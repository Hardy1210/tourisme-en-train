// Base de test réelle (`pnpm test:integration`) : gares d'exemple de db/echantillon/echantillon.sql.
// Chaque test remplace les lieux d'exemple par son propre scénario, calcule les rattachements, puis
// annule tout. Lieux inventés (nom « Test … ») près de Dijon-Ville (5.0272, 47.3233).
import type pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';
import type { Decision } from '../src/chargement/decisions-doublons';
import {
  calculerRattachementsDans,
  type BilanRattachements,
} from '../src/chargement/rattachements';
import { creerPool, enTransaction } from '../src/db';

function urlTestEtl(): string {
  if (!process.env.BDD_URL_ETL) throw new Error('BDD_URL_ETL manquante (voir .env.example).');
  const adresse = new URL(process.env.BDD_URL_ETL);
  adresse.pathname = `${adresse.pathname}_test`;
  return adresse.toString();
}

const pool = creerPool(urlTestEtl());
afterAll(() => pool.end());

class Annulation extends Error {}

/** [id_source, source, nom, catégorie, sous-catégorie, lon, lat, image_url ?] */
type LieuTest = [string, 'datatourisme' | 'osm', string, string, string, number, number, string?];

const DIJON = { lon: 5.0272, lat: 47.3233 };
/** Décalage vers le nord, en mètres (1° de latitude ≈ 111 195 m). */
const nord = (m: number): number => DIJON.lat + m / 111_195;

function inserer(lieux: readonly LieuTest[]): string {
  const valeurs = lieux
    .map(
      ([id, source, nom, cat, sc, lon, lat, image]) =>
        `('${source}', '${id}', '${nom.replaceAll("'", "''")}', '${cat}', '${sc}', '21231', ` +
        `${image ? `'${image}'` : 'NULL'}, ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)::geography)`,
    )
    .join(',\n');
  return `INSERT INTO lieu (source, id_source, nom, categorie, sous_categorie, code_insee, image_url, geom)
          VALUES ${valeurs};`;
}

/** Calcule les rattachements après `preparation`, puis exécute `lire` ; tout est annulé. */
async function apres<T>(
  lieux: readonly LieuTest[],
  lire: (client: pg.PoolClient, bilan: BilanRattachements) => Promise<T>,
  preparation = '',
  decisions: Decision[] = [],
): Promise<T> {
  let resultat: T | undefined;
  await expect(
    enTransaction(pool, async (client) => {
      await client.query(`DELETE FROM lieu;
        INSERT INTO source_donnees (code, nom, producteur, url, licence, attribution) VALUES
          ('datatourisme', 'Test', 'Test', 'https://example.org', 'Test', 'Test'),
          ('osm', 'Test', 'Test', 'https://example.org', 'Test', 'Test')
        ON CONFLICT (code) DO NOTHING;`);
      await client.query(inserer(lieux));
      if (preparation) await client.query(preparation);
      const bilan = await calculerRattachementsDans(client, { decisions, rejets: [] });
      resultat = await lire(client, bilan);
      throw new Annulation();
    }),
  ).rejects.toBeInstanceOf(Annulation);
  return resultat as T;
}

const lignes = async (client: pg.PoolClient, sql: string): Promise<Record<string, unknown>[]> =>
  (await client.query(sql)).rows;

const rattaches = (client: pg.PoolClient) =>
  lignes(
    client,
    `SELECT l.id_source, g.uic, lg.distance_m FROM lieu_gare lg
     JOIN lieu l ON l.id = lg.lieu_id JOIN gare g ON g.id = lg.gare_id ORDER BY 1, 2`,
  );

