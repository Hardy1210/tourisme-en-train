// Configuration ESLint unique de l'espace de travail (règles : docs/08-conventions-qualite.md § 1).
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Fichiers qui doivent exporter par défaut (imposés par Next.js ou par l'outil) — D031.
const FICHIERS_EXPORT_DEFAUT = [
  '**/*.config.{js,mjs,cjs,ts,mts}',
  '**/src/app/**/{page,layout,template,loading,error,global-error,not-found,default,manifest,sitemap,robots,icon,apple-icon,opengraph-image}.{ts,tsx}',
];

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/coverage/**',
      '**/next-env.d.ts',
      'data/**',
      'design/**',
      'db/migrations/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration',
          message:
            "Pas d'export par défaut hors fichiers imposés par Next.js ou fichiers de configuration (08 § 1).",
        },
      ],
    },
  },
  {
    files: FICHIERS_EXPORT_DEFAUT,
    rules: { 'no-restricted-syntax': 'off' },
  },
);
