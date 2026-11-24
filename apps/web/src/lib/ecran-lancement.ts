'use client';

// Fin de l'écran de lancement (D112, D113) : la fenêtre de position du téléphone ne doit jamais le
// couvrir. On attend la fin de son animation CSS (`animationend`) : aucune durée recopiée ici, la seule
// est dans globals.css.
import { useSyncExternalStore } from 'react';

const SELECTEUR = '[data-ecran-lancement]';

/** Terminé : absent, caché (`display: none`), ou effacé par son animation (`visibility: hidden`). */
export function lancementTermine(element: Element | null): boolean {
  if (!element) return true;
  const style = getComputedStyle(element);
  return style.display === 'none' || style.visibility === 'hidden';
}

// Une fois terminé, il le reste : plus besoin de relire le style à chaque rendu.
let termine = false;
const lire = () => termine || (termine = lancementTermine(document.querySelector(SELECTEUR)));

function abonner(prevenir: () => void) {
  const element = document.querySelector(SELECTEUR);
  element?.addEventListener('animationend', prevenir);
  return () => element?.removeEventListener('animationend', prevenir);
}

/** Vrai quand l'écran de lancement a disparu ; faux côté serveur. */
export function useLancementTermine(): boolean {
  return useSyncExternalStore(abonner, lire, () => false);
}
