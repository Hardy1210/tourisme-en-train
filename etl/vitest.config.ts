import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { name: 'etl', include: ['tests/**/*.test.ts'] },
});
