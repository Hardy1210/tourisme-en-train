'use client';

import { LocateFixed } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';

type Proprietes = {
  surRecentrer: () => void;
};

/**
 * Bouton posé sur la carte : recentrer. Plus de « Carte plein écran » (D120) : sur téléphone, on baisse la
 * feuille au doigt ou par sa poignée.
 */
export function CommandesCarte({ surRecentrer }: Proprietes) {
  return (
    <div className="absolute top-[calc(var(--en-tete-hauteur,0px)+0.75rem)] right-3 flex flex-col gap-2 lg:top-3">
      <Bouton
        variante="secondaire"
        forme="icone"
        aria-label="Recentrer"
        className="border-0 shadow-carte"
        onClick={surRecentrer}
      >
        <LocateFixed aria-hidden="true" className="size-5 text-primary" />
      </Bouton>
    </div>
  );
}
