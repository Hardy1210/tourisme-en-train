'use client';

// État de l'accueil du premier lancement (D113). Explorer reste en vie (D069) : cet état aussi.
import { useCallback, useState } from 'react';
import { useUrlEcran } from '@/lib/ecran-visible';
import { ecrireAccueilVu, etapeAccueil, lireAccueilVu } from './accueil';

export function useAccueil() {
  const gareDansUrl = useUrlEcran().get('gare') !== null;
  const [vu, setVu] = useState(lireAccueilVu);
  // Une gare choisie met un instant à arriver dans l'URL : d'ici là, aucune demande de position (le
  // parcours `accueil.e2e.ts` l'a vue partir). Remis à faux pendant le rendu, comme `useUrlEcran`.
  const [gareEnAttente, setGareEnAttente] = useState(false);
  if (gareEnAttente && gareDansUrl) setGareEnAttente(false);

  /** L'utilisateur a choisi son départ : l'accueil ne reviendra plus sur cet appareil. */
  const terminer = useCallback((choix: 'position' | 'gare') => {
    ecrireAccueilVu();
    setVu(true);
    if (choix === 'gare') setGareEnAttente(true);
  }, []);

  return {
    etape: etapeAccueil({ accueilVu: vu, gareDansUrl }),
    /** Au premier lancement, la position attend « Utiliser ma position » : jamais à l'ouverture. */
    positionPermise: vu && !gareEnAttente,
    terminer,
  };
}
