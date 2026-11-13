import 'server-only';
import { schemaCategorie, type Categorie } from '@tourisme/commun';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';
import { filtreCategories } from '@/lib/db/filtre-categories';

const schemaLigne = z.object({
  cle: z.string(),
  nom: z.string(),
  categorie: schemaCategorie,
  sous_categorie: z.string().nullable(),
  image_url: z.string().nullable(),
  qualite_tourisme: z.boolean(),
  source: z.string(),
  lat: z.number(),
  lon: z.number(),
  vol_oiseau_m: z.number(),
  total: z.coerce.number().int(),
});

export type LieuAutourBrut = z.infer<typeof schemaLigne>;

/**
 * Lieux à moins de `rayonVolOiseauM` d'un point, les plus proches d'abord. Doublons et membres d'un
 * site ignorés (un site apparaît une fois, par son représentant : docs/03 § 3.6). Aires de jeux : seulement
 * à `airesDeJeux.rayonVolOiseauM` au plus du point (D091).
 */
export async function lieuxAutour(options: {
  lat: number;
  lon: number;
  rayonVolOiseauM: number;
  categories: readonly Categorie[] | null;
  airesDeJeux: { sousCategories: readonly string[]; rayonVolOiseauM: number };
  limite: number;
}): Promise<LieuAutourBrut[]> {
  const aires = sql.join(
    options.airesDeJeux.sousCategories.map((s) => sql`${s}`),
    sql`, `,
  );
  const point = sql`ST_SetSRID(ST_MakePoint(${options.lon}, ${options.lat}), 4326)::geography`;
  const { rows } = await db.execute(sql`
    SELECT l.cle, l.nom, l.categorie, l.sous_categorie, l.image_url, l.qualite_tourisme, l.source,
           ST_Y(l.geom::geometry) AS lat, ST_X(l.geom::geometry) AS lon,
           ST_Distance(l.geom, ${point}) AS vol_oiseau_m, count(*) OVER () AS total
    FROM lieu l
    WHERE l.doublon_de IS NULL AND l.site_de IS NULL AND NOT l.fiche_ville
      AND ${filtreCategories(options.categories)}
      AND ST_DWithin(l.geom, ${point}, ${options.rayonVolOiseauM})
      AND (coalesce(l.sous_categorie, '') NOT IN (${aires})
           OR ST_DWithin(l.geom, ${point}, ${options.airesDeJeux.rayonVolOiseauM}))
    ORDER BY vol_oiseau_m, l.cle
    LIMIT ${options.limite}`);
  return z.array(schemaLigne).parse(rows);
}
