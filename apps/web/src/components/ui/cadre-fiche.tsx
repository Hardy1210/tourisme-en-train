import type { ReactNode } from 'react';
import { cn } from '@/lib/classes';

type Proprietes = {
  /** Colonne de droite sur grand écran (la carte) ; rien sur mobile. */
  carte: ReactNode;
  children: ReactNode;
  /** `marque` : toute la fiche sur le fond de la marque (fiche destination) ; ses surfaces gardent leurs couleurs. */
  fond?: 'neutre' | 'marque';
};

/** Fiche plein écran sur mobile (au-dessus de la navigation), panneau et carte sur grand écran. */
export function CadreFiche({ carte, children, fond = 'neutre' }: Proprietes) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 top-0 z-overlay h-(--hauteur-app) flex flex-col bg-background safe-top lg:static lg:z-auto lg:grid lg:h-full lg:grid-cols-[var(--panneau-largeur)_minmax(0,1fr)] lg:pt-0',
        fond === 'marque' && 'bg-page-marque-bg text-page-marque-texte',
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col lg:h-full">{children}</div>
      <div className="hidden min-h-0 lg:block">{carte}</div>
    </div>
  );
}
