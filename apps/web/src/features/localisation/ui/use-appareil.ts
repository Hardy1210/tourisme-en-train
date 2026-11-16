'use client';

// Appareil de la personne (D083, D096), lu dans le navigateur seulement : jamais envoyé au serveur.
import { useSyncExternalStore } from 'react';

import { reconnaitreAppareil } from '../appareil';
import type { Appareil } from '../contenu-guidage';

const sansAbonnement = () => () => {};

function lireAppareil(): Appareil {
  const installee =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return reconnaitreAppareil({
    userAgent: navigator.userAgent,
    installee,
    tactile: navigator.maxTouchPoints > 1,
  });
}

/** « inconnu » au rendu serveur, puis l'appareil réel dans le navigateur. */
export function useAppareil(): Appareil {
  return useSyncExternalStore(sansAbonnement, lireAppareil, () => 'inconnu' as const);
}
