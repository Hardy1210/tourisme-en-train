// Requêtes utilisées par plusieurs fonctionnalités (docs/01-architecture.md § 4).
import 'server-only';
import { sql } from 'drizzle-orm';
import { z } from 'zod';

import { db } from './client';

const schemaFenetre = z.object({ debut: z.iso.date().nullable(), fin: z.iso.date().nullable() });

export type Fenetre = { debut: string; fin: string };

/**
 * Dates couvertes par les liaisons directes chargées (`pnpm etl liaisons`) ; null si aucune.
 * Sert à refuser une date hors fenêtre (`400`, docs/05-api.md § 1.7) : destinations, trains (E09).
 */
export async function fenetreLiaisons(): Promise<Fenetre | null> {
  const { rows } = await db.execute(
    sql`SELECT min(date_service)::text AS debut, max(date_service)::text AS fin FROM liaison_directe`,
  );
  const { debut, fin } = schemaFenetre.parse(rows[0]);
  return debut && fin ? { debut, fin } : null;
}
