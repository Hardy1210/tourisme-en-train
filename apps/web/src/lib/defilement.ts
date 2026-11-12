// Indicateur de défilement des feuilles : sur téléphone, la barre du navigateur n'apparaît que pendant le
// geste, et Safari ignore son style. Calcul pur, à partir de ce que mesure le navigateur.

type Mesure = { hauteurContenu: number; hauteurVisible: number; defilement: number };

/** Ce que montre l'indicateur, ou null quand tout le contenu est visible. */
export type Indicateur = {
  /** Part du contenu visible, entre 0 et 1 : la longueur du trait. */
  partVisible: number;
  /** 0 en haut, 1 tout en bas : la position du trait. */
  progression: number;
};

// En dessous d'un pixel, l'écart vient des arrondis du navigateur, pas d'un contenu caché.
const ECART_ARRONDI = 1;

const borner = (valeur: number) => Math.min(1, Math.max(0, valeur));

export function indicateurDefilement({
  hauteurContenu,
  hauteurVisible,
  defilement,
}: Mesure): Indicateur | null {
  const cache = hauteurContenu - hauteurVisible;
  if (hauteurVisible <= 0 || cache <= ECART_ARRONDI) return null;
  return {
    partVisible: hauteurVisible / hauteurContenu,
    // L'élan d'iOS fait passer le défilement sous 0 ou au-delà du bas : le trait reste dans son rail.
    progression: borner(defilement / cache),
  };
}
