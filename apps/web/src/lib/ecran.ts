// Grand écran (à partir de `lg`, 64rem) : la même limite que les classes `lg:` de Tailwind.
export const GRAND_ECRAN = '(min-width: 64rem)';

/** Lecture ponctuelle, dans un geste ; pour suivre les changements, `useGrandEcran` (carte). */
export function estGrandEcran(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(GRAND_ECRAN).matches;
}
