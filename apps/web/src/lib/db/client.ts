// Client de la base pour l'application : rôle `app_lecture`, lecture seule (docs/03-base-de-donnees.md § 4).
// Seuls les modules `server/` et `lib/db` l'importent, jamais l'interface (CLAUDE.md § 2, règle 9).
import 'server-only';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import { env } from '@/lib/env';
import { journal } from '@/lib/journal';

import * as schema from './schema';

// En développement, le rechargement à chaud réévalue ce module : un seul pool, gardé sur globalThis.
const globalDev = globalThis as typeof globalThis & { poolBdd?: pg.Pool };
// Délai de connexion borné : base arrêtée → erreur (503 de /api/sante) au lieu d'une attente sans fin.
const pool =
  globalDev.poolBdd ??
  new pg.Pool({ connectionString: env.BDD_URL_APP, connectionTimeoutMillis: 5000 });
if (env.NODE_ENV !== 'production') globalDev.poolBdd = pool;

// Une connexion au repos perdue (base redémarrée) : sans ce gestionnaire, une erreur non gérée, imprimée
// hors du format JSON (07 § 1). Le pool en rouvre une à la demande : rien d'autre à faire.
if (pool.listenerCount('error') === 0) {
  pool.on('error', (erreur: Error & { code?: string }) => {
    journal.avertissement('Connexion à la base perdue', { code: erreur.code });
  });
}

export const db = drizzle({ client: pool, schema, casing: 'snake_case' });