describe('rattachements — lieux à pied des gares (04 § 4.6, D043)', () => {
  // Rayon à pied : 2 000 m (acces.rayonPiedM, D091) ; distance à pied = vol d'oiseau × 1,3.
  it('lieu à 1 950 m à pied rattaché à Dijon-Ville ; lieu à 2 080 m à pied non rattaché', async () => {
    const liens = await apres(
      [
        ['PRES', 'osm', 'Test parc proche', 'parcs', 'parc', DIJON.lon, nord(1500)],
        ['LOIN', 'osm', 'Test parc loin', 'parcs', 'parc', DIJON.lon, nord(1600)],
      ],
      rattaches,
    );
    const dijon = liens.filter((l) => l.uic === 'EX000001');
    expect(dijon.map((l) => l.id_source)).toEqual(['PRES']);
    expect(dijon[0]?.distance_m).toBe(1950);
  });

  it('aire de jeux à 650 m à pied rattachée ; à 1 430 m non, alors qu’un parc l’est (D091)', async () => {
    const liens = await apres(
      [
        ['AIRE_PRES', 'osm', 'Aire de jeux', 'enfants', 'aire de jeux', DIJON.lon, nord(500)],
        ['AIRE_LOIN', 'osm', 'Aire de jeux', 'enfants', 'aire de jeux', DIJON.lon, nord(1100)],
        ['PARC', 'osm', 'Test parc', 'parcs', 'parc', DIJON.lon, nord(1100)],
      ],
      rattaches,
    );
    const dijon = liens.filter((l) => l.uic === 'EX000001').map((l) => l.id_source);
    expect(dijon.sort()).toEqual(['AIRE_PRES', 'PARC']);
  });

  it('lieu masqué (piscine) : jamais relié à une gare ; son voisin non masqué l’est (D093)', async () => {
    const liens = await apres(
      [
        ['PISCINE', 'osm', 'Piscine', 'enfants', 'piscine', DIJON.lon, nord(200)],
        ['PARC', 'osm', 'Test parc', 'parcs', 'parc', DIJON.lon, nord(200)],
      ],
      rattaches,
      "UPDATE lieu SET masque = true WHERE id_source = 'PISCINE'",
    );
    const dijon = liens.filter((l) => l.uic === 'EX000001').map((l) => l.id_source);
    expect(dijon).toEqual(['PARC']);
  });

  it('gare_stats : une gare compte autant de lieux que ses lignes de lieu_gare', async () => {
    const [stats] = await apres(
      [
        ['A', 'osm', 'Test parc A', 'parcs', 'parc', DIJON.lon, nord(200)],
        ['B', 'osm', 'Test musée B', 'culture', 'musée', DIJON.lon, nord(400)],
        ['C', 'osm', 'Test parc C', 'parcs', 'parc', DIJON.lon, nord(600)],
      ],
      (client) =>
        lignes(
          client,
          `SELECT (SELECT sum(nb_lieux)::int FROM gare_stats s JOIN gare g ON g.id = s.gare_id
                   WHERE g.uic = 'EX000001') AS stats,
                  (SELECT nb_lieux FROM gare_stats s JOIN gare g ON g.id = s.gare_id
                   WHERE g.uic = 'EX000001' AND categorie = 'parcs') AS parcs`,
        ),
    );
    expect(stats).toEqual({ stats: 3, parcs: 2 });
  });
});

describe('rattachements — fiches de ville (D057)', () => {
  const marques = (client: pg.PoolClient) =>
    lignes(client, 'SELECT id_source FROM lieu WHERE fiche_ville ORDER BY 1');

  it('marque « Ville de … » et le nom de sa commune, venus de DATAtourisme', async () => {
    const liste = await apres(
      [
        [
          'V1',
          'datatourisme',
          'Ville de Test',
          'patrimoine',
          'patrimoine urbain',
          DIJON.lon,
          nord(100),
        ],
        ['V2', 'datatourisme', 'Dijon', 'patrimoine', 'site culturel', DIJON.lon, nord(300)],
      ],
      marques,
    );
    expect(liste.map((l) => l.id_source)).toEqual(['V1', 'V2']);
  });

  it('ne marque ni les exceptions, ni un autre nom, ni OpenStreetMap', async () => {
    const liste = await apres(
      [
        [
          'E1',
          'datatourisme',
          'Village du Livre',
          'patrimoine',
          'patrimoine urbain',
          DIJON.lon,
          nord(100),
        ],
        ['E2', 'datatourisme', 'Ville-Musée Test', 'culture', 'musée', DIJON.lon, nord(300)],
        ['E3', 'osm', 'Dijon', 'nature', 'point de vue', DIJON.lon, nord(500)],
      ],
      marques,
    );
    expect(liste).toEqual([]);
  });

  it('une fiche de ville n’est ni rattachée à une gare, ni comptée, ni fusionnée avec un lieu', async () => {
    const [etat] = await apres(
      [
        [
          'V1',
          'datatourisme',
          'Ville de Test',
          'patrimoine',
          'patrimoine urbain',
          DIJON.lon,
          nord(100),
        ],
        ['L1', 'osm', 'Ville de Test', 'patrimoine', 'patrimoine urbain', DIJON.lon, nord(105)],
      ],
      (client) =>
        lignes(
          client,
          `SELECT (SELECT count(*)::int FROM lieu_gare lg JOIN lieu l ON l.id = lg.lieu_id
                   WHERE l.id_source = 'V1') AS liens_fiche,
                  (SELECT count(*)::int FROM lieu_gare lg JOIN lieu l ON l.id = lg.lieu_id
                   WHERE l.id_source = 'L1') > 0 AS lieu_rattache,
                  (SELECT doublon_de FROM lieu WHERE id_source = 'L1') AS doublon`,
        ),
    );
    expect(etat).toEqual({ liens_fiche: 0, lieu_rattache: true, doublon: null });
  });
});

