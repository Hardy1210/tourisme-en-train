import { CATEGORIES } from '@tourisme/commun';
import { APPARENCE_CATEGORIE, IconeCategorie } from '@/features/lieux/ui/icone-categorie';
import { cn } from '@/lib/classes';
import type { Destination } from '../schemas';

/** Une pastille par catégorie non vide : icône + nombre de lieux à pied depuis la gare. */
export function PastillesCategories({
  lieuxParCategorie,
  className,
}: {
  lieuxParCategorie: Destination['lieuxParCategorie'];
  className?: string;
}) {
  return (
    <ul className={cn('flex flex-wrap gap-1.5', className)}>
      {CATEGORIES.filter((c) => (lieuxParCategorie[c] ?? 0) > 0).map((c) => {
        const { libelle, classeFond, classeTexte } = APPARENCE_CATEGORIE[c];
        const nombre = lieuxParCategorie[c];
        return (
          <li
            key={c}
            aria-label={`${nombre} ${libelle}`}
            className={cn(
              'tabular flex h-7.5 items-center gap-1 rounded-pill pr-2.5 pl-2 text-sm font-bold',
              classeFond,
              classeTexte,
            )}
          >
            <IconeCategorie categorie={c} className="size-4" />
            {nombre}
          </li>
        );
      })}
    </ul>
  );
}
