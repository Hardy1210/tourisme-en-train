'use client';

import { useSearchParams } from 'next/navigation';
import { createContext, useContext, useState } from 'react';

const ContexteVisible = createContext(true);

/** Pour un écran gardé en vie (Explorer) : caché, il ne doit faire aucun appel (D069). */
export const FournisseurEcranVisible = ContexteVisible.Provider;

export const useEcranVisible = (): boolean => useContext(ContexteVisible);

/** L'URL de l'écran : caché, il garde la sienne et ne réagit pas à celle de l'écran affiché. */
export function useUrlEcran(): URLSearchParams {
  const url = useSearchParams();
  const visible = useEcranVisible();
  const [gardee, setGardee] = useState(url);
  if (visible && gardee !== url) setGardee(url);
  return visible ? url : gardee;
}
