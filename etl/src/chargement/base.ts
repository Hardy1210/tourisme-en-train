// Socle du chargement (docs/04-traitement-donnees.md § 1, principes 5 et 9) :
// CSV lu en flux et validé par Zod → `COPY` dans une table temporaire → contrôles → fusion dans
// la vraie table, le tout dans UNE transaction. La fusion est propre à chaque source : suppression
// puis insertion, ou mise à jour par clé pour les gares (D034).
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { parse } from 'csv-parse';
import type pg from 'pg';
import type { z } from 'zod';
import {
  type Controle,
  ErreurControles,
  echecsBloquants,
  executerControles,
} from '../controles/base';
import type { ResultatControle } from '../controles/base';
import { copierCsv, enTransaction } from '../db';

export interface Rejet {
  /** Numéro de ligne dans le fichier (l'en-tête est la ligne 1). */
  ligne: number;
  raison: string;
}

export interface BilanLecture {
  lues: number;
  rejets: Rejet[];
}

/**
 * Lit un CSV avec en-tête, en flux, et ne laisse passer que les lignes valides pour `schema`.
 * Les rejets sont comptés dans `bilan` au fur et à mesure (jamais écartés en silence).
 */
export function lireCsv<T>(
  chemin: string,
  schema: z.ZodType<T>,
  options: { delimiteur: string },
): { lignes: AsyncGenerator<T>; bilan: BilanLecture } {
  const bilan: BilanLecture = { lues: 0, rejets: [] };
  async function* lignes(): AsyncGenerator<T> {
    const lecteur = createReadStream(chemin).pipe(
      parse({ columns: true, bom: true, delimiter: options.delimiteur, info: true }),
    );
    for await (const { record, info } of lecteur as AsyncIterable<{
      record: unknown;
      info: { lines: number };
    }>) {
      bilan.lues += 1;
      const resultat = schema.safeParse(record);
      if (resultat.success) yield resultat.data;
      else bilan.rejets.push({ ligne: info.lines, raison: resumerErreur(resultat.error) });
    }
  }
  return { lignes: lignes(), bilan };
}

function resumerErreur(erreur: z.ZodError): string {
  return erreur.issues
    .map((p) => (p.path.length ? `${p.path.join('.')} : ${p.message}` : p.message))
    .join(' ; ');
}

/** Valeur d'une colonne pour `COPY … WITH (FORMAT csv)`. Un tableau devient un tableau PostgreSQL. */
export type ValeurCopie = string | number | boolean | null | readonly string[];

const entreGuillemets = (texte: string): string => `"${texte.replaceAll('"', '""')}"`;

/** null → champ vide sans guillemets (= NULL pour `COPY`) ; texte → toujours entre guillemets (= '' gardé). */
export function versLigneCsv(valeurs: readonly ValeurCopie[]): string {
  const champs = valeurs.map((v) => {
    if (v === null) return '';
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    if (typeof v === 'string') return entreGuillemets(v);
    return entreGuillemets(`{${v.map(entreGuillemets).join(',')}}`);
  });
  return `${champs.join(',')}\n`;
}

export interface PlanChargement<T> {
  /** Code de la source dans `source_donnees`. */
  source: string;
  /** Table temporaire (supprimée au COMMIT) : colonnes dans l'ordre de `versValeurs`, avec leur type SQL. */
  tableTemporaire: { nom: string; colonnes: readonly (readonly [nom: string, type: string])[] };
  lignes: AsyncIterable<T>;
  versValeurs: (ligne: T) => readonly ValeurCopie[];
  controles: readonly Controle[];
  /** Recopie la table temporaire dans la vraie table ; renvoie le nombre de lignes chargées. */
  fusionner: (client: pg.ClientBase) => Promise<number>;
}

export interface BilanChargement {
  copiees: number;
  chargees: number;
  controles: ResultatControle[];
}

/**
 * Exécute le plan dans une transaction et enregistre l'empreinte du fichier dans `source_donnees`.
 * Un contrôle bloquant en échec lève `ErreurControles` : rien n'est modifié en base.
 */
export async function charger<T>(
  pool: pg.Pool,
  plan: PlanChargement<T>,
  empreinte: string,
): Promise<BilanChargement> {
  return enTransaction(pool, async (client) => {
    const { nom, colonnes } = plan.tableTemporaire;
    const definition = colonnes
      .map(([colonne, type]) => `${client.escapeIdentifier(colonne)} ${type}`)
      .join(', ');
    await client.query(
      `CREATE TEMP TABLE ${client.escapeIdentifier(nom)} (${definition}) ON COMMIT DROP`,
    );

    async function* enCsv(): AsyncGenerator<string> {
      for await (const ligne of plan.lignes) yield versLigneCsv(plan.versValeurs(ligne));
    }
    const noms = colonnes.map(([colonne]) => colonne);
    const copiees = await copierCsv(client, nom, noms, Readable.from(enCsv()));

    const controles = await executerControles(client, plan.controles);
    if (echecsBloquants(controles).length > 0) throw new ErreurControles(controles);

    const chargees = await plan.fusionner(client);
    await client.query(
      `UPDATE source_donnees SET empreinte = $2, date_telechargement = now(), nb_lignes = $3
       WHERE code = $1`,
      [plan.source, empreinte, chargees],
    );
    return { copiees, chargees, controles };
  });
}
