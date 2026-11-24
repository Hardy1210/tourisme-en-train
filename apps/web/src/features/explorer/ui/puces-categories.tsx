'use client';

// « Tout » et les 5 catégories, avec leurs icônes : les mêmes puces dans la rangée de la carte et dans la
// feuille « Filtres » (remarque ② du professeur). Les deux lisent le même état (l'adresse de la page) : un
// choix d'un côté se voit aussitôt de l'autre.
import { CATEGORIES, type Categorie } from '@tourisme/commun';
import { Puce } from '@/components/ui/puce';
import { APPARENCE_CATEGORIE, IconeCategorie } from '@/features/lieux/ui/icone-categorie';
import { basculerCategorie } from '../filtres';

type Proprietes = {
  categories: readonly Categorie[];
  surCategories: (categories: readonly Categorie[]) => void;
};

export function PucesCategories({ categories, surCategories }: Proprietes) {
  return (
    <>
      <Puce selectionnee={categories.length === 0} onClick={() => surCategories([])}>
        Tout
      </Puce>
      {CATEGORIES.map((categorie) => (
        <Puce
          key={categorie}
          selectionnee={categories.includes(categorie)}
          onClick={() => surCategories(basculerCategorie(categories, categorie))}
          icone={<IconeCategorie categorie={categorie} />}
        >
          {APPARENCE_CATEGORIE[categorie].libelle}
        </Puce>
      ))}
    </>
  );
}
