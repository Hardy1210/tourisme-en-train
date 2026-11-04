'use client';

import { Tabs } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/lib/classes';

export type Onglet = { valeur: string; libelle: string; contenu: ReactNode };

type Proprietes = {
  onglets: readonly Onglet[];
  valeur: string;
  surChangement: (valeur: string) => void;
  className?: string;
  classeContenu?: string;
};

/** Onglets accessibles : flèches du clavier, rôles et liens avec leur contenu fournis par Radix. */
export function Onglets({ onglets, valeur, surChangement, className, classeContenu }: Proprietes) {
  return (
    <Tabs.Root
      value={valeur}
      onValueChange={surChangement}
      className={cn('flex flex-col gap-3', className)}
    >
      <Tabs.List className="flex flex-none gap-1 rounded-bouton bg-onglets-bg p-1">
        {onglets.map((onglet) => (
          <Tabs.Trigger
            key={onglet.valeur}
            value={onglet.valeur}
            className="h-touch flex-1 cursor-pointer rounded-md text-md font-semibold text-muted-foreground transition-colors data-[state=active]:bg-onglet-actif-bg data-[state=active]:text-foreground data-[state=active]:shadow-xs"
          >
            {onglet.libelle}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {onglets.map((onglet) => (
        <Tabs.Content key={onglet.valeur} value={onglet.valeur} className={classeContenu}>
          {onglet.contenu}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
