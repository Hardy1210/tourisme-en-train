// Base de test réelle, préparée par `pnpm db:test:preparer` (10 communes d'échantillon, toutes
// référencées par une gare). Tout se passe dans une transaction annulée.
import { afterAll, describe, expect, it } from 'vitest';
import { fusionnerCommunes, TABLE_TEMPORAIRE } from '../src/chargement/communes';
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

describe('fusionnerCommunes', () => {
  it('met à jour par code INSEE, ajoute, supprime une commune libre et garde une commune référencée', async () => {
    await expect(
      enTransaction(pool, async (client) => {
        await client.query("INSERT INTO commune VALUES ('21999', 'Commune libre', '21')");
        const colonnes = TABLE_TEMPORAIRE.colonnes.map(([n, t]) => `${n} ${t}`).join(', ');
        await client.query(`CREATE TEMP TABLE tmp_commune (${colonnes}) ON COMMIT DROP`);
        await client.query(`INSERT INTO tmp_commune VALUES
          ('21231', 'Dijon (renommée)', '21'),
          ('21001', 'Agencourt', '21')`);

        const bilan = await fusionnerCommunes(client);
        expect(bilan.chargees).toBe(2);

        const { rows } = await client.query(
          "SELECT code_insee, nom FROM commune WHERE code_insee IN ('21231', '21001', '21999') ORDER BY code_insee",
        );
        expect(rows).toEqual([
          { code_insee: '21001', nom: 'Agencourt' },
          { code_insee: '21231', nom: 'Dijon (renommée)' },
        ]);

        // Commune libre absente du fichier : supprimée. Les 9 autres communes d'échantillon,
        // absentes aussi mais référencées par une gare : gardées.
        expect(bilan.supprimees).toBe(1);
        expect(bilan.gardees).toHaveLength(9);
        throw new Annulation();
      }),
    ).rejects.toBeInstanceOf(Annulation);
  });
});
