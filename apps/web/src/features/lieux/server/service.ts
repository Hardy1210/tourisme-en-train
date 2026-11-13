import 'server-only';

import { parametres } from '@/config/parametres';
import { distanceMarcheM, dureeMarcheMin, rayonVolOiseauM } from '@/lib/geo/distances';

import type {
  ParametresAutour,
  ParametresLieuxCarte,
  ReponseAutour,
  ReponseLieuxCarte,
} from '../schemas';

import { lieuxAutour } from './requetes';
import { lieuxCarte } from './requetes-carte';

/** Lieux autour de l'utilisateur ; le rayon est une distance à pied, comme pour les gares (D043). */
export async function autour({
  lat,
  lon,
  rayon,
  categories,
}: ParametresAutour): Promise<ReponseAutour> {
  const lignes = await lieuxAutour({
    lat,
    lon,
    rayonVolOiseauM: rayonVolOiseauM(rayon),
    categories,
    airesDeJeux: {
      sousCategories: parametres.acces.sousCategoriesAiresDeJeux,
      rayonVolOiseauM: rayonVolOiseauM(parametres.acces.rayonAiresDeJeuxM),
    },
    limite: parametres.limites.lieux,
  });
  return {
    lieux: lignes.map((l) => ({
      cle: l.cle,
      nom: l.nom,
      categorie: l.categorie,
      sousCategorie: l.sous_categorie,
      distanceM: distanceMarcheM(l.vol_oiseau_m),
      dureeMarcheMin: dureeMarcheMin(l.vol_oiseau_m),
      imageUrl: l.image_url,
      qualiteTourisme: l.qualite_tourisme,
      source: l.source,
      lat: l.lat,
      lon: l.lon,
    })),
    total: lignes[0]?.total ?? 0,
  };
}

/** Lieux de la carte dans une zone, regroupés en bulles sur le téléphone (D094). */
export async function lieuxPourCarte(zone: ParametresLieuxCarte): Promise<ReponseLieuxCarte> {
  const { acces } = parametres;
  const lignes = await lieuxCarte({
    zone: {
      point:
        zone.lat !== undefined && zone.lon !== undefined && zone.rayon !== undefined
          ? {
              lat: zone.lat,
              lon: zone.lon,
              rayonVolOiseauM: rayonVolOiseauM(zone.rayon),
              airesVolOiseauM: rayonVolOiseauM(acces.rayonAiresDeJeuxM),
            }
          : null,
      gares: zone.gares,
    },
    airesDeJeux: acces.sousCategoriesAiresDeJeux,
    pauvres: {
      sources: acces.lieuxPauvresSources,
      categories: acces.lieuxPauvresCategories,
      toujoursGardes: acces.lieuxPauvresToujoursGardes,
    },
  });
  return {
    lieux: lignes.map((l): ReponseLieuxCarte['lieux'][number] => [
      l.cle,
      l.lat,
      l.lon,
      l.categorie,
      l.secondaires,
    ]),
  };
}
