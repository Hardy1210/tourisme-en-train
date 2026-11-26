// Billet de « Votre gare » (maquette Explorer-B-Max-2) : une décision pure, testable sans écran.
import { prochainTrainDirect } from '@/features/destinations/presentation';
import type { Destination } from '@/features/destinations/schemas';

import { TEXTES_TRAJET } from './contenu-trajet';

export type BilletVotreGare = { valeur: string; vers: string; aucun: boolean };

/**
 * Destination choisie : le prochain train vers elle, ou « aucun aujourd'hui » vers elle (le billet garde sa
 * place). Sinon : le train direct qui part le plus tôt parmi toutes les destinations, ou rien.
 */
export function billetVotreGare(
  choisie: Destination | null | undefined,
  destinations: readonly Destination[] | undefined,
  autreJour: boolean,
): BilletVotreGare | null {
  if (choisie) {
    const train = prochainTrainDirect([choisie]);
    return train
      ? { valeur: train.heure, vers: train.vers, aucun: false }
      : { valeur: TEXTES_TRAJET.aucunDepart(autreJour), vers: choisie.titre, aucun: true };
  }
  const train = destinations ? prochainTrainDirect(destinations) : null;
  return train && { valeur: train.heure, vers: train.vers, aucun: false };
}
