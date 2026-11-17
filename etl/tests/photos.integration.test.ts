// Chargement de `photo_lieu` (D100) sur la base de test : une photo par lieu, remplacée à chaque
// chargement ; la base refuse une photo sans crédit ou aux dates de droits incohérentes. Chaque test
// travaille dans une transaction annulée.
import { sources } from '@tourisme/commun';
import type pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';
import { chargerPhotosDans, type PhotoACharger } from '../src/chargement/photos';
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

const photo = (lieuId: number, autre: Partial<PhotoACharger> = {}): PhotoACharger => ({
  lieuId,
  origine: 'wikidata',
  source: 'wikimedia_commons',
  fichier: 'Exemple.jpg',
  urlPetite: 'https://upload.wikimedia.org/exemple/400px-Exemple.jpg',
  urlGrande: 'https://upload.wikimedia.org/exemple/800px-Exemple.jpg',
  auteur: 'Exemple',
  licence: 'CC BY-SA 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
  page: 'https://commons.wikimedia.org/wiki/File:Exemple.jpg',
  droitsDebut: null,
  droitsFin: null,
  ...autre,
});

type Ligne = { lieu_id: string; fichier: string; auteur: string; droits_fin: string | null };
const lire = async (client: pg.PoolClient) =>
  (
    await client.query<Ligne>(
      "SELECT lieu_id, fichier, auteur, to_char(droits_fin, 'YYYY-MM-DD') AS droits_fin FROM photo_lieu ORDER BY lieu_id",
    )
  ).rows;

describe('chargerPhotosDans', () => {
  it('charge une photo par lieu et remplace entièrement le chargement précédent', async () => {
    await dansTransaction(async (client) => {
      const l01 = await idLieu(client, 'ECH_L01');
      const l02 = await idLieu(client, 'ECH_L02');
      expect(
        await chargerPhotosDans(client, [photo(l01), photo(l02, { fichier: 'Autre.jpg' })]),
      ).toBe(2);
      expect(
        await chargerPhotosDans(client, [
          photo(l02, {
            source: 'datatourisme_photos',
            origine: 'datatourisme',
            auteur: 'OT',
            licence: 'Licence Ouverte',
            page: null,
            droitsFin: '2027-06-30',
          }),
        ]),
      ).toBe(1);
      expect(await lire(client)).toEqual([
        { lieu_id: String(l02), fichier: 'Exemple.jpg', auteur: 'OT', droits_fin: '2027-06-30' },
      ]);
    });
  });

  it('limite : sans auteur, la base refuse la photo (dernier garde-fou du crédit obligatoire)', async () => {
    await dansTransaction(async (client) => {
      const l01 = await idLieu(client, 'ECH_L01');
      await expect(chargerPhotosDans(client, [photo(l01, { auteur: ' ' })])).rejects.toThrow(
        /photo_lieu_auteur_check/,
      );
    });
  });

  it('limite : droits qui finissent avant de commencer → refusés', async () => {
    await dansTransaction(async (client) => {
      const l01 = await idLieu(client, 'ECH_L01');
      await expect(
        chargerPhotosDans(client, [
          photo(l01, { droitsDebut: '2027-01-01', droitsFin: '2026-01-01' }),
        ]),
      ).rejects.toThrow(/photo_lieu_droits_check/);
    });
  });
});
