import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(import.meta.dirname, 'src'),
      // `server-only` lève une erreur hors de Next.js : remplacé par un module vide dans les tests (D031).
      'server-only': path.join(import.meta.dirname, 'tests/server-only-vide.ts'),
    },
  },
  test: { name: 'web' },
});
