'use client';

import { useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { useEcranVisible } from '@/lib/ecran-visible';
import { chargerStyleCarte } from '@/lib/external/fond-carte';
import { lireCouleursCarte } from './couleurs';
import { colorierStyle } from './style';

type StyleBrut = {
  layers: { id: string; type: string }[];
  sources?: Record<string, Record<string, unknown>>;
};

/** Style du fond de carte aux couleurs du design system ; `route` sert aux segments. */
export function useStyleCarte() {
  const visible = useEcranVisible();
  return useQuery({
    queryKey: ['style-carte'],
    enabled: visible,
    staleTime: Infinity,
    queryFn: async ({ signal }) => {
      const brut = (await chargerStyleCarte(signal)) as StyleBrut;
      const couleurs = lireCouleursCarte();
      return { style: colorierStyle(brut, couleurs), couleurs };
    },
  });
}

const GRAND_ECRAN = '(min-width: 64rem)';

/** Vrai à partir de `lg` : une seule carte est créée, dans le panneau de droite ou dans la liste. */
export function useGrandEcran(): boolean {
  return useSyncExternalStore(
    (rappel) => {
      const requete = window.matchMedia(GRAND_ECRAN);
      requete.addEventListener('change', rappel);
      return () => requete.removeEventListener('change', rappel);
    },
    () => window.matchMedia(GRAND_ECRAN).matches,
    () => false,
  );
}
