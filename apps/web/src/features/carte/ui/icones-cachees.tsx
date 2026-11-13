import { CATEGORIES } from '@tourisme/commun';
import { forwardRef } from 'react';
import { APPARENCE_CATEGORIE } from '@/features/lieux/ui/icone-categorie';
import { ATTRIBUT_ICONE, TAILLE_ICONE } from '../icones-categories';

/** Les cinq icônes de catégorie, cachées : la carte en copie le dessin (`enregistrerIconesCategories`). */
export const IconesCachees = forwardRef<HTMLDivElement>(function IconesCachees(_, ref) {
  return (
    <div ref={ref} hidden aria-hidden="true">
      {CATEGORIES.map((categorie) => {
        const { Icone } = APPARENCE_CATEGORIE[categorie];
        return <Icone key={categorie} size={TAILLE_ICONE} {...{ [ATTRIBUT_ICONE]: categorie }} />;
      })}
    </div>
  );
});
