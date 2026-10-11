// `pnpm db:generer [--custom] [--name=nom]` : génère une migration depuis schema.ts, puis la corrige.
// drizzle-kit 0.31 écrit "geography(Point, 4326)" entre guillemets, ce que PostgreSQL refuse (D033).
// Lancé par `node` (types TypeScript retirés nativement par Node 24).
import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const DOSSIER_MIGRATIONS = path.join(import.meta.dirname, '../../../db/migrations');
const GEOGRAPHY_ENTRE_GUILLEMETS = /"(geography\([^"]*\))"/g;

/** Retire les guillemets autour des types geography(…) ; le reste du SQL est inchangé. */
export function corrigerGeography(sqlMigration: string): string {
  return sqlMigration.replace(GEOGRAPHY_ENTRE_GUILLEMETS, '$1');
}

function principal(): void {
  const generation = spawnSync('drizzle-kit', ['generate', ...process.argv.slice(2)], {
    stdio: 'inherit',
  });
  if (generation.status !== 0) process.exit(generation.status ?? 1);

  for (const fichier of readdirSync(DOSSIER_MIGRATIONS).filter((nom) => nom.endsWith('.sql'))) {
    const chemin = path.join(DOSSIER_MIGRATIONS, fichier);
    const avant = readFileSync(chemin, 'utf8');
    const apres = corrigerGeography(avant);
    if (apres !== avant) writeFileSync(chemin, apres);
    if (apres.includes('"geography(')) {
      throw new Error(`${fichier} : type geography encore entre guillemets.`);
    }
  }
}

if (import.meta.main) principal();
