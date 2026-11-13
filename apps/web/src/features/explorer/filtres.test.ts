import { describe, expect, it } from 'vitest';
import {
  ecrireFiltres,
  filtresDeLUrl,
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
      recherche: '',
      destination: null,
    });
  });

  it('lit la recherche de destination : texte tapé, ou destination touchée (D084)', () => {
    expect(lireFiltres(url('recherche=%20beau%20'))).toMatchObject({
      recherche: 'beau',
      destination: null,
    });
    expect(lireFiltres(url('recherche=Beaune&destination=87713545'))).toMatchObject({
      recherche: 'Beaune',
      destination: '87713545',
    });
  });

  it('destination au code abîmé, ou sans son nom → ignorée', () => {
    expect(lireFiltres(url('recherche=Beaune&destination=8771'))).toMatchObject({
      recherche: 'Beaune',
      destination: null,
    });
    expect(lireFiltres(url('destination=87713545'))).toMatchObject({ destination: null });
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

  it('écrit la recherche, et l’efface quand elle est vide (D084)', () => {
    const avec = { ...FILTRES_PAR_DEFAUT, recherche: 'Beaune', destination: '87713545' };
    expect(ecrireFiltres(url('gare=87713040'), avec).toString()).toBe(
      'gare=87713040&recherche=Beaune&destination=87713545',
    );
    expect(
      ecrireFiltres(url('recherche=beau&destination=87713545'), FILTRES_PAR_DEFAUT).toString(),
    ).toBe('');
  });

  it('relire ce qui a été écrit redonne les mêmes filtres', () => {
    const filtres = { ...FILTRES_PAR_DEFAUT, date: '2026-07-15', dureeMax: 30, faisable: true };
    expect(lireFiltres(ecrireFiltres(url(''), filtres))).toEqual(filtres);
  });
});

describe('nombreFiltres', () => {
  it('destination choisie : ne compte que les catégories et la date, pas les filtres cachés', () => {
    const filtres = {
      ...FILTRES_PAR_DEFAUT,
      categories: ['enfants' as const],
      rayon: 5000,
      dureeMax: 30,
      faisable: true,
      date: '2026-11-14',
    };
    expect(nombreFiltres(filtres, '2026-11-12')).toBe(5);
    expect(
      nombreFiltres({ ...filtres, recherche: 'Beaune', destination: '87713545' }, '2026-11-12'),
    ).toBe(2);
  });

  it('ne compte rien par défaut', () => {
    expect(nombreFiltres(FILTRES_PAR_DEFAUT, '2026-11-12')).toBe(0);
  });

  it('compte la date quand ce n’est pas aujourd’hui (elle vit dans « Filtres »)', () => {
    expect(nombreFiltres({ ...FILTRES_PAR_DEFAUT, date: '2026-11-14' }, '2026-11-12')).toBe(1);
  });

  it('ne compte pas la date d’aujourd’hui écrite dans l’adresse', () => {
    expect(nombreFiltres({ ...FILTRES_PAR_DEFAUT, date: '2026-11-12' }, '2026-11-12')).toBe(0);
  });

  it('ne compte pas la recherche de destination, montrée dans la barre du trajet', () => {
    expect(nombreFiltres({ ...FILTRES_PAR_DEFAUT, recherche: 'beau' })).toBe(0);
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
    expect(libelleRayon(1500)).toBe('1,5 km');
  });
});

describe('nombreFiltresLieux', () => {
  it('compte les catégories et la durée de train', () => {
    expect(nombreFiltresLieux(lireFiltres(url('categories=nature,culture&dureeMax=60')))).toBe(3);
  });
  it('ne compte ni le rayon ni « faisable », sans effet sur cet écran', () => {
    expect(nombreFiltresLieux(lireFiltres(url('rayon=5000&faisable=1')))).toBe(0);
  });
  it('compte la date quand ce n’est pas aujourd’hui', () => {
    expect(nombreFiltresLieux(lireFiltres(url('date=2026-11-14')), '2026-11-12')).toBe(1);
    expect(nombreFiltresLieux(lireFiltres(url('date=2026-11-12')), '2026-11-12')).toBe(0);
  });
});

describe('lienAvecDepart', () => {
  it('garde la gare choisie et la date', () => {
    expect(lienAvecDepart('/lieux', url('gare=87713040&date=2026-11-18'))).toBe(
      '/lieux?gare=87713040&date=2026-11-18',
    );
  });
  it('rend à l’écran ses propres filtres', () => {
    expect(lienAvecDepart('/', url('date=2026-11-18'), 'categories=nature&dureeMax=60')).toBe(
      '/?date=2026-11-18&categories=nature&dureeMax=60',
    );
  });
  it('ne donne pas à un écran les filtres de celui qu’on quitte', () => {
    expect(lienAvecDepart('/lieux', url('categories=nature&rayon=5000'))).toBe('/lieux');
  });
  it('ne garde jamais une position arrivée par un ancien lien', () => {
    expect(lienAvecDepart('/lieux', url('lat=47.3&lon=5'))).toBe('/lieux');
  });
});

describe('filtresDeLUrl', () => {
  it('garde les filtres', () => {
    expect(filtresDeLUrl(url('categories=nature&faisable=1'))).toBe('categories=nature&faisable=1');
  });
  it('garde la recherche de destination au retour sur Explorer (D070, D084)', () => {
    expect(filtresDeLUrl(url('gare=A&recherche=Beaune&destination=87713545'))).toBe(
      'recherche=Beaune&destination=87713545',
    );
  });
  it('écarte la gare, la date et toute position', () => {
    expect(filtresDeLUrl(url('gare=A&date=2026-11-18&lat=47.3&lon=5'))).toBe('');
  });
});
