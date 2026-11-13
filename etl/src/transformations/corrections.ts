// Corrections manuelles d'un lieu (docs/04-traitement-donnees.md § 4.5, D061) : fonction pure.
import { schemaCategorie, type Categorie } from '@tourisme/commun';
import type { LieuACharger } from './lieux';

export interface CorrectionLieu {
  source: string;
  idSource: string;
  action: 'retirer' | 'reclasser' | 'inclure';
  categorie: string | null;
  sousCategorie: string | null;
  /** null = règle normale ; [] = aucune ; sinon, ces catégories seulement. */
  secondaires: readonly string[] | null;
}

/**
 * Le lieu corrigé, ou null s'il est retiré. « inclure » se comporte comme « reclasser » : le lieu, que
 * les règles auraient écarté, est gardé avec la catégorie donnée (le lecteur l'a déjà construit).
 */
export function corrigerLieu(lieu: LieuACharger, correction: CorrectionLieu): LieuACharger | null {
  if (correction.action === 'retirer') return null;
  const categorie = correction.categorie ?? lieu.categorie;
  return {
    ...lieu,
    categorie,
    sousCategorie: correction.sousCategorie ?? lieu.sousCategorie,
    // Une catégorie devenue principale ne reste pas en secondaire.
    categoriesSecondaires: (correction.secondaires ?? lieu.categoriesSecondaires).filter(
      (c) => c !== categorie,
    ),
  };
}

/** Catégorie imposée à une ligne que les règles écartent (« inclure ») ; sinon undefined. */
export type Inclusion = (
  idSource: string,
) => { categorie: Categorie; sousCategorie: string | null } | undefined;

/** Les inclusions d'une liste de corrections, par identifiant de source. */
export function inclusionsDe(corrections: readonly CorrectionLieu[]): Inclusion {
  const parId = new Map(
    corrections
      .filter((c) => c.action === 'inclure' && c.categorie !== null)
      .map((c) => [
        c.idSource,
        { categorie: schemaCategorie.parse(c.categorie), sousCategorie: c.sousCategorie },
      ]),
  );
  return (idSource) => parId.get(idSource);
}

/**
 * Un lieu est-il masqué par sa sous-catégorie (`acces.sousCategoriesMasquees`, ex. piscine) ? Il reste
 * en base, caché de tous les écrans (D093). Une correction manuelle passe avant (D091) : un lieu
 * « inclure » ou « reclasser » n'est jamais masqué ici.
 */
export function masqueParSousCategorie(
  sousCategorie: string | null,
  masquees: readonly string[],
  correction: CorrectionLieu | undefined,
): boolean {
  if (correction && correction.action !== 'retirer') return false;
  return sousCategorie !== null && masquees.includes(sousCategorie);
}
