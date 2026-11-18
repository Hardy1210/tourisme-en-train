// Densité de la carte : calcul pur (audit C, règle de Hardy du 18/11).

/**
 * Densité de dessin de la carte : celle de l'écran, plafonnée à `max` (`carte.densiteMax`). Un iPhone ×3
 * dessine 2,25 fois moins de points en ×2, pour une différence de netteté à peine visible ; un écran
 * d'ordinateur (×1 à ×1,5) ne change pas. Illisible (serveur, navigateur ancien) : 1.
 */
export function densiteCarte(densiteEcran: number | undefined, max: number): number {
  if (densiteEcran === undefined || !Number.isFinite(densiteEcran) || densiteEcran <= 0) return 1;
  return Math.min(densiteEcran, max);
}
