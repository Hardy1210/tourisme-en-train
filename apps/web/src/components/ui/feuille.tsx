'use client';

import type { ReactNode } from 'react';
import { Drawer } from 'vaul';
import { cn } from '@/lib/classes';
import { BoutonFermer } from './bouton';

type Proprietes = {
  ouverte: boolean;
  surChangement: (ouverte: boolean) => void;
  titre: string;
  /** Sur grand écran : petit panneau flottant à côté du rail de navigation, sans voile. */
  ancreeAuRail?: boolean;
  children: ReactNode;
};

/** Panneau glissant par le bas : se ferme au doigt, à la touche Échap, par le bouton ou d'un clic à côté. */
export function Feuille({
  ouverte,
  surChangement,
  titre,
  ancreeAuRail = false,
  children,
}: Proprietes) {
  return (
    <Drawer.Root open={ouverte} onOpenChange={surChangement}>
      <Drawer.Portal>
        <Drawer.Overlay
          className={cn('fixed inset-0 z-overlay bg-overlay', ancreeAuRail && 'lg:bg-transparent')}
        />
        <Drawer.Content
          aria-describedby={undefined}
          className={cn(
            'fixed inset-x-0 bottom-0 z-overlay flex max-h-(--feuille-hauteur-max) flex-col gap-4 rounded-t-feuille bg-feuille-bg px-5 pt-2.5 shadow-sheet outline-none safe-bottom',
            ancreeAuRail &&
              'lg:right-auto lg:bottom-4 lg:left-[calc(var(--rail-largeur)+0.5rem)] lg:w-80 lg:rounded-lg lg:border lg:px-3 lg:pt-1.5 lg:shadow-float lg:after:hidden',
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'h-1.25 w-10 flex-none self-center rounded-pill bg-feuille-poignee',
              ancreeAuRail && 'lg:hidden',
            )}
          />
          <div
            className={cn('flex items-center justify-between gap-3', ancreeAuRail && 'lg:contents')}
          >
            <Drawer.Title
              className={cn('font-display text-xl font-bold', ancreeAuRail && 'lg:sr-only')}
            >
              {titre}
            </Drawer.Title>
            {/* Sur grand écran, le panneau flottant se ferme d'un clic à côté ou par Échap. */}
            <Drawer.Close asChild>
              <BoutonFermer className={cn('-mr-2.5', ancreeAuRail && 'lg:hidden')} />
            </Drawer.Close>
          </div>
          <div className={cn('min-h-0 flex-1 overflow-y-auto pb-6', ancreeAuRail && 'lg:pb-1.5')}>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
