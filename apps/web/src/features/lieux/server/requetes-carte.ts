import 'server-only';
import { CATEGORIES } from '@tourisme/commun';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';

const schemaLigne = z.object({
  cle: z.string(),
  lat: z.number(),
  lon: z.number(),
  categorie: z.enum(CATEGORIES),
  secondaires: z.array(z.enum(CATEGORIES)),
});

const liste = (valeurs: readonly string[]) =>
  sql.join(
    valeurs.map((v) => sql`${v}`),
    sql`, `,
  );

/**
 * Tous les lieux à montrer sur la carte (D090, D091) : ni doublon, ni membre d'un site, ni fiche de
 * ville. Les aires de jeux (`sousCategoriesAiresDeJeux`) seulement si elles sont reliées à une gare : elles
 * le sont à `rayonAiresDeJeuxM` au plus. Loin de toute gare, un lieu « pauvre » (sources et catégories de
 * `lieuxPauvres`, sans description, photo, label ni article Wikipédia) n'apparaît pas, sauf les
 * sous-catégories toujours gardées (musées, abbayes) ; il reste en base (D092). Position
 * arrondie à 5 décimales (≈ 1 m) pour une réponse légère.
 */
export async function lieuxCarte(options: {
  airesDeJeux: readonly string[];
  pauvres: {
    sources: readonly string[];
    categories: readonly string[];
    toujoursGardes: readonly string[];
  };
}) {
  const relie = sql`EXISTS (SELECT 1 FROM lieu_gare lg WHERE lg.lieu_id = l.id)`;
  const { rows } = await db.execute(sql`
    SELECT l.cle, l.categorie, l.categories_secondaires AS secondaires,
           round(ST_Y(l.geom::geometry)::numeric, 5)::float8 AS lat,
           round(ST_X(l.geom::geometry)::numeric, 5)::float8 AS lon
    FROM lieu l
    WHERE l.doublon_de IS NULL AND l.site_de IS NULL AND NOT l.fiche_ville
      AND (coalesce(l.sous_categorie, '') NOT IN (${liste(options.airesDeJeux)}) OR ${relie})
      AND NOT (l.source IN (${liste(options.pauvres.sources)})
               AND l.categorie IN (${liste(options.pauvres.categories)})
               AND coalesce(l.sous_categorie, '') NOT IN (${liste(options.pauvres.toujoursGardes)})
               AND l.description IS NULL AND l.image_url IS NULL AND NOT l.qualite_tourisme
               AND l.wikipedia IS NULL AND NOT ${relie})
    ORDER BY l.cle`);
  return z.array(schemaLigne).parse(rows);
}
