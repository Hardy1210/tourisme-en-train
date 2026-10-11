// Client de la base pour l'application : rôle `app_lecture`, lecture seule (docs/03-base-de-donnees.md § 4).
// Seuls les modules `server/` et `lib/db` l'importent, jamais l'interface (CLAUDE.md § 2, règle 9).
import 'server-only';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import { env } from '@/lib/env';

import * as schema from './schema';

// En développement, le rechargement à chaud réévalue ce module : un seul pool, gardé sur globalThis.
const globalDev = globalThis as typeof globalThis & { poolBdd?: pg.Pool };
const pool = globalDev.poolBdd ?? new pg.Pool({ connectionString: env.BDD_URL_APP });
if (env.NODE_ENV !== 'production') globalDev.poolBdd = pool;

export const db = drizzle({ client: pool, schema, casing: 'snake_case' });
