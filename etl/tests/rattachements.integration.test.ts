// Base de test réelle (`pnpm test:integration`) : gares d'exemple de db/echantillon/echantillon.sql.
// Chaque test remplace les lieux d'exemple par son propre scénario, calcule les rattachements, puis
// annule tout. Lieux inventés (nom « Test … ») près de Dijon-Ville (5.0272, 47.3233).
import type pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';
import { calculerRattachementsDans } from '../src/chargement/rattachements';
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
  lire: (client: pg.PoolClient) => Promise<T>,
  preparation = '',
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
      await calculerRattachementsDans(client);
      resultat = await lire(client);
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
  it('lieu à 1 430 m à pied rattaché à Dijon-Ville ; lieu à 1 625 m à pied non rattaché', async () => {
    const liens = await apres(
      [
        ['PRES', 'osm', 'Test parc proche', 'parcs', 'parc', DIJON.lon, nord(1100)],
        ['LOIN', 'osm', 'Test parc loin', 'parcs', 'parc', DIJON.lon, nord(1250)],
      ],
      rattaches,
    );
    const dijon = liens.filter((l) => l.uic === 'EX000001');
    expect(dijon.map((l) => l.id_source)).toEqual(['PRES']);
    expect(dijon[0]?.distance_m).toBe(1430);
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