describe('rattachements — catégories secondaires (D060)', () => {
  it('gare_stats les compte à part : le total principal reste celui de lieu_gare', async () => {
    const [stats] = await apres(
      [
        ['A', 'osm', 'Test parc animalier', 'nature', 'parc animalier', DIJON.lon, nord(200)],
        ['B', 'osm', 'Test sentier', 'nature', 'sentier', DIJON.lon, nord(400)],
      ],
      (client) =>
        lignes(
          client,
          `SELECT (SELECT nb_lieux FROM gare_stats s JOIN gare g ON g.id = s.gare_id
                   WHERE g.uic = 'EX000001' AND categorie = 'nature') AS nature,
                  (SELECT nb_lieux FROM gare_stats s JOIN gare g ON g.id = s.gare_id
                   WHERE g.uic = 'EX000001' AND categorie = 'enfants') AS enfants_principale,
                  (SELECT nb_secondaires FROM gare_stats s JOIN gare g ON g.id = s.gare_id
                   WHERE g.uic = 'EX000001' AND categorie = 'enfants') AS enfants_secondaire`,
        ),
      "UPDATE lieu SET categories_secondaires = '{enfants}' WHERE id_source = 'A';",
    );
    expect(stats).toEqual({ nature: 2, enfants_principale: 0, enfants_secondaire: 1 });
  });
});

describe('rattachements — doublons entre sources', () => {
  const doublons = (client: pg.PoolClient) =>
    lignes(
      client,
      `SELECT l.id_source, g.id_source AS garde, g.image_url FROM lieu l
       LEFT JOIN lieu g ON g.id = l.doublon_de ORDER BY 1`,
    );

  it('même château à 20 m (accent en moins) fusionné, photo OSM reprise ; noms différents à 20 m : non', async () => {
    const resultat = await apres(
      [
        ['DT1', 'datatourisme', 'Château de Test', 'patrimoine', 'château', DIJON.lon, nord(300)],
        [
          'OSM1',
          'osm',
          'Chateau de Test',
          'patrimoine',
          'château',
          DIJON.lon,
          nord(320),
          'https://example.org/photo.jpg',
        ],
        ['DT2', 'datatourisme', 'Musée Exemplaire', 'culture', 'musée', DIJON.lon, nord(800)],
        ['OSM2', 'osm', 'Boulangerie Lointaine', 'culture', 'musée', DIJON.lon, nord(820)],
      ],
      async (client) => ({
        doublons: await doublons(client),
        photo: (await lignes(client, "SELECT image_url FROM lieu WHERE id_source = 'DT1'"))[0],
      }),
    );
    expect(resultat.doublons).toContainEqual(
      expect.objectContaining({ id_source: 'OSM1', garde: 'DT1' }),
    );
    expect(resultat.doublons).toContainEqual(
      expect.objectContaining({ id_source: 'OSM2', garde: null }),
    );
    expect(resultat.photo).toEqual({ image_url: 'https://example.org/photo.jpg' });
  });

  it('palier large : même nom à 200 m et même catégorie fusionné ; même nom à 200 m, autre catégorie : non', async () => {
    const resultat = await apres(
      [
        [
          'DT1',
          'datatourisme',
          'Château de Grandeville',
          'patrimoine',
          'château',
          DIJON.lon,
          nord(100),
        ],
        ['OSM1', 'osm', 'Château de Grandeville', 'patrimoine', 'château', DIJON.lon, nord(300)],
        ['DT2', 'datatourisme', 'Pont de la Roche', 'patrimoine', 'pont', DIJON.lon, nord(900)],
        ['OSM2', 'osm', 'Pont de la Roche', 'nature', 'point de vue', DIJON.lon, nord(1100)],
      ],
      doublons,
    );
    expect(resultat).toContainEqual(expect.objectContaining({ id_source: 'OSM1', garde: 'DT1' }));
    expect(resultat).toContainEqual(expect.objectContaining({ id_source: 'OSM2', garde: null }));
  });

  it('un doublon n’apparaît pas dans lieu_gare', async () => {
    const liens = await apres(
      [
        ['DT1', 'datatourisme', 'Jardin Test', 'parcs', 'jardin', DIJON.lon, nord(300)],
        ['OSM1', 'osm', 'Jardin Test', 'parcs', 'jardin', DIJON.lon, nord(310)],
      ],
      rattaches,
    );
    expect(liens.map((l) => l.id_source)).toEqual(['DT1']);
  });
});

