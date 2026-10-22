// Chargement des gares (docs/04-traitement-donnees.md § 4.1, D034) : table temporaire `tmp_gare`,
// contrôles bloquants, puis mise à jour de `gare` PAR `uic` (jamais supprimer puis réinsérer :
// d'autres tables pointent vers `gare.id`).
import type pg from 'pg';
import { parametres } from '../config';
import { auMoins, type Controle } from '../controles/base';

export const TABLE_TEMPORAIRE = {
  nom: 'tmp_gare',
  colonnes: [
    ['uic', 'char(8)'],
    ['codes_uic', 'char(8)[]'],
    ['nom', 'text'],
    ['commune', 'text'],
    ['code_insee', 'char(5)'],
    ['departement', 'char(3)'],
    ['dans_region', 'boolean'],
    ['lon', 'float8'],
    ['lat', 'float8'],
  ],
} as const;

/** Contrôle « la requête compte 0 ligne » (avec paramètres). */
function aucune(nom: string, requete: string, valeurs: readonly unknown[] = []): Controle {
  return {
    nom,
    bloquant: true,
    async verifier(client) {
      const { rows } = await client.query<{ n: number }>(requete, [...valeurs]);
      const n = rows[0]?.n ?? 0;
      return { reussi: n === 0, detail: n === 0 ? 'aucune' : `${n} trouvée(s)` };
    },
  };
}

const { emprise } = parametres.region;

export const CONTROLES: readonly Controle[] = [
  auMoins(
    'Gares en France',
    'SELECT count(*)::int AS n FROM tmp_gare',
    parametres.controles.garesFranceMin,
  ),
  auMoins(
    'Gares de la région',
    'SELECT count(*)::int AS n FROM tmp_gare WHERE dans_region',
    parametres.controles.garesRegionMin,
  ),
  aucune(
    'Gares de la région hors de son emprise (latitude et longitude inversées ?)',
    `SELECT count(*)::int AS n FROM tmp_gare
     WHERE dans_region AND NOT (lat BETWEEN $1 AND $2 AND lon BETWEEN $3 AND $4)`,
    [emprise.latMin, emprise.latMax, emprise.lonMin, emprise.lonMax],
  ),
  // Sinon la mise à jour par `uic` échouerait (une ligne ne peut être modifiée deux fois).
  aucune(
    'Code UIC principal en double dans le fichier',
    'SELECT count(*)::int AS n FROM (SELECT uic FROM tmp_gare GROUP BY uic HAVING count(*) > 1) d',
  ),
];

const INSERER_OU_METTRE_A_JOUR = `
  INSERT INTO gare (uic, codes_uic, nom, commune, code_insee, departement, dans_region, geom, maj)
  SELECT uic, codes_uic, nom, commune, code_insee, departement, dans_region,
         ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography, now()
  FROM tmp_gare
  ON CONFLICT (uic) DO UPDATE SET
    codes_uic = EXCLUDED.codes_uic, nom = EXCLUDED.nom, commune = EXCLUDED.commune,
    code_insee = EXCLUDED.code_insee, departement = EXCLUDED.departement,
    dans_region = EXCLUDED.dans_region, geom = EXCLUDED.geom, maj = EXCLUDED.maj`;

// Une table qui pointe vers `gare.id` et manque ici fait échouer le DELETE (clé étrangère) :
// le chargement est annulé, jamais une gare référencée supprimée en silence.
const REFERENCEE = `(EXISTS (SELECT 1 FROM passage r WHERE r.gare_id = g.id)
  OR EXISTS (SELECT 1 FROM lieu_gare r WHERE r.gare_id = g.id)
  OR EXISTS (SELECT 1 FROM gare_stats r WHERE r.gare_id = g.id)
  OR EXISTS (SELECT 1 FROM mobilite_locale r WHERE r.gare_id = g.id))`;

const ABSENTE = 'NOT EXISTS (SELECT 1 FROM tmp_gare t WHERE t.uic = g.uic)';

export interface BilanFusion {
  chargees: number;
  supprimees: number;
  /** Gares absentes du fichier mais gardées, car référencées. */
  gardees: string[];
}

export async function fusionnerGares(client: pg.ClientBase): Promise<BilanFusion> {
  const { rowCount } = await client.query(INSERER_OU_METTRE_A_JOUR);
  const supprimees = await client.query(
    `DELETE FROM gare g WHERE ${ABSENTE} AND NOT ${REFERENCEE}`,
  );
  const gardees = await client.query<{ nom: string; uic: string }>(
    `SELECT nom, uic FROM gare g WHERE ${ABSENTE} ORDER BY nom`,
  );
  return {
    chargees: rowCount ?? 0,
    supprimees: supprimees.rowCount ?? 0,
    gardees: gardees.rows.map((g) => `${g.nom} (${g.uic})`),
  };
}
