'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const ONGLETS = ['lieux', 'trains', 'sur-place'] as const;
export type OngletFiche = (typeof ONGLETS)[number];

/**
 * Gare de départ, date et onglet de la fiche, dans l'URL : le lien est partageable.
 * Remplace l'entrée d'historique : « Retour » ramène à l'écran d'avant, pas à l'onglet d'avant.
 */
export function useParametresFiche() {
  const routeur = useRouter();
  const chemin = usePathname();
  const url = useSearchParams();
  const brut = url.get('onglet');

  const changer = (modifications: { date?: string | null; onglet?: string }) => {
    const suite = new URLSearchParams(url.toString());
    if (modifications.date !== undefined) {
      if (modifications.date === null) suite.delete('date');
      else suite.set('date', modifications.date);
    }
    if (modifications.onglet !== undefined) suite.set('onglet', modifications.onglet);
    routeur.replace(`${chemin}?${suite.toString()}`, { scroll: false });
  };

  return {
    depuis: url.get('depuis'),
    date: url.get('date'),
    onglet: ONGLETS.find((o) => o === brut) ?? 'lieux',
    changer,
  };
}
