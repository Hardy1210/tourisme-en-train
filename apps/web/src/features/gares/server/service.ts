import 'server-only';

import { dureeVeloMin, dureeVoitureMin } from '@/lib/geo/distances';

import type { ParametresGaresProches, ReponseGaresProches } from '../schemas';

import { garesLesPlusProches } from './requetes';

export async function garesProches({
  lat,
  lon,
  limite,
}: ParametresGaresProches): Promise<ReponseGaresProches> {
  const gares = await garesLesPlusProches(lat, lon, limite);
  return {
    gares: gares.map((g) => ({
      uic: g.uic,
      nom: g.nom,
      commune: g.commune,
      distanceM: Math.round(g.distance_m),
      dureeVeloMin: dureeVeloMin(g.distance_m),
      dureeVoitureMin: dureeVoitureMin(g.distance_m),
      dansRegion: g.dans_region,
    })),
  };
}
