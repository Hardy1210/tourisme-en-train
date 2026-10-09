# 08 — Conventions de code et qualité

> **Version** 1.2 · **Date** 09/10/2026
> **Dépend de :** `01-architecture.md`, `GLOSSAIRE.md`
> **Utilisé par :** toutes les fiches d'étape
> **Document de référence pour :** style de code, nommage détaillé, gestion des erreurs, journaux, tests, Git, définition de « terminé ».
> Le résumé est dans `CLAUDE.md` § 11 ; **ce document fait foi** en cas de doute.

---

## 1. TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`.
- **Interdits :** `any`, `@ts-ignore` (utiliser `@ts-expect-error` avec justification), `as` pour forcer un type sauf après validation Zod, `console.log` (utiliser le journal), `export default` hors fichiers imposés par Next.js (`page.tsx`, `layout.tsx`, `manifest.ts`…) et fichiers de configuration des outils (`next.config`, `postcss.config`, `eslint.config`, `prettier.config`, `vitest.config`, `drizzle.config`, `playwright.config`) — D031.
- **Types dérivés, jamais recopiés** : `type Destination = z.infer<typeof schemaDestination>`. *Une copie à la main compile encore quand la source change, et cache l'écart.*
- **Fonctions** : une responsabilité ; paramètres objets au-delà de 3 paramètres ; valeurs de retour typées explicitement pour les fonctions exportées.
- **Code serveur** : première ligne `import 'server-only'` dans tout fichier de `server/`, `lib/db/`, `lib/external/`, **sauf** `lib/db/schema.ts` et `lib/db/types-postgis.ts` (lus aussi par drizzle-kit, hors de Next.js). Dans Vitest, `server-only` est remplacé par un module vide (alias) — D031.
- **Composants** : Server Components par défaut ; `'use client'` seulement si interaction ou hook navigateur ; props typées ; aucun appel `fetch` direct (hooks TanStack Query).

## 2. Traitement des données (`etl/`, TypeScript + SQL)

