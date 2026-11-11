'use client';

import { useEffect, useState } from 'react';

export type ZoneVisible = { haut: number; hauteur: number };

/**
 * Partie de l'écran que le clavier ne cache pas (`visualViewport`), tant que `actif` est vrai : une page
 * plein écran s'y tient, et sa liste défile au-dessus du clavier au lieu de passer dessous.
 */
export function useZoneVisible(actif: boolean): ZoneVisible | null {
  const [zone, setZone] = useState<ZoneVisible | null>(null);

  useEffect(() => {
    const visible = window.visualViewport;
    if (!actif || !visible) return;
    const mesurer = () => setZone({ haut: visible.offsetTop, hauteur: visible.height });
    mesurer();
    visible.addEventListener('resize', mesurer);
    visible.addEventListener('scroll', mesurer);
    return () => {
      visible.removeEventListener('resize', mesurer);
      visible.removeEventListener('scroll', mesurer);
    };
  }, [actif]);

  return actif ? zone : null;
}
