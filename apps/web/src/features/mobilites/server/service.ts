// Transports sur place (docs/05-api.md § 3.9, D046).
import 'server-only';

import { parametres } from '@/config/parametres';
import { gareParUic } from '@/lib/db/requetes-partagees';
import { dureeMarcheDepuisAPiedMin } from '@/lib/geo/distances';
import { Introuvable } from '@/lib/http/erreurs';

import type { ReponseMobilites } from '../schemas';

import { mobilitesDeLaGare } from './requetes';

export async function mobilites(uic: string): Promise<ReponseMobilites> {
  const gare = await gareParUic(uic);
  if (gare === null) throw new Introuvable('Cette gare est inconnue.');
  const lignes = await mobilitesDeLaGare(gare.id, parametres.limites.mobilites);
  return {
    mobilites: lignes.map((m) => ({
      type: m.type,
      nom: m.nom,
      lignes: m.lignes ?? [],
      operateur: m.operateur,
      distanceM: m.distance_m,
      dureeMarcheMin: dureeMarcheDepuisAPiedMin(m.distance_m),
      source: m.source,
    })),
  };
}
