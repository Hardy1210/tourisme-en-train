// /api/lieux (onglet Lieux, D056) sur l'échantillon : section E11 de db/echantillon/echantillon.sql.
import { beforeAll, describe, expect, it } from 'vitest';

import { schemaReponseAutour, schemaReponseLieuxAccessibles } from '@/features/lieux/schemas';

import { appeler, erreurDe, type Route } from './outils-api';

let route: Route;
let autour: Route;
let lieuxGare: Route;
let fiche: Route;
const DIJON = 'EX000001';
const PORTE_NEUVE = 'EX000023';
const HIVER = '2026-11-18';
const ETE = '2026-07-15';

async function lire(gare: string, suite = '', date = HIVER) {
  const reponse = await appeler(route, `/api/lieux?gare=${gare}&date=${date}${suite}`);
  expect(reponse.statut).toBe(200);
  return schemaReponseLieuxAccessibles.parse(reponse.corps);
}
const cle = (identifiant: string) => `echantillon-${identifiant}`;

beforeAll(async () => {
  route = await import('@/app/api/lieux/route');
  autour = await import('@/app/api/autour/route');
  lieuxGare = await import('@/app/api/destinations/[uic]/lieux/route');
  fiche = await import('@/app/api/lieux/[cle]/route');
});

describe('/api/lieux', () => {
  it('donne la gare, le train et la marche de chaque lieu, avec un cache d’une heure', async () => {
    const reponse = await appeler(route, `/api/lieux?gare=${DIJON}&date=${HIVER}`);
    expect(reponse.cache).toBe('public, max-age=3600');
    const { lieux } = schemaReponseLieuxAccessibles.parse(reponse.corps);
    expect(lieux.find((l) => l.cle === cle('ECH_L15'))).toMatchObject({
      nom: 'Exemple - Aire de jeux des remparts',
      gare: { uic: 'EX000002', nom: 'Beaune' },
      dureeTrainMin: 22,
    });
  });

  it('trie par temps total, train et marche', async () => {
    const { lieux } = await lire(DIJON);
    const temps = lieux.map((l) => l.dureeTrainMin + l.dureeMarcheMin);
    expect(lieux.length).toBeGreaterThan(1);
    expect(temps).toEqual([...temps].sort((a, b) => a - b));
  });

  it('affiche une seule fois un lieu proche de deux gares, par la plus rapide au total', async () => {
    const { lieux } = await lire(DIJON);
    const trouves = lieux.filter((l) => l.cle === cle('ECH_L40'));
    expect(trouves).toHaveLength(1);
    // Chalon : 40 + 19 min, malgré une marche plus longue ; l'autre gare : 70 + 1 min.
    expect(trouves[0]).toMatchObject({ gare: { uic: 'EX000005' }, dureeMarcheMin: 19 });
  });

  it('écarte les lieux à pied de la gare de départ', async () => {
    const cles = (await lire(PORTE_NEUVE)).lieux.map((l) => l.cle);
    expect(cles).toContain(cle('ECH_L27'));
    expect(cles).not.toContain(cle('ECH_L41'));
  });

  it('écarte les gares de la commune de départ, pas les autres', async () => {
    const cles = (await lire(PORTE_NEUVE)).lieux.map((l) => l.cle);
    expect(cles).toContain(cle('ECH_L11')); // Beaune
    expect(cles).not.toContain(cle('ECH_L01')); // Dijon-Ville, même commune que Porte-Neuve
  });

  it('applique la durée maximale, limite comprise', async () => {
    const trente = (await lire(DIJON, '&dureeMax=30', ETE)).lieux.map((l) => l.cle);
    expect(trente).toContain(cle('ECH_L24')); // Dole : 30 min
    expect(trente).not.toContain(cle('ECH_L20')); // Besançon : 60 min
  });

  it('dépend de la date : pas de lieu sans train ce jour-là', async () => {
    expect((await lire(DIJON)).lieux.map((l) => l.cle)).not.toContain(cle('ECH_L24'));
  });

  it('filtre par catégorie', async () => {
    const { lieux } = await lire(DIJON, '&categories=culture');
    expect(lieux.length).toBeGreaterThan(0);
    expect(lieux.every((l) => l.categorie === 'culture')).toBe(true);
  });

  it('garde le total au-delà de la dernière page, sans page suivante', async () => {
    const { total } = await lire(DIJON);
    const loin = await lire(DIJON, '&page=99');
    expect(loin).toMatchObject({ lieux: [], total, pageSuivante: null });
  });

  // Piscines et centres aquatiques ne sont plus chargés en base (D091) : rien à retirer ici.
  it('retire de l’onglet les aires de jeux sans nom propre, garde les aires nommées', async () => {
    const cles = (await lire(DIJON)).lieux.map((l) => l.cle);
    expect(cles).not.toContain(cle('ECH_L44'));
    expect(cles).toContain(cle('ECH_L45'));
  });

  it('garde ces lieux dans « À deux pas de vous », sans la fiche de ville', async () => {
    const reponse = await appeler(autour, '/api/autour?lat=46.3&lon=6.9');
    const cles = schemaReponseAutour.parse(reponse.corps).lieux.map((l) => l.cle);
    expect(cles).toEqual(expect.arrayContaining([cle('ECH_L44'), cle('ECH_L45')]));
    expect(cles).not.toContain(cle('ECH_L42'));
  });

  // Le point est ≈ 890 m au nord des lieux : 1 157 m à pied, dans le rayon de 2 km, au-delà des 1 000 m
  // des aires de jeux (D091). Le parc animalier, au même endroit qu'elles, sert de témoin.
  it('« Près de vous » : aires de jeux à 1 km au plus, les autres lieux suivent le rayon', async () => {
    const reponse = await appeler(autour, '/api/autour?lat=46.308&lon=6.9&rayon=2000');
    const cles = schemaReponseAutour.parse(reponse.corps).lieux.map((l) => l.cle);
    expect(cles).toContain(cle('ECH_L47'));
    expect(cles).not.toContain(cle('ECH_L44'));
    expect(cles).not.toContain(cle('ECH_L45'));
  });

  it('garde ces lieux sur la fiche destination', async () => {
    const reponse = await appeler(lieuxGare, '/api/destinations/EX000005/lieux', {
      uic: 'EX000005',
    });
    const cles = schemaReponseAutour.parse(reponse.corps).lieux.map((l) => l.cle);
    expect(cles).toEqual(expect.arrayContaining([cle('ECH_L44'), cle('ECH_L45')]));
  });

  it('garde une fiche de ville accessible par son lien, sans la lister', async () => {
    const directe = await appeler(fiche, `/api/lieux/${cle('ECH_L42')}`, { cle: cle('ECH_L42') });
    expect(directe.statut).toBe(200);
    const cles = (await lire(DIJON)).lieux.map((l) => l.cle);
    expect(cles).not.toContain(cle('ECH_L42'));
  });

  it('un lieu de catégorie secondaire apparaît aussi sous cette envie, et sous sa catégorie', async () => {
    const enfants = (await lire(DIJON, '&categories=enfants')).lieux;
    expect(enfants.find((l) => l.cle === cle('ECH_L47'))).toMatchObject({ categorie: 'nature' });
    const nature = (await lire(DIJON, '&categories=nature')).lieux.map((l) => l.cle);
    expect(nature).toContain(cle('ECH_L47'));
  });

  it('un lieu sans catégorie secondaire n’apparaît pas sous cette envie', async () => {
    const enfants = (await lire(DIJON, '&categories=enfants')).lieux.map((l) => l.cle);
    expect(enfants).not.toContain(cle('ECH_L48'));
  });

  it('sans filtre, il n’apparaît qu’une fois', async () => {
    const { lieux, total } = await lire(DIJON);
    expect(lieux.filter((l) => l.cle === cle('ECH_L47'))).toHaveLength(1);
    expect(new Set(lieux.map((l) => l.cle)).size).toBe(total);
  });

  it.each([
    ['une date hors des horaires', `gare=${DIJON}&date=2020-01-01`, 400],
    ['une page invalide', `gare=${DIJON}&page=0`, 400],
    ['une durée hors des options', `gare=${DIJON}&dureeMax=45`, 400],
    ['une gare manquante', '', 400],
    ['une gare inconnue', `gare=ZZ000000&date=${HIVER}`, 404],
  ])('refuse %s', async (_cas, requete, statut) => {
    const reponse = await appeler(route, `/api/lieux?${requete}`);
    expect(reponse.statut).toBe(statut);
    expect(erreurDe(reponse.corps).message).not.toBe('');
  });
});
