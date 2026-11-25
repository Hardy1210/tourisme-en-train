'use client';

// Glissement de la feuille de résultats au doigt, partout sur elle (④, D120).
// Pendant le geste, la feuille suit le doigt par `transform`, sans état React (rien n'est redessiné) ;
// au lâcher, une seule mise à jour : la position choisie par `positionAuLacher`. Toutes les décisions
// sont dans `position-feuille.ts` (fonctions pures) ; ici, seulement la lecture des événements.
import { type RefObject, useEffect } from 'react';
import {
  type Crans,
  hautSousLeDoigt,
  type PointGeste,
  positionAuLacher,
  type PositionFeuille,
  preneurDuGeste,
  SEUIL_DEPLACEMENT_PX,
  vitesseAuLacher,
} from './position-feuille';

type Geste = {
  x: number;
  y: number;
  hautDepart: number;
  crans: Crans;
  preneur: 'feuille' | 'navigateur' | null;
  aGlisse: boolean;
  points: PointGeste[];
};

/** Haut de la feuille pour chaque position, lu sur les repères posés à côté d'elle (`data-cran`). */
function lireCrans(feuille: HTMLElement): Crans {
  const haut = (position: PositionFeuille) =>
    feuille.parentElement?.querySelector<HTMLElement>(`[data-cran="${position}"]`)?.offsetTop ?? 0;
  return { plein: 0, milieu: haut('milieu'), carte: haut('carte') };
}

export function useGlissementFeuille({
  feuille,
  liste,
  position,
  surPosition,
}: {
  feuille: RefObject<HTMLDivElement | null>;
  liste: RefObject<HTMLDivElement | null>;
  position: PositionFeuille;
  surPosition: (position: PositionFeuille) => void;
}) {
  useEffect(() => {
    const element = feuille.current;
    if (!element) return;
    let geste: Geste | null = null;
    // Un glissement se termine par un « clic » du navigateur : il ne doit rien ouvrir.
    let clicAIgnorer = false;

    const debut = (evenement: TouchEvent) => {
      const doigt = evenement.touches[0];
      clicAIgnorer = false;
      // Un seul doigt, et seulement sur téléphone : sur grand écran, c'est un panneau fixe.
      const mobile = getComputedStyle(element).position === 'absolute';
      geste =
        doigt && evenement.touches.length === 1 && mobile
          ? {
              x: doigt.clientX,
              y: doigt.clientY,
              hautDepart: element.offsetTop,
              crans: lireCrans(element),
              preneur: null,
              aGlisse: false,
              points: [{ y: doigt.clientY, t: evenement.timeStamp }],
            }
          : null;
    };

    const mouvement = (evenement: TouchEvent) => {
      const doigt = evenement.touches[0];
      if (!geste || !doigt) return;
      const dx = doigt.clientX - geste.x;
      const dy = doigt.clientY - geste.y;
      geste.preneur ??= preneurDuGeste({
        position,
        listeAuDebut: (liste.current?.scrollTop ?? 0) <= 0,
        dx,
        dy,
      });
      if (geste.preneur === 'navigateur') return;
      evenement.preventDefault();
      if (!geste.aGlisse && Math.abs(dy) < SEUIL_DEPLACEMENT_PX) return;
      geste.aGlisse = true;
      geste.points.push({ y: doigt.clientY, t: evenement.timeStamp });
      const decalage = hautSousLeDoigt(geste.crans, geste.hautDepart, dy) - geste.hautDepart;
      element.style.transition = 'none';
      element.style.transform = `translateY(${decalage}px)`;
    };

    const fin = (evenement: TouchEvent) => {
      const termine = geste;
      geste = null;
      if (!termine?.aGlisse) return;
      const dernier = termine.points.at(-1)?.y ?? termine.y;
      const haut = hautSousLeDoigt(termine.crans, termine.hautDepart, dernier - termine.y);
      clicAIgnorer = true;
      // Le décalage revient à zéro pendant que le haut va au cran choisi, à la même vitesse (même
      // transition) : la feuille part de sous le doigt et arrive au cran, sans saut.
      element.style.transition = '';
      element.style.transform = '';
      if (evenement.type === 'touchend')
        surPosition(
          positionAuLacher(
            termine.crans,
            haut,
            vitesseAuLacher(termine.points, evenement.timeStamp),
          ),
        );
    };

    const clic = (evenement: MouseEvent) => {
      if (!clicAIgnorer) return;
      clicAIgnorer = false;
      evenement.preventDefault();
      evenement.stopPropagation();
    };

    element.addEventListener('touchstart', debut, { passive: true });
    // Non passif : c'est le seul moyen d'empêcher la liste de défiler quand la feuille prend le geste.
    element.addEventListener('touchmove', mouvement, { passive: false });
    element.addEventListener('touchend', fin);
    element.addEventListener('touchcancel', fin);
    element.addEventListener('click', clic, { capture: true });
    return () => {
      element.removeEventListener('touchstart', debut);
      element.removeEventListener('touchmove', mouvement);
      element.removeEventListener('touchend', fin);
      element.removeEventListener('touchcancel', fin);
      element.removeEventListener('click', clic, { capture: true });
    };
  }, [feuille, liste, position, surPosition]);
}
