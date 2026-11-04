// Positions de la feuille de résultats sur mobile : décision pure à partir d'un geste.
export type PositionFeuille = 'carte' | 'milieu' | 'plein';

const ORDRE: readonly PositionFeuille[] = ['carte', 'milieu', 'plein'];

/** Écart en pixels à partir duquel un geste compte comme un glissement. */
export const SEUIL_GLISSEMENT_PX = 40;

/** Position après un glissement : vers le haut (écart négatif) la feuille monte d'un cran. */
export function apresGlissement(position: PositionFeuille, ecartPx: number): PositionFeuille {
  if (Math.abs(ecartPx) < SEUIL_GLISSEMENT_PX) return position;
  const index = ORDRE.indexOf(position) + (ecartPx < 0 ? 1 : -1);
  return ORDRE[Math.max(0, Math.min(ORDRE.length - 1, index))] ?? position;
}

/** Un toucher ou la touche Entrée sur la poignée : le plein écran se replie, sinon la feuille monte. */
export function apresToucher(position: PositionFeuille): PositionFeuille {
  return position === 'plein' ? 'milieu' : position === 'milieu' ? 'plein' : 'milieu';
}
