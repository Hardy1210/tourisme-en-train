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
  /** Code UIC : identifiant public stable (D052). */
  uic: z.string(),
  nom: z.string(),
  commune: z.string().nullable(),
  lat: z.number(),
  lon: z.number(),
  /** À vol d'oiseau. */
  distanceM: z.number().int(),
  dureeVeloMin: z.number().int(),
  dureeVoitureMin: z.number().int(),
  dansRegion: z.boolean(),
  /** Trains directs au départ de cette gare aujourd'hui. */
  nbTrainsJour: z.number().int(),
});

export const schemaReponseGaresProches = z.object({
  /** Les plus proches d'abord. */
  gares: z.array(schemaGareProche),
  /** Gare de départ proposée par défaut (D064) ; null sans gare. */
  uicConseille: z.string().nullable(),
});

export type ParametresGaresProches = z.infer<typeof schemaParametresGaresProches>;
export type GareProche = z.infer<typeof schemaGareProche>;
export type ReponseGaresProches = z.infer<typeof schemaReponseGaresProches>;
