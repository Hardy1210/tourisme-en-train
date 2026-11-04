import type { ComponentProps } from 'react';
import { cn } from '@/lib/classes';

/** Forme d'attente pendant un chargement : la taille se donne par `className`. */
export function Squelette({ className, ...reste }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-skeleton rounded-md bg-surface-sunken', className)}
      {...reste}
    />
  );
}
