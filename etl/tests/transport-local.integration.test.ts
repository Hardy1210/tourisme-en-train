// Base de test réelle : gares d'exemple (Dijon-Ville EX000001 : 5.0272, 47.3233). Chaque test charge
// ses propres arrêts dans une transaction annulée.
import type pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';
import { chargerTransportLocalDans } from '../src/chargement/transport-local';
import { creerPool, enTransaction } from '../src/db';
import type { ArretNormalise } from '../src/transformations/transport-local';

function urlTestEtl(): string {
  if (!process.env.BDD_URL_ETL) throw new Error('BDD_URL_ETL manquante (voir .env.example).');
  const adresse = new URL(process.env.BDD_URL_ETL);
  adresse.pathname = `${adresse.pathname}_test`;
  return adresse.toString();
}

const pool = creerPool(urlTestEtl());
afterAll(() => pool.end());
class Annulation extends Error {}

const DIJON = { lon: 5.0272, lat: 47.3233 };
/** Arrêt à `m` mètres au nord de Dijon-Ville (1° de latitude ≈ 111 195 m). */
const arret = (id: string, nom: string, m: number, lignes = ['1']): ArretNormalise => ({
  idSource: id,
  nom,
  type: 'BUS',
  lignes,
  lon: DIJON.lon,
  lat: DIJON.lat + m / 111_195,
});

async function charger(arrets: ArretNormalise[]): Promise<Record<string, unknown>[]> {
  let lignes: Record<string, unknown>[] = [];
  await expect(
    enTransaction(pool, async (client: pg.PoolClient) => {
      await client.query(`INSERT INTO source_donnees (code, nom, producteur, url, licence, attribution)
        VALUES ('reseau_test', 'Réseau test', 'Test', 'https://example.org', 'ODbL', 'Test')
        ON CONFLICT (code) DO NOTHING`);
      await chargerTransportLocalDans(client, new Map([['reseau_test', arrets]]));
      lignes = (
        await client.query(
          `SELECT m.id_source, m.nom, m.lignes, m.distance_m, g.uic FROM mobilite_locale m
           JOIN gare g ON g.id = m.gare_id WHERE m.source = 'reseau_test' ORDER BY g.uic, m.id_source`,
        )
      ).rows;
      throw new Annulation();
    }),
  ).rejects.toBeInstanceOf(Annulation);
  return lignes.filter((l) => l.uic === 'EX000001');
}

describe('chargerTransportLocalDans (04 § 4.7, D046)', () => {
  it('deux quais « République » à 30 m : un seul arrêt, lignes réunies ; deux noms différents à 30 m : deux arrêts', async () => {
    const memeNom = await charger([
      arret('Q1', 'République', 200, ['3']),
      arret('Q2', 'République', 230, ['10']),
    ]);
    expect(memeNom.map((l) => [l.id_source, l.lignes])).toEqual([['Q1', ['3', '10']]]);
    const nomsDifferents = await charger([
      arret('A', 'République', 200),
      arret('B', 'Liberté', 230),
    ]);
    expect(nomsDifferents).toHaveLength(2);
  });

  it('arrêt à 790 m à pied gardé ; à 810 m à pied écarté', async () => {
    const lignes = await charger([
      arret('PRES', 'Près', 790 / 1.3),
      arret('LOIN', 'Loin', 810 / 1.3),
    ]);
    expect(lignes.map((l) => l.id_source)).toEqual(['PRES']);
  });
});
