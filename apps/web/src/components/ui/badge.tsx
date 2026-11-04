import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/classes';

const classesBadge = cva(
  'inline-flex min-h-5.5 items-center gap-1 rounded-pill px-2 text-2xs font-semibold whitespace-nowrap [&_svg]:size-3.5',
  {
    variants: {
      variante: {
        neutre: 'bg-surface-sunken text-muted-foreground',
        eco: 'bg-eco-soft text-eco',
        transit: 'bg-transit-soft text-transit-foreground',
        avertissement: 'bg-warning-soft text-warning',
        danger: 'bg-danger-soft text-danger',
        info: 'bg-info-soft text-info',
      },
    },
    defaultVariants: { variante: 'neutre' },
  },
);

type Proprietes = ComponentProps<'span'> & VariantProps<typeof classesBadge>;

export function Badge({ variante, className, ...reste }: Proprietes) {
  return <span className={cn(classesBadge({ variante }), className)} {...reste} />;
}
