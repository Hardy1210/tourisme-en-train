// Accès à la base pour le traitement des données : rôle `etl_ecriture` (docs/03-base-de-donnees.md § 4).
// Une source se remplace dans une transaction : l'application lit l'ancienne version jusqu'au COMMIT (03 § 1.8).
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import pg from 'pg';
import { from as copierVers } from 'pg-copy-streams';

export function creerPool(urlBdd: string): pg.Pool {
  return new pg.Pool({ connectionString: urlBdd });
}

/** Exécute `travail` dans une transaction : COMMIT s'il réussit, ROLLBACK s'il lève une erreur. */
export async function enTransaction<T>(
  pool: pg.Pool,
  travail: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const resultat = await travail(client);
    await client.query('COMMIT');
    return resultat;
  } catch (erreur) {
    await client.query('ROLLBACK');
    throw erreur;
  } finally {
    client.release();
  }
}

/**
 * Charge un flux CSV (sans ligne d'en-tête, colonnes dans l'ordre donné) par `COPY … FROM STDIN`,
 * sans tout garder en mémoire. Renvoie le nombre de lignes chargées.
 */
export async function copierCsv(
  client: pg.PoolClient,
  table: string,
  colonnes: readonly string[],
  csv: Readable,
): Promise<number> {
  const liste = colonnes.map((colonne) => client.escapeIdentifier(colonne)).join(', ');
  const copie = client.query(
    copierVers(`COPY ${client.escapeIdentifier(table)} (${liste}) FROM STDIN WITH (FORMAT csv)`),
  );
  await pipeline(csv, copie);
  return copie.rowCount;
}
