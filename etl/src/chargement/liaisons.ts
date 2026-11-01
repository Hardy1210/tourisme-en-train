// Calcul des liaisons directes (docs/04-traitement-donnees.md § 4.3, D040) dans UNE transaction :
// tables temporaires (transformations/liaisons.sql) → contrôles → remplacement de `liaison_directe`
// → constats. Un contrôle bloquant en échec annule tout : l'ancienne table reste en place.
import type pg from 'pg';
import { parametres } from '../config';
import {
  aucune,
  type Controle,
  ErreurControles,
  echecsBloquants,
  executerControles,
  type ResultatControle,
} from '../controles/base';
import { enTransaction } from '../db';
import { lireSections, preparer } from '../transformations/sql';
import type { Fenetre } from './gtfs-controles';

const PREPARATION = ['paire', 'liaison', 'index_liaison', 'analyser'] as const;
const REMPLACEMENT = ['vider', 'inserer'] as const;

export interface BilanLiaisons {
  liaisons: number;
  controles: ResultatControle[];
  constats: string[];
}

/** "HH:MM" (validé par le schéma de parametres.json) → secondes depuis minuit. */
export function heureEnSecondes(heure: string): number {
  const [h = 0, m = 0] = heure.split(':').map(Number);
  return h * 3600 + m * 60;
}

export function controlesLiaisons(fenetre: Fenetre): Controle[] {
  return [
    aucune(
      'Liaisons de durée nulle ou négative',
      'SELECT count(*)::int AS n FROM tmp_liaison WHERE duree_min <= 0',
    ),
    aucune(
      'Liaisons d’une gare vers elle-même',
      'SELECT count(*)::int AS n FROM tmp_liaison WHERE dep = arr',
    ),
    // Horaires chargés un autre jour : la fin de la fenêtre n'a plus de trains.
    aucune(
      'Jours de la fenêtre sans aucune liaison (horaires à recharger : pnpm etl gtfs_sncf ?)',
      `SELECT count(*)::int AS n
       FROM generate_series($1::date::timestamp, ($1::date + $2::int)::timestamp, interval '1 day') AS jour
       WHERE NOT EXISTS (SELECT 1 FROM tmp_liaison l WHERE l.date_service = jour::date)`,
      [fenetre.debut, fenetre.jours],
    ),
    aucune(
      'Liaisons sans liaison inverse le même jour (aller sans retour direct)',
      `SELECT count(*)::int AS n FROM tmp_liaison l WHERE NOT EXISTS (
         SELECT 1 FROM tmp_liaison r
         WHERE r.dep = l.arr AND r.arr = l.dep AND r.date_service = l.date_service)`,
      [],
      false,
    ),
  ];
}

const nombre = (n: number): string => n.toLocaleString('fr-FR');

/** Constats pour le rapport, après l'insertion (même transaction). */
async function constatsLiaisons(client: pg.ClientBase): Promise<string[]> {
  const { rows } = await client.query<{
    paires: number;
    hors_region: number;
    faisables: number;
    jumeaux: number;
  }>(
    `SELECT
       (SELECT count(*)::int FROM (SELECT DISTINCT dep, arr FROM tmp_liaison) d) AS paires,
       (SELECT count(DISTINCT l.arr)::int FROM tmp_liaison l JOIN gare g ON g.id = l.arr
        WHERE NOT g.dans_region) AS hors_region,
       (SELECT count(*)::int FROM liaison_directe WHERE faisable_journee) AS faisables,
       (SELECT coalesce(sum(nb_jumeaux), 0)::int FROM tmp_liaison) AS jumeaux`,
  );
  const c = rows[0];
  if (!c) return [];
  return [
    `Paires de gares : ${nombre(c.paires)} ; destinations hors région : ${nombre(c.hors_region)}`,
    `Liaisons faisables dans la journée : ${nombre(c.faisables)}`,
    `Trains en jumelage regroupés (trajets comptés une fois, toutes dates) : ${nombre(c.jumeaux)}`,
  ];
}

/** Tout le calcul, dans la transaction de `client`. */
export async function calculerLiaisonsDans(
  client: pg.ClientBase,
  fenetre: Fenetre,
): Promise<BilanLiaisons> {
  const sections = await lireSections(new URL('../transformations/liaisons.sql', import.meta.url));
  const valeurs = {
    debut: fenetre.debut,
    jours: fenetre.jours,
    coef_detour: parametres.rail.coefDetour,
    arrivee_max_s: heureEnSecondes(parametres.journee.arriveeMaxAller),
    visite_s: parametres.journee.dureeVisiteMin * 60,
  };
  async function executer(nom: string): Promise<number> {
    const sql = sections.get(nom);
    if (sql === undefined) throw new Error(`Section « ${nom} » absente de liaisons.sql`);
    const { texte, valeurs: liste } = preparer(sql, valeurs);
    return (await client.query(texte, liste)).rowCount ?? 0;
  }

  for (const nom of PREPARATION) await executer(nom);
  const controles = await executerControles(client, controlesLiaisons(fenetre));
  if (echecsBloquants(controles).length > 0) throw new ErreurControles(controles);

  let liaisons = 0;
  for (const nom of REMPLACEMENT) liaisons = await executer(nom);
  return { liaisons, controles, constats: await constatsLiaisons(client) };
}

/** Calcul dans sa propre transaction. */
export function calculerLiaisons(pool: pg.Pool, fenetre: Fenetre): Promise<BilanLiaisons> {
  return enTransaction(pool, (client) => calculerLiaisonsDans(client, fenetre));
}
