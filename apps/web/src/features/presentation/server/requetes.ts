import 'server-only';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';

const schemaDates = z.object({
  /** Dernier téléchargement par code de source (`source_donnees`). */
  telechargements: z.record(z.string(), z.coerce.date()),
  /** Dernier chargement réussi des transports sur place (réseaux et vélos, D046). */
  transport_local: z.coerce.date().nullable(),
});

export async function datesDesDonnees(): Promise<z.infer<typeof schemaDates>> {
  const { rows } = await db.execute(sql`
    SELECT coalesce((SELECT jsonb_object_agg(code, date_telechargement) FROM source_donnees
                     WHERE date_telechargement IS NOT NULL), '{}'::jsonb) AS telechargements,
           (SELECT max(fin) FROM execution_etl
            WHERE source = 'transport_local' AND statut = 'SUCCES') AS transport_local`);
  return schemaDates.parse(rows[0]);
}
