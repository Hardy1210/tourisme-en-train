// /api/lieux/rangees (onglet Lieux en rangées, D121) sur l'échantillon : section E11 de
// db/echantillon/echantillon.sql (données d'exemple). Mêmes lieux que /api/lieux, rangés par gare.
import { beforeAll, describe, expect, it } from 'vitest';

import { parametres } from '@/config/parametres';
import { schemaReponseLieuxAccessibles, schemaReponseRangeesLieux } from '@/features/lieux/schemas';

import { appeler, erreurDe, type Route } from './outils-api';

let route: Route;
let liste: Route;
const DIJON = 'EX000001';
const BEAUNE = 'EX000002';
const CHALON = 'EX000005';
const PORTE_NEUVE = 'EX000023';
const HIVER = '2026-11-18';
const ETE = '2026-07-15';

async function lire(gare: string, suite = '', date = HIVER) {
  const reponse = await appeler(route, `/api/lieux/rangees?gare=${gare}&date=${date}${suite}`);
  expect(reponse.statut).toBe(200);
  return schemaReponseRangeesLieux.parse(reponse.corps);
}
const cle = (identifiant: string) => `echantillon-${identifiant}`;
const cles = (reponse: Awaited<ReturnType<typeof lire>>) =>
  reponse.rangees.flatMap((r) => r.lieux.map((l) => l.cle));
const rangeeDe = (reponse: Awaited<ReturnType<typeof lire>>, uic: string) =>
  reponse.rangees.find((r) => r.gare.uic === uic);

/** Change une limite le temps d'un test (l'échantillon a peu de lieux par gare). */
async function avecLimites<T>(
  limites: Partial<Pick<typeof parametres.limites, 'lieuxParRangee' | 'rangeesParPage'>>,
  test: () => Promise<T>,
): Promise<T> {
  const avant = { ...parametres.limites };
  Object.assign(parametres.limites, limites);
  try {
    return await test();
  } finally {
    Object.assign(parametres.limites, avant);
  }
}

beforeAll(async () => {
  route = await import('@/app/api/lieux/rangees/route');
  liste = await import('@/app/api/lieux/route');
});

