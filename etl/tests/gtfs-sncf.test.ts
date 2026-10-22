import { describe, expect, it } from 'vitest';
import { estAJour } from '../src/sources/gtfs-sncf';

const base = {
  empreinte: 'abc',
  empreinteConnue: 'abc',
  dateDernierChargement: '2026-10-22',
  dateDuJour: '2026-10-22',
  force: false,
};

describe('estAJour (IGNORE du GTFS)', () => {
  it('même fichier, déjà chargé aujourd’hui → à jour (IGNORE)', () => {
    expect(estAJour(base)).toBe(true);
  });
  it('même fichier, chargé hier → à recharger (la fenêtre a avancé)', () => {
    expect(estAJour({ ...base, dateDernierChargement: '2026-10-21' })).toBe(false);
  });
  it('fichier changé aujourd’hui → à recharger', () => {
    expect(estAJour({ ...base, empreinte: 'def' })).toBe(false);
  });
  it('jamais chargé → à charger', () => {
    expect(estAJour({ ...base, empreinteConnue: null, dateDernierChargement: null })).toBe(false);
  });
  it('--force → toujours rechargé', () => {
    expect(estAJour({ ...base, force: true })).toBe(false);
  });
});
