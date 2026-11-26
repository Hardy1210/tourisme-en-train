// Chargement des textes Wikipédia dans `description_lieu` (D123) sur la base de test : seules les lignes
// `wikipedia` sont remplacées, nos propres textes (`wagoo`) restent ; la base refuse un texte vide.
// Chaque test travaille dans une transaction annulée.
import { sources } from '@tourisme/commun';
import type pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';
import {
  chargerTextesWikipediaDans,
  lireLieuxPourTextes,
} from '../src/chargement/descriptions-wikipedia';
import { creerPool, enTransaction } from '../src/db';
import { enregistrerSources } from '../src/sources/registre';

function urlTestEtl(): string {
  if (!process.env.BDD_URL_ETL) throw new Error('BDD_URL_ETL manquante (voir .env.example).');
  const adresse = new URL(process.env.BDD_URL_ETL);
  adresse.pathname = `${adresse.pathname}_test`;
  return adresse.toString();
}

const pool = creerPool(urlTestEtl());
afterAll(() => pool.end());
class Annulation extends Error {}

async function dansTransaction(travail: (client: pg.PoolClient) => Promise<void>): Promise<void> {
  await expect(
    enTransaction(pool, async (client) => {
      await enregistrerSources(client, sources);
      await travail(client);
      throw new Annulation();
    }),
  ).rejects.toBeInstanceOf(Annulation);
}

async function idLieu(client: pg.PoolClient, idSource: string): Promise<number> {
  const { rows } = await client.query<{ id: string }>('SELECT id FROM lieu WHERE id_source = $1', [
    idSource,
  ]);
  return Number(rows[0]?.id);
}

const lire = async (client: pg.PoolClient) =>
  (
    await client.query<{ lieu_id: string; origine: string; texte: string; credit: string }>(
      'SELECT lieu_id, origine, texte, credit FROM description_lieu ORDER BY lieu_id, origine',
    )
  ).rows;

describe('chargerTextesWikipediaDans', () => {
  it('remplace entièrement les textes Wikipédia, crédit et licence compris', async () => {
    await dansTransaction(async (client) => {
      const l01 = await idLieu(client, 'ECH_L01');
      const l02 = await idLieu(client, 'ECH_L02');
      await chargerTextesWikipediaDans(client, [{ lieuId: l01, texte: 'Ancien.', lien: null }]);
      expect(
        await chargerTextesWikipediaDans(client, [
          { lieuId: l02, texte: 'Nouveau.', lien: 'https://fr.wikipedia.org/wiki/X' },
        ]),
      ).toBe(1);
      expect(await lire(client)).toEqual([
        { lieu_id: String(l02), origine: 'wikipedia', texte: 'Nouveau.', credit: 'Wikipédia' },
      ]);
    });
  });

  it('limite : nos propres textes (wagoo) ne sont jamais touchés', async () => {
    await dansTransaction(async (client) => {
      const l01 = await idLieu(client, 'ECH_L01');
      await client.query(
        "INSERT INTO description_lieu (lieu_id, origine, texte, credit) VALUES ($1, 'wagoo', 'Notre texte.', 'Wagoo')",
        [l01],
      );
      await chargerTextesWikipediaDans(client, [{ lieuId: l01, texte: 'Wiki.', lien: null }]);
      await chargerTextesWikipediaDans(client, []);
      expect((await lire(client)).map((r) => r.origine)).toEqual(['wagoo']);
    });
  });

  it('limite : la base refuse un texte vide et une origine inconnue', async () => {
    await dansTransaction(async (client) => {
      const l01 = await idLieu(client, 'ECH_L01');
      await client.query('SAVEPOINT avant');
      await expect(
        chargerTextesWikipediaDans(client, [{ lieuId: l01, texte: '  ', lien: null }]),
      ).rejects.toThrow(/description_lieu_texte_check/);
      await client.query('ROLLBACK TO SAVEPOINT avant');
      await expect(
        client.query(
          "INSERT INTO description_lieu (lieu_id, origine, texte, credit) VALUES ($1, 'osm', 'x', 'y')",
          [l01],
        ),
      ).rejects.toThrow(/description_lieu_origine_check/);
    });
  });
});

describe('lireLieuxPourTextes', () => {
  it('donne chaque lieu avec sa commune, pour le contrôle « article de la commune »', async () => {
    const lieux = await lireLieuxPourTextes(pool);
    expect(lieux.length).toBeGreaterThan(0);
    expect(lieux.some((l) => l.commune !== null)).toBe(true);
  });
});