- **Mêmes règles TypeScript qu'au § 1** (sauf `server-only`, propre à Next.js), mêmes ESLint et Prettier.
- **Zod** pour les variables d'environnement et chaque ligne lue des fichiers de taille modeste ; les paramètres viennent de `@tourisme/commun` (jamais relus ni revalidés à part).
- **Lecture en flux** des fichiers (CSV, ZIP) : jamais de fichier entier chargé en mémoire.
- **Chargement par `COPY`** dans une table temporaire, puis transformation en SQL.
- **SQL paramétré** uniquement (`$1`, `$2`…) : jamais de valeur concaténée dans une requête. Les requêtes longues vivent dans des fichiers `.sql` à côté du module qui les exécute.
- Un module par source : `sources/<code>.ts` avec `telecharger()` et `lire()` ; les petites conversions sont des fonctions pures dans `transformations/` ; les transformations lourdes sont des fichiers `.sql`.
- Journal JSON sur la sortie standard (même format que l'app).
- `etl/` n'importe jamais `apps/web`, et inversement : le code commun va dans `packages/commun`.

## 3. SQL et migrations

- Tables et colonnes : `snake_case`, français, sans accents, **au singulier** (`gare`, `lieu`).
- Toute modification de schéma : `schema.ts` → `drizzle-kit generate` → relire le SQL → appliquer → mettre à jour `03-base-de-donnees.md`.
- Migrations **jamais modifiées une fois appliquées** sur une autre machine : on en ajoute une nouvelle.
- Index justifié par une requête réelle (citer la requête dans le commit).

## 4. Nommage

| Élément | Convention | Exemple |
|---|---|---|
| Fichier TS/TSX | `kebab-case` | `carte-destination.tsx` |
| Composant React | `PascalCase` | `CarteDestination` |
| Hook | `useXxx` | `useDestinations` |
| Fonction, variable | `camelCase` | `dureeMarcheMin` |
| Constante de module | `SCREAMING_SNAKE_CASE` | `CATEGORIES` |
| Schéma Zod | `schemaXxx` | `schemaParametresDestinations` |
| Route API | `kebab-case`, français | `/api/trains/temps-reel` |
| Branche | `etape/Exx-description` ou `correctif/description` | `etape/E04-trains-directs` |

Vocabulaire : `GLOSSAIRE.md`. Un terme absent y est ajouté **avant** usage.

## 5. Erreurs et journaux

- Les erreurs attendues (paramètre invalide, introuvable, service externe indisponible) sont des **classes dédiées** dans `lib/http/erreurs.ts`, traduites en réponse par un utilitaire unique.
- Les erreurs inattendues sont journalisées avec contexte, et renvoient `ERREUR_INTERNE` sans détail.
- **Aucun `catch` silencieux** : tout `catch` journalise ou relance.
- Journaux : module unique `journal.ts` de `@tourisme/commun` (JSON sur la sortie standard), réexporté par `apps/web/src/lib/journal.ts` et importé par l'ETL (D031). **Jamais** de position, jamais de clé API, jamais de contenu de variable d'environnement.

## 6. Dates et heures

Règles de `CLAUDE.md` § 3. En pratique :
- `dateDuJour()` et `maintenantParis()` (date du jour + heure actuelle en secondes depuis minuit) de `packages/commun` sont **les seules** fonctions qui lisent l'horloge, dans l'app comme dans le traitement des données ; elles acceptent un instant en paramètre pour les tests ; tout le reste reçoit la date ou l'heure en paramètre (D031).
- Utiliser `Intl.DateTimeFormat` avec `timeZone: 'Europe/Paris'` (ou `Temporal` si disponible) ; pas de bibliothèque de dates sans décision.
- Dans le SQL, la date du jour arrive **en paramètre** : jamais `CURRENT_DATE` ni `now()` (ils suivent le fuseau du serveur).

## 7. Tests

| Niveau | Outil | Emplacement | Quoi |
|---|---|---|---|
| Unitaires | Vitest | à côté du fichier : `x.test.ts` | Fonctions pures (`lib/geo`, `lib/dates`, `lib/impact`), schémas Zod, services avec requêtes simulées |
| Intégration | Vitest + base de test Docker | `apps/web/tests/integration/` | Routes API contre `db/echantillon/` |
| Traitement des données | Vitest + base de test Docker | `etl/tests/` | Lecture, normalisation, catégorisation, requêtes SQL (heures, calendrier, liaisons, rattachements) sur un GTFS miniature |
| Parcours | Playwright | `apps/web/tests/e2e/` | Ouverture → résultats → destination → trains, sur mobile émulé |

**Règles :**
1. **Tests en paires** : le cas **et** sa limite. *Sans la limite, une fonction qui dit toujours « oui » passe.*
2. **Dates** : tout test impliquant une date existe en **version été et hiver**, et un cas **après minuit** (heure GTFS > 24 h).
3. **Un test doit pouvoir échouer** : lors de sa création, le casser volontairement une fois pour vérifier qu'il échoue (en copiant le fichier avant, voir § 9).
4. **Pas de test dépendant du réseau** ou de l'heure réelle.
5. **Pas de test intermittent** : un test qui échoue « parfois » est corrigé ou supprimé immédiatement.
6. Couverture visée : **fonctions pures ≥ 90 %**, le reste selon l'utilité, sans course au chiffre.

## 8. Scripts

| Script | Commande |
|---|---|
| Développement | `pnpm dev` |
| Vérification des types | `pnpm typecheck` |
| Lint | `pnpm lint` |
| Format | `pnpm format` |
| Tests unitaires | `pnpm test` |
| Tests d'intégration | `pnpm test:integration` |
| Tests de parcours | `pnpm test:e2e` |
| Migrations | `pnpm db:generer` · `pnpm db:migrer` |
| Tout vérifier | `pnpm verifier` (typecheck + lint + test) |
| Traitement des données | `pnpm etl <source|all>` ou `docker compose run --rm etl <source|all>` |
| Tests du traitement | inclus dans `pnpm test` (tout l'espace de travail) |

Les commandes réelles sont reportées dans `CLAUDE.md` § 16 dès qu'elles existent.

## 9. Git

- **Commits** : `type(portee): description` en français, à l'impératif présent. Types : `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `data`. Ex. : `feat(destinations): ajoute le filtre par durée`.
- **Petits commits** cohérents ; jamais « divers ».
- **Pas de `Co-Authored-By`.**
- **Branches** : une par étape ; fusion dans `main` par pull request en fin d'étape (description : ce qui est fait, comment le vérifier, captures si écran).
- **Protocole de sécurité** : jamais `git checkout`, `restore`, `stash`, `clean -fd`, `reset --hard` sur du travail non commité ; pour casser un test volontairement : copier le fichier → modifier → tester → restaurer depuis la copie ; `git status` avant toute commande qui jette des changements.
- **`infra/`** : modifié uniquement par pull request des SR, relue par Hardy.

## 10. Définition de « terminé »

Une tâche est terminée quand **tout** est vrai :

**Toujours**
- [ ] `pnpm verifier` passe (application, code commun et traitement des données).
- [ ] Les critères d'acceptation de la fiche d'étape sont vérifiés un par un.
- [ ] La documentation de référence touchée est à jour (en-tête, historique).
- [ ] Aucun interdit de `CLAUDE.md` § 12 n'est violé.

**Si un écran est touché**
- [ ] Ouvert dans le navigateur, en mobile **et** desktop, en mode clair (et sombre si P1 fait).
- [ ] États vides, chargement et erreur vérifiés.
- [ ] Navigation clavier possible.

**Si des données sont touchées**
- [ ] Rapport ETL relu ; lignes en base comptées ; 5 lignes au hasard inspectées.

**Si une route est touchée**
- [ ] Appelée à la main avec un cas valide, un cas invalide et un cas limite.

## 11. Relecture (avant chaque fusion)

- Respect des couches et des règles de dépendance (`01` § 4).
- Pas de valeur en dur (couleur, marque, seuil).
- Nouveaux termes ajoutés au glossaire.
- « Quelles protections existantes deviennent insuffisantes avec ce changement ? » — réponse écrite dans la pull request.

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 30/09/2026 | 1.0 | Création |
| 05/10/2026 | 1.1 | Traitement des données en TypeScript + SQL : règles du § 2, tests Vitest, commandes `pnpm etl` — D024 |
| 09/10/2026 | 1.2 | Exceptions `export default` et `server-only`, journal dans le code commun, `maintenantParis()` — D031 |
