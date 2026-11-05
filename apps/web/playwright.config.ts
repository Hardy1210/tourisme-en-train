// Parcours (`pnpm test:e2e`) : version de production sur la base de test (échantillon), sans réseau.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const FICHIER_ENV = path.join(import.meta.dirname, '../../.env');
if (existsSync(FICHIER_ENV)) process.loadEnvFile(FICHIER_ENV);

const PORT = 3100;
const urlApp = `http://localhost:${PORT}`;

function urlBaseDeTest(): string {
  const url = process.env.BDD_URL_APP;
  if (!url) throw new Error('BDD_URL_APP manquante : voir .env.example.');
  const adresse = new URL(url);
  adresse.pathname = `${adresse.pathname}_test`;
  return adresse.toString();
}

export default defineConfig({
  testDir: 'tests/e2e',
  // `.e2e.ts` et non `.spec.ts` : Vitest prendrait ces fichiers pour les siens.
  testMatch: '*.e2e.ts',
  outputDir: '../../test-results',
  reporter: 'list',
  forbidOnly: true,
  // Sans service worker par défaut : il masquerait les réponses simulées. Activé dans pwa.e2e.ts.
  use: { baseURL: urlApp, trace: 'retain-on-failure', serviceWorkers: 'block' },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm exec next start --port ${PORT}`,
    url: `${urlApp}/api/sante`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: { NODE_ENV: 'production', BDD_URL_APP: urlBaseDeTest(), URL_APP: urlApp },
  },
});
