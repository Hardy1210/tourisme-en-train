import 'server-only';
import type { Categorie } from '@tourisme/commun';
import { sql, type SQL } from 'drizzle-orm';

/**
 * Filtre « envies » d'une requête sur `lieu l` : catégorie principale ou secondaire (D060).
 * Sans filtre (`null`), aucune condition : la liste et son ordre restent les mêmes pour tout le monde.
 */
export function filtreCategories(categories: readonly Categorie[] | null): SQL {
  if (categories === null) return sql`TRUE`;
  const liste = sql.join(
    categories.map((c) => sql`${c}`),
    sql`, `,
  );
  return sql`(l.categorie IN (${liste}) OR l.categories_secondaires && ARRAY[${liste}]::text[])`;
}
