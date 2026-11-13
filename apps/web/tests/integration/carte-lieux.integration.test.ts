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

describe('/api/carte/lieux', () => {
  it('répond en gzip, en cache, avec les lieux en tableaux courts', async () => {
    const reponse = await route.GET(
      new Request('http://localhost/api/carte/lieux', { headers: { 'Accept-Encoding': 'gzip' } }),
      { params: Promise.resolve({}) },
    );
    expect(reponse.status).toBe(200);
    expect(reponse.headers.get('content-encoding')).toBe('gzip');
    expect(reponse.headers.get('cache-control')).toMatch(/^public, max-age=\d+$/);
    const corps = JSON.parse(gunzipSync(Buffer.from(await reponse.arrayBuffer())).toString());
    const { lieux } = schemaReponseLieuxCarte.parse(corps);
    const cles = lieux.map(([c]) => c);
    // Aire de jeux reliée à une gare : sur la carte ; non reliée : jamais.
    expect(cles).toContain(cle('ECH_L44'));
    expect(cles).not.toContain(cle('ECH_L52'));
    // Fiche de ville : jamais.
    expect(cles).not.toContain(cle('ECH_L42'));
  });
});

describe('lieuxCarte : tri des lieux pauvres loin des gares (D092)', () => {
  const OPTIONS = {
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
