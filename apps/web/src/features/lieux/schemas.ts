// Contrats des lieux : GET /api/autour (docs/05-api.md § 3.3) ; résumé de lieu réutilisé en E09.
import { schemaCategorie } from '@tourisme/commun';
import { z } from 'zod';

import { parametres } from '@/config/parametres';
import { schemaCategories, schemaLat, schemaLon, schemaParmi } from '@/lib/http/valider';

export const schemaParametresAutour = z.object({
  lat: schemaLat,
  lon: schemaLon,
  rayon: schemaParmi(parametres.rayons.autourDeMoiOptionsM, 'Rayons (m)')
    .optional()
    .transform((rayon) => rayon ?? parametres.rayons.autourDeMoiDefautM),
  categories: schemaCategories,
});

export const schemaLieuResume = z.object({
  /** Clé de source : identifiant public stable (D052). */
  cle: z.string(),
  nom: z.string(),
  categorie: schemaCategorie,
  sousCategorie: z.string().nullable(),
  /** Distance à pied (vol d'oiseau × détour, D043). */
  distanceM: z.number().int(),
  dureeMarcheMin: z.number().int(),
  imageUrl: z.string().nullable(),
  qualiteTourisme: z.boolean(),
  /** Code de la source : l'interface affiche son attribution (§ 1.12). */
  source: z.string(),
  lat: z.number(),
  lon: z.number(),
});

export const schemaReponseAutour = z.object({
  lieux: z.array(schemaLieuResume),
  /** Lieux dans le rayon, avant la limite `parametres.limites.lieux`. */
  total: z.number().int(),
});

/** GET /api/destinations/[uic]/lieux (docs/05-api.md § 3.6) : rayon à pied, au plus `rayons.lieuxGareM`. */
export const schemaParametresLieuxGare = z.object({
  categories: schemaCategories,
  rayon: z.coerce
    .number()
    .int(`Le rayon doit être un nombre de mètres entre 100 et ${parametres.rayons.lieuxGareM}.`)
    .min(
      100,
      `Le rayon doit être un nombre de mètres entre 100 et ${parametres.rayons.lieuxGareM}.`,
    )
    .max(
      parametres.rayons.lieuxGareM,
      `Le rayon doit être un nombre de mètres entre 100 et ${parametres.rayons.lieuxGareM}.`,
    )
    .optional()
    .transform((rayon) => rayon ?? parametres.rayons.lieuxGareM),
});

/** GET /api/lieux/[cle] (docs/05-api.md § 3.7, D052). */
export const schemaFicheLieu = z.object({
  cle: z.string(),
  /** Clé du lien suivi, s'il désignait un doublon ou un membre de site ; sinon null. */
  demande: z.string().nullable(),
  nom: z.string(),
  categorie: schemaCategorie,
  sousCategorie: z.string().nullable(),
  description: z.string().nullable(),
  adresse: z.string().nullable(),
  commune: z.string().nullable(),
  url: z.string().nullable(),
  imageUrl: z.string().nullable(),
  horaires: z.string().nullable(),
  periode: z.string().nullable(),
  qualiteTourisme: z.boolean(),
  source: z.string(),
  attribution: z.string(),
  lat: z.number(),
  lon: z.number(),
  garesProches: z.array(
    z.object({
      uic: z.string(),
      nom: z.string(),
      distanceM: z.number().int(),
      dureeMarcheMin: z.number().int(),
    }),
  ),
});

export type ParametresLieuxGare = z.infer<typeof schemaParametresLieuxGare>;
export type FicheLieu = z.infer<typeof schemaFicheLieu>;
export type ParametresAutour = z.infer<typeof schemaParametresAutour>;
export type LieuResume = z.infer<typeof schemaLieuResume>;
export type ReponseAutour = z.infer<typeof schemaReponseAutour>;
