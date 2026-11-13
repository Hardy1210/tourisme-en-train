// Transports sur place (docs/04-traitement-donnees.md § 4.7, D046) : lecture des GTFS (dans le ZIP)
// et des GBFS, puis UNE transaction : tmp_arret → transformations/transport-local.sql → contrôles.
// Un contrôle bloquant en échec annule tout : l'ancienne table mobilite_locale reste en place.
import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse';
import type pg from 'pg';
import { parametres } from '../config';
import {
  aucune,
  auMoins,
  ErreurControles,
  echecsBloquants,
  executerControles,
  type ResultatControle,
} from '../controles/base';
import { copierCsv, enTransaction } from '../db';
import { ouvrirDansZip } from '../sources/zip';
import { lireSections, preparer } from '../transformations/sql';
import {
  arretsDesservis,
  stationsGbfs,
  type ArretGtfs,
  type ArretNormalise,
  type LigneGtfs,
} from '../transformations/transport-local';
import { versLigneCsv } from './base';
import { Readable } from 'node:stream';

/** Lignes d'un fichier du ZIP GTFS ; fichier absent : erreur (stops, routes, trips, stop_times sont obligatoires). */
async function* lignesDuZip(chemin: string, nom: string): AsyncGenerator<Record<string, string>> {
  const flux = await ouvrirDansZip(chemin, nom);
  if (!flux) throw new Error(`${nom} absent de ${chemin}`);
  yield* flux.pipe(
    parse({
      columns: true,
      bom: true,
      relax_column_count: true,
      skip_empty_lines: true,
      trim: true,
    }),
  ) as AsyncIterable<Record<string, string>>;
}

async function tableau<T>(chemin: string, nom: string): Promise<T[]> {
  const lignes: T[] = [];
  for await (const l of lignesDuZip(chemin, nom)) lignes.push(l as T);
  return lignes;
}

/** Arrêts desservis d'un fichier GTFS (lignes par arrêt lues dans stop_times → trips). */
export async function lireGtfs(
  chemin: string,
  typeParDefaut: 'BUS' | 'CAR',
): Promise<ArretNormalise[]> {
  const lignes = await tableau<LigneGtfs>(chemin, 'routes.txt');
  const ligneDuTrajet = new Map<string, string>();
  for await (const t of lignesDuZip(chemin, 'trips.txt')) {
    if (t.trip_id && t.route_id) ligneDuTrajet.set(t.trip_id, t.route_id);
  }
  const lignesParArret = new Map<string, Set<string>>();
  for await (const st of lignesDuZip(chemin, 'stop_times.txt')) {
    const ligne = st.trip_id ? ligneDuTrajet.get(st.trip_id) : undefined;
    if (!ligne || !st.stop_id) continue;
    const ensemble = lignesParArret.get(st.stop_id) ?? new Set<string>();
    ensemble.add(ligne);
    lignesParArret.set(st.stop_id, ensemble);
  }
  return arretsDesservis(
    await tableau<ArretGtfs>(chemin, 'stops.txt'),
    lignes,
    lignesParArret,
    typeParDefaut,
  );
}

export async function lireGbfs(chemin: string): Promise<ArretNormalise[]> {
  return stationsGbfs(JSON.parse(await readFile(chemin, 'utf8')));
}

const SECTIONS = ['position', 'quais', 'arrets', 'index_arrets', 'vider', 'inserer'] as const;

export function controlesTransportLocal(reseauxCharges: number) {
  return [
    auMoins('Réseaux chargés', `SELECT ${Number(reseauxCharges)}::int AS n`, 1),
    aucune(
      'Arrêts au-delà du rayon à pied',
      'SELECT count(*)::int AS n FROM mobilite_locale WHERE distance_m > $1::int + 1',
      [parametres.rayons.mobiliteM],
    ),
    aucune(
      'Arrêts sans ligne (bus, tram, car)',
      "SELECT count(*)::int AS n FROM mobilite_locale WHERE type <> 'VELO' AND coalesce(cardinality(lignes), 0) = 0",
    ),
    aucune(
      'Réseaux sans aucun arrêt près d’une gare de la région',
      `SELECT count(DISTINCT source)::int AS n FROM tmp_arret t
       WHERE NOT EXISTS (SELECT 1 FROM mobilite_locale m WHERE m.source = t.source)`,
      [],
      false,
    ),
  ];
}

export interface BilanTransportLocal {
  lignes: number;
  controles: ResultatControle[];
  parReseau: { source: string; arrets: number; gares: number }[];
}

export async function chargerTransportLocalDans(
  client: pg.PoolClient,
  arrets: ReadonlyMap<string, readonly ArretNormalise[]>,
): Promise<BilanTransportLocal> {
  await client.query(`CREATE TEMP TABLE tmp_arret (source text, id_source text, nom text, type text,
    lignes text[], lon float8, lat float8, geom geography(Point, 4326)) ON COMMIT DROP`);
  const csv = [...arrets].flatMap(([source, liste]) =>
    liste.map((a) => versLigneCsv([source, a.idSource, a.nom, a.type, a.lignes, a.lon, a.lat])),
  );
  await copierCsv(
    client,
    'tmp_arret',
    ['source', 'id_source', 'nom', 'type', 'lignes', 'lon', 'lat'],
    Readable.from(csv),
  );

  const sections = await lireSections(
    new URL('../transformations/transport-local.sql', import.meta.url),
  );
  const valeurs = {
    regroupement_m: parametres.mobilite.regroupementQuaisM,
    rayon_m: parametres.rayons.mobiliteM,
    coef_detour: parametres.acces.coefDetour,
  };
  let lignes = 0;
  for (const nom of SECTIONS) {
    const sql = sections.get(nom);
    if (sql === undefined) throw new Error(`Section « ${nom} » absente de transport-local.sql`);
    const { texte, valeurs: liste } = preparer(sql, valeurs);
    const { rowCount } = await client.query(texte, liste);
    if (nom === 'inserer') lignes = rowCount ?? 0;
  }
  const controles = await executerControles(client, controlesTransportLocal(arrets.size));
  if (echecsBloquants(controles).length > 0) throw new ErreurControles(controles);
  const { rows } = await client.query<{ source: string; arrets: number; gares: number }>(
    `SELECT source, count(DISTINCT id_source)::int AS arrets, count(DISTINCT gare_id)::int AS gares
     FROM mobilite_locale GROUP BY source ORDER BY source`,
  );
  return { lignes, controles, parReseau: rows };
}

export function chargerTransportLocal(
  pool: pg.Pool,
  arrets: ReadonlyMap<string, readonly ArretNormalise[]>,
): Promise<BilanTransportLocal> {
  return enTransaction(pool, (client) => chargerTransportLocalDans(client, arrets));
}
