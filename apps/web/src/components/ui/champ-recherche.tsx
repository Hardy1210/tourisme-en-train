import { Search } from 'lucide-react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/classes';

type Proprietes = Omit<ComponentProps<'input'>, 'type'> & {
  /** Nom du champ pour les lecteurs d'écran. */
  libelle: string;
};

export function ChampRecherche({ libelle, className, ...reste }: Proprietes) {
  return (
    <label
      className={cn(
        'flex h-13 items-center gap-2.5 rounded-champ bg-champ-bg px-3.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring',
        className,
      )}
    >
      <Search aria-hidden="true" className="size-5 flex-none text-muted-foreground" />
      <span className="sr-only">{libelle}</span>
      {/* 16 px minimum : en dessous, iOS zoome sur la page à la saisie. */}
      <input
        type="search"
        className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        {...reste}
      />
    </label>
  );
}
