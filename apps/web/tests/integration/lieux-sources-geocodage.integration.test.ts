// Routes /api/destinations/[uic]/lieux, /api/lieux/[cle], /api/sources, /api/geocodage(/inverse) sur
// l'échantillon. L'API Adresse n'est jamais appelée : `fetch` est simulé (règle 4 des tests). D051, D052.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { schemaFicheLieu, schemaReponseAutour } from '@/features/lieux/schemas';
import { schemaReponseGeocodage, schemaReponseInverse } from '@/features/localisation/schemas';
import { schemaReponseSources } from '@/features/presentation/schemas';

import { appeler, erreurDe, type Route } from './outils-api';

let lieuxGare: Route;
let lieu: Route;
let sources: Route;
let geocodage: Route;
let inverse: Route;

beforeAll(async () => {
  lieuxGare = await import('@/app/api/destinations/[uic]/lieux/route');
  lieu = await import('@/app/api/lieux/[cle]/route');
  sources = await import('@/app/api/sources/route');
  geocodage = await import('@/app/api/geocodage/route');
  inverse = await import('@/app/api/geocodage/inverse/route');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Réponse simulée de l'API Adresse (format GeoJSON de la Géoplateforme). */
function apiAdresse(features: { label: string; type: string; city: string; citycode: string }[]) {
  const reponse = {
    features: features.map((p) => ({ geometry: { coordinates: [4.993, 47.336] }, properties: p })),
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(Response.json(reponse))),
  );
}
const apiEnPanne = () =>
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new TypeError('fetch failed'))),
  );

describe('/api/destinations/[uic]/lieux', () => {
  const noms = async (parametres: string) =>
    schemaReponseAutour
      .parse(
        (
          await appeler(lieuxGare, `/api/destinations/EX000001/lieux?${parametres}`, {
            uic: 'EX000001',
          })
        ).corps,
      )
      .lieux.map((l) => l.nom);

  it('lieux à pied de Dijon-Ville, les plus proches d’abord, clé de source (D052)', async () => {
    const reponse = schemaReponseAutour.parse(
      (await appeler(lieuxGare, '/api/destinations/EX000001/lieux', { uic: 'EX000001' })).corps,
    );
    expect(reponse.total).toBe(7);
    expect(reponse.lieux[0]).toMatchObject({
      cle: 'echantillon-ECH_L02',
      distanceM: 477,
      dureeMarcheMin: 7,
    });
  });

  it('rayon 1 400 m : musée (1 478 m) exclu, palais (1 369 m) gardé', async () => {
    const liste = await noms('rayon=1400');
    expect(liste).toContain('Exemple - Palais historique');
    expect(liste).not.toContain('Exemple - Musée des beaux-arts');
  });

  it('catégorie culture : théâtre et musée seulement ; rayon au-delà de 1 500 m → 400', async () => {
    expect(await noms('categories=culture')).toEqual([
      'Exemple - Théâtre',
      'Exemple - Musée des beaux-arts',
    ]);
    const trop = await appeler(lieuxGare, '/api/destinations/EX000001/lieux?rayon=1600', {
      uic: 'EX000001',
    });
    expect(trop.statut).toBe(400);
  });
});

describe('/api/lieux/[cle]', () => {
  const lire = async (cle: string) => {
    const reponse = await appeler(lieu, `/api/lieux/${cle}`, { cle });
    expect(reponse.statut).toBe(200);
    return schemaFicheLieu.parse(reponse.corps);
  };

  it('fiche complète : commune, attribution de la source, gares d’où l’on y va à pied', async () => {
    expect(await lire('echantillon-ECH_L11')).toMatchObject({
      cle: 'echantillon-ECH_L11',
      demande: null,
      nom: 'Exemple - Hospices',
      commune: 'Beaune',
      attribution: 'Données d’exemple'.replace('’', "'"),
      garesProches: [{ uic: 'EX000002', nom: 'Beaune', distanceM: 606, dureeMarcheMin: 9 }],
    });
  });

  it('lien vers un doublon → lieu gardé, avec la clé demandée (D052)', async () => {
    expect(await lire('echantillon-ECH_L17')).toMatchObject({
      cle: 'echantillon-ECH_L11',
      demande: 'echantillon-ECH_L17',
    });
  });

  it('lien vers un membre de site → représentant du site', async () => {
    expect(await lire('echantillon-ECH_L16')).toMatchObject({
      cle: 'echantillon-ECH_L13',
      demande: 'echantillon-ECH_L16',
    });
  });

  it('clé inconnue → 404 ; clé mal formée → 400', async () => {
    const inconnue = await appeler(lieu, '/api/lieux/osm-node-1', { cle: 'osm-node-1' });
    expect(erreurDe(inconnue.corps).code).toBe('INTROUVABLE');
    expect((await appeler(lieu, '/api/lieux/48213', { cle: '48213' })).statut).toBe(400);
  });
});

