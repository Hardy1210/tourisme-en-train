import { describe, expect, it } from 'vitest';

import { lirePointEwkb } from './types-postgis';

// Valeurs renvoyées par PostGIS 3.4 pour Dijon-Ville (5.0272, 47.3233).
const DIJON_PETIT_BOUTISTE = '0101000020E610000007CE1951DA1B1440FE65F7E461A94740';
const DIJON_GRAND_BOUTISTE = '0020000001000010e640141bda5119ce074047a961e4f765fe';
const POINT_3D = '01010000A0E6100000000000000000F03F00000000000000400000000000000840';
const LIGNE =
  '0102000020E610000002000000000000000000F03F000000000000004000000000000008400000000000001040';

describe('lirePointEwkb', () => {
  it('lit un point 2D avec SRID, quel que soit l’ordre des octets', () => {
    expect(lirePointEwkb(DIJON_PETIT_BOUTISTE)).toEqual({ lon: 5.0272, lat: 47.3233 });
    expect(lirePointEwkb(DIJON_GRAND_BOUTISTE)).toEqual({ lon: 5.0272, lat: 47.3233 });
  });

  it('lit un point sans SRID', () => {
    expect(lirePointEwkb('0101000000000000000000F03F0000000000000040')).toEqual({
      lon: 1,
      lat: 2,
    });
  });

  it('refuse un point 3D et une ligne', () => {
    expect(() => lirePointEwkb(POINT_3D)).toThrow(/point 2D/);
    expect(() => lirePointEwkb(LIGNE)).toThrow(/point 2D/);
  });

  it('refuse un texte tronqué ou qui n’est pas de l’hexadécimal', () => {
    expect(() => lirePointEwkb(DIJON_PETIT_BOUTISTE.slice(0, -2))).toThrow(/longueur/);
    expect(() => lirePointEwkb('0101')).toThrow(/trop court/);
    expect(() => lirePointEwkb('POINT(1 2)')).toThrow(/hexadécimal/);
  });

  it('refuse un point vide', () => {
    expect(() => lirePointEwkb('0101000020E6100000000000000000F87F000000000000F87F')).toThrow(
      /vide/,
    );
  });
});
