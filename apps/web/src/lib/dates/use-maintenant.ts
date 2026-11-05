'use client';

import { maintenantParis, type Maintenant } from '@tourisme/commun';
import { useEffect, useState } from 'react';
import { parametres } from '@/config/parametres';

/** Heure de Paris, relue régulièrement et au retour sur l'onglet : le téléphone suspend les minuteurs. */
export function useMaintenant(): Maintenant {
  const [maintenant, setMaintenant] = useState(() => maintenantParis());
  useEffect(() => {
    const actualiser = () => setMaintenant(maintenantParis());
    const minuteur = setInterval(actualiser, parametres.cache.horlogeTrainsS * 1000);
    document.addEventListener('visibilitychange', actualiser);
    return () => {
      clearInterval(minuteur);
      document.removeEventListener('visibilitychange', actualiser);
    };
  }, []);
  return maintenant;
}
