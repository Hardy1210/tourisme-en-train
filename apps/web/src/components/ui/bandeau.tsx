import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/classes';

const classesBandeau = cva(
  'flex items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground [&_svg]:size-4.5 [&_svg]:flex-none',
  {
    variants: {
      variante: {
        avertissement: 'bg-warning-soft',
        info: 'bg-info-soft',
        danger: 'bg-danger-soft',
        neutre: 'bg-surface-sunken',
      },
    },
    defaultVariants: { variante: 'info' },
  },
);

type Proprietes = ComponentProps<'div'> &
  VariantProps<typeof classesBandeau> & { icone?: ReactNode };

/** Message d'état sur toute la largeur : annoncé par les lecteurs d'écran. */
export function Bandeau({ variante, icone, className, children, ...reste }: Proprietes) {
  return (
    <div role="status" className={cn(classesBandeau({ variante }), className)} {...reste}>
      {icone}
      <span>{children}</span>
    </div>
  );
}
