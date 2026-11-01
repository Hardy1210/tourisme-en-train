// Chargement des lieux d'une source (docs/04-traitement-donnees.md § 4.4, D041), commun à
// DATAtourisme et OSM : table temporaire → commune par contour (hors région = écarté) → contrôles
// → mise à jour de `lieu` par (source, id_source), puis suppression des lieux disparus.
// Mise à jour plutôt que « supprimer puis réinsérer » : l'identifiant d'un lieu reste stable.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type pg from 'pg';
import { parametres } from '../config';
import { aucune, auMoins, type Controle } from '../controles/base';
import type { ValeurCopie } from './base';
import type { LieuNormalise, RaisonEcart } from '../transformations/lieux';

export const TABLE_TEMPORAIRE = {
  nom: 'tmp_lieu',
  colonnes: [
    ['id_source', 'text'],
    ['nom', 'text'],
    ['categorie', 'text'],
    ['sous_categorie', 'text'],
    ['description', 'text'],
    ['adresse', 'text'],
    ['url', 'text'],
    ['image_url', 'text'],
    ['horaires', 'text'],
    ['qualite_tourisme', 'boolean'],
    ['lon', 'float8'],
    ['lat', 'float8'],
  ],
} as const;

export const versValeurs = (l: LieuNormalise): readonly ValeurCopie[] => [
  l.idSource,
  l.nom,
  l.categorie,
  l.sousCategorie,
  l.description,
  l.adresse,
  l.url,
  l.imageUrl,
  l.horaires,
  l.qualiteTourisme,
  l.lon,
  l.lat,
];

/** Point du lieu, puis commune dont le contour le contient (seules les communes de la région en ont un). */
export async function trouverCommunes(client: pg.ClientBase): Promise<void> {
  await client.query(`ALTER TABLE tmp_lieu
    ADD COLUMN geom geography(Point, 4326), ADD COLUMN code_insee char(5)`);
  await client.query(
    'UPDATE tmp_lieu SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography',
  );
  // Un point sur une limite touche deux communes : la plus petite code INSEE, pour un résultat stable.
  await client.query(`UPDATE tmp_lieu t SET code_insee = (
    SELECT c.code_insee FROM commune c
    WHERE c.contour IS NOT NULL AND ST_Covers(c.contour, t.geom)
    ORDER BY c.code_insee LIMIT 1)`);
}

export function controlesLieux(): Controle[] {
  return [
    auMoins(
      'Communes de la région avec contour (sinon : pnpm etl contours)',
      'SELECT count(*)::int AS n FROM commune WHERE contour IS NOT NULL',
      parametres.controles.contoursRegionMin,
    ),
    auMoins(
      'Lieux dans la région',
      'SELECT count(*)::int AS n FROM tmp_lieu WHERE code_insee IS NOT NULL',
      parametres.controles.lieuxSourceMin,
    ),
    aucune(
      'Identifiants de lieu en double dans la source',
      `SELECT count(*)::int AS n FROM (
         SELECT 1 FROM tmp_lieu GROUP BY id_source HAVING count(*) > 1) d`,
    ),
    aucune(
      'Lieux hors des contours de la région (écartés)',
      'SELECT count(*)::int AS n FROM tmp_lieu WHERE code_insee IS NULL',
      [],
      false,
    ),
  ];
}

export interface BilanFusionLieux {
  chargees: number;
  supprimees: number;
  horsRegion: number;
  parCategorie: Record<string, number>;
}

export async function fusionnerLieux(
  client: pg.ClientBase,
  source: string,
): Promise<BilanFusionLieux> {
  const { rowCount } = await client.query(
    `INSERT INTO lieu (source, id_source, nom, categorie, sous_categorie, description, adresse,
       code_insee, url, image_url, horaires, qualite_tourisme, geom)
     SELECT $1, id_source, nom, categorie, sous_categorie, description, adresse,
       code_insee, url, image_url, horaires, qualite_tourisme, geom
     FROM tmp_lieu WHERE code_insee IS NOT NULL
     ON CONFLICT (source, id_source) DO UPDATE SET
       nom = EXCLUDED.nom, categorie = EXCLUDED.categorie, sous_categorie = EXCLUDED.sous_categorie,
       description = EXCLUDED.description, adresse = EXCLUDED.adresse,
       code_insee = EXCLUDED.code_insee, url = EXCLUDED.url, image_url = EXCLUDED.image_url,
       horaires = EXCLUDED.horaires, qualite_tourisme = EXCLUDED.qualite_tourisme,
       geom = EXCLUDED.geom, maj = now()`,
    [source],
  );
  const supprimees = await client.query(
    `DELETE FROM lieu l WHERE l.source = $1 AND NOT EXISTS (
       SELECT 1 FROM tmp_lieu t WHERE t.id_source = l.id_source AND t.code_insee IS NOT NULL)`,
    [source],
  );
  const horsRegion = await client.query<{ n: number }>(
    'SELECT count(*)::int AS n FROM tmp_lieu WHERE code_insee IS NULL',
  );
  const categories = await client.query<{ categorie: string; n: number }>(
    'SELECT categorie, count(*)::int AS n FROM lieu WHERE source = $1 GROUP BY categorie ORDER BY categorie',
    [source],
  );
  return {
    chargees: rowCount ?? 0,
    supprimees: supprimees.rowCount ?? 0,
    horsRegion: horsRegion.rows[0]?.n ?? 0,
    parCategorie: Object.fromEntries(categories.rows.map((c) => [c.categorie, c.n])),
  };
}

/** Comptes de la lecture d'une source de lieux, pour le rapport. */
export interface CompteLecture {
  ecarts: Map<RaisonEcart, number>;
  /** « cle=valeur » sans règle → nombre de lieux concernés. */
  nonClassees: Map<string, number>;
}

export function nouveauCompte(): CompteLecture {
  return { ecarts: new Map(), nonClassees: new Map() };
}

export function compter(
  compte: CompteLecture,
  raison: RaisonEcart | null,
  nonClassees: string[],
): void {
  if (raison) compte.ecarts.set(raison, (compte.ecarts.get(raison) ?? 0) + 1);
  for (const v of nonClassees) compte.nonClassees.set(v, (compte.nonClassees.get(v) ?? 0) + 1);
}

/**
 * Écrit `traite/rapports/categories_non_classees_<source>.csv` (`04` § 4.5), relu par Hardy pour
 * compléter `categories.csv`. Toujours réécrit : un fichier vide dit « tout est classé ».
 */
export async function ecrireNonClassees(
  dossierDonnees: string,
  source: string,
  nonClassees: ReadonlyMap<string, number>,
): Promise<string> {
  const dossier = path.join(dossierDonnees, 'traite', 'rapports');
  await mkdir(dossier, { recursive: true });
  const chemin = path.join(dossier, `categories_non_classees_${source}.csv`);
  const lignes = [...nonClassees]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([etiquette, n]) => {
      const [cle, ...valeur] = etiquette.split('=');
      return `${source};${cle};${valeur.join('=')};${n}`;
    });
  await writeFile(chemin, ['source;cle;valeur;occurrences', ...lignes].join('\n') + '\n');
  return chemin;
}
