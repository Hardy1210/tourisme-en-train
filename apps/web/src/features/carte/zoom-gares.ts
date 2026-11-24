// Gares en points ou en icônes de train (D118, remarque ⑥ du professeur) : de loin, les points colorés par
// le temps de train ; de près, les icônes de train. Seuil mesuré : environ 15 gares visibles autour de
// Dijon sur un écran d'iPhone (`parametres.carte.zoomIconesGares`). Fonction pure.

export function garesEnIcones(zoom: number, seuil: number): boolean {
  return zoom >= seuil;
}
