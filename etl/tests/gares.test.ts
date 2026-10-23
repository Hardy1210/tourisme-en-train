import { describe, expect, it } from 'vitest';
import { schemaGare } from '../src/sources/gares';

// Colonnes réelles du fichier SNCF (docs/02-sources-donnees.md § 2.1).
const ligne = {
  nom: 'Dijon',
  libellecourt: 'DJV',
  segment_drg: 'A',
  position_geographique: '47.3234, 5.0272',
  codeinsee: '21231',
  codes_uic: '87713040',
  id: 'a1b2',
};

describe('schemaGare', () => {
  it('ligne valide → gare transformée, dans la région', () => {
    expect(schemaGare.parse(ligne)).toEqual({
      uic: '87713040',
      codesUic: ['87713040'],
      nom: 'Dijon',
      codeInsee: '21231',
      dansRegion: true,
      lat: 47.3234,
      lon: 5.0272,
    });
  });

  it('gare hors région (Lyon) → dansRegion faux', () => {
    const lyon = { ...ligne, codeinsee: '69383', codes_uic: '87723197' };
    expect(schemaGare.parse(lyon).dansRegion).toBe(false);
  });

  it('chaque défaut est nommé (UIC, position, code INSEE)', () => {
    const resultat = schemaGare.safeParse({
      ...ligne,
      codes_uic: '12345',
      position_geographique: '',
      codeinsee: '2761',
    });
    expect(resultat.success).toBe(false);
    expect(resultat.error?.issues.map((p) => p.path[0])).toEqual([
      'codes_uic',
      'position_geographique',
      'codeinsee',
    ]);
  });

  it('nom vide → rejet', () => {
    expect(schemaGare.safeParse({ ...ligne, nom: '  ' }).success).toBe(false);
  });
});
