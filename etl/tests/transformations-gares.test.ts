import { describe, expect, it } from 'vitest';
import { parametres } from '../src/config';
import {
  departementDe,
  estDansRegion,
  lireCodesUic,
  lirePosition,
  normaliserUic,
} from '../src/transformations/gares';

describe('normaliserUic', () => {
  it('garde un code de 8 chiffres', () => {
    expect(normaliserUic('87713040')).toBe('87713040');
  });
  it('retire les zéros de tête en trop', () => {
    expect(normaliserUic('0087713040')).toBe('87713040');
  });
  it('refuse un code trop court', () => {
    expect(normaliserUic('12345')).toBeNull();
  });
  it('refuse un code trop long sans zéros de tête', () => {
    expect(normaliserUic('187713040')).toBeNull();
  });
  it('refuse un caractère non numérique', () => {
    expect(normaliserUic('8771304A')).toBeNull();
  });
});

describe('lireCodesUic', () => {
  it('un seul code', () => {
    expect(lireCodesUic('87713040')).toEqual({ uic: '87713040', codesUic: ['87713040'] });
  });
  it('liste : le premier est le principal, tous sont gardés dans l’ordre', () => {
    expect(lireCodesUic('87391011;87391003;87391102')).toEqual({
      uic: '87391011',
      codesUic: ['87391011', '87391003', '87391102'],
    });
  });
  it('un code invalide dans la liste est ignoré, les autres gardés', () => {
    expect(lireCodesUic('12345;87713041')).toEqual({ uic: '87713041', codesUic: ['87713041'] });
  });
  it('doublon (après normalisation) gardé une seule fois', () => {
    expect(lireCodesUic('87713040;0087713040')?.codesUic).toEqual(['87713040']);
  });
  it('principal = premier code français, même s’il n’est pas en tête', () => {
    expect(lireCodesUic('80123456;87713040')).toEqual({
      uic: '87713040',
      codesUic: ['80123456', '87713040'],
    });
  });
  it('aucun code valide → rejet', () => {
    expect(lireCodesUic('12345')).toBeNull();
  });
  it('aucun code français → rejet', () => {
    expect(lireCodesUic('80123456')).toBeNull();
  });
});

describe('departementDe', () => {
  it('métropole : 2 caractères', () => {
    expect(departementDe('21231')).toBe('21');
  });
  it('Corse : 2A', () => {
    expect(departementDe('2A004')).toBe('2A');
  });
  it('outre-mer : 3 caractères', () => {
    expect(departementDe('97411')).toBe('974');
  });
  it('zéro initial perdu (fichier passé par Excel) → rejet', () => {
    expect(departementDe('2761')).toBeNull();
  });
  it('lettres hors Corse → rejet', () => {
    expect(departementDe('2C004')).toBeNull();
  });
});

describe('estDansRegion (paramètres réels)', () => {
  const departements = parametres.region.departements;
  it('Dijon (21) est dans la région', () => {
    expect(estDansRegion(departementDe('21231') ?? '', departements)).toBe(true);
  });
  it('Lyon (69) n’est pas dans la région', () => {
    expect(estDansRegion(departementDe('69123') ?? '', departements)).toBe(false);
  });
});

describe('lirePosition', () => {
  it('latitude d’abord, comme dans le fichier SNCF', () => {
    expect(lirePosition('47.3233, 5.0272')).toEqual({ lat: 47.3233, lon: 5.0272 });
  });
  it('longitude négative (ouest de la France)', () => {
    expect(lirePosition('47.5546432, -1.5244159')).toEqual({ lat: 47.5546432, lon: -1.5244159 });
  });
  it('valeur manquante → rejet', () => {
    expect(lirePosition('47.3233,')).toBeNull();
  });
  it('vide → rejet', () => {
    expect(lirePosition('')).toBeNull();
  });
  it('latitude impossible → rejet', () => {
    expect(lirePosition('147.3, 5.0')).toBeNull();
  });
  it('texte non numérique → rejet', () => {
    expect(lirePosition('nord, est')).toBeNull();
  });
});
