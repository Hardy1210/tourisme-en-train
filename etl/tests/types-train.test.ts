import { describe, expect, it } from 'vitest';
import { parametresSql, typeDuMode } from '../src/regles/types-train';

describe('typeDuMode (règle validée le 22/10, D036)', () => {
  it.each([
    ['Train TER', 'TER'],
    ['TramTrain', 'TER'],
    ['TGV INOUI', 'TGV'],
    ['OUIGO', 'TGV'],
    ['Lyria', 'TGV'],
    ['ICE', 'TGV'],
    ['INTERCITES', 'INTERCITES'],
    ['INTERCITES de nuit', 'INTERCITES'],
  ])('%s → %s', (mode, type) => {
    expect(typeDuMode(mode)).toBe(type);
  });

  it('mode inconnu (Paris–Bruxelles « Train ») → AUTRE', () => {
    expect(typeDuMode('Train')).toBe('AUTRE');
  });

  it.each(['Car TER', 'Car à réservation', 'Navette'])('%s → exclu', (mode) => {
    expect(typeDuMode(mode)).toBeNull();
  });

  it('la casse compte : « train ter » n’est pas reconnu', () => {
    expect(typeDuMode('train ter')).toBe('AUTRE');
  });
});

describe('parametresSql', () => {
  it('chaque mode connu apparaît dans une seule liste', () => {
    const { modesTer, modesTgv, modesIntercites, modesExclus } = parametresSql();
    const tous = [...modesTer, ...modesTgv, ...modesIntercites, ...modesExclus];
    expect(new Set(tous).size).toBe(tous.length);
    expect(modesTer).toEqual(['Train TER', 'TramTrain']);
    expect(modesExclus).toContain('Car TER');
  });
});
