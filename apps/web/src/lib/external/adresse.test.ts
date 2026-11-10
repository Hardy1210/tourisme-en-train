// Adaptateur de l'API Adresse : `fetch` est simulé, aucun appel réseau (D051).
import { afterEach, describe, expect, it, vi } from 'vitest';

import { communeAuPoint, rechercherAdresses } from './adresse';

type Proprietes = { label: string; type: string; city: string; citycode: string };

function simulerApi(features: Proprietes[]) {
  const reponse = {
    features: features.map((p) => ({ geometry: { coordinates: [4.84, 47.02] }, properties: p })),
  };
  const faux = vi.fn((_url: URL) => Promise.resolve(Response.json(reponse)));
  vi.stubGlobal('fetch', faux);
  return () => new URL(String(faux.mock.calls[0]?.[0]));
}

const BEAUNE = { label: 'Beaune', type: 'municipality', city: 'Beaune', citycode: '21054' };

afterEach(() => vi.unstubAllGlobals());

describe('rechercherAdresses : communes seules (D081)', () => {
  it('demande à l’API les seules communes (type=municipality)', async () => {
    const url = simulerApi([BEAUNE]);
    await rechercherAdresses('beaune', 6);
    expect(url().searchParams.get('type')).toBe('municipality');
  });

  it('écarte une rue ou un lieu-dit homonyme, garde la commune', async () => {
    simulerApi([
      BEAUNE,
      { label: 'Beaune 19290 Sornac', type: 'street', city: 'Sornac', citycode: '19261' },
      { label: 'Beaune 87120 Eymoutiers', type: 'locality', city: 'Eymoutiers', citycode: '87064' },
    ]);
    const resultats = await rechercherAdresses('beaune', 6);
    expect(resultats.map((r) => [r.libelle, r.type])).toEqual([['Beaune', 'commune']]);
  });
});

describe('communeAuPoint : sans filtre de type (D051)', () => {
  it('n’ajoute pas type=municipality : la recherche inverse ne renverrait rien', async () => {
    const url = simulerApi([
      {
        label: '8 Rue de Lorraine 21000 Dijon',
        type: 'housenumber',
        city: 'Dijon',
        citycode: '21231',
      },
    ]);
    const commune = await communeAuPoint(47.33, 5.03);
    expect(url().searchParams.has('type')).toBe(false);
    expect(commune).toEqual({ commune: 'Dijon', codeInsee: '21231' });
  });
});
