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
  it('met à jour par code UIC commun (id gardé), ajoute, et ne supprime jamais une gare référencée', async () => {
    const avant = await pool.query("SELECT id FROM gare WHERE uic = 'EX000001'");
    const beaune = await pool.query("SELECT id FROM gare WHERE uic = 'EX000002'");

    await expect(
      enTransaction(pool, async (client) => {
        const colonnes = TABLE_TEMPORAIRE.colonnes.map(([n, t]) => `${n} ${t}`).join(', ');
        await client.query(`CREATE TEMP TABLE tmp_gare (${colonnes}) ON COMMIT DROP`);
        await client.query(`INSERT INTO tmp_gare VALUES
          ('EX000001', '{EX000001}', 'Dijon (renommée)', '21231', true, 5.0272, 47.3233),
          ('EX000099', '{EX000099,EX000002}', 'Beaune', '21054', true, 4.8436, 47.0237),
          ('87000001', '{87000001,87000002}', 'Nouvelle gare', '21054', true, 4.84, 47.02),
          ('87000003', '{87000003}', 'Gare d''une commune fusionnée', '85166', false, -1.77, 46.53)`);

        const bilan = await fusionnerGares(client);
        expect(bilan.chargees).toBe(4);
        expect(bilan.ajoutees).toBe(2);

        const { rows } = await client.query(
          "SELECT id, nom, code_insee FROM gare WHERE uic = 'EX000001'",
        );
        expect(rows[0]).toEqual({
          id: avant.rows[0].id,
          nom: 'Dijon (renommée)',
          code_insee: '21231',
        });

        // Ordre des codes changé (cas réel de Paris Gare de Lyon, D039) : même gare, nouveau code principal.
        const renumerotee = await client.query(
          "SELECT id, uic FROM gare WHERE 'EX000002' = ANY(codes_uic)",
        );
        expect(renumerotee.rows).toEqual([{ id: beaune.rows[0].id, uic: 'EX000099' }]);

        // Code absent de `commune` : gare chargée, sans commune, et signalée (D038).
        const fusionnee = await client.query("SELECT code_insee FROM gare WHERE uic = '87000003'");
        expect(fusionnee.rows[0]).toEqual({ code_insee: null });
        expect(bilan.sansCommune).toEqual(["Gare d'une commune fusionnée (85166)"]);

        // Les 8 autres gares d'échantillon sont absentes du « fichier » : supprimées ou gardées.
        expect(bilan.supprimees + bilan.gardees.length).toBe(8);
        const referencees = await client.query(
          "SELECT count(DISTINCT gare_id)::int AS n FROM passage p JOIN gare g ON g.id = p.gare_id WHERE g.uic NOT IN ('EX000001', 'EX000099')",
        );
        expect(bilan.gardees).toHaveLength(referencees.rows[0].n);
        expect(referencees.rows[0].n).toBeGreaterThan(0);

        throw new Annulation();
      }),
    ).rejects.toBeInstanceOf(Annulation);
  });
});

/** Résultat d'un contrôle de `CONTROLES` sur ces lignes de fichier (après `preparation`, annulée). */
async function controler(
  nom: string,
  lignes: string,
  preparation = '',
): Promise<boolean | undefined> {
  let reussi: boolean | undefined;
  await expect(
    enTransaction(pool, async (client) => {
      if (preparation) await client.query(preparation);
      const colonnes = TABLE_TEMPORAIRE.colonnes.map(([n, t]) => `${n} ${t}`).join(', ');
      await client.query(`CREATE TEMP TABLE tmp_gare (${colonnes}) ON COMMIT DROP`);
      await client.query(`INSERT INTO tmp_gare VALUES ${lignes}`);
      const resultats = await executerControles(client, CONTROLES);
      reussi = resultats.find((r) => r.nom.startsWith(nom))?.reussi;
      throw new Annulation();
    }),
  ).rejects.toBeInstanceOf(Annulation);
  return reussi;
}

describe('contrôle « gares de la région sans commune »', () => {
  const nom = 'Gares de la région sans commune';

  it('gare hors région au code inconnu : accepté', async () => {
    expect(
      await controler(nom, `('87000003', '{87000003}', 'Olonne', '85166', false, -1.77, 46.53)`),
    ).toBe(true);
  });

  it('gare de la région au code inconnu : bloquant', async () => {
    expect(
      await controler(nom, `('87000004', '{87000004}', 'Inconnue', '21999', true, 5, 47.3)`),
    ).toBe(false);
  });
});

describe('contrôles des codes UIC (D039)', () => {
  const dole = `('EX000003', '{EX000003}', 'Dole', '39198', true, 5.4935, 47.0926)`;

  it('codes distincts entre les lignes du fichier : accepté', async () => {
    const autre = `('87000005', '{87000005}', 'Autre', '39198', true, 5.5, 47.1)`;
    expect(await controler('Code UIC présent dans plusieurs lignes', `${dole}, ${autre}`)).toBe(
      true,
    );
  });

  it('un code UIC dans deux lignes du fichier : bloquant', async () => {
    const autre = `('87000005', '{87000005,EX000003}', 'Autre', '39198', true, 5.5, 47.1)`;
    expect(await controler('Code UIC présent dans plusieurs lignes', `${dole}, ${autre}`)).toBe(
      false,
    );
  });

  it('ligne correspondant à une seule gare en base : accepté', async () => {
    expect(await controler('Ligne du fichier correspondant à plusieurs gares', dole)).toBe(true);
  });

  it('ligne correspondant à deux gares en base (doublon) : bloquant', async () => {
    const doublon = `INSERT INTO gare (uic, codes_uic, nom, dans_region, geom)
      VALUES ('EX000098', '{EX000098,EX000003}', 'Dole (doublon)', true, ST_MakePoint(5.49, 47.09)::geography)`;
    expect(await controler('Ligne du fichier correspondant à plusieurs gares', dole, doublon)).toBe(
      false,
    );
  });
});