describe('rattachements — sites', () => {
  const sites = (client: pg.PoolClient) =>
    lignes(
      client,
      `SELECT l.id_source, s.id_source AS site FROM lieu l
       LEFT JOIN lieu s ON s.id = l.site_de ORDER BY 1`,
    );

  it('grottes à moins de 500 m : un site représenté par DATAtourisme ; deux monuments à 50 m : jamais regroupés', async () => {
    const resultat = await apres(
      [
        ['G1', 'osm', 'Test grotte du Loup', 'nature', 'grotte', DIJON.lon, nord(100)],
        ['G2', 'osm', 'Test grotte du Lion', 'nature', 'grotte', DIJON.lon, nord(400)],
        ['G3', 'datatourisme', 'Test grottes du site', 'nature', 'grotte', DIJON.lon, nord(700)],
        [
          'M1',
          'osm',
          'Test hôtel particulier',
          'patrimoine',
          'monument historique',
          DIJON.lon,
          nord(1000),
        ],
        [
          'M2',
          'osm',
          'Test église voisine',
          'patrimoine',
          'monument historique',
          DIJON.lon,
          nord(1050),
        ],
      ],
      sites,
    );
    expect(resultat).toEqual([
      { id_source: 'G1', site: 'G3' },
      { id_source: 'G2', site: 'G3' },
      { id_source: 'G3', site: null },
      { id_source: 'M1', site: null },
      { id_source: 'M2', site: null },
    ]);
  });

  it('grotte à 600 m d’une autre : pas le même site', async () => {
    const resultat = await apres(
      [
        ['G1', 'osm', 'Test grotte A', 'nature', 'grotte', DIJON.lon, nord(100)],
        ['G2', 'osm', 'Test grotte B', 'nature', 'grotte', DIJON.lon, nord(700)],
      ],
      sites,
    );
    expect(resultat.every((l) => l.site === null)).toBe(true);
  });
});

describe('rattachements — lieux en longueur', () => {
  it('canal passant à 550 m de Dijon et de Besançon : rattaché aux deux, une fois chacune ; son point (loin) ne compte pas', async () => {
    const liens = await apres(
      [['CANAL', 'osm', 'Test canal', 'nature', 'canal', 5.5, 47.29]],
      rattaches,
      `UPDATE lieu SET trace = ST_Multi(ST_GeomFromText(
         'LINESTRING(5.0272 47.3283, 5.03 47.3283, 5.5 47.29, 6.0217 47.2521)', 4326))::geography
       WHERE id_source = 'CANAL';`,
    );
    expect(liens.map((l) => l.uic)).toEqual(['EX000001', 'EX000004']);
  });

  it('même canal sans tracé (seulement son point, loin des gares) : rattaché à aucune', async () => {
    const liens = await apres(
      [['CANAL', 'osm', 'Test canal', 'nature', 'canal', 5.5, 47.29]],
      rattaches,
    );
    expect(liens).toEqual([]);
  });
});

