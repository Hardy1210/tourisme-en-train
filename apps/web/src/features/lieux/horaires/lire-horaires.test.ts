import { describe, expect, it } from 'vitest';
import { lireHoraires } from './lire-horaires';

const HOTEL_DIEU =
  'Apr 01-Nov 15 09:00-19:30; Nov 16-Mar 31 09:00-12:00,14:00-18:30; Jan 01,Dec 25 14:00-18:30';

/** La ligne marquée « Aujourd'hui », ou null. */
function ligneDuJour(texte: string, date: string) {
  return lireHoraires(texte, date)?.find((l) => l.aujourdhui) ?? null;
}

describe('lireHoraires : traduction en lignes françaises', () => {
  it('traduit les saisons et les dates de l’Hôtel-Dieu (maquette)', () => {
    expect(lireHoraires(HOTEL_DIEU, '2026-07-01')).toEqual([
      { quand: '1er avr. – 15 nov.', heures: ['9 h – 19 h 30'], aujourdhui: true },
      { quand: '16 nov. – 31 mars', heures: ['9 h – 12 h', '14 h – 18 h 30'], aujourdhui: false },
      { quand: '1er janv., 25 déc.', heures: ['14 h – 18 h 30'], aujourdhui: false },
    ]);
  });
  it('traduit les jours de la semaine, une plage et une liste', () => {
    expect(
      lireHoraires('Mo-Sa 09:00-18:00; Su 14:00-18:00', '2026-11-20')?.map((l) => l.quand),
    ).toEqual(['Lun. – sam.', 'Dim.']);
    expect(lireHoraires('Mo,We-Su 10:00-18:00', '2026-11-20')?.[0]?.quand).toBe(
      'Lun., mer. – dim.',
    );
  });
  it('dit « Tous les jours » pour toute la semaine ou sans jour précisé', () => {
    expect(lireHoraires('Mo-Su 09:00-18:30', '2026-11-20')?.[0]?.quand).toBe('Tous les jours');
    expect(lireHoraires('08:30-12:30,15:30-20:00', '2026-11-20')?.[0]).toEqual({
      quand: 'Tous les jours',
      heures: ['8 h 30 – 12 h 30', '15 h 30 – 20 h'],
      aujourdhui: true,
    });
  });
  it('relie une saison et des jours par « · »', () => {
    expect(lireHoraires('Jul-Aug Mo-Su 10:00-18:00', '2026-11-20')?.[0]?.quand).toBe(
      'Juil. – août · tous les jours',
    );
  });
  it('traduit fermé, 24 h/24, jours fériés, soleil et commentaire', () => {
    expect(lireHoraires('24/7', '2026-11-20')?.[0]?.heures).toEqual(['24 h/24']);
    expect(lireHoraires('We-Mo 00:00-24:00', '2026-11-20')?.[0]?.heures).toEqual(['24 h/24']);
    expect(lireHoraires('Tu-Su 14:00-18:00; PH off', '2026-11-20')?.[1]).toMatchObject({
      quand: 'Jours fériés',
      heures: ['Fermé'],
    });
    expect(lireHoraires('Mo-Su 07:30-sunset', '2026-11-20')?.[0]?.heures).toEqual([
      '7 h 30 – coucher du soleil',
    ]);
    // Un commentaire seul ne dit pas si le lieu ouvre ce jour-là : pas de « Aujourd'hui ».
    expect(lireHoraires('"sur réservation"', '2026-11-20')).toEqual([
      { quand: null, heures: ['sur réservation'], aujourdhui: false },
    ]);
  });
  it('dit « Ouvert » pour une période sans heures', () => {
    expect(lireHoraires('Mar 30-Nov 10', '2026-11-20')?.[0]).toMatchObject({
      quand: '30 mars – 10 nov.',
      heures: ['Ouvert'],
    });
  });
  it('accepte « : » après une saison et des virgules suivies d’espaces', () => {
    expect(lireHoraires('Apr-Oct: Sa-Su 15:00-18:00', '2026-11-20')?.[0]?.quand).toBe(
      'Avr. – oct. · sam. – dim.',
    );
    expect(lireHoraires('Mo-Sa 10:00-13:00, 14:00-18:00', '2026-11-20')?.[0]?.heures).toEqual([
      '10 h – 13 h',
      '14 h – 18 h',
    ]);
  });
});

