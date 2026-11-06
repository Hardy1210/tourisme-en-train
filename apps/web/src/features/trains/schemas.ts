// Contrat de GET /api/trains (docs/05-api.md § 3.8, D040, D051).
import { schemaTypeTrain } from '@tourisme/commun';
import { z } from 'zod';

import { schemaHeure } from '@/lib/dates/heures';
import { schemaDate, schemaUic } from '@/lib/http/valider';

export const schemaParametresTrains = z.object({
  depart: schemaUic,
  arrivee: schemaUic,
  date: schemaDate,
  /** `HH:MM` → secondes depuis minuit. */
  depuis: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'L’heure doit être au format HH:MM.')
    .transform((texte) => Number(texte.slice(0, 2)) * 3600 + Number(texte.slice(3, 5)) * 60)
    .optional(),
});

export const schemaTrain = z.object({
  /** Trains en jumelage (mêmes heures) : un seul train, tous les trajets et numéros (D040). */
  trajetIds: z.array(z.string()),
  depart: schemaHeure,
  arrivee: schemaHeure,
  dureeMin: z.number().int(),
  typeTrain: schemaTypeTrain,
  numeros: z.array(z.string()),
});

export const schemaReponseTrains = z.object({
  date: z.iso.date(),
  aller: z.array(schemaTrain),
  retour: z.array(schemaTrain),
  dernierRetour: schemaTrain.nullable(),
});

/** Arrêts du prochain train direct, du départ à l'arrivée : la ligne dessinée sur la carte (D074). */
export const schemaReponseArretsTrain = z.object({
  date: z.iso.date(),
  arrets: z.array(z.object({ uic: schemaUic, nom: z.string(), lat: z.number(), lon: z.number() })),
});

export type ParametresTrains = z.infer<typeof schemaParametresTrains>;
export type Train = z.infer<typeof schemaTrain>;
export type ReponseTrains = z.infer<typeof schemaReponseTrains>;
export type ReponseArretsTrain = z.infer<typeof schemaReponseArretsTrain>;
