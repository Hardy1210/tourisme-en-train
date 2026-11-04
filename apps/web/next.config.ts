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
  // Sans indicateur de développement : il couvrait la navigation ou le choix de la date. Les erreurs restent affichées.
  devIndicators: false,
  transpilePackages: ['@tourisme/commun'],
  // Aucune URL de requête dans les journaux : elles contiennent la position (lat, lon) de l'utilisateur
  // (CLAUDE.md § 2, règle 5). Les erreurs passent par le journal JSON de l'application.
  logging: { incomingRequests: false },
  turbopack: { root: RACINE },
  outputFileTracingRoot: RACINE,
};

export default nextConfig;
