// Chargement brut du GTFS (docs/04-traitement-donnees.md § 4.2, point 2) : chaque fichier est copié
// TEL QUEL (texte) dans une table temporaire `gtfs_<fichier>`, par `COPY`. Les colonnes sont prises
// par leur nom dans l'en-tête (l'ordre peut changer d'un export à l'autre). Tout le reste est en SQL.
import { createReadStream } from 'node:fs';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import type pg from 'pg';
import { copierCsv } from '../db';
import { ouvrirDansZip } from '../sources/zip';

/** Ouvre un fichier GTFS par son nom ; null s'il est absent. ZIP en production, dossier en test. */
export type OuvrirFichier = (nom: string) => Promise<Readable | null>;

export const depuisZip =
  (chemin: string): OuvrirFichier =>
  (nom) =>
    ouvrirDansZip(chemin, nom);

export const depuisDossier =
  (dossier: string): OuvrirFichier =>
  async (nom) => {
    const chemin = path.join(dossier, nom);
    const present = await access(chemin).then(
      () => true,
      () => false,
    );
    return present ? createReadStream(chemin) : null;
  };

interface FichierGtfs {
  nom: string;
  /** Fichier absent : erreur si obligatoire, sinon table vide. */
  obligatoire: boolean;
  /** Colonnes sans lesquelles le chargement échoue. */
  colonnes: readonly string[];
  /** Colonnes facultatives du standard : créées vides si l'en-tête ne les a pas. */
  facultatives?: readonly string[];
}

const JOURS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const FICHIERS_GTFS: readonly FichierGtfs[] = [
  { nom: 'agency.txt', obligatoire: true, colonnes: ['agency_timezone'] },
  {
    nom: 'routes.txt',
    obligatoire: true,
    colonnes: ['route_id'],
    facultatives: ['route_short_name'],
  },
  {
    nom: 'trips.txt',
    obligatoire: true,
    colonnes: ['route_id', 'service_id', 'trip_id'],
    facultatives: ['trip_headsign'],
  },
  {
    nom: 'stop_times.txt',
    obligatoire: true,
    colonnes: ['trip_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence'],
    facultatives: ['pickup_type', 'drop_off_type'],
  },
  { nom: 'stops.txt', obligatoire: true, colonnes: ['stop_id'], facultatives: ['stop_name'] },
  // Absent du GTFS SNCF au 22/10/2026, pris en charge s'il réapparaît (D036).
  {
    nom: 'calendar.txt',
    obligatoire: false,
    colonnes: ['service_id', ...JOURS, 'start_date', 'end_date'],
  },
  {
    nom: 'calendar_dates.txt',
    obligatoire: false,
    colonnes: ['service_id', 'date', 'exception_type'],
  },
  { nom: 'feed_info.txt', obligatoire: false, colonnes: [], facultatives: ['feed_end_date'] },
];

export const tableBrute = (nom: string): string => `gtfs_${nom.replace(/\.txt$/, '')}`;

const NOM_COLONNE = /^[a-z_][a-z0-9_]*$/;

/** Sépare la ligne d'en-tête du reste du flux (BOM, guillemets et `\r` retirés). */
export async function separerEntete(
  flux: Readable,
): Promise<{ entete: string[]; reste: Readable }> {
  // En octets : un caractère accentué coupé entre deux morceaux ne doit pas être abîmé.
  const iterateur = flux[Symbol.asyncIterator]();
  let debut = Buffer.alloc(0);
  let fin = -1;
  while (fin < 0) {
    const { value, done } = (await iterateur.next()) as { value: Buffer; done: boolean };
    if (done) break;
    debut = Buffer.concat([debut, value]);
    fin = debut.indexOf(0x0a);
  }
  const ligne = (fin < 0 ? debut : debut.subarray(0, fin))
    .toString('utf8')
    .replace(/^\uFEFF/, '')
    .replace(/\r$/, '');
  const entete = ligne.split(',').map((c) => c.trim().replace(/^"(.*)"$/, '$1'));
  const premier = fin < 0 ? Buffer.alloc(0) : debut.subarray(fin + 1);
  async function* suite(): AsyncGenerator<Buffer> {
    if (premier.length > 0) yield premier;
    for (let r = await iterateur.next(); !r.done; r = await iterateur.next())
      yield r.value as Buffer;
  }
  return { entete, reste: Readable.from(suite()) };
}

/**
 * Copie les fichiers GTFS dans des tables temporaires (supprimées au COMMIT), toutes colonnes en
 * texte. Renvoie le nombre de lignes par fichier (null = fichier facultatif absent).
 */
export async function chargerGtfsBrut(
  client: pg.PoolClient,
  ouvrir: OuvrirFichier,
): Promise<Record<string, number | null>> {
  const lignes: Record<string, number | null> = {};
  for (const fichier of FICHIERS_GTFS) {
    const table = client.escapeIdentifier(tableBrute(fichier.nom));
    const flux = await ouvrir(fichier.nom);
    if (!flux && fichier.obligatoire) throw new Error(`GTFS : ${fichier.nom} absent du ZIP`);

    const { entete, reste } = flux
      ? await separerEntete(flux)
      : { entete: [], reste: Readable.from([]) };
    const invalide = entete.find((c) => !NOM_COLONNE.test(c));
    if (invalide !== undefined)
      throw new Error(`GTFS : ${fichier.nom}, colonne illisible « ${invalide} »`);
    const manquantes = flux ? fichier.colonnes.filter((c) => !entete.includes(c)) : [];
    if (manquantes.length > 0) {
      throw new Error(`GTFS : ${fichier.nom}, colonne(s) manquante(s) : ${manquantes.join(', ')}`);
    }

    const ajoutees = [...fichier.colonnes, ...(fichier.facultatives ?? [])].filter(
      (c) => !entete.includes(c),
    );
    const definition = [...entete, ...ajoutees].map((c) => `${client.escapeIdentifier(c)} text`);
    await client.query(`CREATE TEMP TABLE ${table} (${definition.join(', ')}) ON COMMIT DROP`);
    lignes[fichier.nom] = flux
      ? await copierCsv(client, tableBrute(fichier.nom), entete, reste)
      : null;
  }
  return lignes;
}
