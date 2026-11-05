import { describe, expect, it } from 'vitest';
import {
  ecrireFiltres,
  lienAvecDepart,
  nombreFiltresLieux,
  FILTRES_PAR_DEFAUT,
  libelleDureeMax,
  libelleRayon,
  lireFiltres,
  nombreFiltres,
} from './filtres';

const url = (texte: string) => new URLSearchParams(texte);

describe('lireFiltres', () => {
  it('lit tous les filtres d’un lien', () => {
    expect(
      lireFiltres(
        url('date=2026-11-14&categories=nature,culture&rayon=5000&dureeMax=60&faisable=1'),
      ),
    ).toEqual({
      date: '2026-11-14',
      categories: ['nature', 'culture'],
      rayon: 5000,
      dureeMax: 60,
      faisable: true,
    });
  });

  it('sans paramètre, donne les valeurs par défaut', () => {
    expect(lireFiltres(url(''))).toEqual(FILTRES_PAR_DEFAUT);
  });

  it('un lien abîmé retombe sur le défaut, valeur par valeur', () => {
    const filtres = lireFiltres(
      url('date=hier&categories=nature,inconnue,nature&rayon=1234&dureeMax=45'),
    );
    expect(filtres).toEqual({ ...FILTRES_PAR_DEFAUT, categories: ['nature'] });
  });
});

describe('ecrireFiltres', () => {
  it('garde la gare et écrit les valeurs qui s’écartent du défaut', () => {
    const suite = ecrireFiltres(url('gare=87713040'), {
      ...FILTRES_PAR_DEFAUT,
      categories: ['parcs'],
      rayon: 1000,
    });
    expect(suite.toString()).toBe('gare=87713040&categories=parcs&rayon=1000');
  });

  it('retire de l’URL une valeur revenue au défaut', () => {
    expect(ecrireFiltres(url('rayon=5000&faisable=1'), FILTRES_PAR_DEFAUT).toString()).toBe('');
  });

  it('n’écrit jamais de position, même venue d’un ancien lien', () => {
    const suite = ecrireFiltres(url('lat=47.3&lon=5.0&gare=87713040'), FILTRES_PAR_DEFAUT);
    expect(suite.toString()).toBe('gare=87713040');
  });

  it('relire ce qui a été écrit redonne les mêmes filtres', () => {
    const filtres = { ...FILTRES_PAR_DEFAUT, date: '2026-07-15', dureeMax: 30, faisable: true };
    expect(lireFiltres(ecrireFiltres(url(''), filtres))).toEqual(filtres);
  });
});

describe('nombreFiltres', () => {
  it('ne compte rien par défaut, ni la date', () => {
    expect(nombreFiltres({ ...FILTRES_PAR_DEFAUT, date: '2026-11-14' })).toBe(0);
  });

  it('compte chaque catégorie et chaque écart', () => {
    expect(
      nombreFiltres({
        ...FILTRES_PAR_DEFAUT,
        categories: ['nature', 'parcs'],
        rayon: 1000,
        dureeMax: 60,
        faisable: true,
      }),
    ).toBe(5);
  });
});

describe('libellés', () => {
  it('écrit la durée en minutes sous une heure, en heures au-delà', () => {
    expect(libelleDureeMax(30)).toBe('30 min');
    expect(libelleDureeMax(60)).toBe('1 h');
    expect(libelleDureeMax(180)).toBe('3 h');
  });

  it('écrit le rayon en kilomètres', () => {
    expect(libelleRayon(2000)).toBe('2 km');
  });
});

describe('nombreFiltresLieux', () => {
  it('compte les catégories et la durée de train', () => {
    expect(nombreFiltresLieux(lireFiltres(url('categories=nature,culture&dureeMax=60')))).toBe(3);
  });
  it('ne compte ni le rayon ni « faisable », sans effet sur cet écran', () => {
    expect(nombreFiltresLieux(lireFiltres(url('rayon=5000&faisable=1')))).toBe(0);
  });
});

describe('lienAvecDepart', () => {
  it('garde la gare choisie et la date', () => {
    expect(lienAvecDepart('/lieux', url('gare=87713040&date=2026-11-18'))).toBe(
      '/lieux?gare=87713040&date=2026-11-18',
    );
  });
  it('ne garde ni les filtres ni une position arrivée par un ancien lien', () => {
    expect(lienAvecDepart('/lieux', url('categories=nature&lat=47.3&lon=5'))).toBe('/lieux');
  });
});
