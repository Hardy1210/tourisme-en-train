'use client';

import { useEffect, useState } from 'react';
import { hauteurClavier } from '@/lib/clavier';

/** Hauteur du clavier du téléphone tant que `actif` est vrai ; 0 sinon ou sans `visualViewport`. */
export function useHauteurClavier(actif: boolean): number {
  const [hauteur, setHauteur] = useState(0);

  useEffect(() => {
    const visible = window.visualViewport;
    if (!actif || !visible) return;
    const mesurer = () =>
      setHauteur(
        hauteurClavier({
          hauteurFenetre: window.innerHeight,
          hauteurVisible: visible.height,
          decalageHaut: visible.offsetTop,
        }),
      );
    mesurer();
    visible.addEventListener('resize', mesurer);
    visible.addEventListener('scroll', mesurer);
    return () => {
      visible.removeEventListener('resize', mesurer);
      visible.removeEventListener('scroll', mesurer);
    };
  }, [actif]);

  return actif ? hauteur : 0;
}
