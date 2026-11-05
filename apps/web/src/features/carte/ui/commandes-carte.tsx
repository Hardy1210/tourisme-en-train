'use client';

import { List, LocateFixed, Maximize2 } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';

type Proprietes = {
  surRecentrer: () => void;
  pleinEcran: { actif: boolean; bascule: () => void };
};

/** Boutons posés sur la carte : recentrer, et carte plein écran sur mobile. */
export function CommandesCarte({ surRecentrer, pleinEcran }: Proprietes) {
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
      <Bouton
        variante="secondaire"
        forme="icone"
        aria-label={pleinEcran.actif ? 'Afficher la liste' : 'Carte plein écran'}
        className="border-0 shadow-carte lg:hidden"
        onClick={pleinEcran.bascule}
      >
        {pleinEcran.actif ? (
          <List aria-hidden="true" className="size-5" />
        ) : (
          <Maximize2 aria-hidden="true" className="size-5" />
        )}
      </Bouton>
    </div>
  );
}
