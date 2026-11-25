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

/**
 * Photo d'un lieu (D100, D101) : deux vignettes fournies par la source et le crédit à afficher avec elles.
 * Présente seulement si ses droits sont en cours à la date du jour ; sinon null (l'icône de la catégorie).
 */
export const schemaPhoto = z.object({
  petite: z.string(),
  grande: z.string(),
  auteur: z.string(),
  licence: z.string(),
  licenceUrl: z.string().nullable(),
  /** Page du fichier (Wikimedia Commons) ; null pour DATAtourisme. */
  page: z.string().nullable(),
  source: z.enum(['wikimedia_commons', 'datatourisme_photos']),
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
  photo: schemaPhoto.nullable(),
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

/** GET /api/lieux/rangees (docs/05-api.md § 3.6 ter, D121) : les filtres de l'onglet Lieux. */
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

/**
 * Une rangée de l'onglet Lieux (D121, docs/05-api.md § 3.6 ter). Une seule sorte pour l'instant : les lieux
 * à pied d'une gare d'arrivée. Une autre sorte s'ajoutera comme une nouvelle variante de l'union (`type`).
 */
export const schemaRangeeGare = z.object({
  type: z.literal('gare'),
  /** Gare d'arrivée : « Voir tout » ouvre sa fiche destination. */
  gare: z.object({ uic: z.string(), nom: z.string() }),
  dureeTrainMin: z.number().int(),
  /** Lieux à pied de cette gare avec ces filtres, avant la limite `limites.lieuxParRangee`. */
  total: z.number().int(),
  lieux: z.array(schemaLieuResume),
});

export const schemaRangee = z.discriminatedUnion('type', [schemaRangeeGare]);

/** GET /api/lieux/rangees : mêmes paramètres que /api/lieux, `page` compte des rangées. */
export const schemaReponseRangeesLieux = z.object({
  rangees: z.array(schemaRangee),
  /** Lieux distincts, toutes rangées confondues : le nombre du titre. */
  total: z.number().int(),
  totalRangees: z.number().int(),
  /** Page de rangées à demander pour « Voir plus » ; null s'il n'y en a plus. */
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
  photo: schemaPhoto.nullable(),
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
export type Photo = z.infer<typeof schemaPhoto>;
export type ReponseAutour = z.infer<typeof schemaReponseAutour>;
export type ParametresLieuxAccessibles = z.infer<typeof schemaParametresLieuxAccessibles>;
export type Rangee = z.infer<typeof schemaRangee>;
export type ReponseRangeesLieux = z.infer<typeof schemaReponseRangeesLieux>;

/**
 * GET /api/carte/lieux (D094) : les lieux autour d'un point (`lat`, `lon`, `rayon` parmi les distances du
 * filtre) et/ou les lieux à pied d'une liste de gares (`gares`, codes UIC séparés par des virgules). Au
 * moins l'un des deux.
 */
export const schemaParametresLieuxCarte = z
  .object({
    lat: schemaLat.optional(),
    lon: schemaLon.optional(),
    rayon: schemaParmi(parametres.rayons.autourDeMoiOptionsM, 'Rayons (m)').optional(),
    gares: z
      .string()
      .optional()
      .transform((texte) => (texte ? [...new Set(texte.split(','))] : []))
      .pipe(z.array(schemaUic).max(parametres.limites.destinations)),
  })
  .refine(
    (p) =>
      (p.lat === undefined) === (p.lon === undefined) &&
      (p.lat === undefined) === (p.rayon === undefined),
    { message: 'lat, lon et rayon vont ensemble.' },
  )
  .refine((p) => p.lat !== undefined || p.gares.length > 0, {
    message: 'Il faut un point ou au moins une gare.',
  });
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
