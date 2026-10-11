// Tests d'intégration (`pnpm test:integration`) : base de test réelle, préparée juste avant
// par `pnpm db:test:preparer`. Hors de `pnpm test` et `pnpm verifier`, qui tournent sans Docker.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const FICHIER_ENV = path.join(import.meta.dirname, '.env');
if (existsSync(FICHIER_ENV)) process.loadEnvFile(FICHIER_ENV);

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(import.meta.dirname, 'apps/web/src'),
      'server-only': path.join(import.meta.dirname, 'apps/web/tests/server-only-vide.ts'),
    },
  },
  test: {
    name: 'integration',
    include: ['{apps/*,etl}/tests/**/*.integration.test.ts'],
    // Une seule base partagée : un fichier à la fois.
    fileParallelism: false,
  },
});
