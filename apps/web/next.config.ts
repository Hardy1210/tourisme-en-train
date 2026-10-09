import { existsSync } from 'node:fs';
import path from 'node:path';
import type { NextConfig } from 'next';

// Racine de l'espace de travail : le fichier .env et config/parametres.json y vivent.
const RACINE = path.join(import.meta.dirname, '../..');

// Next.js ne lit les fichiers .env que dans apps/web : on charge celui de la racine.
// Facultatif (absent dans Docker, où les variables viennent du compose) ; ne remplace jamais une variable déjà définie.
const FICHIER_ENV = path.join(RACINE, '.env');
if (existsSync(FICHIER_ENV)) process.loadEnvFile(FICHIER_ENV);

const nextConfig: NextConfig = {
  // Pas d'AGENTS.md généré par `next dev` : CLAUDE.md (racine) est le seul fichier maître du projet.
  agentRules: false,
  transpilePackages: ['@tourisme/commun'],
  turbopack: { root: RACINE },
  outputFileTracingRoot: RACINE,
};

export default nextConfig;
