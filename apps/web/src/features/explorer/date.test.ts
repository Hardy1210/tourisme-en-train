import { describe, expect, it } from 'vitest';
import { dateChoisie, joursDuWeekEnd, libelleDate, optionsDate, suffixeDate } from './date';

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

describe('joursDuWeekEnd', () => {
  // Mercredi 18/11/2026 (hiver) et mercredi 15/07/2026 (été).
  it('donne le samedi et le dimanche quand la date est dans le week-end', () => {
    expect(joursDuWeekEnd('2026-11-22', '2026-11-18')).toEqual({
      samedi: '2026-11-21',
      dimanche: '2026-11-22',
    });
    expect(joursDuWeekEnd('2026-07-18', '2026-07-15')).toEqual({
      samedi: '2026-07-18',
      dimanche: '2026-07-19',
    });
  });
  it('ne donne rien pour une autre date, ni pour aujourd’hui en semaine', () => {
    expect(joursDuWeekEnd('2026-11-20', '2026-11-18')).toBeNull();
    expect(joursDuWeekEnd(null, '2026-11-18')).toBeNull();
  });
  it('ne donne rien un dimanche', () => {
    expect(joursDuWeekEnd('2026-11-22', '2026-11-22')).toBeNull();
  });
});

// Mercredi 4 novembre 2026 : demain = jeudi 5, week-end = samedi 7.
describe('dateChoisie', () => {
  it('faux pour aujourd’hui, qu’il soit absent ou écrit', () => {
    expect(dateChoisie(null, '2026-11-04')).toBe(false);
    expect(dateChoisie('2026-11-04', '2026-11-04')).toBe(false);
  });
  it('vrai pour toute autre date', () => {
    expect(dateChoisie('2026-11-05', '2026-11-04')).toBe(true);
  });
});

describe('suffixeDate et libellé de la pastille', () => {
  it.each([
    [null, '', "Aujourd'hui"],
    ['2026-11-05', ' · demain', 'Demain'],
    ['2026-11-07', ' · ce week-end', 'Ce week-end'],
    ['2026-11-14', ' · sam. 14 nov.', 'Sam. 14 nov.'],
  ])('%s : titre « …%s », pastille « %s »', (date, suffixe, pastille) => {
    expect(suffixeDate(date, '2026-11-04')).toBe(suffixe);
    expect(libelleDate(date, '2026-11-04')).toBe(pastille);
  });
});
