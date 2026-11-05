import { describe, expect, it } from 'vitest';
import { grouperParCategorie, libelleCategorieDetaillee } from './presentation';

describe('grouperParCategorie', () => {
  it('regroupe en gardant l’ordre des lieux', () => {
    const groupes = grouperParCategorie([
      { nom: 'a', categorie: 'culture' as const },
      { nom: 'b', categorie: 'enfants' as const },
      { nom: 'c', categorie: 'culture' as const },
    ]);
    expect(groupes.map((g) => g.categorie)).toEqual(['enfants', 'culture']);
    expect(groupes[1]?.lieux.map((l) => l.nom)).toEqual(['a', 'c']);
  });
  it('n’a aucun groupe vide', () => {
    expect(grouperParCategorie([])).toEqual([]);
  });
});

describe('libelleCategorieDetaillee', () => {
  it('ajoute une sous-catégorie qui apporte une information', () => {
    expect(libelleCategorieDetaillee('Patrimoine', 'château')).toBe('Patrimoine · château');
  });
  it('ne répète pas la catégorie, et accepte l’absence de sous-catégorie', () => {
    expect(libelleCategorieDetaillee('Parcs', 'parc')).toBe('Parcs');
    expect(libelleCategorieDetaillee('Parcs', null)).toBe('Parcs');
  });
});
