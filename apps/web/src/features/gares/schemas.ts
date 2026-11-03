// Contrat de GET /api/gares/proches (docs/05-api.md § 3.2).
import { z } from 'zod';

import { parametres } from '@/config/parametres';
import { schemaLat, schemaLon } from '@/lib/http/valider';

export const LIMITE_GARES_MAX = 10;

export const schemaParametresGaresProches = z.object({
  lat: schemaLat,
  lon: schemaLon,
  limite: z.coerce
    .number()
    .int(`La limite doit être un entier entre 1 et ${LIMITE_GARES_MAX}.`)
    .min(1, `La limite doit être un entier entre 1 et ${LIMITE_GARES_MAX}.`)
    .max(LIMITE_GARES_MAX, `La limite doit être un entier entre 1 et ${LIMITE_GARES_MAX}.`)
    .optional()
    .transform((limite) => limite ?? parametres.limites.gares),
});

export const schemaGareProche = z.object({
  id: z.number().int(),
  nom: z.string(),
  commune: z.string().nullable(),
  /** À vol d'oiseau. */
  distanceM: z.number().int(),
  dureeVeloMin: z.number().int(),
  dureeVoitureMin: z.number().int(),
  dansRegion: z.boolean(),
});

export const schemaReponseGaresProches = z.object({ gares: z.array(schemaGareProche) });

export type ParametresGaresProches = z.infer<typeof schemaParametresGaresProches>;
export type GareProche = z.infer<typeof schemaGareProche>;
export type ReponseGaresProches = z.infer<typeof schemaReponseGaresProches>;
