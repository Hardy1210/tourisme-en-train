// Contrat de GET /api/sante (docs/05-api.md § 3.1), utilisé par la supervision.
import { z } from 'zod';

export const schemaSante = z.object({
  statut: z.enum(['ok', 'degrade']),
  base: z.enum(['ok', 'erreur']),
  dateDonnees: z.iso.date().nullable(),
  version: z.string(),
});

export type Sante = z.infer<typeof schemaSante>;
