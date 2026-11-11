'use client';

// Trait fin à la couleur de la marque, sur un rail presque invisible : il dit qu'il reste du contenu
// plus bas (les résultats cachés sous le clavier), tant que c'est vrai, sans attendre un geste.
import { type CSSProperties, type RefObject, useEffect, useState } from 'react';
import { type Indicateur, indicateurDefilement } from '@/lib/defilement';

type Proprietes = {
  /** La zone qui défile. */
  zone: RefObject<HTMLElement | null>;
  /** Son contenu : sa hauteur change quand des résultats arrivent. */
  contenu: RefObject<HTMLElement | null>;
};

export function IndicateurDefilement({ zone, contenu }: Proprietes) {
  const [indicateur, setIndicateur] = useState<Indicateur | null>(null);

  useEffect(() => {
    const element = zone.current;
    if (!element) return;
    const mesurer = () =>
      setIndicateur(
        indicateurDefilement({
          hauteurContenu: element.scrollHeight,
          hauteurVisible: element.clientHeight,
          defilement: element.scrollTop,
        }),
      );
    mesurer();
    element.addEventListener('scroll', mesurer, { passive: true });
    // La zone change de taille avec le clavier ; le contenu, avec les résultats d'une frappe.
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(element);
    if (contenu.current) observateur.observe(contenu.current);
    return () => {
      element.removeEventListener('scroll', mesurer);
      observateur.disconnect();
    };
  }, [zone, contenu]);

  if (!indicateur) return null;
  return (
    <div
      aria-hidden="true"
      data-indicateur-defilement
      className="pointer-events-none absolute inset-y-0 -right-3 w-(--indicateur-defilement-largeur) rounded-pill bg-indicateur-defilement-rail"
    >
      <div
        className="indicateur-defilement-trait absolute inset-x-0 rounded-pill bg-indicateur-defilement"
        style={
          {
            '--part-visible': `${indicateur.partVisible * 100}%`,
            '--progression': indicateur.progression,
          } as CSSProperties
        }
      />
    </div>
  );
}
