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
 * Zone de la carte (D094) : autour d'un point (position ou gare de départ), et/ou autour de gares de
 * destination (leurs lieux à pied).
 */
export type ZoneCarte = {
  point: { lat: number; lon: number; rayonVolOiseauM: number; airesVolOiseauM: number } | null;
  gares: readonly string[];
};

/**
 * Lieux de la carte dans une zone (D094) : ni doublon, ni membre d'un site, ni fiche de ville, ni masqué.
 * Autour d'un point : à `rayonVolOiseauM` (filtre « Distance autour de vous »), aires de jeux à
 * `airesVolOiseauM` au plus (D091). Autour des gares : leurs lieux à pied (`lieu_gare`, `acces.rayonPiedM`).
 * Loin de toute gare, un lieu « pauvre » (sources et catégories de `lieuxPauvres`, sans description, photo,
 * label ni article Wikipédia) n'apparaît pas, sauf musées et abbayes ; il reste en base (D092). Aucune
 * limite de nombre : les bulles comptent tout. Position arrondie à 5 décimales (≈ 1 m).
 */
export async function lieuxCarte(options: {
  zone: ZoneCarte;
  airesDeJeux: readonly string[];
  pauvres: {
    sources: readonly string[];
    categories: readonly string[];
    toujoursGardes: readonly string[];
  };
}) {
  const relie = sql`EXISTS (SELECT 1 FROM lieu_gare lg WHERE lg.lieu_id = l.id)`;
  const { zone } = options;
  const { point } = zone;
  const position = point
    ? sql`ST_SetSRID(ST_MakePoint(${point.lon}, ${point.lat}), 4326)::geography`
    : null;
  const autourDuPoint = point
    ? sql`(ST_DWithin(l.geom, ${position}, ${point.rayonVolOiseauM})
           AND (coalesce(l.sous_categorie, '') NOT IN (${liste(options.airesDeJeux)})
                OR ST_DWithin(l.geom, ${position}, ${point.airesVolOiseauM})))`
    : sql`false`;
  const autourDesGares =
    zone.gares.length > 0
      ? sql`EXISTS (SELECT 1 FROM lieu_gare lg JOIN gare g ON g.id = lg.gare_id
                    WHERE lg.lieu_id = l.id AND g.uic IN (${liste(zone.gares)}))`
      : sql`false`;
  const dansLaZone = sql`(${autourDuPoint} OR ${autourDesGares})`;
  const { rows } = await db.execute(sql`
    SELECT l.cle, l.categorie, l.categories_secondaires AS secondaires,
           round(ST_Y(l.geom::geometry)::numeric, 5)::float8 AS lat,
           round(ST_X(l.geom::geometry)::numeric, 5)::float8 AS lon
    FROM lieu l
    WHERE l.doublon_de IS NULL AND l.site_de IS NULL AND NOT l.fiche_ville AND NOT l.masque
      AND ${dansLaZone}
      AND NOT (l.source IN (${liste(options.pauvres.sources)})
               AND l.categorie IN (${liste(options.pauvres.categories)})
               AND coalesce(l.sous_categorie, '') NOT IN (${liste(options.pauvres.toujoursGardes)})
               AND l.description IS NULL AND l.image_url IS NULL AND NOT l.qualite_tourisme
               AND l.wikipedia IS NULL AND NOT ${relie})
    ORDER BY l.cle`);
  return z.array(schemaLigne).parse(rows);
}
