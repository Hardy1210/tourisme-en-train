import { describe, expect, it } from 'vitest';
import { trancheTemps } from './tranche-temps';

// Bornes du dépôt : 30, 60, 90 (config/parametres.json).
describe('trancheTemps', () => {
  it.each([
    [30, '<=30'],
    [31, '<=60'],
    [60, '<=60'],
    [61, '<=90'],
    [90, '<=90'],
    [91, '>90'],
  ])('%i min → %s', (duree, attendu) => {
    expect(trancheTemps(duree)).toBe(attendu);
  });

  it('donne une couleur à Paris (94 min depuis Dijon) et jusqu’à la limite de 3 h', () => {
    expect(trancheTemps(94)).toBe('>90');
    expect(trancheTemps(180)).toBe('>90');
  });

  it('suit les bornes données (une région pourrait en avoir d’autres)', () => {
    expect(trancheTemps(45, [45, 90])).toBe('<=45');
    expect(trancheTemps(46, [45, 90])).toBe('<=90');
  });
});
