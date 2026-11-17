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
