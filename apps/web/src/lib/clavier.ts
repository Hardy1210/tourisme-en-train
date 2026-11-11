// Hauteur du clavier du téléphone, à partir de ce que dit le navigateur : la fenêtre garde sa taille,
// seule la partie visible (`visualViewport`) rétrécit quand le clavier passe par-dessus. Calcul pur.

type Fenetre = {
  /** Hauteur de la fenêtre (`window.innerHeight`). */
  hauteurFenetre: number;
  /** Hauteur de la partie visible (`visualViewport.height`). */
  hauteurVisible: number;
  /** Décalage de la partie visible vers le bas (`visualViewport.offsetTop`), si la page a glissé. */
  decalageHaut: number;
};

/** Pixels cachés en bas de la fenêtre ; 0 sans clavier. */
export function hauteurClavier({ hauteurFenetre, hauteurVisible, decalageHaut }: Fenetre): number {
  return Math.max(0, Math.round(hauteurFenetre - hauteurVisible - decalageHaut));
}
