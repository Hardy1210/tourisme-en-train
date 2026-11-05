// Mise en forme des lieux : calcul pur.
import { CATEGORIES, type Categorie } from '@tourisme/commun';

export type GroupeLieux<L> = { categorie: Categorie; lieux: L[] };

/** Regroupe par catégorie, dans l'ordre de l'application ; l'ordre des lieux (plus proches d'abord) est gardé. */
export function grouperParCategorie<L extends { categorie: Categorie }>(
  lieux: readonly L[],
): GroupeLieux<L>[] {
  return CATEGORIES.map((categorie) => ({
    categorie,
    lieux: lieux.filter((l) => l.categorie === categorie),
  })).filter((groupe) => groupe.lieux.length > 0);
}

/** « Patrimoine · château », mais « Parcs » seul si la sous-catégorie ne fait que le répéter. */
export function libelleCategorieDetaillee(libelle: string, sousCategorie: string | null): string {
  if (!sousCategorie) return libelle;
  return libelle.toLowerCase().startsWith(sousCategorie.toLowerCase())
    ? libelle
    : `${libelle} · ${sousCategorie}`;
}
