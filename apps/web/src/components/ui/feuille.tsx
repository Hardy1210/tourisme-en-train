'use client';

import type { ReactNode } from 'react';
import { Drawer } from 'vaul';
import { BoutonFermer } from './bouton';

type Proprietes = {
  ouverte: boolean;
  surChangement: (ouverte: boolean) => void;
  titre: string;
  children: ReactNode;
};

/** Panneau glissant par le bas : se ferme au doigt, à la touche Échap ou par le bouton. */
export function Feuille({ ouverte, surChangement, titre, children }: Proprietes) {
  return (
    <Drawer.Root open={ouverte} onOpenChange={surChangement}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-overlay bg-overlay" />
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-overlay flex max-h-(--feuille-hauteur-max) flex-col gap-4 rounded-t-feuille bg-feuille-bg px-5 pt-2.5 shadow-sheet outline-none safe-bottom"
        >
          <span
            aria-hidden="true"
            className="h-1.25 w-10 flex-none self-center rounded-pill bg-feuille-poignee"
          />
          <div className="flex items-center justify-between gap-3">
            <Drawer.Title className="font-display text-xl font-bold">{titre}</Drawer.Title>
            <Drawer.Close asChild>
              <BoutonFermer className="-mr-2.5" />
            </Drawer.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pb-6">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
