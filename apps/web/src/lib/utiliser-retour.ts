'use client';

import { useRouter } from 'next/navigation';

/** Revient à l'écran d'avant ; un lien ouvert directement n'en a pas : on rejoint Explorer. */
export function useRetour() {
  const routeur = useRouter();
  return () => (window.history.length > 1 ? routeur.back() : routeur.push('/'));
}
