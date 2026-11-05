import 'server-only';

import { parametres } from '@/config/parametres';
import { dureeVeloMin, dureeVoitureMin } from '@/lib/geo/distances';

import { gareConseillee, garesAProposer } from '../conseil';
import type { ParametresGaresProches, ReponseGaresProches } from '../schemas';

import { garesAutourDuPoint } from './requetes';

/** `dateDuJour` vient de la route : le service ne lit jamais l'horloge. */
export async function garesProches(
  { lat, lon, limite }: ParametresGaresProches,
  dateDuJour: string,
): Promise<ReponseGaresProches> {
  const limites = parametres.gareConseillee;
  const autour = await garesAutourDuPoint(lat, lon, limite, limites.distanceMaxM, dateDuJour);
  const candidates = autour.map((g) => ({
    ...g,
    distanceM: g.distance_m,
    dansRegion: g.dans_region,
    trainsParDestination: g.trains_par_destination,
  }));
  const conseillee = gareConseillee(candidates, limites);
  return {
    uicConseille: conseillee?.uic ?? null,
    gares: garesAProposer(candidates, conseillee, limite).map((g) => ({
      uic: g.uic,
      nom: g.nom,
      commune: g.commune,
      lat: g.lat,
      lon: g.lon,
      distanceM: Math.round(g.distance_m),
      dureeVeloMin: dureeVeloMin(g.distance_m),
      dureeVoitureMin: dureeVoitureMin(g.distance_m),
      dansRegion: g.dans_region,
    })),
  };
}
