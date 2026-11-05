import type { ReactNode } from 'react';

type Proprietes = {
  /** Colonne de droite sur grand écran (la carte) ; rien sur mobile. */
  carte: ReactNode;
  children: ReactNode;
};

/** Fiche plein écran sur mobile (au-dessus de la navigation), panneau et carte sur grand écran. */
export function CadreFiche({ carte, children }: Proprietes) {
  return (
    <div className="fixed inset-x-0 top-0 z-overlay h-(--hauteur-app) flex flex-col bg-background safe-top lg:static lg:z-auto lg:grid lg:h-full lg:grid-cols-[var(--panneau-largeur)_minmax(0,1fr)] lg:pt-0">
      <div className="flex min-h-0 flex-1 flex-col lg:h-full">{children}</div>
      <div className="hidden min-h-0 lg:block">{carte}</div>
    </div>
  );
}
