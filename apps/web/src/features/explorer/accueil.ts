// Accueil du premier lancement (D113) : fonctions pures et repère « accueil vu ». Le repère est un simple
// oui, sur l'appareil seulement : jamais une position (règle 5).
import { plusProcheDifferente, type Depart } from './depart';

export const CLE_ACCUEIL_VU = 'wagoo-accueil-vu';

/**
 * Où en est l'accueil dans cette visite : `bienvenue` (écran 1), `gare` (écran 3a, départ choisi), `fini`
 * (Explorer). Au premier lancement seulement : ensuite, `fini` dès l'ouverture.
 */
export type EtatAccueil = 'bienvenue' | 'gare' | 'fini';

/**
 * Écran à montrer par-dessus Explorer ; null : Explorer lui-même (ou ses écrans d'état). `recherche` : la
 * gare n'est pas encore trouvée (position demandée) ; même aspect, mais pas de fenêtre modale (bug du 24/11).
 */
export type EtapeAccueil = 'bienvenue' | 'recherche' | 'gare' | null;

export const etatAccueilInitial = (accueilVu: boolean): EtatAccueil =>
  accueilVu ? 'fini' : 'bienvenue';

/**
 * Un lien partagé avec une gare (`?gare=`) ouvre toujours Explorer : on ne bloque jamais un lien. Écran 3a :
 * pendant la recherche de la gare et une fois trouvée ; position refusée, hors région ou erreur : les écrans
 * d'Explorer prennent le relais, et 3a revient dès qu'une gare est choisie (« Dans quelle ville… »).
 */
export function etapeAccueil({
  etat,
  gareDansUrl,
  depart,
}: {
  etat: EtatAccueil;
  gareDansUrl: boolean;
  depart: Depart['etat'];
}): EtapeAccueil {
  if (etat === 'fini') return null;
  if (etat === 'bienvenue') return gareDansUrl ? null : 'bienvenue';
  if (depart === 'chargement') return 'recherche';
  return depart === 'pret' ? 'gare' : null;
}

/**
 * Sous-titre de l'écran 3a. « La plus proche » seulement si c'est vrai : la gare proposée peut être une
 * gare mieux desservie un peu plus loin (D064).
 */
export function presentationGare(
  depart: Extract<Depart, { etat: 'pret' }>,
): 'plus_proche' | 'mieux_desservie' | 'choisie' {
  if (depart.origine === 'choix') return 'choisie';
  return plusProcheDifferente(depart) ? 'mieux_desservie' : 'plus_proche';
}

export function lireAccueilVu(): boolean {
  try {
    return localStorage.getItem(CLE_ACCUEIL_VU) === '1';
  } catch {
    return false;
  }
}

export function ecrireAccueilVu(): void {
  try {
    localStorage.setItem(CLE_ACCUEIL_VU, '1');
  } catch {
    // Stockage refusé (navigation privée) : l'accueil reviendra à la prochaine ouverture, rien de plus.
  }
}

/** Une photo de la liste, d'après un tirage entre 0 (compris) et 1 (exclu), comme `Math.random()`. */
export function photoAuHasard<T>(liste: readonly T[], tirage: number): T {
  const index = Math.min(Math.floor(tirage * liste.length), liste.length - 1);
  return liste[index] as T;
}
