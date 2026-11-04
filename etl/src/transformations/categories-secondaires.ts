// Catégories secondaires d'un lieu (docs/04-traitement-donnees.md § 4.5, D060) : fonctions pures.
// Elles ne changent jamais la catégorie principale, ni donc la liste sans filtre.
import type { Categorie } from '@tourisme/commun';
import type { Etiquette } from './categories';
import { lireMotif, motifQuiExclut } from './noms-exclus';

export interface RegleSecondaire {
  source: 'datatourisme' | 'osm' | 'nom';
  cle: string;
  valeur: string;
  categorie: Categorie;
}

/** Catégories ajoutées à ce lieu, sans doublon et sans sa catégorie principale. */
export function categoriesSecondaires(
  regles: readonly RegleSecondaire[],
  lieu: {
    source: string;
    etiquettes: readonly Etiquette[];
    nom: string;
    categorie: string;
  },
): Categorie[] {
  const retenues = regles.filter((regle) => {
    if (regle.source === 'nom') {
      return motifQuiExclut(lieu.nom, [lireMotif(regle.valeur, '')]) !== null;
    }
    return (
      regle.source === lieu.source &&
      lieu.etiquettes.some(
        ([cle, valeur]) => cle === regle.cle && (regle.valeur === '*' || valeur === regle.valeur),
      )
    );
  });
  return [...new Set(retenues.map((r) => r.categorie))].filter((c) => c !== lieu.categorie);
}
