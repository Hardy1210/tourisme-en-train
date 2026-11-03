import 'server-only';
import { schemaTypeTrain } from '@tourisme/commun';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';

const schemaLigne = z.object({
  trajet_ids: z.array(z.string()),
  depart_s: z.number().int(),
  arrivee_s: z.number().int(),
  type_train: schemaTypeTrain,
  numeros: z.array(z.string()),
});

export type TrainBrut = z.infer<typeof schemaLigne>;

/**
 * Tous les trains directs `departId → arriveeId` à `date`, dans l'ordre des départs (docs/03 § 5).
 * Trajets aux mêmes heures de départ et d'arrivée réunis (jumelage, D040) ; montée et descente
 * interdites respectées (D036).
 */
export async function trainsDirects(
  departId: number,
  arriveeId: number,
  date: string,
): Promise<TrainBrut[]> {
  const { rows } = await db.execute(sql`
    SELECT array_agg(a.trajet_id ORDER BY a.trajet_id) AS trajet_ids, a.depart_s, b.arrivee_s,
           (array_agg(t.type_train ORDER BY t.type_train))[1] AS type_train,
           coalesce(array_agg(DISTINCT t.numero) FILTER (WHERE t.numero IS NOT NULL), '{}') AS numeros
    FROM passage a
    JOIN passage b ON b.trajet_id = a.trajet_id AND b.sequence > a.sequence
    JOIN trajet t ON t.id = a.trajet_id
    JOIN service_jour s ON s.service_id = t.service_id AND s.date_service = ${date}
    WHERE a.gare_id = ${departId} AND b.gare_id = ${arriveeId}
      AND a.depart_s IS NOT NULL AND b.arrivee_s IS NOT NULL
      AND NOT a.montee_interdite AND NOT b.descente_interdite
    GROUP BY a.depart_s, b.arrivee_s
    ORDER BY a.depart_s, b.arrivee_s`);
  return z.array(schemaLigne).parse(rows);
}
