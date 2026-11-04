// Corrections manuelles d'un lieu (docs/04-traitement-donnees.md § 4.5, D061) : fonction pure.
import type { LieuACharger } from './lieux';

export interface CorrectionLieu {
  source: string;
  idSource: string;
  action: 'retirer' | 'reclasser';
  categorie: string | null;
  sousCategorie: string | null;
  /** null = règle normale ; [] = aucune ; sinon, ces catégories seulement. */
  secondaires: readonly string[] | null;
}

/** Le lieu corrigé, ou null s'il est retiré. */
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
