// Chargement des gares (docs/04-traitement-donnees.md § 4.1, D034) : table temporaire `tmp_gare`,
// contrôles bloquants, puis mise à jour de `gare` PAR `uic` (jamais supprimer puis réinsérer :
// d'autres tables pointent vers `gare.id`). Le code INSEE n'est gardé que s'il est dans `commune` (D038).
import type pg from 'pg';
import { parametres } from '../config';
import { aucune, auMoins, type Controle } from '../controles/base';

export const TABLE_TEMPORAIRE = {
  nom: 'tmp_gare',
  colonnes: [
    ['uic', 'char(8)'],
    ['codes_uic', 'char(8)[]'],
    ['nom', 'text'],
    ['code_insee', 'char(5)'],
    ['dans_region', 'boolean'],
    ['lon', 'float8'],
    ['lat', 'float8'],
  ],
} as const;

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
  // Attrape aussi une table `commune` vide : `pnpm etl communes` doit passer avant `gares`.
  aucune(
    'Gares de la région sans commune (lancer pnpm etl communes ?)',
    `SELECT count(*)::int AS n FROM tmp_gare t
     WHERE dans_region AND NOT EXISTS (SELECT 1 FROM commune c WHERE c.code_insee = t.code_insee)`,
  ),
  // Sinon la mise à jour par `uic` échouerait (une ligne ne peut être modifiée deux fois).
  aucune(
    'Code UIC principal en double dans le fichier',
    'SELECT count(*)::int AS n FROM (SELECT uic FROM tmp_gare GROUP BY uic HAVING count(*) > 1) d',
  ),
];

const INSERER_OU_METTRE_A_JOUR = `
  INSERT INTO gare (uic, codes_uic, nom, code_insee, dans_region, geom, maj)
  SELECT t.uic, t.codes_uic, t.nom, c.code_insee, t.dans_region,
         ST_SetSRID(ST_MakePoint(t.lon, t.lat), 4326)::geography, now()
  FROM tmp_gare t
  LEFT JOIN commune c ON c.code_insee = t.code_insee
  ON CONFLICT (uic) DO UPDATE SET
    codes_uic = EXCLUDED.codes_uic, nom = EXCLUDED.nom, code_insee = EXCLUDED.code_insee,
    dans_region = EXCLUDED.dans_region, geom = EXCLUDED.geom, maj = EXCLUDED.maj`;

/** Gares du fichier dont le code INSEE est absent de `commune` (communes fusionnées) : chargées sans commune. */
const SANS_COMMUNE = `
  SELECT t.nom, t.code_insee, t.dans_region FROM tmp_gare t
  WHERE NOT EXISTS (SELECT 1 FROM commune c WHERE c.code_insee = t.code_insee)
  ORDER BY t.nom`;

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
  /** Gares chargées sans commune (code INSEE absent de `commune`). */
  sansCommune: string[];
}

export async function fusionnerGares(client: pg.ClientBase): Promise<BilanFusion> {
  const sansCommune = await client.query<{ nom: string; code_insee: string; dans_region: boolean }>(
    SANS_COMMUNE,
  );
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
    sansCommune: sansCommune.rows.map(
      (g) => `${g.nom} (${g.code_insee}${g.dans_region ? ', RÉGION' : ''})`,
    ),
  };
}
