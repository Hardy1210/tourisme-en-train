'use client';

import { useSyncExternalStore } from 'react';

const sansAbonnement = () => () => undefined;

/**
 * Le contenu n'existe qu'après le JavaScript : si ses fichiers ne se chargent pas, ce message remplace
 * la page blanche. Présent dans le HTML de départ, invisible pendant un chargement normal (animation
 * retardée, sans script), et retiré dès que l'application démarre (D071).
 */
export function SecoursChargement() {
  const sansApplication = useSyncExternalStore(
    sansAbonnement,
    () => false,
    () => true,
  );
  if (!sansApplication) return null;
  return (
    <div className="animate-chargement-lent flex flex-col items-start gap-3 p-4">
      <p className="text-md text-muted-foreground">Le chargement prend plus de temps que prévu.</p>
      <a href="" className="text-md font-semibold text-primary underline">
        Recharger la page
      </a>
    </div>
  );
}
