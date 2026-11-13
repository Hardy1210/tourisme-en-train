// Contrats des lieux : GET /api/autour (docs/05-api.md § 3.3) ; résumé de lieu réutilisé en E09.
import { schemaCategorie } from '@tourisme/commun';
import { z } from 'zod';

import { parametres } from '@/config/parametres';
import {
  schemaCategories,
  schemaDate,
  schemaLat,
  schemaLon,
  schemaParmi,
  schemaUic,
} from '@/lib/http/valider';

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

/** GET /api/destinations/[uic]/lieux (docs/05-api.md § 3.6) : rayon à pied, au plus `acces.rayonPiedM`. */
export const schemaParametresLieuxGare = z.object({
  categories: schemaCategories,
  rayon: z.coerce
    .number()
    .int(`Le rayon doit être un nombre de mètres entre 100 et ${parametres.acces.rayonPiedM}.`)
    .min(100, `Le rayon doit être un nombre de mètres entre 100 et ${parametres.acces.rayonPiedM}.`)
    .max(
      parametres.acces.rayonPiedM,
      `Le rayon doit être un nombre de mètres entre 100 et ${parametres.acces.rayonPiedM}.`,
    )
    .optional()
    .transform((rayon) => rayon ?? parametres.acces.rayonPiedM),
});

const optionsDureeMax = parametres.durees.trainMaxOptionsMin;

/** GET /api/lieux (docs/05-api.md § 3.6 bis, D056) : l'onglet Lieux. */
export const schemaParametresLieuxAccessibles = z.object({
  gare: schemaUic,
  date: schemaDate,
  categories: schemaCategories,
  dureeMax: schemaParmi(optionsDureeMax, 'Durées maximales (min)')
    .optional()
    .transform((duree) => duree ?? Math.max(...optionsDureeMax)),
  page: z.coerce
    .number({ error: 'La page doit être un entier à partir de 1.' })
    .int('La page doit être un entier à partir de 1.')
    .min(1, 'La page doit être un entier à partir de 1.')
    .optional()
    .transform((page) => page ?? 1),
});

export const schemaLieuAccessible = schemaLieuResume.extend({
  /** Gare d'arrivée : la plus rapide (train + marche) si le lieu est proche de plusieurs gares. */
  gare: z.object({ uic: z.string(), nom: z.string() }),
  dureeTrainMin: z.number().int(),
});

export const schemaReponseLieuxAccessibles = z.object({
  lieux: z.array(schemaLieuAccessible),
  /** Tous les lieux correspondants, toutes pages confondues. */
  total: z.number().int(),
  /** Page à demander pour « Voir plus » ; null s'il n'y en a plus. */
  pageSuivante: z.number().int().nullable(),
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
export type ParametresLieuxAccessibles = z.infer<typeof schemaParametresLieuxAccessibles>;
export type ReponseLieuxAccessibles = z.infer<typeof schemaReponseLieuxAccessibles>;

/**
 * GET /api/carte/lieux (D094) : autour d'un point (`lat`, `lon`, `rayon` parmi les distances du filtre) ou
 * d'une gare de destination (`gare`). Un seul des deux.
 */
export const schemaParametresLieuxCarte = z.union([
  z.object({ gare: schemaUic }),
  z.object({
    lat: schemaLat,
    lon: schemaLon,
    rayon: schemaParmi(parametres.rayons.autourDeMoiOptionsM, 'Rayons (m)'),
  }),
]);
export type ParametresLieuxCarte = z.infer<typeof schemaParametresLieuxCarte>;

/**
 * GET /api/carte/lieux (D091) : tous les lieux de la carte, en tableaux courts pour une réponse légère :
 * [clé, latitude, longitude, catégorie, catégories secondaires].
 */
export const schemaReponseLieuxCarte = z.object({
  lieux: z.array(
    z.tuple([z.string(), z.number(), z.number(), schemaCategorie, z.array(schemaCategorie)]),
  ),
});
export type ReponseLieuxCarte = z.infer<typeof schemaReponseLieuxCarte>;
