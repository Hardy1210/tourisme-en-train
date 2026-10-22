// Base de test réelle, préparée par `pnpm db:test:preparer`. Transactions toujours annulées.
import { Readable } from 'node:stream';
import { afterAll, describe, expect, it } from 'vitest';
import { chargerGtfsBrut, type OuvrirFichier } from '../src/chargement/gtfs-brut';
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

/** GTFS minimal en mémoire ; `remplacer` modifie ou retire (null) un fichier. */
function gtfs(remplacer: Record<string, string | null> = {}): OuvrirFichier {
  const fichiers: Record<string, string | null> = {
    'agency.txt': 'agency_id,agency_timezone\n1,Europe/Paris\n',
    'routes.txt': 'route_id,route_short_name\nR1,K7\n',
    'trips.txt': 'route_id,service_id,trip_id,trip_headsign\nR1,S1,T1,17821\n',
    // Colonnes dans un autre ordre que le standard, sans pickup_type ni drop_off_type.
    'stop_times.txt':
      'stop_sequence,trip_id,stop_id,departure_time,arrival_time\n' +
      '0,T1,StopPoint:OCETrain TER-87713040,05:42:00,05:42:00\n' +
      '1,T1,StopPoint:OCETrain TER-87713545,06:03:00,06:03:00\n',
    'stops.txt': 'stop_id,stop_name\nStopPoint:OCETrain TER-87713040,Dijon\n',
    'calendar_dates.txt': '﻿service_id,date,exception_type\r\nS1,20261026,1\r\n',
    ...remplacer,
  };
  return async (nom) => {
    const contenu = fichiers[nom];
    return contenu == null ? null : Readable.from([Buffer.from(contenu)]);
  };
}

async function dansTransaction(travail: (client: import('pg').PoolClient) => Promise<void>) {
  await expect(
    enTransaction(pool, async (client) => {
      await travail(client);
      throw new Annulation();
    }),
  ).rejects.toBeInstanceOf(Annulation);
}

describe('chargerGtfsBrut', () => {
  it('copie chaque fichier par nom de colonne ; facultatifs absents = null', async () => {
    await dansTransaction(async (client) => {
      const lignes = await chargerGtfsBrut(client, gtfs());
      expect(lignes).toMatchObject({ 'stop_times.txt': 2, 'calendar_dates.txt': 1 });
      expect(lignes['calendar.txt']).toBeNull();

      const { rows } = await client.query(
        'SELECT trip_id, stop_sequence, departure_time, pickup_type FROM gtfs_stop_times ORDER BY 2',
      );
      expect(rows[0]).toEqual({
        trip_id: 'T1',
        stop_sequence: '0',
        departure_time: '05:42:00',
        pickup_type: null,
      });
      const cal = await client.query('SELECT count(*)::int AS n FROM gtfs_calendar');
      expect(cal.rows[0].n).toBe(0);
      const dates = await client.query('SELECT exception_type FROM gtfs_calendar_dates');
      expect(dates.rows[0].exception_type).toBe('1'); // \r retiré
    });
  });

  it('fichier obligatoire absent → erreur explicite', async () => {
    await expect(
      enTransaction(pool, (client) => chargerGtfsBrut(client, gtfs({ 'trips.txt': null }))),
    ).rejects.toThrow('trips.txt absent');
  });

  it('colonne obligatoire manquante → erreur qui la nomme', async () => {
    await expect(
      enTransaction(pool, (client) =>
        chargerGtfsBrut(client, gtfs({ 'trips.txt': 'route_id,trip_id\nR1,T1\n' })),
      ),
    ).rejects.toThrow('colonne(s) manquante(s) : service_id');
  });
});
