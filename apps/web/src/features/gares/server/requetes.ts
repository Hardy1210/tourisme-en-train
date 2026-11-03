import 'server-only';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';

const schemaLigne = z.object({
  uic: z.string(),
  nom: z.string(),
  commune: z.string().nullable(),
  distance_m: z.coerce.number(),
  dans_region: z.boolean(),
});

export type GareProcheBrute = z.infer<typeof schemaLigne>;

/** Gares les plus proches d'un point (index GIST, opérateur `<->`, docs/03 § 5). */
export async function garesLesPlusProches(
  lat: number,
  lon: number,
  limite: number,
): Promise<GareProcheBrute[]> {
  const point = sql`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography`;
  const { rows } = await db.execute(sql`
    SELECT g.uic, g.nom, c.nom AS commune, ST_Distance(g.geom, ${point}) AS distance_m, g.dans_region
    FROM gare g LEFT JOIN commune c ON c.code_insee = g.code_insee
    ORDER BY g.geom <-> ${point}
    LIMIT ${limite}`);
  return z.array(schemaLigne).parse(rows);
}
