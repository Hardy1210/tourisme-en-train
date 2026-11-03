// CO₂ et prix estimé d'une liaison (docs/05-api.md § 3.10) : calcul 100 % local (lib/impact, D048).
import 'server-only';

import { parametres } from '@/config/parametres';
import { gareParUic } from '@/lib/db/requetes-partagees';
import { Introuvable } from '@/lib/http/erreurs';
import { impactLiaison } from '@/lib/impact/impact';

import type { ParametresImpact, ReponseImpact } from '../schemas';

import { liaisonPourImpact } from './requetes';

export async function impact({ depart, arrivee, type }: ParametresImpact): Promise<ReponseImpact> {
  const [gareDepart, gareArrivee] = await Promise.all([gareParUic(depart), gareParUic(arrivee)]);
  if (gareDepart === null || gareArrivee === null)
    throw new Introuvable('Cette gare est inconnue.');
  const liaison = await liaisonPourImpact(gareDepart.id, gareArrivee.id);
  if (liaison === null) {
    throw new Introuvable('Aucun train direct ne relie ces deux gares.');
  }
  // Sans type demandé : tous les types de la liaison, donc le moins favorable (même chiffre que la carte, D051).
  const calcul = impactLiaison(liaison.distance_km, type ? [type] : liaison.types_train);
  return {
    distanceKm: liaison.distance_km,
    ...calcul,
    source: parametres.impact.source,
    dateReleve: parametres.impact.dateReleve,
  };
}
