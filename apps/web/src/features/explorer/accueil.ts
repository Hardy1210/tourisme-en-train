// Accueil du premier lancement (D113) : fonctions pures et repère « accueil vu ». Le repère est un simple
// oui, sur l'appareil seulement : jamais une position (règle 5).

export const CLE_ACCUEIL_VU = 'wagoo-accueil-vu';

/** `bienvenue` : écran « Que faire autour de vous ? » ; null : Explorer. */
export type EtapeAccueil = 'bienvenue' | null;

/** Un lien partagé avec une gare (`?gare=`) ouvre toujours Explorer : on ne bloque jamais un lien. */
export function etapeAccueil({
  accueilVu,
  gareDansUrl,
}: {
  accueilVu: boolean;
  gareDansUrl: boolean;
}): EtapeAccueil {
  return !accueilVu && !gareDansUrl ? 'bienvenue' : null;
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
