// `pnpm db:reinitialiser` : supprime et recrée la base locale, puis la migre. LOCAL UNIQUEMENT.
// Toutes les données sont perdues : il faudra relancer `pnpm etl all`.
import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline/promises';
import { journal } from '@tourisme/commun';

import { lireEnvBase, migrerBase, nomBase, recreerBase } from './base.ts';

const HOTES_LOCAUX = new Set(['localhost', '127.0.0.1', '[::1]']);

const env = lireEnvBase();
const hote = new URL(env.BDD_URL_MIGRATIONS).hostname;
if (!HOTES_LOCAUX.has(hote) || process.env.NODE_ENV === 'production') {
  throw new Error(`Réinitialisation refusée : base non locale (${hote}) ou NODE_ENV=production.`);
}

const nom = nomBase(env.BDD_URL_MIGRATIONS);
const lecteur = createInterface({ input: stdin, output: stdout });
const reponse = await lecteur.question(
  `Toutes les données de la base « ${nom} » seront supprimées. Tapez son nom pour confirmer : `,
);
lecteur.close();
if (reponse.trim() !== nom) {
  journal.info('Réinitialisation annulée');
  process.exit(1);
}

await recreerBase(env.BDD_URL_MIGRATIONS, nom);
await migrerBase(env.BDD_URL_MIGRATIONS, env);
journal.info('Base réinitialisée et migrée', { base: nom });
