// /api/carte/lieux (D091, D092) sur l'échantillon : section D092 de db/echantillon/echantillon.sql.
import { gunzipSync } from 'node:zlib';
import { beforeAll, describe, expect, it } from 'vitest';

import { schemaReponseLieuxCarte } from '@/features/lieux/schemas';

// Importé pour son effet : la base de test est choisie AVANT de charger la route et la requête.
import { type Route } from './outils-api';
import './outils-api';

let route: Route;
let lieuxCarte: typeof import('@/features/lieux/server/requetes-carte').lieuxCarte;
const cle = (identifiant: string) => `echantillon-${identifiant}`;

beforeAll(async () => {
  route = await import('@/app/api/carte/lieux/route');
  ({ lieuxCarte } = await import('@/features/lieux/server/requetes-carte'));
});

async function lire(chemin: string) {
  const reponse = await route.GET(
    new Request(`http://localhost${chemin}`, { headers: { 'Accept-Encoding': 'gzip' } }),
    { params: Promise.resolve({}) },
  );
  expect(reponse.status).toBe(200);
  expect(reponse.headers.get('content-encoding')).toBe('gzip');
  const corps = JSON.parse(gunzipSync(Buffer.from(await reponse.arrayBuffer())).toString());
  const cles = schemaReponseLieuxCarte.parse(corps).lieux.map(([c]) => c);
  return { cles, cache: reponse.headers.get('cache-control') };
}

describe('/api/carte/lieux (D094)', () => {
  it('seulement des gares : leurs lieux à pied, en cache, compressés', async () => {
    const { cles, cache } = await lire('/api/carte/lieux?gares=EX000005');
    expect(cache).toMatch(/^public, max-age=\d+$/);
    expect(cles).toEqual(expect.arrayContaining([cle('ECH_L44'), cle('ECH_L47')]));
    // Fiche de ville et lieu masqué (piscine, D093) : jamais.
    expect(cles).not.toContain(cle('ECH_L42'));
    expect(cles).not.toContain(cle('ECH_L53'));
  });

  it('autour d’une position : jamais en cache (règle 5), le rayon du filtre compte', async () => {
    const { cles, cache } = await lire('/api/carte/lieux?lat=46.3&lon=6.9&rayon=1000');
    expect(cache).toBe('no-store');
    expect(cles).toEqual(expect.arrayContaining([cle('ECH_L44'), cle('ECH_L47')]));
    expect(cles).not.toContain(cle('ECH_L53'));
    // Les lieux d'exemple « loin des gares » sont à plus de 200 km : hors du rayon.
    expect(cles).not.toContain(cle('ECH_L50'));
  });

  it('position et gares ensemble : les lieux des deux zones, jamais en cache', async () => {
    const { cles, cache } = await lire(
      '/api/carte/lieux?lat=46.5&lon=4.2&rayon=1000&gares=EX000005',
    );
    expect(cache).toBe('no-store');
    // Autour du point (lieux « loin des gares ») et autour de la gare EX000005.
    expect(cles).toEqual(expect.arrayContaining([cle('ECH_L50'), cle('ECH_L47')]));
  });

  it('un rayon hors des choix du filtre → 400', async () => {
    const reponse = await route.GET(
      new Request('http://localhost/api/carte/lieux?lat=46.3&lon=6.9&rayon=1234'),
      { params: Promise.resolve({}) },
    );
    expect(reponse.status).toBe(400);
  });
});

describe('lieuxCarte : tri des lieux pauvres loin des gares (D092)', () => {
  // Autour des lieux d'exemple « loin des gares » (4,2 ; 46,5), sans aucune ligne lieu_gare.
  const OPTIONS = {
    zone: {
      point: { lat: 46.5, lon: 4.2, rayonVolOiseauM: 5000, airesVolOiseauM: 770 },
      gares: [],
    },
    airesDeJeux: ['aire de jeux'],
    pauvres: {
      sources: ['echantillon'],
      categories: ['patrimoine'],
      toujoursGardes: ['musée', 'abbaye'],
    },
  };

  it('retire le monument sans description ; garde le musée et le lieu avec un article Wikipédia', async () => {
    const cles = (await lieuxCarte(OPTIONS)).map((l) => l.cle);
    expect(cles).not.toContain(cle('ECH_L49'));
    expect(cles).toContain(cle('ECH_L50'));
    expect(cles).toContain(cle('ECH_L51'));
  });

  it('source non triée : le monument pauvre reste', async () => {
    const cles = (
      await lieuxCarte({ ...OPTIONS, pauvres: { ...OPTIONS.pauvres, sources: ['osm'] } })
    ).map((l) => l.cle);
    expect(cles).toContain(cle('ECH_L49'));
  });
});
