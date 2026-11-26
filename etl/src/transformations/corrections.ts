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
 * Le lieu corrigé. « retirer » ne le supprime jamais : il est gardé tel quel, et `lieuMasque` le cache de
 * tous les écrans (règle de Hardy, D093, D124). « inclure » se comporte comme « reclasser » : le lieu, que
 * les règles auraient écarté, est gardé avec la catégorie donnée (le lecteur l'a déjà construit).
 */
export function corrigerLieu(lieu: LieuACharger, correction: CorrectionLieu): LieuACharger {
  if (correction.action === 'retirer') return lieu;
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
 * Un lieu est-il masqué ? Il reste alors en base, caché de tous les écrans (D093). Une correction manuelle
 * passe avant (D091) : « retirer » le masque toujours (D124), « inclure » ou « reclasser » jamais ; sans
 * correction, sa sous-catégorie décide (`acces.sousCategoriesMasquees`, ex. piscine).
 */
export function lieuMasque(
  sousCategorie: string | null,
  masquees: readonly string[],
  correction: CorrectionLieu | undefined,
): boolean {
  if (correction) return correction.action === 'retirer';
  return sousCategorie !== null && masquees.includes(sousCategorie);
}
