// Base de test réelle, préparée par `pnpm db:test:preparer` (10 gares d'échantillon `EX…`,
// dont certaines référencées par des passages). Tout se passe dans une transaction annulée.
import { afterAll, describe, expect, it } from 'vitest';
import { fusionnerGares, TABLE_TEMPORAIRE } from '../src/chargement/gares';
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

describe('fusionnerGares', () => {
  it('met à jour par uic (id gardé), ajoute, et ne supprime jamais une gare référencée', async () => {
    const avant = await pool.query("SELECT id FROM gare WHERE uic = 'EX000001'");

    await expect(
      enTransaction(pool, async (client) => {
        const colonnes = TABLE_TEMPORAIRE.colonnes.map(([n, t]) => `${n} ${t}`).join(', ');
        await client.query(`CREATE TEMP TABLE tmp_gare (${colonnes}) ON COMMIT DROP`);
        await client.query(`INSERT INTO tmp_gare VALUES
          ('EX000001', '{EX000001}', 'Dijon (renommée)', 'Dijon', '21231', '21', true, 5.0272, 47.3233),
          ('87000001', '{87000001,87000002}', 'Nouvelle gare', null, '21054', '21', true, 4.84, 47.02)`);

        const bilan = await fusionnerGares(client);
        expect(bilan.chargees).toBe(2);

        const { rows } = await client.query("SELECT id, nom FROM gare WHERE uic = 'EX000001'");
        expect(rows[0]).toEqual({ id: avant.rows[0].id, nom: 'Dijon (renommée)' });

        // Les 9 autres gares d'échantillon sont absentes du « fichier » : supprimées ou gardées.
        expect(bilan.supprimees + bilan.gardees.length).toBe(9);
        const referencees = await client.query(
          "SELECT count(DISTINCT gare_id)::int AS n FROM passage p JOIN gare g ON g.id = p.gare_id WHERE g.uic <> 'EX000001'",
        );
        expect(bilan.gardees).toHaveLength(referencees.rows[0].n);
        expect(referencees.rows[0].n).toBeGreaterThan(0);

        throw new Annulation();
      }),
    ).rejects.toBeInstanceOf(Annulation);
  });
});
