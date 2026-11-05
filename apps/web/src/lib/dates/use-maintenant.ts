'use client';

import { maintenantParis, type Maintenant } from '@tourisme/commun';
import { useEffect, useState } from 'react';
import { parametres } from '@/config/parametres';
import { useEcranVisible } from '@/lib/ecran-visible';

/** Heure de Paris, relue régulièrement et au retour sur l'onglet : le téléphone suspend les minuteurs. */
export function useMaintenant(): Maintenant {
  const [maintenant, setMaintenant] = useState(() => maintenantParis());
  const visible = useEcranVisible();
  // Au retour sur un écran gardé en vie : un train parti entre-temps disparaît aussitôt (D069).
  const [etaitVisible, setEtaitVisible] = useState(visible);
  if (visible !== etaitVisible) {
    setEtaitVisible(visible);
    if (visible) setMaintenant(maintenantParis());
  }
  useEffect(() => {
    if (!visible) return;
    const actualiser = () => setMaintenant(maintenantParis());
    const minuteur = setInterval(actualiser, parametres.cache.horlogeTrainsS * 1000);
    document.addEventListener('visibilitychange', actualiser);
    return () => {
      clearInterval(minuteur);
      document.removeEventListener('visibilitychange', actualiser);
    };
  }, [visible]);
  return maintenant;
}
