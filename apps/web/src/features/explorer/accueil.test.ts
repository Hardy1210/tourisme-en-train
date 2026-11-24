import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CLE_ACCUEIL_VU,
  ecrireAccueilVu,
  etapeAccueil,
  lireAccueilVu,
  photoAuHasard,
} from './accueil';

describe('etapeAccueil', () => {
  it('premier lancement, sans gare dans le lien : la bienvenue', () => {
    expect(etapeAccueil({ accueilVu: false, gareDansUrl: false })).toBe('bienvenue');
  });
  it('accueil déjà vu : Explorer directement', () => {
    expect(etapeAccueil({ accueilVu: true, gareDansUrl: false })).toBeNull();
  });
  it('lien partagé avec une gare, même au premier lancement : Explorer directement', () => {
    expect(etapeAccueil({ accueilVu: false, gareDansUrl: true })).toBeNull();
  });
});

describe('repère « accueil vu »', () => {
  let valeurs: Map<string, string>;
  beforeEach(() => {
    valeurs = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (cle: string) => valeurs.get(cle) ?? null,
      setItem: (cle: string, valeur: string) => valeurs.set(cle, valeur),
    });
  });

  it('se relit', () => {
    expect(lireAccueilVu()).toBe(false);
    ecrireAccueilVu();
    expect(lireAccueilVu()).toBe(true);
  });
  it('ne garde qu’un oui, jamais de position (règle 5)', () => {
    ecrireAccueilVu();
    expect([...valeurs.entries()]).toEqual([[CLE_ACCUEIL_VU, '1']]);
  });
  it('une autre valeur ne vaut pas « vu »', () => {
    valeurs.set(CLE_ACCUEIL_VU, 'oui');
    expect(lireAccueilVu()).toBe(false);
  });
  it('stockage refusé (navigation privée) : pas vu, sans erreur', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('refusé');
      },
      setItem: () => {
        throw new Error('refusé');
      },
    });
    expect(() => ecrireAccueilVu()).not.toThrow();
    expect(lireAccueilVu()).toBe(false);
  });
});

describe('photoAuHasard', () => {
  const liste = ['a', 'b', 'c'] as const;
  it('prend la photo qui correspond au tirage', () => {
    expect(photoAuHasard(liste, 0)).toBe('a');
    expect(photoAuHasard(liste, 0.5)).toBe('b');
  });
  it('ne dépasse jamais la liste, même au tirage le plus haut', () => {
    expect(photoAuHasard(liste, 0.9999)).toBe('c');
  });
});
