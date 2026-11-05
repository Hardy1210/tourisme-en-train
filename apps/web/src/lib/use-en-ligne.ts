'use client';

import { useSyncExternalStore } from 'react';

function surChangement(rappel: () => void) {
  window.addEventListener('online', rappel);
  window.addEventListener('offline', rappel);
  return () => {
    window.removeEventListener('online', rappel);
    window.removeEventListener('offline', rappel);
  };
}

/** Faux quand le téléphone n'a plus de réseau ; vrai côté serveur. */
export function useEnLigne(): boolean {
  return useSyncExternalStore(
    surChangement,
    () => navigator.onLine,
    () => true,
  );
}
