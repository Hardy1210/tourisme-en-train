import { describe, expect, it } from 'vitest';
import { trancheTemps } from './tranche-temps';

// Bornes du dépôt : 30, 60, 120 (config/parametres.json).
describe('trancheTemps', () => {
  it.each([
    [29, '<30'],
    [30, '<60'],
    [59, '<60'],
    [60, '<120'],
    [119, '<120'],
    [120, '>=120'],
  ])('%i min → %s', (duree, attendu) => {
    expect(trancheTemps(duree)).toBe(attendu);
  });

  it('suit les bornes données (une région pourrait en avoir d’autres)', () => {
    expect(trancheTemps(44, [45, 90])).toBe('<45');
    expect(trancheTemps(45, [45, 90])).toBe('<90');
  });
});