describe('lireHoraires : texte non compris → null (le texte d’origine reste affiché)', () => {
  it.each([
    'Juil-Aug: Su,PH 15:00-18:00',
    'May-Oct Su[1]',
    'week 35 Mo-Th 10:30-18:00',
    'Sep Su[4] -1 day 10:00-18:00',
    'Sa 09:00-14:00 off',
    '',
  ])('%s', (texte) => {
    expect(lireHoraires(texte, '2026-11-20')).toBeNull();
  });
});

describe('lireHoraires : « Aujourd’hui »', () => {
  it('marque la saison d’été jusqu’à son dernier jour inclus…', () => {
    expect(ligneDuJour(HOTEL_DIEU, '2026-11-15')?.quand).toBe('1er avr. – 15 nov.');
  });
  it('… et la saison d’hiver dès le lendemain, à cheval sur deux années', () => {
    expect(ligneDuJour(HOTEL_DIEU, '2026-11-16')?.quand).toBe('16 nov. – 31 mars');
    expect(ligneDuJour(HOTEL_DIEU, '2027-03-31')?.quand).toBe('16 nov. – 31 mars');
  });
  it('donne la règle écrite en dernier quand plusieurs s’appliquent (1er janvier)', () => {
    expect(ligneDuJour(HOTEL_DIEU, '2027-01-01')?.quand).toBe('1er janv., 25 déc.');
    expect(ligneDuJour(HOTEL_DIEU, '2027-01-02')?.quand).toBe('16 nov. – 31 mars');
  });
  it('suit le jour de la semaine (vendredi 20/11/2026), plage qui passe par dimanche comprise', () => {
    expect(ligneDuJour('Mo-Th 10:00-18:00; Fr 10:00-17:30', '2026-11-20')?.quand).toBe('Ven.');
    expect(ligneDuJour('We-Mo 10:00-17:30', '2026-11-22')?.quand).toBe('Mer. – lun.');
    expect(ligneDuJour('We-Mo 10:00-17:30', '2026-11-24')).toBeNull();
  });
  it('ne marque rien un jour sans règle (fermé ce jour-là)', () => {
    expect(ligneDuJour('Sa,Su 14:00-18:00', '2026-11-20')).toBeNull();
  });
  it('reconnaît un jour férié, fixe ou mobile (lundi de Pâques 2026 = 06/04)', () => {
    const texte = 'Tu-Su 10:00-18:00; PH off';
    expect(ligneDuJour(texte, '2026-11-11')?.quand).toBe('Jours fériés');
    expect(ligneDuJour(texte, '2026-04-06')?.quand).toBe('Jours fériés');
    expect(ligneDuJour(texte, '2026-04-07')?.quand).toBe('Mar. – dim.');
  });
  it('reconnaît l’Ascension et le lundi de Pentecôte 2027 (06/05 et 17/05)', () => {
    expect(ligneDuJour('Mo-Su 10:00-18:00; PH off', '2027-05-06')?.quand).toBe('Jours fériés');
    expect(ligneDuJour('Mo-Su 10:00-18:00; PH off', '2027-05-17')?.quand).toBe('Jours fériés');
    expect(ligneDuJour('Mo-Su 10:00-18:00; PH off', '2027-05-18')?.quand).toBe('Tous les jours');
  });
  it('ne marque rien quand les vacances scolaires peuvent décider (calendrier inconnu)', () => {
    const texte = '10:00-18:00; We off; SH We 10:00-18:00';
    expect(ligneDuJour(texte, '2026-11-18')).toBeNull();
    // Un jeudi, la règle des vacances (le mercredi seulement) ne joue pas : on sait.
    expect(ligneDuJour(texte, '2026-11-19')?.quand).toBe('Tous les jours');
  });
  it('ne marque rien avec une règle de secours « || » ou une règle ajoutée par « , »', () => {
    expect(ligneDuJour('Jul-Aug 14:00-18:00 || Su 14:00-18:00', '2026-11-22')).toBeNull();
    const ajoutee = 'Tu-Fr 10:00-12:30, 14:00-18:00, Sa-Su 10:00-18:00';
    expect(lireHoraires(ajoutee, '2026-11-20')?.map((l) => l.quand)).toEqual([
      'Mar. – ven.',
      'Sam. – dim.',
    ]);
    expect(ligneDuJour(ajoutee, '2026-11-20')).toBeNull();
  });
  it('tient compte de l’année quand elle est écrite', () => {
    const texte = '2026 Jul 28-2026 Aug 31';
    expect(lireHoraires(texte, '2026-08-01')?.[0]).toMatchObject({
      quand: '28 juil. 2026 – 31 août 2026',
      aujourdhui: true,
    });
    expect(ligneDuJour(texte, '2027-08-01')).toBeNull();
  });
});
