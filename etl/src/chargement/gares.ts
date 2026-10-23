// Chargement des gares (docs/04-traitement-donnees.md § 4.1, D034, D039) : table temporaire `tmp_gare`,
// contrôles bloquants, puis mise à jour de la gare qui partage AU MOINS UN code UIC avec la ligne du
// fichier (jamais supprimer puis réinsérer : d'autres tables pointent vers `gare.id`). L'ordre des codes
// peut changer d'un fichier à l'autre. Le code INSEE n'est gardé que s'il est dans `commune` (D038).
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
  // Sinon une gare en base correspondrait à deux lignes du fichier (laquelle garder ?).
  aucune(
    'Code UIC présent dans plusieurs lignes du fichier',
    `SELECT count(*)::int AS n FROM (
       SELECT code FROM tmp_gare, unnest(codes_uic) AS code GROUP BY code HAVING count(*) > 1) d`,
  ),
  // Sinon la ligne serait recopiée sur plusieurs gares : doublons à fusionner à la main (D039).
  aucune(
    'Ligne du fichier correspondant à plusieurs gares en base',
    `SELECT count(*)::int AS n FROM (
       SELECT t.uic FROM tmp_gare t JOIN gare g ON g.codes_uic && t.codes_uic
       GROUP BY t.uic HAVING count(*) > 1) d`,
  ),
];

// `&&` : les deux tableaux ont au moins un code en commun (index GIN sur `gare.codes_uic`).
const METTRE_A_JOUR = `
  UPDATE gare g SET
    uic = t.uic, codes_uic = t.codes_uic, nom = t.nom, code_insee = c.code_insee,
    dans_region = t.dans_region, geom = ST_SetSRID(ST_MakePoint(t.lon, t.lat), 4326)::geography,
    maj = now()
  FROM tmp_gare t
  LEFT JOIN commune c ON c.code_insee = t.code_insee
  WHERE g.codes_uic && t.codes_uic`;

const INSERER = `
  INSERT INTO gare (uic, codes_uic, nom, code_insee, dans_region, geom, maj)
  SELECT t.uic, t.codes_uic, t.nom, c.code_insee, t.dans_region,
         ST_SetSRID(ST_MakePoint(t.lon, t.lat), 4326)::geography, now()
  FROM tmp_gare t
  LEFT JOIN commune c ON c.code_insee = t.code_insee
  WHERE NOT EXISTS (SELECT 1 FROM gare g WHERE g.codes_uic && t.codes_uic)`;

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

const ABSENTE = 'NOT EXISTS (SELECT 1 FROM tmp_gare t WHERE t.codes_uic && g.codes_uic)';

export interface BilanFusion {
  chargees: number;
  /** Dont gares nouvelles (aucun code commun avec une gare en base). */
  ajoutees: number;
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
  // Insertion APRÈS la mise à jour : une gare mise à jour porte déjà les codes de sa ligne.
  const misesAJour = await client.query(METTRE_A_JOUR);
  const ajoutees = await client.query(INSERER);
  const supprimees = await client.query(
    `DELETE FROM gare g WHERE ${ABSENTE} AND NOT ${REFERENCEE}`,
  );
  const gardees = await client.query<{ nom: string; uic: string }>(
    `SELECT nom, uic FROM gare g WHERE ${ABSENTE} ORDER BY nom`,
  );
  return {
    chargees: (misesAJour.rowCount ?? 0) + (ajoutees.rowCount ?? 0),
    ajoutees: ajoutees.rowCount ?? 0,
    supprimees: supprimees.rowCount ?? 0,
    gardees: gardees.rows.map((g) => `${g.nom} (${g.uic})`),
    sansCommune: sansCommune.rows.map(
      (g) => `${g.nom} (${g.code_insee}${g.dans_region ? ', RÉGION' : ''})`,
    ),
  };
}