describe('rattachements — même source et décisions manuelles (D044)', () => {
  const doublons = (client: pg.PoolClient) =>
    lignes(
      client,
      `SELECT l.id_source, g.id_source AS garde FROM lieu l
       LEFT JOIN lieu g ON g.id = l.doublon_de ORDER BY 1`,
    );
  const decision = (
    garde: string,
    doublon: string,
    d: 'oui' | 'non',
    source = 'osm',
  ): Decision => ({
    source_garde: source,
    id_garde: garde,
    source_doublon: 'osm',
    id_doublon: doublon,
    decision: d,
  });

  it('même source, nom identique à 30 m : fusionné ; « Parc du château de X » et « Château de X » : à relire, non fusionnés', async () => {
    const { liste, bilan } = await apres(
      [
        ['A1', 'osm', 'Château des Forges', 'patrimoine', 'château', DIJON.lon, nord(300)],
        ['A2', 'osm', 'Château des Forges', 'patrimoine', 'château', DIJON.lon, nord(330)],
        ['B1', 'osm', 'Château de Ray', 'patrimoine', 'château', DIJON.lon, nord(800)],
        ['B2', 'osm', 'Parc du château de Ray', 'parcs', 'parc', DIJON.lon, nord(810)],
      ],
      async (client, b) => ({ liste: await doublons(client), bilan: b }),
    );
    expect(liste).toContainEqual({ id_source: 'A2', garde: 'A1' });
    expect(liste).toContainEqual({ id_source: 'B2', garde: null });
    expect(bilan.aRelire.map((p) => [p.id_garde, p.id_doublon])).toContainEqual(['B1', 'B2']);
  });

  it('décision « oui » : fusion même à 200 m et noms différents ; décision « non » : une paire automatique n’est plus fusionnée', async () => {
    const liste = await apres(
      [
        ['P1', 'datatourisme', 'Parc Buffon', 'parcs', 'parc', DIJON.lon, nord(300)],
        ['P2', 'osm', 'Musée et Parc Buffon', 'patrimoine', 'musée', DIJON.lon, nord(500)],
        ['J1', 'datatourisme', 'Jardin Test', 'parcs', 'jardin', DIJON.lon, nord(900)],
        ['J2', 'osm', 'Jardin Test', 'parcs', 'jardin', DIJON.lon, nord(910)],
      ],
      doublons,
      '',
      [decision('P1', 'P2', 'oui', 'datatourisme'), decision('J1', 'J2', 'non', 'datatourisme')],
    );
    expect(liste).toContainEqual({ id_source: 'P2', garde: 'P1' });
    expect(liste).toContainEqual({ id_source: 'J2', garde: null });
  });

  it('doublon avec deux candidats : une seule paire dans le rapport des fusions, la plus semblable', async () => {
    const bilan = await apres(
      [
        ['C1', 'datatourisme', 'Château de Drée', 'patrimoine', 'château', DIJON.lon, nord(300)],
        ['C2', 'datatourisme', 'Parc du Château de Drée', 'parcs', 'parc', DIJON.lon, nord(300)],
        ['C3', 'osm', 'Château de Drée', 'patrimoine', 'château', DIJON.lon, nord(320)],
      ],
      async (_client, b) => b,
    );
    const pourC3 = bilan.fusions.filter((p) => p.id_doublon === 'C3');
    expect(pourC3.map((p) => p.id_garde)).toEqual(['C1']);
  });
});

describe('rattachements — parc d’un château (D045)', () => {
  const sites = (client: pg.PoolClient) =>
    lignes(
      client,
      `SELECT l.id_source, s.id_source AS site FROM lieu l
       LEFT JOIN lieu s ON s.id = l.site_de ORDER BY 1`,
    );

  it('« Parc du château de Testville » à 300 m : partie du site du château ; « Parc de la ville » à 50 m : non', async () => {
    const resultat = await apres(
      [
        [
          'C',
          'datatourisme',
          'Château de Testville',
          'patrimoine',
          'château',
          DIJON.lon,
          nord(100),
        ],
        [
          'P',
          'datatourisme',
          'Parc du château de Testville',
          'parcs',
          'parc',
          DIJON.lon,
          nord(400),
        ],
        ['V', 'osm', 'Parc de la ville', 'parcs', 'parc', DIJON.lon, nord(150)],
      ],
      sites,
    );
    expect(resultat).toEqual([
      { id_source: 'C', site: null },
      { id_source: 'P', site: 'C' },
      { id_source: 'V', site: null },
    ]);
  });

  it('même parc à 600 m du château : pas le même site', async () => {
    const resultat = await apres(
      [
        [
          'C',
          'datatourisme',
          'Château de Testville',
          'patrimoine',
          'château',
          DIJON.lon,
          nord(100),
        ],
        [
          'P',
          'datatourisme',
          'Les Jardins du Château de Testville',
          'parcs',
          'jardin',
          DIJON.lon,
          nord(700),
        ],
      ],
      sites,
    );
    expect(resultat.every((l) => l.site === null)).toBe(true);
  });
});
