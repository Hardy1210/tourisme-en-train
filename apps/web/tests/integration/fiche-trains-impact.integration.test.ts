// Routes de la fiche destination sur l'échantillon (section E09 de db/echantillon/echantillon.sql) :
// /api/destinations/[uic], /api/trains, /api/impact, /api/mobilites/[uic]. D040, D051, D052.
import { beforeAll, describe, expect, it } from 'vitest';

import { schemaReponseDestinations } from '@/features/destinations/schemas';
import { schemaFicheDestination } from '@/features/destinations/schemas';
import { schemaImpact } from '@/features/impact/schemas';
import { schemaReponseMobilites } from '@/features/mobilites/schemas';
import { schemaReponseArretsTrain, schemaReponseTrains } from '@/features/trains/schemas';

import { appeler, erreurDe, type Route } from './outils-api';

const DIJON = 'EX000001';
const BEAUNE = 'EX000002';
const CHALON = 'EX000005';
const HIVER = '2026-11-18';

let fiche: Route;
let destinations: Route;
let trains: Route;
let arretsTrain: Route;
let impact: Route;
let mobilites: Route;
let serviceTrains: typeof import('@/features/trains/server/service');

beforeAll(async () => {
  fiche = await import('@/app/api/destinations/[uic]/route');
  destinations = await import('@/app/api/destinations/route');
  trains = await import('@/app/api/trains/route');
  arretsTrain = await import('@/app/api/trains/arrets/route');
  impact = await import('@/app/api/impact/route');
  mobilites = await import('@/app/api/mobilites/[uic]/route');
  serviceTrains = await import('@/features/trains/server/service');
});

describe('/api/destinations/[uic]', () => {
  const lire = async (uic: string, parametres = '') =>
    schemaFicheDestination.parse(
      (await appeler(fiche, `/api/destinations/${uic}?${parametres}`, { uic })).corps,
    );

  it('Beaune depuis Dijon : mêmes chiffres que la carte de destination (D051)', async () => {
    const enTete = await lire(BEAUNE, `depuis=${DIJON}&date=${HIVER}`);
    const carte = schemaReponseDestinations
      .parse((await appeler(destinations, `/api/destinations?gare=${DIJON}&date=${HIVER}`)).corps)
      .destinations.find((d) => d.gare.uic === BEAUNE);
    expect(enTete.liaison).toMatchObject({
      dureeMin: 22,
      nbTrains: 2,
      trancheTemps: '<=30',
      dernierRetour: { texte: '18:44' },
    });
    expect(enTete.liaison?.prixEstime).toEqual(carte?.prixEstime);
    expect(enTete.liaison?.co2EconomiseKg).toBe(carte?.co2EconomiseKg);
    expect(enTete.lieuxParCategorie).toEqual(carte?.lieuxParCategorie);
  });

  it('sans gare de départ : pas de liaison ; hors région : lieux non chargés', async () => {
    expect((await lire(BEAUNE)).liaison).toBeNull();
    expect(await lire('EX000021')).toMatchObject({
      lieuxCharges: false,
      lieuxParCategorie: {},
      gare: { titre: 'Paris', horsVille: false },
    });
  });

  it('gare TGV : titre = nom de la gare, commune dessous (D049)', async () => {
    expect((await lire('EX000025')).gare).toMatchObject({
      titre: 'Besançon Franche-Comté TGV',
      horsVille: true,
      commune: { nom: 'Les Auxons' },
    });
  });

  it('code UIC secondaire → même gare, code principal renvoyé (D039, D052)', async () => {
    expect((await lire('EX000095')).gare).toMatchObject({
      uic: 'EX000005',
      nom: 'Chalon-sur-Saône',
    });
  });

  it('code inconnu → 404 ; mal formé → 400', async () => {
    expect((await appeler(fiche, '/api/destinations/EX999999', { uic: 'EX999999' })).statut).toBe(
      404,
    );
    const mal = await appeler(fiche, '/api/destinations/712', { uic: '712' });
    expect(erreurDe(mal.corps).message).toBe('Le code UIC de la gare doit compter 8 chiffres.');
  });
});

