// iPhone, application installée : avec la barre d'état transparente, iOS annonce une hauteur d'écran trop
// courte (`100dvh`), et le bas de l'écran reste vide. Sans barre de navigateur, la vraie hauteur est celle
// de l'écran (D072). Calcul pur, à partir de ce que dit le navigateur.

type Ecran = { standaloneIos: boolean; paysage: boolean; largeur: number; hauteur: number };

/** La hauteur à imposer, en pixels ; null quand `100dvh` est juste (Android, Safari, ordinateur). */
export function hauteurApplication({
  standaloneIos,
  paysage,
  largeur,
  hauteur,
}: Ecran): number | null {
  if (!standaloneIos) return null;
  // Sur iOS, `screen` ne suit pas la rotation.
  return paysage ? Math.min(largeur, hauteur) : Math.max(largeur, hauteur);
}
