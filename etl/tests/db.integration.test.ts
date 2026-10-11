// Base de test réelle, préparée par `pnpm db:test:preparer`.
import { Readable } from 'node:stream';
import { afterAll, describe, expect, it } from 'vitest';

import { copierCsv, creerPool, enTransaction } from '../src/db';

function urlTestEtl(): string {
  if (!process.env.BDD_URL_ETL) throw new Error('BDD_URL_ETL manquante (voir .env.example).');
  const adresse = new URL(process.env.BDD_URL_ETL);
  adresse.pathname = `${adresse.pathname}_test`;
  return adresse.toString();
}

const pool = creerPool(urlTestEtl());
afterAll(() => pool.end());

const COLONNES = ['code', 'nom', 'producteur', 'url', 'licence', 'attribution'];
const CSV =
  'essai_a,A,P,https://a.example,L,Att\nessai_b,"B, avec virgule",P,https://b.example,L,Att\n';

async function compterEssais(): Promise<number> {
  const { rows } = await pool.query(
    "SELECT count(*)::int AS n FROM source_donnees WHERE code LIKE 'essai_%'",
  );
  return rows[0].n;
}

describe('copierCsv et enTransaction', () => {
  it('charge un flux CSV puis annule tout si la transaction échoue', async () => {
    await expect(
      enTransaction(pool, async (client) => {
        const nb = await copierCsv(client, 'source_donnees', COLONNES, Readable.from([CSV]));
        expect(nb).toBe(2);
        throw new Error('échec simulé après le chargement');
      }),
    ).rejects.toThrow('échec simulé');
    expect(await compterEssais()).toBe(0);
  });

  it('garde les lignes quand la transaction réussit', async () => {
    try {
      await enTransaction(pool, (client) =>
        copierCsv(client, 'source_donnees', COLONNES, Readable.from([CSV])),
      );
      expect(await compterEssais()).toBe(2);
    } finally {
      await pool.query("DELETE FROM source_donnees WHERE code LIKE 'essai_%'");
    }
  });
});
