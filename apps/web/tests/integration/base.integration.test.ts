// Base de test réelle, préparée par `pnpm db:test:preparer` (critères d'acceptation de la fiche E01).
import { asc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { gare } from '@/lib/db/schema';

import { lireEnvBase, migrerBase } from '../../scripts/base';

/** Adresse de la base de test pour un rôle : même serveur, base `<nom>_test`. */
function urlTest(variable: 'BDD_URL_MIGRATIONS' | 'BDD_URL_APP' | 'BDD_URL_ETL'): string {
  const url = process.env[variable];
  if (!url) throw new Error(`${variable} manquante (voir .env.example).`);
  const adresse = new URL(url);
  adresse.pathname = `${adresse.pathname}_test`;
  return adresse.toString();
}

const TABLES_P0 = [
  'categorie_regle',
  'commune',
  'execution_etl',
  'gare',
  'gare_stats',
  'lieu',
  'lieu_gare',
  'mobilite_locale',
  'passage',
  'service_jour',
  'source_donnees',
  'trajet',
];
const DROIT_INSUFFISANT = '42501';

const proprietaire = new pg.Client({ connectionString: urlTest('BDD_URL_MIGRATIONS') });
const appLecture = new pg.Client({ connectionString: urlTest('BDD_URL_APP') });
const etlEcriture = new pg.Client({ connectionString: urlTest('BDD_URL_ETL') });

beforeAll(async () => {
  await Promise.all([proprietaire.connect(), appLecture.connect(), etlEcriture.connect()]);
});
afterAll(async () => {
  await Promise.all([proprietaire.end(), appLecture.end(), etlEcriture.end()]);
});

describe('schéma', () => {
  it('contient toutes les tables P0, et pas encore liaison_directe (E04)', async () => {
    const { rows } = await proprietaire.query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
         AND table_name <> 'spatial_ref_sys'
       ORDER BY table_name`,
    );
    expect(rows.map((ligne) => ligne.table_name)).toEqual(TABLES_P0);
  });

  it('relancer les migrations ne fait rien et ne casse rien', async () => {
    const compter = async () =>
      (await proprietaire.query('SELECT count(*)::int AS n FROM drizzle.__drizzle_migrations'))
        .rows[0].n;
    const avant = await compter();
    await migrerBase(urlTest('BDD_URL_MIGRATIONS'), lireEnvBase());
    expect(await compter()).toBe(avant);
    const gares = await proprietaire.query('SELECT count(*)::int AS n FROM gare');
    expect(gares.rows[0].n).toBe(10);
  });
});

describe('droits', () => {
  it('app_lecture peut lire', async () => {
    const { rows } = await appLecture.query('SELECT count(*)::int AS n FROM gare');
    expect(rows[0].n).toBe(10);
  });

  it('app_lecture ne peut pas écrire', async () => {
    await expect(
      appLecture.query(
        `INSERT INTO execution_etl (source, debut, statut) VALUES ('x', now(), 'SUCCES')`,
      ),
    ).rejects.toMatchObject({ code: DROIT_INSUFFISANT });
  });

  it('etl_ecriture peut écrire (annulé ensuite)', async () => {
    await etlEcriture.query('BEGIN');
    try {
      const resultat = await etlEcriture.query(
        `INSERT INTO execution_etl (source, debut, statut) VALUES ('test', now(), 'EN_COURS')`,
      );
      expect(resultat.rowCount).toBe(1);
    } finally {
      await etlEcriture.query('ROLLBACK');
    }
  });

  it('etl_ecriture ne peut pas supprimer une table', async () => {
    await expect(etlEcriture.query('DROP TABLE execution_etl')).rejects.toMatchObject({
      code: DROIT_INSUFFISANT,
    });
  });
});

describe('requête de proximité (03 § 5, gares les plus proches)', () => {
  const gareLaPlusProche = async (lon: number, lat: number) => {
    const { rows } = await appLecture.query<{ nom: string; distance_m: number }>(
      `SELECT nom, ST_Distance(geom, ST_MakePoint($1, $2)::geography) AS distance_m
       FROM gare ORDER BY geom <-> ST_MakePoint($1, $2)::geography LIMIT 1`,
      [lon, lat],
    );
    return rows[0];
  };

  it('un point du centre de Dijon renvoie Dijon-Ville, à moins de 2 km', async () => {
    const resultat = await gareLaPlusProche(5.0415, 47.3216);
    expect(resultat?.nom).toBe('Dijon-Ville');
    expect(resultat?.distance_m).toBeLessThan(2000);
  });

  it('un point de Beaune ne renvoie pas Dijon-Ville', async () => {
    expect((await gareLaPlusProche(4.84, 47.02))?.nom).toBe('Beaune');
  });

  it('Drizzle relit la colonne geography en { lon, lat }', async () => {
    const db = drizzle({ client: appLecture, casing: 'snake_case' });
    const [premiere] = await db
      .select({ nom: gare.nom, geom: gare.geom })
      .from(gare)
      .orderBy(asc(gare.uic))
      .limit(1);
    expect(premiere).toEqual({ nom: 'Dijon-Ville', geom: { lon: 5.0272, lat: 47.3233 } });
  });
});