describe('/api/trains/arrets', () => {
  const LYON = 'EX000010';
  const ETE = '2026-07-15';
  const uics = async (arrivee: string, parametres: string) => {
    const reponse = await appeler(
      arretsTrain,
      `/api/trains/arrets?depart=${DIJON}&arrivee=${arrivee}&${parametres}`,
    );
    expect(reponse.statut).toBe(200);
    return schemaReponseArretsTrain.parse(reponse.corps).arrets.map((a) => a.uic);
  };
  const OMNIBUS = [DIJON, BEAUNE, 'EX000005', 'EX000006', LYON];

  it.each([HIVER, ETE])('le train de 7 h : tous ses arrêts, dans l’ordre (%s)', async (date) => {
    expect(await uics(LYON, `date=${date}&depuis=06:00`)).toEqual(OMNIBUS);
  });

  it('après son départ : le train suivant, qui s’arrête moins', async () => {
    const arrets = await uics(LYON, `date=${HIVER}&depuis=07:01`);
    expect(arrets.length).toBeLessThan(OMNIBUS.length);
    expect(arrets[0]).toBe(DIJON);
    expect(arrets.at(-1)).toBe(LYON);
  });

  it('plus aucun train ce soir : le premier du jour, la ligne reste', async () => {
    expect(await uics(LYON, `date=${HIVER}&depuis=23:30`)).toEqual(OMNIBUS);
  });

  it('aucun train direct : aucun arrêt', async () => {
    expect(await uics(DIJON, `date=${HIVER}`)).toEqual([]);
  });

  it('gare inconnue : 404', async () => {
    const reponse = await appeler(
      arretsTrain,
      `/api/trains/arrets?depart=${DIJON}&arrivee=EX999999&date=${HIVER}`,
    );
    expect(reponse.statut).toBe(404);
  });
});

describe('/api/trains', () => {
  const lire = async (parametres: string) => {
    const reponse = await appeler(
      trains,
      `/api/trains?depart=${DIJON}&arrivee=${BEAUNE}&${parametres}`,
    );
    expect(reponse.statut).toBe(200);
    return schemaReponseTrains.parse(reponse.corps);
  };

  it('jumelage : deux trajets aux mêmes heures → un seul train, deux numéros (D040)', async () => {
    const { aller } = await lire(`date=${HIVER}`);
    expect(aller[0]).toMatchObject({
      trajetIds: ['ECH_T1', 'ECH_T26'],
      numeros: ['891001', '891099'],
      depart: { texte: '07:00', lendemain: false },
      dureeMin: 22,
    });
  });

  it('23:50 part le jour même, arrive « 00:15 » le lendemain (24:15:00)', async () => {
    const dernier = (await lire(`date=${HIVER}`)).aller.at(-1);
    expect(dernier?.depart).toEqual({ s: 85800, texte: '23:50', lendemain: false });
    expect(dernier?.arrivee).toEqual({ s: 87300, texte: '00:15', lendemain: true });
  });

  it('retours après l’arrivée du premier aller (07:22) : 07:10 écarté, 18:44 proposé (D051)', async () => {
    const reponse = await lire(`date=${HIVER}`);
    expect(reponse.aller[0]?.arrivee.texte).toBe('07:22');
    expect(reponse.retour.map((t) => t.depart.texte)).toEqual(['18:44']);
    expect(reponse.dernierRetour?.arrivee.texte).toBe('19:06');
  });

  it('depuis=08:00 : le train de 07:00 disparaît ; premier aller 23:50 (arrivée 00:15) → plus aucun retour utile, dernier retour indiqué', async () => {
    const reponse = await lire(`date=${HIVER}&depuis=08:00`);
    expect(reponse.aller.map((t) => t.depart.texte)).toEqual(['23:50']);
    expect(reponse.retour).toEqual([]);
    expect(reponse.dernierRetour?.depart.texte).toBe('18:44');
  });

  it('aujourd’hui à 07:30 (sans « depuis ») : à partir de l’heure actuelle', async () => {
    const reponse = await serviceTrains.trains(
      { depart: DIJON, arrivee: BEAUNE, date: undefined, depuis: undefined },
      { dateDuJour: HIVER, heureActuelleS: 27000 },
    );
    expect(reponse.aller.map((t) => t.depart.texte)).toEqual(['23:50']);
  });

  it('date d’été : mêmes trains (service ECH_SEMAINE) ; date hors fenêtre → 400', async () => {
    expect((await lire('date=2026-07-15')).aller).toHaveLength(2);
    const hors = await appeler(
      trains,
      `/api/trains?depart=${DIJON}&arrivee=${BEAUNE}&date=2027-01-15`,
    );
    expect(hors.statut).toBe(400);
  });

  it('heure mal écrite → 400 au message clair', async () => {
    const mal = await appeler(trains, `/api/trains?depart=${DIJON}&arrivee=${BEAUNE}&depuis=8h`);
    expect(erreurDe(mal.corps).message).toBe('L’heure doit être au format HH:MM.');
  });
});

