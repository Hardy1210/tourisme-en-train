// Base de test réelle (`pnpm db:test:preparer`, données d'exemple) : mise à jour des descriptions (D105) dans une
// transaction annulée. Seules les fiches données changent ; les autres gardent leur texte.
import type pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';
import {
  lireDescriptionsActuelles,
  mettreAJourDescriptions,
} from '../src/chargement/descriptions';
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

async function dansTransactionAnnulee(test: (client: pg.PoolClient) => Promise<void>) {
  await expect(
    enTransaction(pool, async (client) => {
      await test(client);
      throw new Annulation();
    }),
  ).rejects.toBeInstanceOf(Annulation);
}

describe('descriptions en base (D105)', () => {
  it('lit les lieux d’une source et ne remplace que ceux qu’on lui donne', async () => {
    await dansTransactionAnnulee(async (client) => {
      const avant = await lireDescriptionsActuelles(client, 'echantillon');
      const [premier, second] = avant;
      expect(premier && second).toBeTruthy();
      if (!premier || !second) return;

      const nouvelle = 'Donnée d’exemple.\n\nUn second paragraphe.';
      expect(await mettreAJourDescriptions(client, [{ id: premier.id, description: nouvelle }])).toBe(1);

      const apres = new Map(
        (await lireDescriptionsActuelles(client, 'echantillon')).map((l) => [l.id, l.description]),
      );
      expect(apres.get(premier.id)).toBe(nouvelle);
      expect(apres.get(second.id)).toBe(second.description);
    });
  });

  it('limite : rien à remplacer → aucune ligne touchée', async () => {
    await dansTransactionAnnulee(async (client) => {
      expect(await mettreAJourDescriptions(client, [])).toBe(0);
    });
  });
});
