// `pnpm db:test:preparer` : recrée la base de test (`<base>_test`, même serveur), la migre et y charge
// l'échantillon (données d'exemple, docs/03-base-de-donnees.md § 6). Lancé avant chaque `pnpm test:integration`.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { journal } from '@tourisme/commun';
import pg from 'pg';

import { RACINE, lireEnvBase, migrerBase, nomBase, recreerBase, urlAvecBase } from './base.ts';

const FICHIER_ECHANTILLON = path.join(RACINE, 'db/echantillon/echantillon.sql');

const env = lireEnvBase();
const nomTest = `${nomBase(env.BDD_URL_MIGRATIONS)}_test`;
// Garde-fou : l'échantillon ne doit jamais se mélanger aux vraies données (CLAUDE.md § 11).
if (!nomTest.endsWith('_test')) throw new Error(`Base de test invalide : ${nomTest}.`);
const urlTest = urlAvecBase(env.BDD_URL_MIGRATIONS, nomTest);

await recreerBase(env.BDD_URL_MIGRATIONS, nomTest);
await migrerBase(urlTest, env);

const client = new pg.Client({ connectionString: urlTest });
await client.connect();
try {
  await client.query(readFileSync(FICHIER_ECHANTILLON, 'utf8'));
} finally {
  await client.end();
}
journal.info('Base de test prête', { base: nomTest });
