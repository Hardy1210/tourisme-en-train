// Outils communs aux scripts de base de données (docs/03-base-de-donnees.md § 4, D031, D033).
// Lancés par `node` (types TypeScript retirés nativement par Node 24) : imports relatifs avec `.ts`.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import { z } from 'zod';

export const RACINE = path.join(import.meta.dirname, '../../..');
const DOSSIER_MIGRATIONS = path.join(RACINE, 'db/migrations');

/** Caractères sûrs dans une adresse postgres:// (voir .env.example). */
const motDePasse = z.string().regex(/^[A-Za-z0-9._~-]+$/);

const schemaEnv = z.object({
  BDD_URL_MIGRATIONS: z.url({ protocol: /^postgres(ql)?$/ }),
  MDP_APP_LECTURE: motDePasse,
  MDP_ETL_ECRITURE: motDePasse,
});

export type EnvBase = z.infer<typeof schemaEnv>;

/** Charge le `.env` de la racine s'il existe (absent dans Docker), puis valide les variables. */
export function lireEnvBase(): EnvBase {
  const fichierEnv = path.join(RACINE, '.env');
  if (existsSync(fichierEnv)) process.loadEnvFile(fichierEnv);
  const resultat = schemaEnv.safeParse(process.env);
  if (!resultat.success) {
    const noms = [...new Set(resultat.error.issues.map((probleme) => probleme.path.join('.')))];
    throw new Error(
      `Variables d'environnement manquantes ou invalides : ${noms.join(', ')}. ` +
        'Voir .env.example et docs/07-contrat-infra.md § 3.',
    );
  }
  const incoherences = verifierMotsDePasse(process.env);
  if (incoherences.length > 0) {
    throw new Error(
      `Mot de passe différent entre une adresse et sa variable : ${incoherences.join(', ')}. Corriger le .env.`,
    );
  }
  return resultat.data;
}

const PAIRES_ADRESSE_MOT_DE_PASSE = [
  ['BDD_URL_MIGRATIONS', 'POSTGRES_PASSWORD'],
  ['BDD_URL_APP', 'MDP_APP_LECTURE'],
  ['BDD_URL_ETL', 'MDP_ETL_ECRITURE'],
] as const;

/**
 * Noms des adresses dont le mot de passe diffère de sa variable (seulement si les deux sont définies).
 * Sinon l'erreur n'apparaît qu'à la connexion, sans dire quelle variable corriger. Jamais de valeur dans le message.
 */
export function verifierMotsDePasse(variables: Record<string, string | undefined>): string[] {
  return PAIRES_ADRESSE_MOT_DE_PASSE.filter(([adresse, mdp]) => {
    const url = variables[adresse];
    const attendu = variables[mdp];
    if (!url || !attendu || !URL.canParse(url)) return false;
    return decodeURIComponent(new URL(url).password) !== attendu;
  }).map(([adresse, mdp]) => `${adresse} ≠ ${mdp}`);
}

/** Même serveur, autre base : `postgres://…/tourisme` → `postgres://…/tourisme_test`. */
export function urlAvecBase(url: string, nomBase: string): string {
  const adresse = new URL(url);
  adresse.pathname = `/${nomBase}`;
  return adresse.toString();
}

export function nomBase(url: string): string {
  return decodeURIComponent(new URL(url).pathname.slice(1));
}

/** Crée les rôles s'ils manquent, sinon remet leur mot de passe : relancer ne change rien d'autre. */
export async function creerRoles(client: pg.Client, env: EnvBase): Promise<void> {
  const roles = [
    ['app_lecture', env.MDP_APP_LECTURE],
    ['etl_ecriture', env.MDP_ETL_ECRITURE],
  ] as const;
  for (const [role, mdp] of roles) {
    const existe = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [role]);
    const action = existe.rowCount === 0 ? 'CREATE' : 'ALTER';
    // CREATE/ALTER ROLE n'acceptent pas de paramètre : mot de passe échappé, jamais journalisé.
    await client.query(`${action} ROLE ${role} WITH LOGIN PASSWORD ${client.escapeLiteral(mdp)}`);
  }
}

/** Rôles (communs à tout le serveur), puis migrations de `db/migrations` (déjà appliquées = ignorées). */
export async function migrerBase(url: string, env: EnvBase): Promise<void> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await creerRoles(client, env);
    await migrate(drizzle({ client }), { migrationsFolder: DOSSIER_MIGRATIONS });
  } finally {
    await client.end();
  }
}

/** Supprime puis recrée une base vide, depuis la base d'administration `postgres`. */
export async function recreerBase(urlMigrations: string, nom: string): Promise<void> {
  const client = new pg.Client({ connectionString: urlAvecBase(urlMigrations, 'postgres') });
  await client.connect();
  try {
    const identifiant = client.escapeIdentifier(nom);
    await client.query(`DROP DATABASE IF EXISTS ${identifiant} WITH (FORCE)`);
    await client.query(`CREATE DATABASE ${identifiant}`);
  } finally {
    await client.end();
  }
}
