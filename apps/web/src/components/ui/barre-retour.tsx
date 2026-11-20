import type { ReactNode } from 'react';
import { BoutonRetour } from './bouton';

/**
 * Barre du haut des fiches (Hardy, 20/11) : Retour à gauche, une action facultative à droite (crédit de la
 * photo, date). Une seule position pour tous les écrans (`barre-retour`, tokens `--retour-*` de globals.css) :
 * aucun écran ne place son bouton Retour lui-même. Le parent est le haut de la fiche, en `relative`.
 * Un seul dessin : le bouton rond sombre, lisible sur une photo, sur le violet et sur le blanc.
 */
export function BarreRetour({ surRetour, droite }: { surRetour: () => void; droite?: ReactNode }) {
  return (
    <div className="barre-retour">
      <BoutonRetour surPhoto onClick={surRetour} />
      {droite}
    </div>
  );
}
