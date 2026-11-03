// Contrat de GET /api/impact (docs/05-api.md § 3.10, D051).
import { z } from 'zod';

import { schemaUic } from '@/lib/http/valider';

export const schemaParametresImpact = z.object({
  depart: schemaUic,
  arrivee: schemaUic,
  type: z
    .enum(['TER', 'INTERCITES', 'TGV'], { error: 'Types possibles : TER, INTERCITES, TGV.' })
    .optional(),
});

export const schemaImpact = z.object({
  distanceKm: z.number(),
  co2Kg: z.object({
    train: z.number().nullable(),
    voitureSeule: z.number(),
    voiturePartagee: z.number(),
    avion: z.number().nullable(),
  }),
  co2EconomiseKg: z.number().nullable(),
  prixEstime: z.object({ min: z.number(), max: z.number(), devise: z.literal('EUR') }).nullable(),
  /** Ce que couvre chaque chiffre : CO₂ pour un aller-retour, prix pour un aller simple (D051). */
  trajet: z.object({ co2: z.literal('aller-retour'), prix: z.literal('aller-simple') }),
  source: z.string(),
  dateReleve: z.iso.date(),
});

export type ParametresImpact = z.infer<typeof schemaParametresImpact>;
export type ReponseImpact = z.infer<typeof schemaImpact>;
