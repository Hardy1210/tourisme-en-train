// Commande `pnpm etl sources` : recopie config/sources.json dans `source_donnees` (docs/04 § 3, étape 1).
// Ne touche ni l'empreinte, ni la date de téléchargement, ni le nombre de lignes : ils appartiennent au chargement de chaque source.
import { journal, sources, type Sources } from '@tourisme/commun';
import type pg from 'pg';
import { lireConfig } from '../config';
import { creerPool, enTransaction } from '../db';

const REQUETE = `
  INSERT INTO source_donnees (code, nom, producteur, url, licence, attribution)
  VALUES ($1, $2, $3, $4, $5, $6)
  ON CONFLICT (code) DO UPDATE SET
    nom = EXCLUDED.nom, producteur = EXCLUDED.producteur, url = EXCLUDED.url,
    licence = EXCLUDED.licence, attribution = EXCLUDED.attribution`;

/** Insère ou met à jour chaque source ; renvoie le nombre de sources enregistrées. */
export async function enregistrerSources(client: pg.PoolClient, liste: Sources): Promise<number> {
  for (const s of liste.sources) {
    await client.query(REQUETE, [s.code, s.nom, s.producteur, s.page, s.licence, s.attribution]);
  }
  return liste.sources.length;
}

export async function traiterSources(): Promise<void> {
  const pool = creerPool(lireConfig().BDD_URL_ETL);
  try {
    const nombre = await enTransaction(pool, (client) => enregistrerSources(client, sources));
    const aVerifier = sources.sources.filter((s) => !s.verifie).map((s) => s.code);
    journal.info('Sources enregistrées', { nombre, aVerifier });
  } finally {
    await pool.end();
  }
}
