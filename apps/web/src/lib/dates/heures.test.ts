import { describe, expect, it } from 'vitest';
import { secondesVersHeure, trainParti } from './heures';

const s = (h: number, m: number, sec = 0) => h * 3600 + m * 60 + sec;

describe('secondesVersHeure', () => {
  it('25:10:00 → « 01:10 » le lendemain', () => {
    expect(secondesVersHeure(s(25, 10))).toEqual({ texte: '01:10', lendemain: true });
  });

  it('23:50:00 → « 23:50 » le jour même', () => {
    expect(secondesVersHeure(s(23, 50))).toEqual({ texte: '23:50', lendemain: false });
  });

  it('24:00:00 (minuit pile) → « 00:00 » le lendemain', () => {
    expect(secondesVersHeure(s(24, 0))).toEqual({ texte: '00:00', lendemain: true });
  });

  it('23:59:59 → « 23:59 » le jour même', () => {
    expect(secondesVersHeure(s(23, 59, 59))).toEqual({ texte: '23:59', lendemain: false });
  });

  it('refuse une valeur négative ou non entière', () => {
    expect(() => secondesVersHeure(-1)).toThrow(RangeError);
    expect(() => secondesVersHeure(1.5)).toThrow(RangeError);
  });
});

describe('trainParti', () => {
  const a = (dateDuJour: string, heureActuelleS: number) => ({ dateDuJour, heureActuelleS });
  // Une date d'hiver et une date d'été (CLAUDE.md § 3).
  for (const jour of ['2026-11-18', '2026-07-15']) {
    it(`à l'heure du départ, le train est encore là (${jour})`, () => {
      expect(trainParti(36_000, jour, a(jour, 36_000))).toBe(false);
    });
    it(`une seconde après le départ, il est parti (${jour})`, () => {
      expect(trainParti(36_000, jour, a(jour, 36_001))).toBe(true);
    });
  }
  it('après minuit, un train à « 24:45 » de la veille est encore à venir', () => {
    expect(trainParti(89_100, '2026-11-18', a('2026-11-19', 1_800))).toBe(false);
  });
  it('après minuit, un train de 23:00 de la veille est parti', () => {
    expect(trainParti(82_800, '2026-11-18', a('2026-11-19', 1_800))).toBe(true);
  });
  it('un train d’un jour futur n’est jamais parti', () => {
    expect(trainParti(3_600, '2026-11-20', a('2026-11-18', 80_000))).toBe(false);
  });
});
