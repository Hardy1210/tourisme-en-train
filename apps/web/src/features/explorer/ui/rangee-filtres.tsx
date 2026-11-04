'use client';

import { CATEGORIES, type Categorie } from '@tourisme/commun';
import { SlidersHorizontal } from 'lucide-react';
import { Puce } from '@/components/ui/puce';
import { APPARENCE_CATEGORIE, IconeCategorie } from '@/features/lieux/ui/icone-categorie';

type Proprietes = {
  categories: readonly Categorie[];
  surCategories: (categories: readonly Categorie[]) => void;
  nombre: number;
  surFiltres: () => void;
};

/** « Tout » et les 5 catégories (plusieurs possibles), puis le bouton « Filtres », toujours visible. */
export function RangeeFiltres({ categories, surCategories, nombre, surFiltres }: Proprietes) {
  const basculer = (categorie: Categorie) =>
    surCategories(
      categories.includes(categorie)
        ? categories.filter((c) => c !== categorie)
        : [...categories, categorie],
    );

  return (
    <div className="-mr-4 flex items-center gap-2">
      <div
        role="group"
        aria-label="Catégories"
        className="scrollbar-none flex min-w-0 flex-1 gap-2 overflow-x-auto py-0.5"
      >
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
        className="mr-4 font-semibold"
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
