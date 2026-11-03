import 'server-only';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '@/lib/db/client';

const schemaLigne = z.object({ fin: z.coerce.date().nullable() });

/** Fin de la dernière exécution réussie du chargement des horaires (`gtfs_sncf`) ; null si aucune. */
export async function dernierChargementHoraires(): Promise<Date | null> {
  const { rows } = await db.execute(
    sql`SELECT max(fin) AS fin FROM execution_etl WHERE source = 'gtfs_sncf' AND statut = 'SUCCES'`,
  );
  return schemaLigne.parse(rows[0]).fin;
}
