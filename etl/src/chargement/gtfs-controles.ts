// Contrôles et constats du chargement GTFS (docs/04-traitement-donnees.md § 4.2).
// Exécutés dans la transaction, sur les tables temporaires de transformations/gtfs.sql.
import type pg from 'pg';
import { parametres } from '../config';
import { aucune, type Controle } from '../controles/base';

export interface Fenetre {
  /** Date du jour à Paris, AAAA-MM-JJ. */
  debut: string;
  /** Nombre de jours après `debut` (`fenetreJoursHoraires`). */
  jours: number;
}

const nombre = (n: number): string => n.toLocaleString('fr-FR');

const PASSAGES_RETENUS = `FROM tmp_passage p JOIN tmp_trajet_retenu USING (trip_id)
  LEFT JOIN tmp_gare_uic g USING (uic)`;

function rapprochement(minimumPct: number): Controle {
  return {
    nom: 'Passages des trajets retenus rapprochés d’une gare',
    bloquant: true,
    async verifier(client) {
      const { rows } = await client.query<{ total: number; rapproches: number }>(
        `SELECT count(*)::int AS total, count(g.gare_id)::int AS rapproches ${PASSAGES_RETENUS}`,
      );
      const { total = 0, rapproches = 0 } = rows[0] ?? {};
      const pct = total === 0 ? 0 : (100 * rapproches) / total;
      const texte = pct.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
      return {
        reussi: total > 0 && pct >= minimumPct,
        detail: `${texte} % (minimum ${minimumPct} %)`,
      };
    },
  };
}

export function controlesGtfs(fenetre: Fenetre): Controle[] {
  return [
    aucune(
      `Agences hors du fuseau ${parametres.fuseau} (heures fausses)`,
      'SELECT count(*)::int AS n FROM gtfs_agency WHERE agency_timezone IS DISTINCT FROM $1',
      [parametres.fuseau],
    ),
    rapprochement(parametres.controles.rapprochementGtfsMinPct),
    aucune(
      'Horaires illisibles',
      `SELECT count(*)::int AS n ${PASSAGES_RETENUS}
       WHERE (p.arrival_time IS NOT NULL AND p.arrivee_s IS NULL)
          OR (p.departure_time IS NOT NULL AND p.depart_s IS NULL)`,
    ),
    aucune(
      'Séquence en double dans un trajet',
      `SELECT count(*)::int AS n FROM (SELECT trip_id, sequence ${PASSAGES_RETENUS}
       GROUP BY 1, 2 HAVING count(*) > 1) d`,
    ),
    // Jusqu'à la fin de la fenêtre, ou du fichier s'il s'arrête avant (signalé dans les constats).
    aucune(
      'Jours de la fenêtre sans aucun trajet',
      `SELECT count(*)::int AS n FROM generate_series($1::date::timestamp,
         least($1::date + $2::int, (SELECT max(to_date(feed_end_date, 'YYYYMMDD')) FROM gtfs_feed_info))::timestamp,
         interval '1 day') AS jour
       WHERE NOT EXISTS (SELECT 1 FROM tmp_service_jour s JOIN tmp_trajet_retenu t USING (service_id)
                         WHERE s.date_service = jour::date)`,
      [fenetre.debut, fenetre.jours],
    ),
    aucune(
      'Trajets à plusieurs modes (type pris sur le premier)',
      'SELECT count(*)::int AS n FROM tmp_trajet WHERE nb_modes > 1',
      [],
      false,
    ),
  ];
}

/** Constats pour le rapport, après l'insertion (même transaction : `passage` est à jour). */
export async function constatsGtfs(client: pg.ClientBase, fenetre: Fenetre): Promise<string[]> {
  const constats: string[] = [];

  const f = await client.query<{
    debut: string;
    fin: string;
    fin_fichier: string | null;
    depasse: boolean | null;
  }>(
    `SELECT to_char($1::date, 'DD/MM/YYYY') AS debut, to_char($1::date + $2::int, 'DD/MM/YYYY') AS fin,
            to_char(max(to_date(feed_end_date, 'YYYYMMDD')), 'DD/MM/YYYY') AS fin_fichier,
            max(to_date(feed_end_date, 'YYYYMMDD')) < $1::date + $2::int AS depasse
     FROM gtfs_feed_info`,
    [fenetre.debut, fenetre.jours],
  );
  const { debut, fin, fin_fichier, depasse } = f.rows[0]!;
  constats.push(`Fenêtre : du ${debut} au ${fin} (fichier valable jusqu'au ${fin_fichier ?? '?'})`);
  if (depasse)
    constats.push(
      `⚠️ La fenêtre dépasse la fin du fichier : jours sans horaires après le ${fin_fichier}`,
    );

  const types = await client.query<{ type_train: string; n: number }>(
    'SELECT type_train, count(*)::int AS n FROM tmp_trajet_retenu GROUP BY 1 ORDER BY 1',
  );
  constats.push(
    `Trajets chargés par type : ${types.rows.map((t) => `${t.type_train} ${nombre(t.n)}`).join(' · ')}`,
  );

  const modes = await client.query<{ autre: number; cars: number; cars_region: number }>(
    `SELECT count(*) FILTER (WHERE type_train = 'AUTRE')::int AS autre,
            count(*) FILTER (WHERE type_train IS NULL)::int AS cars,
            count(*) FILTER (WHERE type_train IS NULL AND dans_region)::int AS cars_region
     FROM tmp_trajet`,
  );
  const m = modes.rows[0]!;
  const autreCharges = types.rows.find((t) => t.type_train === 'AUTRE')?.n ?? 0;
  constats.push(
    `Trajets AUTRE (mode inconnu) : ${nombre(autreCharges)} chargés, ${nombre(m.autre)} dans tout le fichier`,
  );
  constats.push(
    `Trajets en car ou navette exclus : ${nombre(m.cars)} dans le fichier, dont ${nombre(m.cars_region)} touchant la région`,
  );

  const absents = await client.query<{ nom: string; n: number }>(
    `SELECT coalesce(s.stop_name, p.stop_id) AS nom, count(*)::int AS n ${PASSAGES_RETENUS}
     LEFT JOIN gtfs_stops s USING (stop_id) WHERE g.gare_id IS NULL
     GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 10`,
  );
  if (absents.rows.length > 0) {
    const liste = absents.rows.map((a) => `${a.nom} (${nombre(a.n)})`).join(', ');
    constats.push(
      `Arrêts non rapprochés les plus fréquents (gares absentes de \`gare\`) : ${liste}`,
    );
  }

  const sansTrain = await client.query<{ nom: string }>(
    `SELECT g.nom FROM gare g WHERE g.dans_region
       AND NOT EXISTS (SELECT 1 FROM passage pa WHERE pa.gare_id = g.id) ORDER BY 1`,
  );
  constats.push(
    sansTrain.rows.length === 0
      ? 'Toutes les gares de la région ont au moins un train dans la fenêtre'
      : `Gares de la région sans aucun train dans la fenêtre : ${sansTrain.rows.map((g) => g.nom).join(', ')}`,
  );
  return constats;
}
