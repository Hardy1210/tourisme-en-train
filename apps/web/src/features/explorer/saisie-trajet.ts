// Saisie de la page « Trajet » (D085, remise en ordre le 24/11) : un seul état, changé par des actions
// nommées, au lieu de quatre états remis à zéro un par un. Fonctions pures : testables sans navigateur.
import type { Destination } from '@/features/destinations/schemas';
import { filtrerDestinations, type Recherche } from './recherche-destination';

export type EtatSaisie = {
  /** Texte tapé dans Départ (vide : le champ montre le départ actuel en indication). */
  texteDepart: string;
  /** null : rien tapé depuis l'ouverture, le champ montre la recherche en cours. */
  saisieDestination: string | null;
  /** Gare d'avant un changement de départ : la destination déjà choisie est à revérifier. */
  verifierDepuis: string | null;
  /** « Pas de train direct de … à … » ; null si rien à dire. */
  message: string | null;
};

export const SAISIE_VIDE: EtatSaisie = {
  texteDepart: '',
  saisieDestination: null,
  verifierDepuis: null,
  message: null,
};

export type ActionSaisie =
  | { type: 'saisirDepart'; texte: string }
  | { type: 'saisirDestination'; texte: string }
  | { type: 'departChoisi'; verifierDepuis: string | null }
  | { type: 'verifiee' }
  | { type: 'impossible'; message: string }
  | { type: 'effacerDestination' }
  | { type: 'reinitialiser' };

export function saisieTrajet(etat: EtatSaisie, action: ActionSaisie): EtatSaisie {
  switch (action.type) {
    case 'saisirDepart':
      return { ...etat, texteDepart: action.texte };
    case 'saisirDestination':
      return { ...etat, saisieDestination: action.texte, message: null };
    case 'departChoisi':
      return { ...etat, texteDepart: '', message: null, verifierDepuis: action.verifierDepuis };
    case 'verifiee':
      return { ...etat, verifierDepuis: null };
    case 'impossible':
      return { ...etat, verifierDepuis: null, message: action.message, saisieDestination: '' };
    case 'effacerDestination':
      return { ...etat, saisieDestination: '' };
    case 'reinitialiser':
      return SAISIE_VIDE;
  }
}

export type Verification = 'aucune' | 'attente' | 'possible' | 'impossible';

/**
 * Après un changement de départ, la destination déjà choisie a-t-elle encore un train direct ? Calculé
 * à partir de la liste du nouveau départ, dès qu'elle est chargée.
 */
export function resultatVerification({
  verifierDepuis,
  gareActuelle,
  liste,
  recherche,
}: {
  verifierDepuis: string | null;
  gareActuelle: string | null;
  liste: readonly Destination[] | undefined;
  recherche: Recherche;
}): Verification {
  if (verifierDepuis === null) return 'aucune';
  if (gareActuelle === null || gareActuelle === verifierDepuis || liste === undefined) {
    return 'attente';
  }
  return filtrerDestinations(liste, recherche).length > 0 ? 'possible' : 'impossible';
}
