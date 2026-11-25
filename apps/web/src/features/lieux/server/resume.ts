import 'server-only';
import { schemaCategorie } from '@tourisme/commun';
import { z } from 'zod';

import { photoDe } from '../photo';
import type { LieuResume } from '../schemas';

import { schemaColonnesPhoto } from './requetes-photo';

/** Colonnes d'un lieu résumé, telles que les requêtes de l'onglet Lieux les sélectionnent (`l` : lieu). */
export const schemaLigneLieuResume = schemaColonnesPhoto.extend({
  cle: z.string(),
  nom: z.string(),
  categorie: schemaCategorie,
  sous_categorie: z.string().nullable(),
  qualite_tourisme: z.boolean(),
  source: z.string(),
  lat: z.number(),
  lon: z.number(),
  distance_m: z.number().int(),
  duree_marche_min: z.number().int(),
});

/** Une ligne de la base → le résumé de lieu du contrat (docs/05-api.md § 1.13 pour la photo). */
export function lieuResumeDe(ligne: z.infer<typeof schemaLigneLieuResume>): LieuResume {
  return {
    cle: ligne.cle,
    nom: ligne.nom,
    categorie: ligne.categorie,
    sousCategorie: ligne.sous_categorie,
    distanceM: ligne.distance_m,
    dureeMarcheMin: ligne.duree_marche_min,
    photo: photoDe(ligne),
    qualiteTourisme: ligne.qualite_tourisme,
    source: ligne.source,
    lat: ligne.lat,
    lon: ligne.lon,
  };
}
