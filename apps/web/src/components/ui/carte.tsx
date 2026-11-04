import type { ComponentProps } from 'react';
import { cn } from '@/lib/classes';

/** Conteneur de contenu (lieu, destination). À ne pas confondre avec la carte géographique. */
export function Carte({ className, ...reste }: ComponentProps<'article'>) {
  return (
    <article
      className={cn(
        'flex flex-col gap-2.5 rounded-carte bg-carte-bg p-4 text-carte-foreground shadow-carte',
        className,
      )}
      {...reste}
    />
  );
}
