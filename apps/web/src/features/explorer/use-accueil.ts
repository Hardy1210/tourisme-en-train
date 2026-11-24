'use client';

// État de l'accueil du premier lancement (D113). Explorer reste en vie (D069) : cet état aussi.
import { useCallback, useState } from 'react';
import { useUrlEcran } from '@/lib/ecran-visible';
import { ecrireAccueilVu, etatAccueilInitial, lireAccueilVu, type EtatAccueil } from './accueil';

export function useAccueil() {
  const gareDansUrl = useUrlEcran().get('gare') !== null;
  const [etat, setEtat] = useState<EtatAccueil>(() => etatAccueilInitial(lireAccueilVu()));
  // Une gare choisie met un instant à arriver dans l'URL : d'ici là, aucune demande de position (le
  // parcours `accueil.e2e.ts` l'a vue partir). Remis à faux pendant le rendu, comme `useUrlEcran`.
  const [gareEnAttente, setGareEnAttente] = useState(false);
  if (gareEnAttente && gareDansUrl) setGareEnAttente(false);

  /** Départ choisi sur l'écran 1 : on passe à l'écran de la gare (3a). */
  const choisir = useCallback((choix: 'position' | 'gare') => {
    setEtat('gare');
    if (choix === 'gare') setGareEnAttente(true);
  }, []);
  /** L'utilisateur quitte l'accueil vers Explorer : il ne reviendra plus sur cet appareil. */
  const terminer = useCallback(() => {
    ecrireAccueilVu();
    setEtat('fini');
  }, []);

  return {
    etat,
    gareDansUrl,
    /** Au premier lancement, la position attend « Utiliser ma position » : jamais à l'ouverture. */
    positionPermise: etat !== 'bienvenue' && !gareEnAttente,
    choisir,
    terminer,
  };
}

export type Accueil = ReturnType<typeof useAccueil>;
