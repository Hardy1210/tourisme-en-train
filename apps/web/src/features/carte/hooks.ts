'use client';

import { useQuery } from '@tanstack/react-query';
import { chargerStyleCarte } from '@/lib/external/fond-carte';
import { lireCouleursCarte } from './couleurs';
import { colorierStyle } from './style';

type StyleBrut = {
  layers: { id: string; type: string }[];
  sources?: Record<string, Record<string, unknown>>;
};

/** Style du fond de carte aux couleurs du design system ; `route` sert aux segments. */
export function useStyleCarte() {
  return useQuery({
    queryKey: ['style-carte'],
    staleTime: Infinity,
    queryFn: async ({ signal }) => {
      const brut = (await chargerStyleCarte(signal)) as StyleBrut;
      const couleurs = lireCouleursCarte();
      return { style: colorierStyle(brut, couleurs), couleurs };
    },
  });
}
