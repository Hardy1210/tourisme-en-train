import { describe, expect, it } from 'vitest';
import { libelleDate, optionsDate } from './date';

const parCle = (jour: string, cle: string) => optionsDate(jour).find((o) => o.cle === cle);

describe('optionsDate', () => {
  it('un mercredi : demain, puis le samedi et le dimanche suivants', () => {
    expect(parCle('2026-11-04', 'demain')).toMatchObject({
      date: '2026-11-05',
      detail: 'Jeu. 5 nov.',
    });
    expect(parCle('2026-11-04', 'weekend')).toMatchObject({
      date: '2026-11-07',
      detail: 'Sam. 7 nov. – dim. 8 nov.',
    });
  });

  it('un dimanche : le week-end se réduit à ce jour', () => {
    expect(parCle('2026-11-08', 'weekend')).toMatchObject({
      date: '2026-11-08',
      detail: 'Dim. 8 nov.',
    });
  });

  it('fonctionne aussi en été, autour d’un changement de mois', () => {
    expect(parCle('2026-07-31', 'demain')).toMatchObject({
      date: '2026-08-01',
      detail: 'Sam. 1er août',
    });
  });
});

describe('libelleDate', () => {
  const JOUR = '2026-11-04';

  it('reconnaît les options', () => {
    expect(libelleDate(null, JOUR)).toBe("Aujourd'hui");
    expect(libelleDate(JOUR, JOUR)).toBe("Aujourd'hui");
    expect(libelleDate('2026-11-05', JOUR)).toBe('Demain');
    expect(libelleDate('2026-11-07', JOUR)).toBe('Ce week-end');
  });

  it('écrit toute autre date', () => {
    expect(libelleDate('2026-11-17', JOUR)).toBe('Mar. 17 nov.');
  });
});
