import { describe, expect, it } from 'vitest';
import {
  debutDeMois,
  decalerJours,
  grilleDuMois,
  libelleComplet,
  libelleCourt,
  libelleMois,
  libelleDate,
} from './calendrier';

describe('decalerJours', () => {
  it('traverse les changements d’heure sans glisser (été puis hiver)', () => {
    expect(decalerJours('2026-10-24', 2)).toBe('2026-10-26'); // passage à l'heure d'hiver le 25/10
    expect(decalerJours('2026-03-28', 2)).toBe('2026-03-30'); // passage à l'heure d'été le 29/03
  });

  it('change de mois et d’année', () => {
    expect(decalerJours('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('debutDeMois', () => {
  it('avance d’un mois, même depuis un 31', () => {
    expect(debutDeMois('2026-10-31', 1)).toBe('2026-11-01');
  });

  it('recule et change d’année', () => {
    expect(debutDeMois('2027-01-15', -1)).toBe('2026-12-01');
  });
});

describe('grilleDuMois', () => {
  it('novembre 2026 commence un dimanche : six cases vides avant le 1er', () => {
    const grille = grilleDuMois('2026-11-17');
    expect(grille.slice(0, 7)).toEqual([null, null, null, null, null, null, '2026-11-01']);
    expect(grille.at(-1)).toBe('2026-11-30');
  });

  it('un mois qui commence un lundi n’a aucune case vide', () => {
    const grille = grilleDuMois('2026-06-10');
    expect(grille[0]).toBe('2026-06-01');
    expect(grille).toHaveLength(30);
  });

  it('février bissextile compte 29 jours, pas les autres années', () => {
    expect(grilleDuMois('2028-02-01').at(-1)).toBe('2028-02-29');
    expect(grilleDuMois('2027-02-01').at(-1)).toBe('2027-02-28');
  });
});

describe('libellés', () => {
  it('écrit la date courte en français', () => {
    expect(libelleCourt('2026-11-17')).toBe('Mar. 17 nov.');
  });

  it('écrit « 1er » le premier du mois, et pas un autre jour', () => {
    expect(libelleCourt('2026-10-01')).toBe('Jeu. 1er oct.');
    expect(libelleCourt('2026-10-02')).toBe('Ven. 2 oct.');
  });

  it('écrit le mois et la date complète', () => {
    expect(libelleMois('2026-11-17')).toBe('Novembre 2026');
    expect(libelleComplet('2026-07-15')).toBe('mercredi 15 juillet 2026');
  });
});

describe('libelleDate', () => {
  it('écrit la date en toutes lettres, en été comme en hiver', () => {
    expect(libelleDate('2026-07-15')).toBe('15 juillet 2026');
    expect(libelleDate('2026-11-17')).toBe('17 novembre 2026');
  });

  it('écrit le premier du mois « 1er », et pas le 2', () => {
    expect(libelleDate('2026-11-01')).toBe('1er novembre 2026');
    expect(libelleDate('2026-11-02')).toBe('2 novembre 2026');
  });
});
