'use client';

import type { ReactNode } from 'react';
import { useRetour } from '@/lib/utiliser-retour';
import { BarreRetour } from './barre-retour';

/**
 * Page de lecture (Sources, À propos, Mentions légales) : plein écran sur mobile (au-dessus de la
 * navigation), à côté du rail sur grand écran. Même bouton Retour que les fiches (`BarreRetour`, 21/11) :
 * il reste en place, seul le texte défile, et commence sous lui (`sous-barre-retour`).
 */
export function CadrePage({ children }: { children: ReactNode }) {
  const surRetour = useRetour();
  return (
    <div className="fixed inset-x-0 top-0 z-overlay flex h-(--hauteur-app) flex-col bg-background sous-barre-retour lg:relative lg:z-auto lg:h-full">
      <BarreRetour surRetour={surRetour} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-(--page-lecture-largeur) flex-col gap-5 px-4 pt-2 safe-bottom lg:gap-6 lg:px-6 lg:pt-2 lg:pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
