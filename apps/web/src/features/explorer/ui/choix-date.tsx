'use client';

// Une case de date (« Demain », et sa date en petit dessous) : la même dans la feuille « Filtres » et dans
// la page « Trajet » (D116), pour qu'un choix se reconnaisse d'un écran à l'autre.
import { CalendarDays } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/classes';

type Proprietes = Omit<ComponentProps<'button'>, 'children'> & {
  selectionne: boolean;
  libelle: string;
  detail: string;
  icone?: boolean;
  /** Page « Trajet » : plus petite, trois sur une ligne. */
  compacte?: boolean;
};

export function ChoixDate({
  selectionne,
  libelle,
  detail,
  icone = false,
  compacte = false,
  className,
  ...reste
}: Proprietes) {
  return (
    <button
      type="button"
      aria-pressed={selectionne}
      className={cn(
        'flex cursor-pointer flex-col justify-center rounded-md border text-left transition-colors',
        compacte ? 'min-h-12 px-2.5 py-1.5' : 'min-h-14 px-3 py-2',
        selectionne
          ? 'border-selection-border bg-selection-bg text-selection-foreground'
          : 'border-border bg-surface hover:bg-surface-sunken',
        className,
      )}
      {...reste}
    >
      <span
        className={cn(
          'flex items-center gap-1.5 font-semibold',
          compacte ? 'text-sm' : 'text-base',
        )}
      >
        {icone && <CalendarDays aria-hidden="true" className="size-4.5 flex-none text-primary" />}
        {libelle}
      </span>
      <span className={cn('tabular text-muted-foreground', compacte ? 'text-xs' : 'text-sm')}>
        {detail}
      </span>
    </button>
  );
}