describe('/api/lieux/rangees', () => {
  it('une rangée par gare, la plus courte en train d’abord, avec un cache d’une heure', async () => {
    const reponse = await appeler(route, `/api/lieux/rangees?gare=${DIJON}&date=${HIVER}`);
    expect(reponse.cache).toBe('public, max-age=3600');
    const { rangees } = schemaReponseRangeesLieux.parse(reponse.corps);
    expect(rangees.length).toBeGreaterThan(1);
    expect(rangees.every((r) => r.type === 'gare')).toBe(true);
    const durees = rangees.map((r) => r.dureeTrainMin);
    expect(durees).toEqual([...durees].sort((a, b) => a - b));
    expect(new Set(rangees.map((r) => r.gare.uic)).size).toBe(rangees.length);
    expect(rangees.find((r) => r.gare.uic === BEAUNE)).toMatchObject({
      gare: { uic: BEAUNE, nom: 'Beaune' },
      dureeTrainMin: 22,
    });
  });

  it('au plus `lieuxParRangee` lieux par rangée ; une rangée plus courte les montre tous', async () => {
    const complet = await lire(DIJON);
    const grande = complet.rangees.find((r) => r.total >= 3);
    const petite = complet.rangees.find((r) => r.total === 1);
    expect(grande).toBeDefined();
    expect(petite).toBeDefined();
    await avecLimites({ lieuxParRangee: 2 }, async () => {
      const limite = await lire(DIJON);
      expect(rangeeDe(limite, grande!.gare.uic)).toMatchObject({ total: grande!.total });
      expect(rangeeDe(limite, grande!.gare.uic)?.lieux).toHaveLength(2);
      expect(rangeeDe(limite, petite!.gare.uic)?.lieux).toHaveLength(1);
    });
    for (const r of complet.rangees)
      expect(r.lieux).toHaveLength(Math.min(r.total, parametres.limites.lieuxParRangee));
  });

  it('dans une rangée : les lieux avec photo d’abord, puis la marche la plus courte (D104)', async () => {
    for (const { lieux } of (await lire(DIJON)).rangees) {
      const marche = (avecPhoto: boolean) =>
        lieux.filter((l) => (l.photo !== null) === avecPhoto).map((l) => l.dureeMarcheMin);
      expect(lieux.map((l) => l.dureeMarcheMin)).toEqual([
        ...marche(true).sort((a, b) => a - b),
        ...marche(false).sort((a, b) => a - b),
      ]);
    }
  });

  it('un lieu à pied de deux gares est dans les deux rangées, et compté une fois au total', async () => {
    const reponse = await lire(DIJON);
    const avecLeLieu = reponse.rangees.filter((r) => r.lieux.some((l) => l.cle === cle('ECH_L40')));
    expect(avecLeLieu.length).toBe(2);
    expect(avecLeLieu.map((r) => r.gare.uic)).toContain(CHALON);
    // Même total que la liste à plat, où chaque lieu n'apparaît qu'une fois.
    const aPlat = await appeler(liste, `/api/lieux?gare=${DIJON}&date=${HIVER}`);
    expect(reponse.total).toBe(schemaReponseLieuxAccessibles.parse(aPlat.corps).total);
  });

  it('écarte la gare de départ et les gares de sa commune, pas les autres', async () => {
    const reponse = await lire(PORTE_NEUVE);
    expect(rangeeDe(reponse, DIJON)).toBeUndefined(); // même commune que Porte-Neuve
    expect(rangeeDe(reponse, BEAUNE)).toBeDefined();
    expect(cles(reponse)).toContain(cle('ECH_L11'));
    expect(cles(reponse)).not.toContain(cle('ECH_L41')); // à pied de la gare de départ
  });

  it('applique la durée maximale, limite comprise', async () => {
    const trente = cles(await lire(DIJON, '&dureeMax=30', ETE));
    expect(trente).toContain(cle('ECH_L24')); // Dole : 30 min
    expect(trente).not.toContain(cle('ECH_L20')); // Besançon : 60 min
  });

  it('dépend de la date : pas de rangée sans train ce jour-là', async () => {
    expect(cles(await lire(DIJON))).not.toContain(cle('ECH_L24'));
  });

  it('filtre par catégorie : seulement ces lieux, et des rangées qui en ont', async () => {
    const { rangees } = await lire(DIJON, '&categories=culture');
    expect(rangees.length).toBeGreaterThan(0);
    for (const r of rangees) {
      expect(r.total).toBeGreaterThan(0);
      expect(r.lieux.every((l) => l.categorie === 'culture')).toBe(true);
    }
  });

  it('garde les mêmes exclusions que la liste : aires sans nom propre, fiche de ville', async () => {
    const tous = cles(await lire(DIJON));
    expect(tous).not.toContain(cle('ECH_L44'));
    expect(tous).toContain(cle('ECH_L45'));
    expect(tous).not.toContain(cle('ECH_L42'));
  });

  it('page par page : la suite des rangées, sans doublon, puis plus de page suivante', async () => {
    await avecLimites({ rangeesParPage: 2 }, async () => {
      const premiere = await lire(DIJON);
      expect(premiere.rangees).toHaveLength(2);
      expect(premiere.pageSuivante).toBe(2);
      const deuxieme = await lire(DIJON, '&page=2');
      expect(deuxieme.rangees[0]!.dureeTrainMin).toBeGreaterThanOrEqual(
        premiere.rangees[1]!.dureeTrainMin,
      );
      const uics = [...premiere.rangees, ...deuxieme.rangees].map((r) => r.gare.uic);
      expect(new Set(uics).size).toBe(uics.length);
      const derniere = Math.ceil(premiere.totalRangees / 2);
      expect((await lire(DIJON, `&page=${derniere}`)).pageSuivante).toBeNull();
    });
  });

  it('garde les totaux au-delà de la dernière page, sans page suivante', async () => {
    const { total, totalRangees } = await lire(DIJON);
    const loin = await lire(DIJON, '&page=99');
    expect(loin).toMatchObject({ rangees: [], total, totalRangees, pageSuivante: null });
  });

  it.each([
    ['une date hors des horaires', `gare=${DIJON}&date=2020-01-01`, 400],
    ['une page invalide', `gare=${DIJON}&page=0`, 400],
    ['une durée hors des options', `gare=${DIJON}&dureeMax=45`, 400],
    ['une gare manquante', '', 400],
    ['une gare inconnue', `gare=ZZ000000&date=${HIVER}`, 404],
  ])('refuse %s', async (_cas, requete, statut) => {
    const reponse = await appeler(route, `/api/lieux/rangees?${requete}`);
    expect(reponse.statut).toBe(statut);
    expect(erreurDe(reponse.corps).message).not.toBe('');
  });
});
