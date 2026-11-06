'use client';

import { useRef, type ReactNode, type Ref } from 'react';
import {
  apresGlissement,
  apresToucher,
  SEUIL_GLISSEMENT_PX,
  type PositionFeuille,
} from '../position-feuille';

type Proprietes = {
  ref: Ref<HTMLDivElement>;
  position: PositionFeuille;
  surPosition: (position: PositionFeuille) => void;
  children: ReactNode;
};

/**
 * Résultats : feuille à 3 positions par-dessus la carte sur mobile, panneau fixe sur grand écran.
 * Sa position vient de `--resultats-haut` (globals.css), que la carte lit aussi pour ne rien cacher.
 */
export function FeuilleResultats({ ref, position, surPosition, children }: Proprietes) {
  const debut = useRef<number | null>(null);
  const aGlisse = useRef(false);

  return (
    <div
      ref={ref}
      className="pointer-events-auto absolute inset-x-0 top-(--resultats-haut) bottom-0 z-sheet flex flex-col rounded-t-feuille bg-background shadow-sheet transition-[top] duration-300 ease-soft lg:static lg:z-auto lg:col-start-1 lg:row-start-2 lg:min-h-0 lg:rounded-none lg:shadow-none lg:transition-none"
    >
      <button
        type="button"
        aria-label="Déplacer le panneau des résultats"
        aria-expanded={position === 'plein'}
        className="flex h-touch flex-none cursor-grab touch-none items-center justify-center lg:hidden"
        onPointerDown={(evenement) => {
          // Le relâchement doit arriver ici même si le doigt a quitté la poignée.
          evenement.currentTarget.setPointerCapture(evenement.pointerId);
          debut.current = evenement.clientY;
          aGlisse.current = false;
        }}
        onPointerUp={(evenement) => {
          if (debut.current === null) return;
          const ecart = evenement.clientY - debut.current;
          debut.current = null;
          if (Math.abs(ecart) >= SEUIL_GLISSEMENT_PX) {
            aGlisse.current = true;
            surPosition(apresGlissement(position, ecart));
          }
        }}
        onClick={() => {
          if (!aGlisse.current) surPosition(apresToucher(position));
          aGlisse.current = false;
        }}
        onKeyDown={(evenement) => {
          if (evenement.key === 'ArrowUp')
            surPosition(apresGlissement(position, -SEUIL_GLISSEMENT_PX));
          if (evenement.key === 'ArrowDown')
            surPosition(apresGlissement(position, SEUIL_GLISSEMENT_PX));
        }}
      >
        <span aria-hidden="true" className="h-1.25 w-10 rounded-pill bg-feuille-poignee" />
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
