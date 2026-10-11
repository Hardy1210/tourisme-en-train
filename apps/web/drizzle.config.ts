// Configuration de drizzle-kit : génération des migrations depuis le schéma (docs/03-base-de-donnees.md § 1).
// Toujours passer par `pnpm db:generer`, qui corrige le type geography après génération (D033).
import { existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit charge ce fichier en CommonJS (pas d'import.meta) et le lance depuis apps/web.
const FICHIER_ENV = path.resolve('../../.env');
if (existsSync(FICHIER_ENV)) process.loadEnvFile(FICHIER_ENV);

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: '../../db/migrations',
  casing: 'snake_case',
  // Facultative pour `generate`, qui ne se connecte pas à la base.
  ...(process.env.BDD_URL_MIGRATIONS
    ? { dbCredentials: { url: process.env.BDD_URL_MIGRATIONS } }
    : {}),
});
