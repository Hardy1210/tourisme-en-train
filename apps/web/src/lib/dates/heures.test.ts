import { describe, expect, it } from 'vitest';
import { secondesVersHeure } from './heures';

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
