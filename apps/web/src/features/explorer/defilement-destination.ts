'use client';

// Défilement de la feuille de résultats vers la destination trouvée (D084).
import { type RefObject, useEffect, useRef } from 'react';

/**
 * Après une recherche appliquée, la carte de la première destination trouvée est la première chose
 * vue : centrée dans la feuille. Une fois la liste filtrée affichée, puis à la fin de la montée de la
 * feuille (son centre a changé). Mouvement doux, sauf si le téléphone demande moins d'animations.
 */
export function useDefilementVersDestination(
  feuille: RefObject<HTMLDivElement | null>,
  demande: number,
  rechercheActive: boolean,
  liste: unknown,
) {
  const traitee = useRef(demande);
  useEffect(() => {
    const element = feuille.current;
    if (demande === traitee.current || !rechercheActive || !element) return;
    traitee.current = demande;
    const defiler = () => {
      const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      element
        .querySelector('[data-destination]')
        ?.scrollIntoView({ block: 'center', behavior: reduit ? 'auto' : 'smooth' });
    };
    const image = requestAnimationFrame(defiler);
    const finMontee = (evenement: TransitionEvent) => {
      if (evenement.target === element) defiler();
    };
    element.addEventListener('transitionend', finMontee);
    return () => {
      cancelAnimationFrame(image);
      element.removeEventListener('transitionend', finMontee);
    };
  }, [feuille, demande, rechercheActive, liste]);
}