describe('/api/trains : terminus dans la région (TER Mobigo, D082)', () => {
  const lire = async (depart: string, arrivee: string) => {
    const reponse = await appeler(
      trains,
      `/api/trains?depart=${depart}&arrivee=${arrivee}&date=${HIVER}`,
    );
    expect(reponse.statut).toBe(200);
    return schemaReponseTrains.parse(reponse.corps);
  };

  it('train entièrement dans la région (Dijon → Beaune, ECH_T4) → true', async () => {
    const dernier = (await lire(DIJON, BEAUNE)).aller.at(-1);
    expect(dernier).toMatchObject({ trajetIds: ['ECH_T4'], terminusEnRegion: true });
  });

  it('train qui sort de la région (Dijon → Lyon, pris jusqu’à Chalon) → false', async () => {
    const [premier] = (await lire(DIJON, CHALON)).aller;
    expect(premier).toMatchObject({ trajetIds: ['ECH_T1'], terminusEnRegion: false });
  });

  it('train qui entre dans la région (Lyon → Dijon, pris depuis Chalon) → false', async () => {
    const [premier] = (await lire(DIJON, CHALON)).retour;
    expect(premier).toMatchObject({ trajetIds: ['ECH_T2'], terminusEnRegion: false });
  });

  it('jumelage : un des trajets sort de la région → false pour le train réuni', async () => {
    const [premier] = (await lire(DIJON, BEAUNE)).aller;
    expect(premier).toMatchObject({
      trajetIds: ['ECH_T1', 'ECH_T26'],
      terminusEnRegion: false,
    });
  });
});

describe('/api/impact', () => {
  const lire = async (parametres: string) => {
    const reponse = await appeler(impact, `/api/impact?${parametres}`);
    expect(reponse.statut).toBe(200);
    return schemaImpact.parse(reponse.corps);
  };

  it('Dijon → Lyon (TER et TGV) : type le moins favorable (TER) par défaut ; TGV demandé : moins', async () => {
    const parDefaut = await lire(`depart=${DIJON}&arrivee=EX000010`);
    const tgv = await lire(`depart=${DIJON}&arrivee=EX000010&type=TGV`);
    expect(parDefaut.co2Kg.train).toBeGreaterThan(tgv.co2Kg.train ?? Infinity);
    expect(parDefaut).toMatchObject({
      source: 'ADEME — Impact CO2',
      dateReleve: '2026-11-03',
      trajet: { co2: 'aller-retour', prix: 'aller-simple' },
    });
  });

  it('avion seulement au-delà de 300 km : Dijon → Paris oui, Dijon → Beaune non', async () => {
    expect((await lire(`depart=${DIJON}&arrivee=EX000021`)).co2Kg.avion).not.toBeNull();
    expect((await lire(`depart=${DIJON}&arrivee=${BEAUNE}`)).co2Kg.avion).toBeNull();
  });

  it('aucune liaison directe (Beaune → Chalon) → 404 ; type inconnu → 400', async () => {
    const sans = await appeler(impact, `/api/impact?depart=${BEAUNE}&arrivee=EX000005`);
    expect(erreurDe(sans.corps)).toEqual({
      code: 'INTROUVABLE',
      message: 'Aucun train direct ne relie ces deux gares.',
    });
    expect(
      (await appeler(impact, `/api/impact?depart=${DIJON}&arrivee=${BEAUNE}&type=AVION`)).statut,
    ).toBe(400);
  });
});

describe('/api/mobilites/[uic]', () => {
  it('Dijon-Ville : triés par type puis distance, durée de marche depuis la distance à pied', async () => {
    const reponse = await appeler(mobilites, `/api/mobilites/${DIJON}`, { uic: DIJON });
    const { mobilites: liste } = schemaReponseMobilites.parse(reponse.corps);
    expect(liste.map((m) => m.type)).toEqual(['BUS', 'TRAM', 'VELO']);
    expect(liste[0]).toMatchObject({ distanceM: 450, dureeMarcheMin: 6, lignes: ['L3'] });
    expect(liste.find((m) => m.type === 'VELO')?.lignes).toEqual([]);
  });

  it('gare sans transport : liste vide ; gare inconnue : 404', async () => {
    const beaune = await appeler(mobilites, `/api/mobilites/${BEAUNE}`, { uic: BEAUNE });
    expect(schemaReponseMobilites.parse(beaune.corps).mobilites).toEqual([]);
    expect((await appeler(mobilites, '/api/mobilites/EX999999', { uic: 'EX999999' })).statut).toBe(
      404,
    );
  });
});