describe('/api/sources', () => {
  it('donne les dates couvertes par les horaires, de l’échantillon d’été à celui d’hiver', async () => {
    const reponse = await appeler(sources, '/api/sources');
    expect(schemaReponseSources.parse(reponse.corps).horaires).toEqual({
      debut: '2026-07-15',
      fin: '2026-11-18',
    });
  });

  it('attribution OpenStreetMap exigée par l’ODbL ; sources P1 absentes', async () => {
    const { sources: liste } = schemaReponseSources.parse(
      (await appeler(sources, '/api/sources')).corps,
    );
    expect(liste.find((s) => s.code === 'osm')).toMatchObject({
      licence: 'ODbL',
      attribution: "© les contributeurs d'OpenStreetMap (ODbL)",
    });
    expect(liste.find((s) => s.code === 'fond_carte')?.attribution).toContain('© OpenStreetMap');
    const codes = liste.map((s) => s.code);
    expect(codes).toEqual(expect.arrayContaining(['gtfs_sncf', 'datatourisme', 'tarifs_tgv']));
    expect(codes).not.toContain('cyclable');
    expect(codes).not.toContain('api_sncf');
  });

  it('dates : valeurs relevées (CO₂, prix) ; service en direct sans date', async () => {
    const { sources: liste } = schemaReponseSources.parse(
      (await appeler(sources, '/api/sources')).corps,
    );
    expect(liste.find((s) => s.code === 'facteurs_co2')?.dateDonnees).toBe('2026-11-03');
    expect(liste.find((s) => s.code === 'tarifs_tgv')?.dateDonnees).toBe('2026-11-03');
    expect(liste.find((s) => s.code === 'api_adresse')?.dateDonnees).toBeNull();
  });
});

describe('/api/geocodage', () => {
  const lire = async (q: string) =>
    schemaReponseGeocodage.parse(
      (await appeler(geocodage, `/api/geocodage?q=${encodeURIComponent(q)}`)).corps,
    );

  it('en ligne : gares de la base d’abord, puis résultats de l’API Adresse', async () => {
    apiAdresse([{ label: 'Beaune', type: 'municipality', city: 'Beaune', citycode: '21054' }]);
    const reponse = await lire('Beaune');
    expect(reponse.horsLigne).toBe(false);
    expect(reponse.resultats.map((r) => [r.libelle, r.type])).toEqual([
      ['Beaune', 'gare'],
      ['Beaune', 'commune'],
    ]);
  });

  it('API en panne : repli sur les gares, sans accents (« besancon »), horsLigne', async () => {
    apiEnPanne();
    const reponse = await lire('besancon');
    expect(reponse.horsLigne).toBe(true);
    expect(reponse.resultats.map((r) => r.libelle)).toEqual(
      expect.arrayContaining(['Besançon-Viotte']),
    );
  });

  it('moins de 3 caractères → 400', async () => {
    const court = await appeler(geocodage, '/api/geocodage?q=ab');
    expect(erreurDe(court.corps).message).toBe('Tapez au moins 3 caractères.');
  });
});

describe('/api/geocodage/inverse', () => {
  const TALANT = 'lat=47.336&lon=4.993';

  it('position à Talant → « Talant », jamais en cache', async () => {
    apiAdresse([
      {
        label: '20a Rue Louis Jouvet 21240 Talant',
        type: 'housenumber',
        city: 'Talant',
        citycode: '21617',
      },
    ]);
    const reponse = await appeler(inverse, `/api/geocodage/inverse?${TALANT}`);
    expect(reponse.cache).toBe('no-store');
    expect(schemaReponseInverse.parse(reponse.corps)).toEqual({
      commune: 'Talant',
      codeInsee: '21617',
      horsLigne: false,
    });
  });

  it('réseau coupé → commune de la gare la plus proche (Dijon), horsLigne, position absente du journal', async () => {
    apiEnPanne();
    const sortie = vi.spyOn(process.stdout, 'write').mockReturnValue(true);
    const reponse = await appeler(inverse, `/api/geocodage/inverse?${TALANT}`);
    expect(schemaReponseInverse.parse(reponse.corps)).toMatchObject({
      commune: 'Dijon',
      horsLigne: true,
    });
    const journal = sortie.mock.calls.map((appel) => String(appel[0])).join('');
    expect(journal).toContain('API Adresse indisponible');
    expect(journal).not.toContain('47.336');
    expect(journal).not.toContain('4.993');
  });
});
