import 'server-only';

import { parametres } from '@/config/parametres';
import { distanceMarcheM, dureeMarcheMin, rayonVolOiseauM } from '@/lib/geo/distances';

import type { ParametresAutour, ReponseAutour } from '../schemas';

import { lieuxAutour } from './requetes';

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
