// Liste sous « Ma position » dans la page « Trajet » (D085) : une décision pure, testable sans écran.

/**
 * Sans position connue (refusée, introuvable ou jamais demandée), les gares proches n'existent pas :
 * on propose les grandes gares de la région, comme l'accueil. Avec une position, ses gares proches,
 * ou rien tant qu'elles n'ont pas répondu.
 */
export function listeSousMaPosition({
  positionConnue,
  nombreProches,
}: {
  positionConnue: boolean;
  nombreProches: number;
}): 'proches' | 'region' | null {
  if (!positionConnue) return 'region';
  return nombreProches > 0 ? 'proches' : null;
}
