import 'server-only';
import { schemaTypeMobilite } from '@tourisme/commun';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';

const schemaLigne = z.object({
  type: schemaTypeMobilite,
  nom: z.string(),
  lignes: z.array(z.string()).nullable(),
  operateur: z.string().nullable(),
  distance_m: z.number().int(),
  source: z.string(),
});

/** Transports sur place d'une gare (`mobilite_locale`), triés par type puis distance à pied. */
export async function mobilitesDeLaGare(
  gareId: number,
  limite: number,
): Promise<z.infer<typeof schemaLigne>[]> {
  const { rows } = await db.execute(sql`
    SELECT type, nom, lignes, operateur, distance_m, source
    FROM mobilite_locale WHERE gare_id = ${gareId}
    ORDER BY type, distance_m, nom
    LIMIT ${limite}`);
  return z.array(schemaLigne).parse(rows);
}
