'use client';

import { type ReactNode, type RefObject, useEffect, useRef } from 'react';
import { AttributionFondCarte } from '@/features/carte/ui/attribution-fond-carte';
import {
  apresGlissement,
  apresToucher,
  SEUIL_GLISSEMENT_PX,
  type PositionFeuille,
} from '../position-feuille';
import { useGlissementFeuille } from '../use-glissement-feuille';

type Proprietes = {
  ref: RefObject<HTMLDivElement | null>;
  position: PositionFeuille;
  surPosition: (position: PositionFeuille) => void;
  children: ReactNode;
};

/**
 * Résultats : feuille à 3 positions par-dessus la carte sur mobile, panneau fixe sur grand écran.
 * Sa position vient de `--resultats-haut` (globals.css), que la carte lit aussi pour ne rien cacher.
 * Elle glisse au doigt partout sur elle (`useGlissementFeuille`, D120) ; la poignée garde le toucher
 * et le clavier (Entrée, ↑, ↓), pour VoiceOver.
 */
export function FeuilleResultats({ ref, position, surPosition, children }: Proprietes) {
  const liste = useRef<HTMLDivElement>(null);
  useGlissementFeuille({ feuille: ref, liste, position, surPosition });

  // Hors du plein écran, la liste ne défile pas (le geste déplace la feuille) : elle revient au début.
  useEffect(() => {
    if (position !== 'plein') liste.current?.scrollTo({ top: 0 });
  }, [position]);

  return (
    <>
      {/* Repères invisibles : le haut de la feuille à moitié et en bas, en pixels, pour le geste. */}
      <span
        aria-hidden="true"
        data-cran="milieu"
        className="absolute top-(--resultats-haut-milieu) lg:hidden"
      />
      <span
        aria-hidden="true"
        data-cran="carte"
        className="absolute top-(--resultats-haut-carte) lg:hidden"
      />
      <div
        ref={ref}
        // `after:` : le fond continue sous la feuille, pour qu'une feuille tirée vers le haut ne laisse
        // pas voir la carte en dessous.
        className="pointer-events-auto absolute inset-x-0 top-(--resultats-haut) bottom-0 z-sheet flex flex-col rounded-t-feuille bg-background shadow-sheet transition-[top,transform] duration-300 ease-soft after:absolute after:inset-x-0 after:top-full after:h-dvh after:bg-background lg:static lg:z-auto lg:col-start-1 lg:row-start-2 lg:min-h-0 lg:rounded-none lg:shadow-none lg:transition-none lg:after:hidden"
      >
        {/* Attribution exigée par la licence (config/sources.json), posée sur la feuille : elle la suit. */}
        <p className="absolute inset-x-0 top-0 -translate-y-full bg-surface/80 px-2 py-0.5 text-2xs text-muted-foreground lg:hidden">
          <AttributionFondCarte />
        </p>
        <button
          type="button"
          aria-label="Déplacer le panneau des résultats"
          aria-expanded={position === 'plein'}
          className="flex h-touch flex-none cursor-grab touch-none items-center justify-center lg:hidden"
          onClick={() => surPosition(apresToucher(position))}
          onKeyDown={(evenement) => {
            if (evenement.key === 'ArrowUp')
              surPosition(apresGlissement(position, -SEUIL_GLISSEMENT_PX));
            if (evenement.key === 'ArrowDown')
              surPosition(apresGlissement(position, SEUIL_GLISSEMENT_PX));
          }}
        >
          <span aria-hidden="true" className="h-1.25 w-10 rounded-pill bg-feuille-poignee" />
        </button>
        <div ref={liste} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </>
  );
}
