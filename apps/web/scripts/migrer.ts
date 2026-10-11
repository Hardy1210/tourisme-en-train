// `pnpm db:migrer` (et `node scripts/migrer.ts` dans l'image web, docs/07-contrat-infra.md § 1) :
// crée les rôles avec leur mot de passe, puis applique les migrations. Relancer ne fait rien de plus.
import { journal } from '@tourisme/commun';

import { lireEnvBase, migrerBase, nomBase } from './base.ts';

const env = lireEnvBase();
await migrerBase(env.BDD_URL_MIGRATIONS, env);
journal.info('Migrations appliquées', { base: nomBase(env.BDD_URL_MIGRATIONS) });
