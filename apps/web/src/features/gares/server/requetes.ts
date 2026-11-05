import 'server-only';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';

const schemaLigne = z.object({
  uic: z.string(),
  nom: z.string(),
  commune: z.string().nullable(),
  lat: z.number(),
  lon: z.number(),
  distance_m: z.coerce.number(),
  dans_region: z.boolean(),
  nb_trains_jour: z.coerce.number(),
});

export type GareProcheBrute = z.infer<typeof schemaLigne>;

/**
 * Les `limite` gares les plus proches d'un point, plus toutes celles du rayon : la gare conseillée
 * peut être plus loin que les premières (index GIST, opérateur `<->`, docs/03 § 5).
 */
export async function garesAutourDuPoint(
  lat: number,
  lon: number,
  limite: number,
  rayonM: number,
  date: string,
): Promise<GareProcheBrute[]> {
  const point = sql`ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography`;
  const { rows } = await db.execute(sql`
    SELECT g.uic, g.nom, c.nom AS commune, ST_Y(g.geom::geometry) AS lat, ST_X(g.geom::geometry) AS lon,
           ST_Distance(g.geom, ${point}) AS distance_m, g.dans_region,
           (SELECT coalesce(sum(l.nb_trains), 0) FROM liaison_directe l
            WHERE l.gare_depart_id = g.id AND l.date_service = ${date}) AS nb_trains_jour
    FROM gare g LEFT JOIN commune c ON c.code_insee = g.code_insee
    WHERE ST_DWithin(g.geom, ${point}, ${rayonM})
       OR g.id IN (SELECT id FROM gare ORDER BY geom <-> ${point} LIMIT ${limite})
    ORDER BY g.geom <-> ${point}`);
  return z.array(schemaLigne).parse(rows);
}
