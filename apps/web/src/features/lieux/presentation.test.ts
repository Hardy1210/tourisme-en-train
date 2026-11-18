import { describe, expect, it } from 'vitest';
import {
  grouperParCategorie,
  libelleCategorieDetaillee,
  libelleVoirAutres,
  lieuxVisibles,
  sousCategorieAffichee,
} from './presentation';

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

describe('sousCategorieAffichee', () => {
  it('garde une sous-catégorie qui apporte une information, même contenue dans le nom', () => {
    expect(sousCategorieAffichee('Château de Beaune', 'château')).toBe('château');
    expect(sousCategorieAffichee('Akroroc', 'parc aventure')).toBe('parc aventure');
  });
  it('limite : la cache quand elle répète le nom (casse et accents ignorés), ou qu’elle manque', () => {
    expect(sousCategorieAffichee('Aire de jeux', 'aire de jeux')).toBeNull();
    expect(sousCategorieAffichee('Écluse', 'ecluse')).toBeNull();
    expect(sousCategorieAffichee('Beffroi', null)).toBeNull();
  });
});

describe('lieuxVisibles', () => {
  const lieux = ['a', 'b', 'c', 'd', 'e', 'f'];
  it('au-delà du maximum, montre les premiers et compte les autres', () => {
    expect(lieuxVisibles(lieux, 5, false)).toEqual({ visibles: ['a', 'b', 'c', 'd', 'e'], caches: 1 });
  });
  it('limite : exactement le maximum, tout est montré, rien à déplier', () => {
    expect(lieuxVisibles(lieux.slice(0, 5), 5, false)).toEqual({
      visibles: ['a', 'b', 'c', 'd', 'e'],
      caches: 0,
    });
  });
  it('dépliée, la liste montre tout', () => {
    expect(lieuxVisibles(lieux, 5, true)).toEqual({ visibles: lieux, caches: 0 });
  });
});

describe('libelleVoirAutres', () => {
  it('au pluriel', () => {
    expect(libelleVoirAutres(12)).toBe('Voir les 12 autres');
  });
  it('limite : un seul autre lieu', () => {
    expect(libelleVoirAutres(1)).toBe("Voir l'autre");
  });
});
