// Contrat de GET /api/destinations (docs/05-api.md § 3.4, D047).
import { schemaCategorie, schemaTypeTrain } from '@tourisme/commun';
import { z } from 'zod';

import { parametres } from '@/config/parametres';
import { schemaCategories, schemaDate, schemaId, schemaParmi } from '@/lib/http/valider';

const optionsDureeMax = parametres.durees.trainMaxOptionsMin;

export const schemaParametresDestinations = z.object({
  gare: schemaId('la gare'),
  date: schemaDate,
  categories: schemaCategories,
  dureeMax: schemaParmi(optionsDureeMax, 'Durées maximales (min)')
    .optional()
    .transform((duree) => duree ?? Math.max(...optionsDureeMax)),
});

/** Heure GTFS prête à afficher (§ 1.8) : secondes depuis minuit de la date de service + texte. */
export const schemaHeure = z.object({
  s: z.number().int(),
  texte: z.string(),
  lendemain: z.boolean(),
});

export const schemaDestination = z.object({
  /** Nom de la carte : la commune, ou le nom de la gare si elle est hors de la ville (D049). */
  titre: z.string(),
  commune: z.object({ nom: z.string().nullable(), codeInsee: z.string().nullable() }),
  /** Gare hors de la ville (TGV) : afficher « à <commune> » sous le titre. */
  horsVille: z.boolean(),
  /** Gare en tête : le plus de trains ; à égalité, la plus rapide. */
  gare: z.object({
    id: z.number().int(),
    nom: z.string(),
    lat: z.number(),
    lon: z.number(),
    dansRegion: z.boolean(),
  }),
  autresGares: z.array(
    z.object({
      id: z.number().int(),
      nom: z.string(),
      dureeMin: z.number().int(),
      nbTrains: z.number().int(),
    }),
  ),
  dureeMin: z.number().int(),
  trancheTemps: z.string(),
  nbTrains: z.number().int(),
  premierDepart: schemaHeure,
  dernierRetour: schemaHeure.nullable(),
  prochainDepart: schemaHeure.nullable(),
  prochaineArrivee: schemaHeure.nullable(),
  typesTrain: z.array(schemaTypeTrain),
  distanceKm: z.number(),
  lieuxParCategorie: z.partialRecord(schemaCategorie, z.number().int()),
  /** Région, moins de `destinations.lieuxMinEnTete` lieux des catégories demandées : en fin de liste (D050). */
  peuDeLieux: z.boolean(),
  faisableJournee: z.boolean(),
  lieuxCharges: z.boolean(),
  co2EconomiseKg: z.number().nullable(),
  prixEstime: z.object({ min: z.number(), max: z.number(), devise: z.literal('EUR') }).nullable(),
});

export const schemaReponseDestinations = z.object({
  gareDepart: z.object({ id: z.number().int(), nom: z.string() }),
  date: z.iso.date(),
  destinations: z.array(schemaDestination),
});

export type ParametresDestinations = z.infer<typeof schemaParametresDestinations>;
export type Heure = z.infer<typeof schemaHeure>;
export type Destination = z.infer<typeof schemaDestination>;
export type ReponseDestinations = z.infer<typeof schemaReponseDestinations>;
