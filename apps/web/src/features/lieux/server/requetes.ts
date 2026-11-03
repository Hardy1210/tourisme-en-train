import 'server-only';
import { CATEGORIES, schemaCategorie, type Categorie } from '@tourisme/commun';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';

const schemaLigne = z.object({
  id: z.coerce.number().int(),
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
 * site ignorés (un site apparaît une fois, par son représentant : docs/03 § 3.6).
 */
export async function lieuxAutour(options: {
  lat: number;
  lon: number;
  rayonVolOiseauM: number;
  categories: readonly Categorie[] | null;
  limite: number;
}): Promise<LieuAutourBrut[]> {
  const point = sql`ST_SetSRID(ST_MakePoint(${options.lon}, ${options.lat}), 4326)::geography`;
  const categories = sql.join(
    (options.categories ?? CATEGORIES).map((c) => sql`${c}`),
    sql`, `,
  );
  const { rows } = await db.execute(sql`
    SELECT l.id, l.nom, l.categorie, l.sous_categorie, l.image_url, l.qualite_tourisme, l.source,
           ST_Y(l.geom::geometry) AS lat, ST_X(l.geom::geometry) AS lon,
           ST_Distance(l.geom, ${point}) AS vol_oiseau_m, count(*) OVER () AS total
    FROM lieu l
    WHERE l.doublon_de IS NULL AND l.site_de IS NULL
      AND l.categorie IN (${categories})
      AND ST_DWithin(l.geom, ${point}, ${options.rayonVolOiseauM})
    ORDER BY vol_oiseau_m, l.id
    LIMIT ${options.limite}`);
  return z.array(schemaLigne).parse(rows);
}
