'use client';

import { CATEGORIES, type Categorie } from '@tourisme/commun';
import { CalendarDays, SlidersHorizontal, X } from 'lucide-react';
import { Puce } from '@/components/ui/puce';
import { APPARENCE_CATEGORIE, IconeCategorie } from '@/features/lieux/ui/icone-categorie';

type Proprietes = {
  categories: readonly Categorie[];
  surCategories: (categories: readonly Categorie[]) => void;
  nombre: number;
  surFiltres: () => void;
  /** Date autre qu'aujourd'hui (« Demain », « Sam. 14 nov. ») : pastille avant « Tout » ; null sinon. */
  date: string | null;
  surAujourdhui: () => void;
};

/**
 * Pastille de la date si ce n'est pas aujourd'hui (la toucher y revient), « Tout » et les 5 catégories
 * (plusieurs possibles), puis le bouton « Filtres », toujours visible.
 */
export function RangeeFiltres({
  categories,
  surCategories,
  nombre,
  surFiltres,
  date,
  surAujourdhui,
}: Proprietes) {
  const basculer = (categorie: Categorie) =>
    surCategories(
      categories.includes(categorie)
        ? categories.filter((c) => c !== categorie)
        : [...categories, categorie],
    );

  return (
    <div className="-mr-4 flex items-center gap-2 lg:mr-0 lg:items-start">
      <div
        role="group"
        aria-label="Catégories"
        className="scrollbar-none flex min-w-0 flex-1 gap-2 overflow-x-auto py-0.5 lg:flex-wrap lg:overflow-visible"
      >
        {date !== null && (
          <Puce
            selectionnee
            aria-label={`Date : ${date}. Revenir à aujourd'hui`}
            icone={<CalendarDays aria-hidden="true" />}
            onClick={surAujourdhui}
          >
            {date}
            <X aria-hidden="true" />
          </Puce>
        )}
        <Puce selectionnee={categories.length === 0} onClick={() => surCategories([])}>
          Tout
        </Puce>
        {CATEGORIES.map((categorie) => (
          <Puce
            key={categorie}
            selectionnee={categories.includes(categorie)}
            onClick={() => basculer(categorie)}
            icone={<IconeCategorie categorie={categorie} />}
          >
            {APPARENCE_CATEGORIE[categorie].libelle}
          </Puce>
        ))}
      </div>
      <Puce
        selectionnee={false}
        className="mr-4 font-semibold lg:mt-0.5 lg:mr-0"
        aria-label={
          nombre > 0 ? `Filtres, ${nombre} ${nombre > 1 ? 'actifs' : 'actif'}` : 'Filtres'
        }
        icone={<SlidersHorizontal aria-hidden="true" className="text-primary" />}
        onClick={surFiltres}
      >
        Filtres
        {nombre > 0 && (
          <span className="tabular flex h-5 min-w-5 items-center justify-center rounded-pill bg-primary px-1.5 text-2xs font-bold text-primary-foreground">
            {nombre}
          </span>
        )}
      </Puce>
    </div>
  );
}
