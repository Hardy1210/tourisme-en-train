'use client';

// État de la page « Trajet » du téléphone (D085), partagé par la barre du trajet, « Changer de gare » et
// la page elle-même, qui reste montée quand le départ se recharge.
import { useRef, useState } from 'react';

import { ouvrirPage } from '@/components/ui/page-plein-ecran';

import type { ChampTrajet } from './enchainement-trajet';

/** Ce qui est actif dans la page : un des deux champs, ou la ligne « Date » (D116, pas de clavier). */
export type ZoneTrajet = ChampTrajet | 'date';

export function usePageTrajet() {
  const page = useRef<HTMLDivElement>(null);
  const depart = useRef<HTMLInputElement>(null);
  const destination = useRef<HTMLInputElement>(null);
  const [ouverte, setOuverte] = useState(false);
  const [champActif, setChampActif] = useState<ZoneTrajet>('destination');
  const champ = (nom: ChampTrajet) => (nom === 'depart' ? depart : destination).current;

  return {
    page,
    champs: { depart, destination },
    ouverte,
    setOuverte,
    champActif,
    setChampActif,
    /** Dans le toucher : le champ prend la main tout de suite, le clavier s'ouvre avec la page. */
    ouvrir: (nom: ChampTrajet) => {
      ouvrirPage(page.current, champ(nom));
      setChampActif(nom);
      setOuverte(true);
    },
    /** Dans le toucher d'une ligne : le curseur passe à l'autre champ, le clavier reste ouvert. */
    allerA: (nom: ChampTrajet) => {
      champ(nom)?.focus({ preventScroll: true });
      setChampActif(nom);
    },
    /** Ligne « Date » touchée : le clavier se ferme, le calendrier prend la place de la liste. */
    allerALaDate: () => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      setChampActif('date');
    },
  };
}

export type PageTrajetEtat = ReturnType<typeof usePageTrajet>;
