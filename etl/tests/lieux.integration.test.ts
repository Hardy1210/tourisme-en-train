// Base de test réelle, préparée par `pnpm db:test:preparer` (communes d'échantillon, sans contour).
// Contours, règles et lieux d'essai sont créés dans une transaction annulée (E05, D041).
import type pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';
import {
  CONTROLES as CONTROLES_CONTOURS,
  fusionnerContours,
  TABLE_TEMPORAIRE as TABLE_CONTOURS,
} from '../src/chargement/contours';
import {
  fusionnerLieux,
  TABLE_TEMPORAIRE as TABLE_LIEUX,
  trouverCommunes,
} from '../src/chargement/lieux';
import {
  CONTROLES as CONTROLES_REGLES,
  remplacerRegles,
  TABLE_TEMPORAIRE as TABLE_REGLES,
} from '../src/chargement/regles';
import { echecsBloquants, executerControles } from '../src/controles/base';
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

/** Exécute `test` dans une transaction toujours annulée. */
async function dansTransactionAnnulee(test: (client: pg.PoolClient) => Promise<void>) {
  await expect(
    enTransaction(pool, async (client) => {
      await test(client);
      throw new Annulation();
    }),
  ).rejects.toBeInstanceOf(Annulation);
}

async function creerTable(
  client: pg.ClientBase,
  table: { nom: string; colonnes: readonly (readonly [string, string])[] },
) {
  const colonnes = table.colonnes.map(([n, t]) => `${n} ${t}`).join(', ');
  await client.query(`CREATE TEMP TABLE ${table.nom} (${colonnes}) ON COMMIT DROP`);
}

/** Carré [lon1, lon2] × [lat1, lat2] en GeoJSON. */
const carre = (lon1: number, lon2: number, lat1: number, lat2: number) =>
  JSON.stringify({
    type: 'Polygon',
    coordinates: [
      [
        [lon1, lat1],
        [lon2, lat1],
        [lon2, lat2],
        [lon1, lat2],
        [lon1, lat1],
      ],
    ],
  });

// Contours d'essai (carrés grossiers, pas les vrais contours).
const DIJON = carre(4.95, 5.1, 47.28, 47.37);
const BEAUNE = carre(4.78, 4.9, 46.98, 47.06);

async function poserContours(client: pg.ClientBase) {
  await client.query(
    `UPDATE commune SET contour = ST_Multi(ST_GeomFromGeoJSON(
       CASE code_insee WHEN '21231' THEN $1 ELSE $2 END))::geography
     WHERE code_insee IN ('21231', '21054')`,
    [DIJON, BEAUNE],
  );
}

describe('fusionnerContours', () => {
  it('pose le contour des communes du fichier et retire celui des communes absentes', async () => {
    await dansTransactionAnnulee(async (client) => {
      await poserContours(client);
      await creerTable(client, TABLE_CONTOURS);
      await client.query("INSERT INTO tmp_contour VALUES ('21231', 'Dijon', $1)", [DIJON]);

      expect(await fusionnerContours(client)).toEqual({ chargees: 1, retires: 1 });
      const { rows } = await client.query(
        `SELECT code_insee, contour IS NOT NULL AS a_contour FROM commune
         WHERE code_insee IN ('21231', '21054') ORDER BY code_insee`,
      );
      expect(rows).toEqual([
        { code_insee: '21054', a_contour: false },
        { code_insee: '21231', a_contour: true },
      ]);
    });
  });

  it('contour d’une commune absente de la table commune : bloquant', async () => {
    await dansTransactionAnnulee(async (client) => {
      await creerTable(client, TABLE_CONTOURS);
      await client.query("INSERT INTO tmp_contour VALUES ('21999', 'Inconnue', $1)", [DIJON]);
      const echecs = echecsBloquants(await executerControles(client, CONTROLES_CONTOURS));
      expect(echecs.map((e) => e.nom)).toContain(
        'Contours dont la commune est absente de la table commune (pnpm etl communes ?)',
      );
    });
  });
});

