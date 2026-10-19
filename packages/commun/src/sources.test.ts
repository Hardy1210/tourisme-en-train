import { describe, expect, it } from 'vitest';
import sourcesBrutes from '../../../config/sources.json' with { type: 'json' };
import { schemaSources, trouverSource, type Sources } from './sources';

// Copie profonde modifiable du vrai fichier, pour fabriquer les cas refusés.
function copie(): Sources {
  return structuredClone(sourcesBrutes) as Sources;
}

describe('schéma de config/sources.json', () => {
  it('accepte le fichier du dépôt', () => {
    expect(schemaSources.safeParse(sourcesBrutes).success).toBe(true);
  });

  it('accepte une adresse de téléchargement à null (pas encore relevée)', () => {
    const s = copie();
    s.sources[0]!.telechargement = null;
    expect(schemaSources.safeParse(s).success).toBe(true);
  });

  it('refuse une adresse en http (non chiffrée)', () => {
    const s = copie();
    s.sources[0]!.telechargement = 'http://exemple.fr/gares.csv';
    expect(schemaSources.safeParse(s).success).toBe(false);
  });

  it('refuse deux sources avec le même code', () => {
    const s = copie();
    s.sources.push({ ...s.sources[0]! });
    expect(schemaSources.safeParse(s).success).toBe(false);
  });

  it('refuse une clé inconnue (faute de frappe)', () => {
    const s = copie();
    expect(schemaSources.safeParse({ ...s, source: [] }).success).toBe(false);
  });
});

describe('trouverSource', () => {
  it('trouve une source présente', () => {
    expect(trouverSource('gares').producteur).toBe('SNCF Gares & Connexions');
  });

  it('lève une erreur pour une source absente', () => {
    expect(() => trouverSource('inconnue')).toThrow(/absente/);
  });
});
