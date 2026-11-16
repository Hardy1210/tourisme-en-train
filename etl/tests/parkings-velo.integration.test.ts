// Base de test réelle : gares d'exemple (Dijon-Ville EX000001 : 5.0272, 47.3233 ; Lyon-Part-Dieu EX000010,
// hors région). Chaque test charge ses propres parkings dans une transaction annulée.
import type pg from 'pg';
import { afterAll, describe, expect, it } from 'vitest';
import { chargerParkingsVeloDans } from '../src/chargement/parkings-velo';
import { chargerTransportLocalDans } from '../src/chargement/transport-local';
import { creerPool, enTransaction } from '../src/db';
import type { ParkingVelo } from '../src/transformations/osm';

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
const LYON = { lon: 4.8597, lat: 45.7605 };
/** Parking à `m` mètres au nord d'une gare (1° de latitude ≈ 111 195 m). */
const parking = (id: string, m: number, gare = DIJON): ParkingVelo => ({
  idSource: id,
  nom: 'Parking vélo',
  lon: gare.lon,
  lat: gare.lat + m / 111_195,
});

type Ligne = { id_source: string; uic: string; distance_m: number; type: string };

/** Charge dans une transaction annulée ; `ensuite` s'exécute après les parkings, dans la même transaction. */
async function charger(
  parkings: ParkingVelo[],
  ensuite?: (client: pg.PoolClient) => Promise<void>,
): Promise<Ligne[]> {
  let lignes: Ligne[] = [];
  await expect(
    enTransaction(pool, async (client: pg.PoolClient) => {
      // La source `osm` existe en vrai après l'étape `sources` ; la base de test n'a que l'échantillon.
      await client.query(`INSERT INTO source_donnees (code, nom, producteur, url, licence, attribution)
        VALUES ('osm', 'OpenStreetMap', 'Test', 'https://example.org', 'ODbL', 'Test')
        ON CONFLICT (code) DO NOTHING`);
      await chargerParkingsVeloDans(client, parkings);
      await ensuite?.(client);
      lignes = (
        await client.query<Ligne>(
          `SELECT m.id_source, g.uic, m.distance_m, m.type FROM mobilite_locale m
           JOIN gare g ON g.id = m.gare_id WHERE m.type = 'PARKING_VELO' ORDER BY m.id_source`,
        )
      ).rows;
      throw new Annulation();
    }),
  ).rejects.toBeInstanceOf(Annulation);
  return lignes;
}

describe('chargerParkingsVeloDans (04 § 4.7 bis, D097)', () => {
  it('parking à 190 m de la gare gardé ; à 210 m écarté (rayonParkingVeloM = 200, vol d’oiseau)', async () => {
    const lignes = await charger([parking('P190', 190), parking('P210', 210)]);
    expect(lignes.map((l) => [l.id_source, l.uic])).toEqual([['P190', 'EX000001']]);
    // distance_m reste une distance à pied, comme les autres lignes : 190 × 1,3.
    expect(lignes[0]?.distance_m).toBe(247);
  });

  it('gare hors région : aucun parking rattaché', async () => {
    expect(await charger([parking('PLYON', 50, LYON)])).toEqual([]);
  });

  it('un nouveau chargement remplace les anciens parkings', async () => {
    const lignes = await charger([parking('ANCIEN', 50)], async (client) => {
      await chargerParkingsVeloDans(client, [parking('NOUVEAU', 60)]);
    });
    expect(lignes.map((l) => l.id_source)).toEqual(['NOUVEAU']);
  });

  it('le chargement des transports sur place ne les efface pas', async () => {
    const lignes = await charger([parking('P50', 50)], async (client) => {
      await client.query(`INSERT INTO source_donnees (code, nom, producteur, url, licence, attribution)
        VALUES ('reseau_test', 'Réseau test', 'Test', 'https://example.org', 'ODbL', 'Test')
        ON CONFLICT (code) DO NOTHING`);
      await chargerTransportLocalDans(
        client,
        new Map([
          ['reseau_test', [{ idSource: 'A', nom: 'Gare', type: 'BUS', lignes: ['1'], ...DIJON }]],
        ]),
      );
    });
    expect(lignes.map((l) => l.id_source)).toEqual(['P50']);
  });
});
