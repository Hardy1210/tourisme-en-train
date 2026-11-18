// Photos dans l'API (D100, D101) sur l'échantillon : une photo ne sort que si ses droits sont en cours à la
// date donnée (date du jour à Paris, passée par la route). Été et hiver, le cas et sa limite.
// Échantillon : ECH_L02 sans dates ; ECH_L03 droits finis le 15/07/2026 ; ECH_L04 droits depuis le 17/11/2026.
import { beforeAll, describe, expect, it } from 'vitest';

import { parametres } from '@/config/parametres';

// Importé pour son effet : la base de test est choisie AVANT de charger les services.
import './outils-api';

let fiche: typeof import('@/features/lieux/server/fiche');
let service: typeof import('@/features/lieux/server/service');
let accessibles: typeof import('@/features/lieux/server/accessibles');

beforeAll(async () => {
  fiche = await import('@/features/lieux/server/fiche');
  service = await import('@/features/lieux/server/service');
  accessibles = await import('@/features/lieux/server/accessibles');
});

const cle = (id: string) => `echantillon-${id}`;
const photoDeLaFiche = async (id: string, date: string) =>
  (await fiche.ficheLieu(cle(id), date)).photo;

describe('fiche lieu', () => {
  it('photo sans dates : toujours là, avec son crédit', async () => {
    expect(await photoDeLaFiche('ECH_L02', '2026-11-17')).toEqual({
      petite: 'https://example.org/photos/jardin-500.jpg',
      grande: 'https://example.org/photos/jardin-960.jpg',
      auteur: 'Exemple Photographe',
      licence: 'CC BY-SA 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
      page: 'https://commons.wikimedia.org/wiki/File:Exemple_jardin.jpg',
      source: 'wikimedia_commons',
    });
  });

  it('été : droits qui finissent le 15/07 → photo le 15/07, plus le 16/07', async () => {
    expect(await photoDeLaFiche('ECH_L03', '2026-07-15')).not.toBeNull();
    expect(await photoDeLaFiche('ECH_L03', '2026-07-16')).toBeNull();
  });

  it('hiver : droits qui commencent le 17/11 → pas de photo le 16/11, photo le 17/11', async () => {
    expect(await photoDeLaFiche('ECH_L04', '2026-11-16')).toBeNull();
    expect(await photoDeLaFiche('ECH_L04', '2026-11-17')).toMatchObject({
      source: 'datatourisme_photos',
      licence: 'Licence Ouverte',
      page: null,
    });
  });

  it('limite : lieu sans photo → null', async () => {
    expect(await photoDeLaFiche('ECH_L01', '2026-11-17')).toBeNull();
  });
});

describe('listes : « Près de vous », lieux à pied d’une destination, écran Lieux', () => {
  const photos = (lieux: readonly { cle: string; photo: unknown }[]) =>
    new Map(lieux.map((l) => [l.cle, l.photo !== null]));

  it('« Près de vous » (autour de Dijon-Ville) : la même règle des droits', async () => {
    const reponse = await service.autour(
      { lat: 47.3233, lon: 5.0272, rayon: 2000, categories: null },
      '2026-07-16',
    );
    const avec = photos(reponse.lieux);
    expect(avec.get(cle('ECH_L02'))).toBe(true);
    expect(avec.get(cle('ECH_L03'))).toBe(false);
    expect(avec.get(cle('ECH_L01'))).toBe(false);
  });

  it('lieux à pied de Dijon-Ville (fiche destination)', async () => {
    const reponse = await fiche.lieuxAPiedDeLaGare(
      'EX000001',
      { categories: null, rayon: 2000 },
      '2026-11-17',
    );
    const avec = photos(reponse.lieux);
    expect(avec.get(cle('ECH_L02'))).toBe(true);
    expect(avec.get(cle('ECH_L04'))).toBe(true);
    expect(avec.get(cle('ECH_L03'))).toBe(false);
  });

  it('écran Lieux (accessibles en train depuis Dijon-Ville) : photo à Beaune ; limite, lieu voisin sans photo', async () => {
    const reponse = await accessibles.accessibles(
      {
        gare: 'EX000001',
        date: '2026-11-18',
        categories: null,
        dureeMax: Math.max(...parametres.durees.trainMaxOptionsMin),
        page: 1,
      },
      '2026-11-17',
    );
    const avec = photos(reponse.lieux);
    expect(avec.get(cle('ECH_L11'))).toBe(true);
    expect(avec.get(cle('ECH_L12'))).toBe(false);
  });
});

