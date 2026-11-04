import { ArrowUpRight, Leaf } from 'lucide-react';
import { Bouton } from '@/components/ui/bouton';
import { parametres } from '@/config/parametres';
import { formaterKg, formaterPrix, MENTION_ESTIMATION } from '../presentation';

type Proprietes = {
  co2EconomiseKg: number | null;
  prixEstime: { min: number; max: number } | null;
  surComparer: () => void;
};

/** Toujours visible : le CO₂ économisé, le prix estimé s'il est calibré, et la billetterie officielle. */
export function PiedDestination({ co2EconomiseKg, prixEstime, surComparer }: Proprietes) {
  return (
    <footer className="flex flex-none flex-col gap-2 border-t bg-surface px-4 pt-2.5 pb-3 safe-bottom">
      {co2EconomiseKg !== null && (
        <div className="flex items-center gap-2 rounded-lg bg-eco-soft py-1 pr-1 pl-3 text-sm">
          <Leaf aria-hidden="true" className="size-4.5 flex-none text-eco" />
          <span className="min-w-0 flex-1 text-pretty">
            Vous économisez{' '}
            <strong className="tabular text-eco">{formaterKg(co2EconomiseKg)} kg de CO₂</strong> par
            rapport à la voiture, aller-retour
          </span>
          <Bouton
            variante="fantome"
            className="flex-none px-2 text-sm font-semibold text-primary underline"
            onClick={surComparer}
          >
            Comparer
          </Bouton>
        </div>
      )}
      <div className="flex items-center gap-3">
        {prixEstime && (
          <div className="flex flex-none flex-col">
            <span className="text-xs text-muted-foreground">
              L&apos;aller ({MENTION_ESTIMATION})
            </span>
            <span className="tabular font-display text-lg font-bold">
              {formaterPrix(prixEstime)}
            </span>
          </div>
        )}
        <Bouton asChild className="flex-1">
          <a href={parametres.billetterie.url} target="_blank" rel="noopener">
            Acheter mon billet
            <ArrowUpRight aria-hidden="true" className="size-4.5" />
          </a>
        </Bouton>
      </div>
    </footer>
  );
}