describe('trouverCommunes + fusionnerLieux', () => {
  /** Valeurs d'une ligne de tmp_lieu, dans l'ordre de TABLE_LIEUX. */
  const ligne = (id: string, nom: string, lon: number, lat: number) => [
    id,
    nom,
    'parcs',
    'parc',
    null,
    null,
    null,
    null,
    null,
    false,
    lon,
    lat,
  ];

  async function charger(client: pg.ClientBase, lignes: unknown[][]) {
    await creerTable(client, TABLE_LIEUX);
    for (const valeurs of lignes) {
      await client.query(
        `INSERT INTO tmp_lieu VALUES (${valeurs.map((_, i) => `$${i + 1}`).join(', ')})`,
        valeurs,
      );
    }
    await trouverCommunes(client);
    const bilan = await fusionnerLieux(client, 'osm');
    await client.query('DROP TABLE tmp_lieu');
    return bilan;
  }

  it('commune par le contour, hors région écarté ; rechargé : même id, lieu disparu supprimé', async () => {
    await dansTransactionAnnulee(async (client) => {
      await client.query(`INSERT INTO source_donnees (code, nom, producteur, url, licence, attribution)
        VALUES ('osm', 'OSM (essai)', 'essai', 'https://example.org', 'ODbL', 'essai')
        ON CONFLICT (code) DO NOTHING`);
      await poserContours(client);

      const premier = await charger(client, [
        ligne('node/1', 'Parc de Dijon', 5.03, 47.32),
        ligne('node/2', 'Parc de Beaune', 4.84, 47.02),
        ligne('node/3', 'Parc de Lyon', 4.85, 45.76),
      ]);
      expect(premier).toMatchObject({ chargees: 2, horsRegion: 1, supprimees: 0 });
      const avant = await client.query(
        "SELECT id_source, id, code_insee FROM lieu WHERE source = 'osm' ORDER BY id_source",
      );
      expect(avant.rows.map((r) => [r.id_source, r.code_insee])).toEqual([
        ['node/1', '21231'],
        ['node/2', '21054'],
      ]);

      const second = await charger(client, [
        ligne('node/1', 'Parc de Dijon (renommé)', 5.03, 47.32),
      ]);
      expect(second).toMatchObject({ chargees: 1, supprimees: 1 });
      const apres = await client.query("SELECT id, nom FROM lieu WHERE source = 'osm'");
      expect(apres.rows).toEqual([{ id: avant.rows[0].id, nom: 'Parc de Dijon (renommé)' }]);
    });
  });
});

describe('raccorderTroncons (lieux en longueur, D043)', () => {
  it('deux tronçons de même nom qui se touchent : un seul lieu avec tout le tracé ; même nom à 20 km : un autre lieu', async () => {
    await dansTransactionAnnulee(async (client) => {
      await client.query(`INSERT INTO source_donnees (code, nom, producteur, url, licence, attribution)
        VALUES ('osm', 'OSM (essai)', 'essai', 'https://example.org', 'ODbL', 'essai')
        ON CONFLICT (code) DO NOTHING`);
      await poserContours(client);
      await creerTable(client, TABLE_LIEUX);
      const troncon = (id: string, coordonnees: number[][]) =>
        client.query(
          `INSERT INTO tmp_lieu (id_source, nom, categorie, sous_categorie, qualite_tourisme, lon, lat, trace)
           VALUES ($1, 'Canal de Test', 'nature', 'canal', false, $2, $3, $4)`,
          [
            id,
            coordonnees[0]?.[0],
            coordonnees[0]?.[1],
            JSON.stringify({ type: 'LineString', coordinates: coordonnees }),
          ],
        );
      await troncon('way/2', [
        [5.03, 47.32],
        [5.04, 47.32],
      ]);
      await troncon('way/1', [
        [5.04, 47.32],
        [5.05, 47.32],
      ]);
      await troncon('way/3', [
        [4.84, 47.02],
        [4.85, 47.02],
      ]);
      await trouverCommunes(client);
      await fusionnerLieux(client, 'osm');
      const { rows } = await client.query(
        `SELECT id_source, round(ST_Length(trace)::numeric, -2)::int AS longueur_m
         FROM lieu WHERE source = 'osm' ORDER BY id_source`,
      );
      // 2 × 0,01° de longitude à 47° ≈ 1 500 m ; un tronçon seul ≈ 800 m.
      expect(rows).toEqual([
        { id_source: 'way/1', longueur_m: 1500 },
        { id_source: 'way/3', longueur_m: 800 },
      ]);
    });
  });
});

describe('remplacerRegles', () => {
  it('remplace toutes les règles ; une règle en double est bloquante', async () => {
    await dansTransactionAnnulee(async (client) => {
      await creerTable(client, TABLE_REGLES);
      await client.query(`INSERT INTO tmp_regle VALUES
        ('datatourisme', 'categorie', 'Museum', 'patrimoine', 'musée', 20, NULL),
        ('osm', 'leisure', 'playground', 'enfants', 'aire de jeux', 20, 'sans_nom')`);
      expect(echecsBloquants(await executerControles(client, CONTROLES_REGLES))).toEqual([]);
      expect(await remplacerRegles(client)).toBe(2);

      await client.query(
        "INSERT INTO tmp_regle VALUES ('osm', 'leisure', 'playground', 'parcs', NULL, 30, NULL)",
      );
      const echecs = echecsBloquants(await executerControles(client, CONTROLES_REGLES));
      expect(echecs.map((e) => e.nom)).toEqual(['Règles en double (même source, clé et valeur)']);
    });
  });
});
