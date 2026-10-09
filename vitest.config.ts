// Lance les tests de tous les paquets de l'espace de travail (`pnpm test`).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['{packages/*,apps/*,etl}/vitest.config.ts'],
  },
});
