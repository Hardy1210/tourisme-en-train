'use client';

import { useEffect } from 'react';
import { hauteurApplication } from '@/lib/hauteur-application';

type NavigateurIos = Navigator & { standalone?: boolean };

/** Donne à `--hauteur-app` la vraie hauteur de l'écran quand `100dvh` est faux (D072). */
export function HauteurEcran() {
  useEffect(() => {
    const appliquer = () => {
      const hauteur = hauteurApplication({
        standaloneIos: (navigator as NavigateurIos).standalone === true,
        paysage: window.matchMedia('(orientation: landscape)').matches,
        largeur: window.screen.width,
        hauteur: window.screen.height,
      });
      const racine = document.documentElement.style;
      if (hauteur === null) racine.removeProperty('--hauteur-app');
      else racine.setProperty('--hauteur-app', `${hauteur}px`);
    };
    appliquer();
    window.addEventListener('resize', appliquer);
    return () => window.removeEventListener('resize', appliquer);
  }, []);
  return null;
}