// Lieux avec une photo d'abord (D104, temporaire) : le tri par distance (ou par temps total) reste à
// l'intérieur de chaque groupe. Le cas (`photosDabord: true`, valeur de parametres.json) et sa limite
// (`false` : l'ordre d'avant, intact). LIMIT après le tri : une photo plus loin remonte dans la page.
describe('photos d’abord (D104)', () => {
  let requetes: typeof import('@/features/lieux/server/requetes');
  let requetesFiche: typeof import('@/features/lieux/server/requetes-fiche');
  let requetesAccessibles: typeof import('@/features/lieux/server/requetes-accessibles');
  let dijon: { id: number; code_insee: string | null };
  beforeAll(async () => {
    requetes = await import('@/features/lieux/server/requetes');
    requetesFiche = await import('@/features/lieux/server/requetes-fiche');
    requetesAccessibles = await import('@/features/lieux/server/requetes-accessibles');
    const gare = await (await import('@/lib/db/requetes-partagees')).gareParUic('EX000001');
    if (gare === null) throw new Error('Échantillon : gare EX000001 (Dijon-Ville) absente.');
    dijon = gare;
  });

  type Ligne = { photo: boolean; tri: number };
  /** Groupes « avec photo » puis « sans », chacun dans l'ordre de `tri` (distance ou temps total). */
  const photosDabordPuisTri = (lignes: Ligne[]) => {
    const avec = lignes.filter((l) => l.photo).map((l) => l.tri);
    const sans = lignes.filter((l) => !l.photo).map((l) => l.tri);
    expect(lignes.map((l) => l.tri)).toEqual([
      ...avec.sort((a, b) => a - b),
      ...sans.sort((a, b) => a - b),
    ]);
  };
  /** Le test n'a de sens que si une photo est plus loin qu'un lieu sans photo. */
  const unePhotoPlusLoin = (lignes: Ligne[]) =>
    lignes.some((a) => a.photo && lignes.some((b) => !b.photo && b.tri < a.tri));
  const croissant = (valeurs: number[]) =>
    expect(valeurs).toEqual([...valeurs].sort((a, b) => a - b));

  const optionsAutour = {
    lat: 47.3233,
    lon: 5.0272,
    rayonVolOiseauM: 2000,
    categories: null,
    airesDeJeux: {
      sousCategories: parametres.acces.sousCategoriesAiresDeJeux,
      rayonVolOiseauM: 2000,
    },
    limite: parametres.limites.lieux,
    datePhoto: '2026-11-17',
  };
  const lignesAutour = (l: Awaited<ReturnType<typeof requetes.lieuxAutour>>) =>
    l.map((x) => ({ photo: x.photo_petite !== null, tri: x.vol_oiseau_m }));

  it('le réglage est actif dans parametres.json', () => {
    expect(parametres.photos.enPremier).toBe(true);
  });

  it('« Près de vous » : photos d’abord, puis par distance ; limite, sans le réglage, par distance seule', async () => {
    const avec = lignesAutour(await requetes.lieuxAutour({ ...optionsAutour, photosDabord: true }));
    const sans = lignesAutour(
      await requetes.lieuxAutour({ ...optionsAutour, photosDabord: false }),
    );
    expect(unePhotoPlusLoin(sans)).toBe(true);
    photosDabordPuisTri(avec);
    croissant(sans.map((l) => l.tri));
  });

  it('« Près de vous », un seul lieu demandé : une photo, même si un lieu sans photo est plus près', async () => {
    // Place Darcy : le plus proche est le théâtre, sans photo.
    const darcy = { ...optionsAutour, lat: 47.3226, lon: 5.0353, limite: 1 };
    const [premier] = await requetes.lieuxAutour({ ...darcy, photosDabord: true });
    const [plusProche] = await requetes.lieuxAutour({ ...darcy, photosDabord: false });
    expect(premier?.photo_petite).not.toBeNull();
    expect(plusProche?.photo_petite).toBeNull();
  });

  it('lieux à pied d’une gare : photos d’abord, puis par distance ; limite, sans le réglage', async () => {
    const options = { rayonM: 2000, categories: null, limite: 50, datePhoto: '2026-11-17' };
    const lire = async (photosDabord: boolean) =>
      (await requetesFiche.lieuxDeLaGare({ ...options, gareId: dijon.id, photosDabord })).map(
        (x) => ({
          photo: x.photo_petite !== null,
          tri: x.distance_m,
        }),
      );
    const avec = await lire(true);
    const sans = await lire(false);
    expect(unePhotoPlusLoin(sans)).toBe(true);
    photosDabordPuisTri(avec);
    croissant(sans.map((l) => l.tri));
  });

  it('écran Lieux : photos d’abord, puis par temps total ; limite, sans le réglage ; page 1 d’un lieu', async () => {
    const options = {
      gareId: dijon.id,
      codeInsee: dijon.code_insee,
      date: '2026-11-18',
      dureeMax: Math.max(...parametres.durees.trainMaxOptionsMin),
      categories: null,
      limite: 50,
      decalage: 0,
      datePhoto: '2026-11-17',
    };
    const lire = async (photosDabord: boolean, limite = 50) =>
      (await requetesAccessibles.lieuxAccessibles({ ...options, limite, photosDabord })).lieux.map(
        (x) => ({
          photo: x.photo_petite !== null,
          tri: x.duree_train_min + x.duree_marche_min,
        }),
      );
    const sans = await lire(false);
    expect(unePhotoPlusLoin(sans)).toBe(true);
    photosDabordPuisTri(await lire(true));
    croissant(sans.map((l) => l.tri));
    expect((await lire(true, 1))[0]?.photo).toBe(true);
    expect((await lire(false, 1))[0]?.photo).toBe(false);
  });
});
