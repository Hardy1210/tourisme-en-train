// Parkings vélo près des gares (docs/04-traitement-donnees.md § 4.7 bis, D097) : lus dans le fichier brut de
// l'extraction OSM, puis UNE transaction : tmp_parking → transformations/parkings-velo.sql → contrôles.
// Un contrôle bloquant en échec annule tout : les anciens parkings restent en place.
import { Readable } from 'node:stream';
import type pg from 'pg';
import { parametres } from '../config';
import {
  aucune,
  ErreurControles,
  echecsBloquants,
  executerControles,
  type ResultatControle,
} from '../controles/base';
import { copierCsv, enTransaction } from '../db';
import type { ParkingVelo } from '../transformations/osm';
import { lireSections, preparer } from '../transformations/sql';
import { versLigneCsv } from './base';

const SECTIONS = ['position', 'index', 'vider', 'inserer'] as const;

export function controlesParkingsVelo() {
  return [
    aucune(
      'Parkings vélo au-delà du rayon de la gare',
      `SELECT count(*)::int AS n FROM mobilite_locale m JOIN gare g ON g.id = m.gare_id
       WHERE m.type = 'PARKING_VELO' AND ST_Distance(m.geom, g.geom) > $1::int + 1`,
      [parametres.acces.rayonParkingVeloM],
    ),
    aucune(
      'Parkings vélo hors de la région',
      `SELECT count(*)::int AS n FROM mobilite_locale m JOIN gare g ON g.id = m.gare_id
       WHERE m.type = 'PARKING_VELO' AND NOT g.dans_region`,
    ),
  ];
}

export interface BilanParkingsVelo {
  lignes: number;
  gares: number;
  controles: ResultatControle[];
}

export async function chargerParkingsVeloDans(
  client: pg.PoolClient,
  parkings: readonly ParkingVelo[],
): Promise<BilanParkingsVelo> {
  // Rechargeable dans une même transaction (tests) : la table temporaire précédente est d'abord retirée.
  await client.query('DROP TABLE IF EXISTS tmp_parking');
  await client.query(`CREATE TEMP TABLE tmp_parking (id_source text, nom text, lon float8, lat float8,
    geom geography(Point, 4326)) ON COMMIT DROP`);
  await copierCsv(
    client,
    'tmp_parking',
    ['id_source', 'nom', 'lon', 'lat'],
    Readable.from(parkings.map((p) => versLigneCsv([p.idSource, p.nom, p.lon, p.lat]))),
  );
  const sections = await lireSections(
    new URL('../transformations/parkings-velo.sql', import.meta.url),
  );
  const valeurs = {
    rayon_m: parametres.acces.rayonParkingVeloM,
    coef_detour: parametres.acces.coefDetour,
  };
  let lignes = 0;
  for (const nom of SECTIONS) {
    const sql = sections.get(nom);
    if (sql === undefined) throw new Error(`Section « ${nom} » absente de parkings-velo.sql`);
    const { texte, valeurs: liste } = preparer(sql, valeurs);
    const { rowCount } = await client.query(texte, liste);
    if (nom === 'inserer') lignes = rowCount ?? 0;
  }
  const controles = await executerControles(client, controlesParkingsVelo());
  if (echecsBloquants(controles).length > 0) throw new ErreurControles(controles);
  const { rows } = await client.query<{ n: number }>(
    "SELECT count(DISTINCT gare_id)::int AS n FROM mobilite_locale WHERE type = 'PARKING_VELO'",
  );
  return { lignes, gares: rows[0]?.n ?? 0, controles };
}

export function chargerParkingsVelo(
  pool: pg.Pool,
  parkings: readonly ParkingVelo[],
): Promise<BilanParkingsVelo> {
  return enTransaction(pool, (client) => chargerParkingsVeloDans(client, parkings));
}
