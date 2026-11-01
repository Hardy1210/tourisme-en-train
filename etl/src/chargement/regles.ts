// Règles de catégories (docs/04-traitement-donnees.md § 4.5, D041) : `regles/categories.csv`
// (source de vérité, versionnée) → `categorie_regle`, remplacée en entier à chaque chargement.
import { CATEGORIES, CONDITIONS_REGLE, type Categorie } from '@tourisme/commun';
import type pg from 'pg';
import { z } from 'zod';
import { aucune, auMoins, type Controle } from '../controles/base';
import type { RegleCategorie } from '../transformations/categories';

export const FICHIER_REGLES = new URL('../regles/categories.csv', import.meta.url);

/** Sources de lieux qui ont des règles (`03` § 3.7). */
export const SOURCES_LIEUX = ['datatourisme', 'osm', 'lieux_culturels', 'festivals'] as const;

const videEnNull = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' ? null : v), schema.nullable());

export const schemaRegle = z.object({
  source: z.enum(SOURCES_LIEUX),
  cle: z.string().min(1),
  valeur: z.string().min(1),
  categorie: videEnNull(z.enum(CATEGORIES)),
  sous_categorie: videEnNull(z.string()),
  priorite: z.coerce.number().int().min(1).max(32767),
  condition: videEnNull(z.enum(CONDITIONS_REGLE)),
});
export type LigneRegle = z.infer<typeof schemaRegle>;

export const TABLE_TEMPORAIRE = {
  nom: 'tmp_regle',
  colonnes: [
    ['source', 'text'],
    ['cle', 'text'],
    ['valeur', 'text'],
    ['categorie', 'text'],
    ['sous_categorie', 'text'],
    ['priorite', 'smallint'],
    ['condition', 'text'],
  ],
} as const;

export const versValeurs = (r: LigneRegle) =>
  [r.source, r.cle, r.valeur, r.categorie, r.sous_categorie, r.priorite, r.condition] as const;

export const CONTROLES: readonly Controle[] = [
  aucune(
    'Règles en double (même source, clé et valeur)',
    `SELECT count(*)::int AS n FROM (
       SELECT 1 FROM tmp_regle GROUP BY source, cle, valeur HAVING count(*) > 1) d`,
  ),
  auMoins(
    'Règles DATAtourisme qui classent',
    "SELECT count(*)::int AS n FROM tmp_regle WHERE source = 'datatourisme' AND categorie IS NOT NULL",
    1,
  ),
  auMoins(
    'Règles OSM qui classent',
    "SELECT count(*)::int AS n FROM tmp_regle WHERE source = 'osm' AND categorie IS NOT NULL",
    1,
  ),
];

export async function remplacerRegles(client: pg.ClientBase): Promise<number> {
  await client.query('DELETE FROM categorie_regle');
  const { rowCount } = await client.query(
    `INSERT INTO categorie_regle (source, cle, valeur, categorie, sous_categorie, priorite, condition)
     SELECT source, cle, valeur, categorie, sous_categorie, priorite, condition FROM tmp_regle`,
  );
  return rowCount ?? 0;
}

/** Règles d'une source, lues en base ; aucune → `pnpm etl regles` n'a pas été lancé. */
export async function lireRegles(
  client: pg.ClientBase,
  source: (typeof SOURCES_LIEUX)[number],
): Promise<RegleCategorie[]> {
  const { rows } = await client.query<{
    cle: string;
    valeur: string;
    categorie: Categorie | null;
    sous_categorie: string | null;
    priorite: number;
    condition: RegleCategorie['condition'];
  }>(
    `SELECT cle, valeur, categorie, sous_categorie, priorite, condition
     FROM categorie_regle WHERE source = $1`,
    [source],
  );
  if (rows.length === 0) {
    throw new Error(`Aucune règle de catégorie pour « ${source} » : lancez pnpm etl regles`);
  }
  return rows.map((r) => ({
    cle: r.cle,
    valeur: r.valeur,
    categorie: r.categorie,
    sousCategorie: r.sous_categorie,
    priorite: r.priorite,
    condition: r.condition,
  }));
}
