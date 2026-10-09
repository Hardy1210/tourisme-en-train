import { describe, expect, it } from 'vitest';
import { dateDuJour, maintenantParis } from './dates';

// Paris = UTC+1 en hiver, UTC+2 en été. Changement d'heure : nuit du 24 au 25/10/2026.
describe('dateDuJour (Paris)', () => {
  it('hiver : 23:30 UTC est déjà le lendemain à Paris', () => {
    expect(dateDuJour(new Date('2026-01-15T23:30:00Z'))).toBe('2026-01-16');
  });

  it('hiver : 22:30 UTC est encore le jour même à Paris', () => {
    expect(dateDuJour(new Date('2026-01-15T22:30:00Z'))).toBe('2026-01-15');
  });

  it('été : 22:30 UTC est déjà le lendemain à Paris', () => {
    expect(dateDuJour(new Date('2026-07-15T22:30:00Z'))).toBe('2026-07-16');
  });

  it('été : 21:30 UTC est encore le jour même à Paris', () => {
    expect(dateDuJour(new Date('2026-07-15T21:30:00Z'))).toBe('2026-07-15');
  });

  it("nuit du changement d'heure : 22:30 UTC le 24/10 est le 25/10 à Paris", () => {
    expect(dateDuJour(new Date('2026-10-24T22:30:00Z'))).toBe('2026-10-25');
  });
});

describe('maintenantParis', () => {
  it('hiver : 09:15:30 UTC → 10:15:30 à Paris', () => {
    expect(maintenantParis(new Date('2026-01-15T09:15:30Z'))).toEqual({
      dateDuJour: '2026-01-15',
      heureActuelleS: 10 * 3600 + 15 * 60 + 30,
    });
  });

  it('été : 09:15:30 UTC → 11:15:30 à Paris', () => {
    expect(maintenantParis(new Date('2026-07-15T09:15:30Z'))).toEqual({
      dateDuJour: '2026-07-15',
      heureActuelleS: 11 * 3600 + 15 * 60 + 30,
    });
  });

  it('minuit à Paris → 0 s et nouvelle date (jamais 24:00)', () => {
    expect(maintenantParis(new Date('2026-01-15T23:00:00Z'))).toEqual({
      dateDuJour: '2026-01-16',
      heureActuelleS: 0,
    });
  });

  it('une seconde avant minuit à Paris → 86 399 s et même date', () => {
    expect(maintenantParis(new Date('2026-01-15T22:59:59Z'))).toEqual({
      dateDuJour: '2026-01-15',
      heureActuelleS: 86_399,
    });
  });
});
