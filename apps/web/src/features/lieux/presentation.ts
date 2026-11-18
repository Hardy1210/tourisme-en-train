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

const normaliser = (texte: string) =>
  texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

/** La sous-catégorie, sauf si elle ne fait que répéter le nom (« Aire de jeux » · « aire de jeux »). */
export function sousCategorieAffichee(nom: string, sousCategorie: string | null): string | null {
  if (!sousCategorie) return null;
  return normaliser(nom) === normaliser(sousCategorie) ? null : sousCategorie;
}

/** Les `max` premiers lieux d'une catégorie, et le nombre de ceux qui restent à déplier. */
export function lieuxVisibles<L>(
  lieux: readonly L[],
  max: number,
  deplie: boolean,
): { visibles: L[]; caches: number } {
  if (deplie || lieux.length <= max) return { visibles: [...lieux], caches: 0 };
  return { visibles: lieux.slice(0, max), caches: lieux.length - max };
}

/** Libellé du bouton qui déplie une catégorie. */
export function libelleVoirAutres(caches: number): string {
  return caches === 1 ? "Voir l'autre" : `Voir les ${caches} autres`;
}
