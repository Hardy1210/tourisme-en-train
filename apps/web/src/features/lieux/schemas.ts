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
  id: z.number().int(),
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

export type ParametresAutour = z.infer<typeof schemaParametresAutour>;
export type LieuResume = z.infer<typeof schemaLieuResume>;
export type ReponseAutour = z.infer<typeof schemaReponseAutour>;
