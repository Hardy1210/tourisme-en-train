// Contrats de GET /api/geocodage et /api/geocodage/inverse (docs/05-api.md § 3.11, § 3.11 bis).
import { z } from 'zod';

import { schemaLat, schemaLon } from '@/lib/http/valider';

export const schemaParametresGeocodage = z.object({
  q: z
    .string({ error: 'Tapez au moins 3 caractères.' })
    .trim()
    .min(3, 'Tapez au moins 3 caractères.')
    .max(80, 'La recherche est limitée à 80 caractères.'),
});

export const schemaParametresInverse = z.object({ lat: schemaLat, lon: schemaLon });

export const schemaReponseGeocodage = z.object({
  resultats: z.array(
    z.object({
      libelle: z.string(),
      commune: z.string(),
      lat: z.number(),
      lon: z.number(),
      type: z.enum(['commune', 'adresse', 'gare']),
    }),
  ),
  horsLigne: z.boolean(),
});

export const schemaReponseInverse = z.object({
  commune: z.string(),
  codeInsee: z.string().nullable(),
  horsLigne: z.boolean(),
});

export type ParametresGeocodage = z.infer<typeof schemaParametresGeocodage>;
export type ParametresInverse = z.infer<typeof schemaParametresInverse>;
export type ReponseGeocodage = z.infer<typeof schemaReponseGeocodage>;
export type ReponseInverse = z.infer<typeof schemaReponseInverse>;
