import { describe, expect, it } from 'vitest';
import { lireArguments, SOURCES } from '../src/arguments';
import { lireConfig } from '../src/config';

describe('lireArguments', () => {
  it('accepte une source connue', () => {
    expect(lireArguments(['gares'])).toEqual({
      type: 'execution',
      cibles: ['gares'],
      force: false,
      horsLigne: false,
    });
  });

  it('refuse une source inconnue', () => {
    expect(lireArguments(['garez'])).toMatchObject({ type: 'erreur' });
  });

  it('« all » enchaîne toutes les sources dans l’ordre du pipeline', () => {
    expect(lireArguments(['all'])).toMatchObject({ type: 'execution', cibles: SOURCES });
  });

  it('lit --force et --hors-ligne', () => {
    expect(lireArguments(['gtfs_sncf', '--force', '--hors-ligne'])).toMatchObject({
      force: true,
      horsLigne: true,
    });
  });

  it('--help demande l’aide, même sans source', () => {
    expect(lireArguments(['--help'])).toEqual({ type: 'aide' });
  });

  it('refuse l’absence de source', () => {
    expect(lireArguments([])).toMatchObject({ type: 'erreur' });
  });

  it('refuse deux sources à la fois', () => {
    expect(lireArguments(['gares', 'osm'])).toMatchObject({ type: 'erreur' });
  });

  it('refuse une option inconnue', () => {
    expect(lireArguments(['gares', '--forcer'])).toMatchObject({ type: 'erreur' });
  });
});

describe('lireConfig', () => {
  const valides = {
    BDD_URL_ETL: 'postgres://etl_ecriture:x@localhost:5433/tourisme',
    DOSSIER_DONNEES: './data',
  };

  it('accepte des variables complètes', () => {
    expect(lireConfig(valides)).toEqual(valides);
  });

  it('refuse une variable manquante en la nommant', () => {
    expect(() => lireConfig({ DOSSIER_DONNEES: './data' })).toThrow(/BDD_URL_ETL/);
  });
});
