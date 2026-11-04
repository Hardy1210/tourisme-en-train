import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowLeft, X } from 'lucide-react';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/classes';

const classesBouton = cva(
  'inline-flex h-touch flex-none cursor-pointer items-center justify-center gap-2 rounded-bouton text-md font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-55',
  {
    variants: {
      variante: {
        principal: 'bg-action font-bold text-action-foreground hover:bg-action-hover',
        sortie: 'bg-sortie-bg text-sortie-foreground hover:bg-sortie-hover',
        secondaire:
          'border border-border-strong bg-surface text-foreground hover:bg-surface-sunken',
        fantome: 'text-foreground hover:bg-surface-sunken',
      },
      forme: { texte: 'px-4', icone: 'w-touch' },
    },
    defaultVariants: { variante: 'principal', forme: 'texte' },
  },
);

type Proprietes = ComponentProps<'button'> &
  VariantProps<typeof classesBouton> & {
    /** Applique l'aspect à l'élément enfant (lien) au lieu d'un `<button>`. */
    asChild?: boolean;
  };

export function Bouton({ variante, forme, asChild = false, className, ...reste }: Proprietes) {
  const Element = asChild ? Slot.Root : 'button';
  return (
    <Element
      {...(asChild ? {} : { type: 'button' })}
      className={cn(classesBouton({ variante, forme }), className)}
      {...reste}
    />
  );
}

type ProprietesIcone = Omit<Proprietes, 'variante' | 'forme' | 'children' | 'aria-label'>;

/** Le seul bouton « Retour » de l'application. */
export function BoutonRetour(proprietes: ProprietesIcone) {
  return (
    <Bouton variante="fantome" forme="icone" aria-label="Retour" {...proprietes}>
      <ArrowLeft aria-hidden="true" className="size-5.5" />
    </Bouton>
  );
}

/** Le seul bouton « Fermer » de l'application. */
export function BoutonFermer({ className, ...reste }: ProprietesIcone) {
  return (
    <Bouton
      variante="fantome"
      forme="icone"
      aria-label="Fermer"
      className={cn('text-muted-foreground', className)}
      {...reste}
    >
      <X aria-hidden="true" className="size-5.5" />
    </Bouton>
  );
}
