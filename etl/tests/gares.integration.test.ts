// Base de test réelle, préparée par `pnpm db:test:preparer` (10 gares d'échantillon `EX…`,
// dont certaines référencées par des passages). Tout se passe dans une transaction annulée.
import { afterAll, describe, expect, it } from 'vitest';
import { CONTROLES, fusionnerGares, TABLE_TEMPORAIRE } from '../src/chargement/gares';
import { executerControles } from '../src/controles/base';
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
          ('EX000001', '{EX000001}', 'Dijon (renommée)', '21231', true, 5.0272, 47.3233),
          ('87000001', '{87000001,87000002}', 'Nouvelle gare', '21054', true, 4.84, 47.02),
          ('87000003', '{87000003}', 'Gare d''une commune fusionnée', '85166', false, -1.77, 46.53)`);

        const bilan = await fusionnerGares(client);
        expect(bilan.chargees).toBe(3);

        const { rows } = await client.query(
          "SELECT id, nom, code_insee FROM gare WHERE uic = 'EX000001'",
        );
        expect(rows[0]).toEqual({
          id: avant.rows[0].id,
          nom: 'Dijon (renommée)',
          code_insee: '21231',
        });

        // Code absent de `commune` : gare chargée, sans commune, et signalée (D038).
        const fusionnee = await client.query("SELECT code_insee FROM gare WHERE uic = '87000003'");
        expect(fusionnee.rows[0]).toEqual({ code_insee: null });
        expect(bilan.sansCommune).toEqual(["Gare d'une commune fusionnée (85166)"]);

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

describe('contrôle « gares de la région sans commune »', () => {
  async function controler(lignes: string): Promise<boolean | undefined> {
    let reussi: boolean | undefined;
    await expect(
      enTransaction(pool, async (client) => {
        const colonnes = TABLE_TEMPORAIRE.colonnes.map(([n, t]) => `${n} ${t}`).join(', ');
        await client.query(`CREATE TEMP TABLE tmp_gare (${colonnes}) ON COMMIT DROP`);
        await client.query(`INSERT INTO tmp_gare VALUES ${lignes}`);
        const resultats = await executerControles(client, CONTROLES);
        reussi = resultats.find((r) => r.nom.startsWith('Gares de la région sans commune'))?.reussi;
        throw new Annulation();
      }),
    ).rejects.toBeInstanceOf(Annulation);
    return reussi;
  }

  it('gare hors région au code inconnu : accepté', async () => {
    expect(
      await controler(`('87000003', '{87000003}', 'Olonne', '85166', false, -1.77, 46.53)`),
    ).toBe(true);
  });

  it('gare de la région au code inconnu : bloquant', async () => {
    expect(await controler(`('87000004', '{87000004}', 'Inconnue', '21999', true, 5, 47.3)`)).toBe(
      false,
    );
  });
});
