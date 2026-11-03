import 'server-only';
import { schemaTypeTrain } from '@tourisme/commun';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';

const schemaLiaison = z.object({
  distance_km: z.coerce.number(),
  types_train: z.array(schemaTypeTrain),
});

/** Distance et types de train d'une liaison directe (première date de la fenêtre) ; null s'il n'y en a pas. */
export async function liaisonPourImpact(
  departId: number,
  arriveeId: number,
): Promise<z.infer<typeof schemaLiaison> | null> {
  const { rows } = await db.execute(sql`
    SELECT distance_km, types_train FROM liaison_directe
    WHERE gare_depart_id = ${departId} AND gare_arrivee_id = ${arriveeId}
    ORDER BY date_service LIMIT 1`);
  return rows[0] ? schemaLiaison.parse(rows[0]) : null;
}
