'use client';

import { dateDuJour, maintenantParis } from '@tourisme/commun';
import { useEffect, useState } from 'react';

const SECONDES_PAR_JOUR = 86_400;

type DocumentVisible = {
  visibilityState: DocumentVisibilityState;
  addEventListener(type: 'visibilitychange', ecouteur: () => void): void;
  removeEventListener(type: 'visibilitychange', ecouteur: () => void): void;
};

/**
 * Donne la date du jour à Paris (`AAAA-MM-JJ`) tout de suite, puis à chaque minuit (Paris) et quand l'app
 * revient au premier plan (téléphone en veille : le minuteur a pu ne pas se déclencher). Renvoie l'arrêt.
 * Un jour de changement d'heure, le minuteur peut tomber une heure trop tôt (il se relance alors) ou trop
 * tard ; le retour au premier plan rattrape. L'horloge n'est lue que par `maintenantParis()` (CLAUDE.md § 3).
 */
export function suivreDateDuJour(
  surDate: (date: string) => void,
  doc: DocumentVisible,
): () => void {
  let minuteur: ReturnType<typeof setTimeout> | undefined;
  const actualiser = () => {
    const { dateDuJour, heureActuelleS } = maintenantParis();
    surDate(dateDuJour);
    clearTimeout(minuteur);
    minuteur = setTimeout(actualiser, (SECONDES_PAR_JOUR - heureActuelleS + 1) * 1000);
  };
  const auRetour = () => {
    if (doc.visibilityState === 'visible') actualiser();
  };
  actualiser();
  doc.addEventListener('visibilitychange', auRetour);
  return () => {
    clearTimeout(minuteur);
    doc.removeEventListener('visibilitychange', auRetour);
  };
}

/** Date du jour à Paris, tenue à jour sur un écran resté ouvert (D108). */
export function useDateDuJour(): string {
  const [date, setDate] = useState(() => dateDuJour());
  useEffect(() => suivreDateDuJour(setDate, document), []);
  return date;
}
