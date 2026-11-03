// Contrat de GET /api/mobilites/[uic] (docs/05-api.md § 3.9, D046).
import { schemaTypeMobilite } from '@tourisme/commun';
import { z } from 'zod';

export const schemaMobilite = z.object({
  type: schemaTypeMobilite,
  nom: z.string(),
  lignes: z.array(z.string()),
  operateur: z.string().nullable(),
  /** Distance à pied depuis la gare (D046). */
  distanceM: z.number().int(),
  dureeMarcheMin: z.number().int(),
  source: z.string(),
});

export const schemaReponseMobilites = z.object({ mobilites: z.array(schemaMobilite) });

export type ReponseMobilites = z.infer<typeof schemaReponseMobilites>;
