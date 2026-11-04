'use client';

import { Switch } from 'radix-ui';
import type { ReactNode } from 'react';
import { cn } from '@/lib/classes';

type Proprietes = {
  libelle: string;
  description?: string;
  /** Mention à côté du libellé (ex. « Bientôt » sur une option désactivée). */
  mention?: ReactNode;
  actif: boolean;
  surChangement?: (actif: boolean) => void;
  desactive?: boolean;
};

export function Interrupteur({
  libelle,
  description,
  mention,
  actif,
  surChangement,
  desactive = false,
}: Proprietes) {
  return (
    <label
      className={cn(
        'flex min-h-14 items-center gap-3',
        desactive ? 'cursor-not-allowed opacity-55' : 'cursor-pointer',
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2 text-base font-semibold">
          {libelle}
          {mention}
        </span>
        {description && <span className="text-sm text-muted-foreground">{description}</span>}
      </span>
      <Switch.Root
        checked={actif}
        onCheckedChange={surChangement}
        disabled={desactive}
        className="h-7.5 w-12.5 flex-none cursor-[inherit] rounded-pill bg-interrupteur-inactif transition-colors data-[state=checked]:bg-interrupteur-actif"
      >
        <Switch.Thumb className="block size-6 translate-x-0.75 rounded-pill bg-interrupteur-pastille shadow-xs transition-transform data-[state=checked]:translate-x-5.75" />
      </Switch.Root>
    </label>
  );
}
