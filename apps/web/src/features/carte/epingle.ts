// Forme de l'épingle des lieux (D119, maquette « Explorer ») : un cercle et sa pointe en bas, qui marque
// l'emplacement exact du lieu. Fonction pure : la même goutte, dessinée en image pour la carte d'Explorer.

const TRAIT = 2;

/** Rayon en pixels de l'image ; largeur, hauteur, centre du cercle, et le chemin SVG de la goutte. */
export function formeEpingle(rayon: number): {
  largeur: number;
  hauteur: number;
  cx: number;
  cy: number;
  chemin: string;
} {
  const largeur = 2 * (rayon + TRAIT);
  const cx = largeur / 2;
  const cy = rayon + TRAIT;
  // La pointe, à √2 fois le rayon sous le centre : les deux côtés touchent le cercle à 45° du bas.
  const pointe = cy + rayon * Math.SQRT2;
  const hauteur = Math.ceil(pointe + TRAIT);
  const ecart = rayon * Math.SQRT1_2;
  const droite = `${cx + ecart} ${cy + ecart}`;
  const gauche = `${cx - ecart} ${cy + ecart}`;
  // Du bas, vers la droite, puis tout le haut du cercle jusqu'à gauche, et retour à la pointe.
  const chemin = `M${cx} ${hauteur - 1} L${droite} A${rayon} ${rayon} 0 1 0 ${gauche} Z`;
  return { largeur, hauteur, cx, cy, chemin };
}
