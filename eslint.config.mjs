// Configuration ESLint unique de l'espace de travail (règles : docs/08-conventions-qualite.md § 1).
import { readdirSync } from 'node:fs';
import js from '@eslint/js';
import nextVitals from 'eslint-config-next/core-web-vitals';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Fichiers qui doivent exporter par défaut (imposés par Next.js ou par l'outil) — D031.
const FICHIERS_EXPORT_DEFAUT = [
  '**/*.config.{js,mjs,cjs,ts,mts}',
  '**/src/app/**/{page,layout,template,loading,error,global-error,not-found,default,manifest,sitemap,robots,icon,apple-icon,opengraph-image}.{ts,tsx}',
];

// Couches de l'application (CLAUDE.md § 11, règle 9, D111) : app/ → features/*/server/ → lib/db | lib/external.
// Seul le `server/` d'une fonctionnalité parle à la base ou à une API externe, et jamais au `server/` d'une autre.
const SRC = 'apps/web/src';
const FONCTIONNALITES = readdirSync(`${SRC}/features`, { withFileTypes: true })
  .filter((entree) => entree.isDirectory())
  .map((entree) => entree.name);

const BASE = {
  regex: '(^|/)lib/db(/|$)',
  message: "Seul le server/ d'une fonctionnalité lit la base (règle 9, D111).",
};
const EXTERNE = {
  regex: '(^|/)lib/external(/|$)',
  message: "Seul le server/ d'une fonctionnalité appelle une API externe (règle 9, D111).",
};
// Seule exception (D111) : le fond de carte est forcément chargé par le navigateur (MapLibre télécharge
// les tuiles chez OpenFreeMap) ; son adresse reste à un seul endroit, l'adaptateur lib/external/fond-carte.
const EXTERNE_SAUF_FOND_CARTE = { ...EXTERNE, regex: '(^|/)lib/external/(?!fond-carte$)' };
const UN_SERVER = {
  // Nos fichiers seulement (`@/…`, `./…`, `../…`) : `react-dom/server` reste permis.
  regex: '^(@/|\\.\\.?/)(.*/)?server(/|$)',
  message: "Hors server/, on passe par une route d'API, jamais par un service (couches, D111).",
};
const interdire = (...patterns) => ({ 'no-restricted-imports': ['error', { patterns }] });

const REGLES_COUCHES = [
  // Routes d'API : elles appellent les services, jamais la base ni une API externe directement.
  { files: [`${SRC}/app/api/**/*.{ts,tsx}`], rules: interdire(BASE, EXTERNE) },
  // Pages : ni base, ni API externe, ni service (01 § 4).
  {
    files: [`${SRC}/app/**/*.{ts,tsx}`],
    ignores: [`${SRC}/app/api/**`],
    rules: interdire(BASE, EXTERNE, UN_SERVER),
  },
  // Composants et outils communs : ni base, ni API externe, ni service.
  {
    files: [`${SRC}/components/**/*.{ts,tsx}`, `${SRC}/lib/**/*.{ts,tsx}`],
    ignores: [`${SRC}/lib/db/**`, `${SRC}/lib/external/**`],
    rules: interdire(BASE, EXTERNE, UN_SERVER),
  },
  ...FONCTIONNALITES.flatMap((nom) => [
    // Interface, hooks, schémas d'une fonctionnalité : ni base, ni API externe, ni service.
    {
      files: [`${SRC}/features/${nom}/**/*.{ts,tsx}`],
      ignores: [`${SRC}/features/${nom}/server/**`],
      rules: interdire(BASE, nom === 'carte' ? EXTERNE_SAUF_FOND_CARTE : EXTERNE, UN_SERVER),
    },
    // Services d'une fonctionnalité : jamais le server/ d'une autre.
    {
      files: [`${SRC}/features/${nom}/server/**/*.{ts,tsx}`],
      rules: interdire({
        regex: `^(@/features/(?!${nom}/)[^/]+|\\.\\./\\.\\./(?!${nom}/)[^/]+)/server(/|$)`,
        message: "Une fonctionnalité n'importe jamais le server/ d'une autre (couches, D111).",
      }),
    },
  ]),
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
  // Règles Next.js (React, hooks, accessibilité de base) limitées à l'application web.
  ...nextVitals.map((config) => ({ ...config, files: ['apps/web/**/*.{ts,tsx}'] })),
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    settings: { next: { rootDir: 'apps/web' } },
  },
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
  ...REGLES_COUCHES,
);
