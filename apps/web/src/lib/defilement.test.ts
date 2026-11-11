import { describe, expect, it } from 'vitest';
import { indicateurDefilement } from './defilement';

describe('indicateurDefilement', () => {
  it('rien de caché : pas d’indicateur', () => {
    expect(
      indicateurDefilement({ hauteurContenu: 300, hauteurVisible: 300, defilement: 0 }),
    ).toBeNull();
  });

  it('un écart d’arrondi (1 px) ne compte pas ; 2 px cachés, si', () => {
    expect(
      indicateurDefilement({ hauteurContenu: 301, hauteurVisible: 300, defilement: 0 }),
    ).toBeNull();
    expect(
      indicateurDefilement({ hauteurContenu: 302, hauteurVisible: 300, defilement: 0 }),
    ).not.toBeNull();
  });

  it('la moitié visible : trait de la moitié du rail, en haut puis en bas', () => {
    expect(
      indicateurDefilement({ hauteurContenu: 600, hauteurVisible: 300, defilement: 0 }),
    ).toEqual({ partVisible: 0.5, progression: 0 });
    expect(
      indicateurDefilement({ hauteurContenu: 600, hauteurVisible: 300, defilement: 300 }),
    ).toEqual({ partVisible: 0.5, progression: 1 });
  });

  it('l’élan d’iOS au-delà des bords : le trait reste dans son rail', () => {
    const mesure = { hauteurContenu: 600, hauteurVisible: 300 };
    expect(indicateurDefilement({ ...mesure, defilement: -40 })?.progression).toBe(0);
    expect(indicateurDefilement({ ...mesure, defilement: 340 })?.progression).toBe(1);
  });

  it('zone encore sans hauteur (feuille qui s’ouvre) : pas d’indicateur', () => {
    expect(
      indicateurDefilement({ hauteurContenu: 200, hauteurVisible: 0, defilement: 0 }),
    ).toBeNull();
  });
});
