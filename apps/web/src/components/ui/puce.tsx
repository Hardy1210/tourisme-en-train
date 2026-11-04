import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/classes';

type Proprietes = Omit<ComponentProps<'button'>, 'aria-pressed'> & {
  selectionnee: boolean;
  icone?: ReactNode;
};

/** Filtre à bascule : une seule taille et une seule façon de marquer la sélection. */
export function Puce({ selectionnee, icone, className, children, ...reste }: Proprietes) {
  return (
    <button
      type="button"
      aria-pressed={selectionnee}
      className={cn(
        'inline-flex h-touch flex-none cursor-pointer items-center gap-1.5 rounded-pill border px-3.5 text-md font-medium transition-colors [&_svg]:size-4.5',
        selectionnee
          ? 'border-selection-border bg-selection-bg text-selection-foreground'
          : 'border-puce-border bg-puce-bg text-puce-foreground hover:bg-surface-sunken',
        className,
      )}
      {...reste}
    >
      {icone}
      {children}
    </button>
  );
}
