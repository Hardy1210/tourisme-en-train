# E00 — Initialisation du dépôt et des outils

> **Semaine :** S1 (05/10 → 11/10) · **Priorité :** P0 · **Branche :** `etape/E00-initialisation`
> **Étapes préalables :** aucune · **État :** ✅ terminé (PR #43, fusionnée le 09/10/2026)
> **Version de la fiche** 1.1 · **Date** 05/10/2026

## Contexte minimal
Projet `tourisme-en-train` (marque provisoire Wagoo) : PWA qui montre ce qu'on peut faire autour de soi et comment y aller en train. La documentation est rédigée ; aucun code n'existe. Cette étape pose le squelette du dépôt, les outils, les conventions et les deux fichiers de configuration centraux (`marque.ts`, `parametres.json`), pour que toutes les étapes suivantes partent d'une base propre.

## Documents à lire
- `CLAUDE.md`
- `docs/01-architecture.md` (§ 3, § 6, § 8)
- `docs/04-traitement-donnees.md` (§ 2 : `parametres.json`)
- `docs/07-contrat-infra.md` (§ 3 : variables)
- `docs/08-conventions-qualite.md`

## Objectif
Un dépôt prêt à accueillir le code : outils installés, structure en place, vérifications automatiques qui passent.

## Résultat attendu
- `pnpm dev` affiche une page d'accueil provisoire avec le nom issu de `marque.ts`.
- `pnpm verifier` passe (application, code commun, traitement des données).
- `pnpm etl --help` affiche l'aide du traitement des données.
- Le dépôt est sur GitHub, `main` protégée, `CODEOWNERS` et modèle de pull request actifs.

## Actions de Hardy
- [x] Créer le dépôt GitHub `tourisme-en-train` (compte Hardy1210, **public conseillé**), y envoyer la documentation, protéger `main`, inviter les SR : pas-à-pas dans `docs/equipe/travail-en-equipe.md` § 2–3.
- [x] Installer : Git, Docker Desktop (moteur WSL2), Node.js 24 LTS (`.nvmrc` = `24` et `engines.node` `>=24` à la racine — D028), pnpm (`corepack enable`), un éditeur.
- [x] Envoyer `docs/equipe/demarrage-SR.md` et `docs/equipe/guide-SR.md` aux SR.
- [x] Valider le plan proposé par Claude Code après l'audit.

## Phase d'audit
1. Vérifier les versions installées (`node -v`, `pnpm -v`, `docker --version`) et les noter.
2. Vérifier que le dossier ne contient que la documentation : `CLAUDE.md`, `README.md`, `.gitignore`, `.github/`, `design/`, `docs/`, `infra/` (`CLAUDE.md` et `JOURNAL.md` des SR).
3. Proposer le plan de fichiers ; attendre la validation.

## Tâches
**Racine**
- [x] Compléter `.gitignore` (node_modules, .next, .env, data/, rapports, sorties de test), ajouter `.editorconfig` et `.gitattributes` (fins de ligne LF).
- [x] Compléter `README.md` : prérequis, démarrage (complété à chaque étape).
- [x] `.env.example` avec toutes les variables de `07` § 3 (valeurs d'exemple, aucun secret).
- [x] `pnpm-workspace.yaml` (paquets : `apps/web`, `etl`, `packages/*`) et `package.json` racine avec les scripts communs : `dev`, `verifier`, `test`, `typecheck`, `lint`, `format`, `etl` (→ `pnpm --filter @tourisme/etl start`).
- [x] Dossiers vides avec `.gitkeep` : `db/migrations`, `db/echantillon`, `data/brut`, `data/traite` (`infra/` existe déjà, avec son `CLAUDE.md`).
- [x] Vérifier `.github/CODEOWNERS` et `.github/pull_request_template.md` (déjà présents) ; ajouter au modèle la question « quelles protections deviennent insuffisantes ? ».

**Configuration partagée**
- [x] `config/parametres.json` : contenu exact de `04` § 2.

**Code commun (`packages/commun`, paquet `@tourisme/commun`)**
- [x] `src/parametres.ts` : **le seul** schéma Zod de `parametres.json` + export des valeurs validées et de leur type. Les `null` autorisés tant que `prix.aCalibrer` est vrai.
- [x] `src/dates.ts` : `dateDuJour(fuseau)` (seule lecture de l'horloge du projet) ; **tests** : été, hiver, 23:30 UTC en hiver (= lendemain à Paris).
- [x] `src/categories.ts` : liste des catégories et types partagés.
- [x] Test : `config/parametres.json` est accepté par le schéma **et** un fichier avec une clé manquante est refusé.

**Application web (`apps/web`)**
- [x] Créer l'app Next.js 15 : TypeScript, App Router, dossier `src/`, Tailwind 4, ESLint, alias `@/*`.
- [x] `tsconfig` : `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`.
- [x] Prettier + règles ESLint (pas de `any`, pas de `console.log`, pas d'`export default` hors fichiers Next).
- [x] Structure vide conforme à `01` § 3 (`features/`, `components/ui/`, `config/`, `lib/…`) avec `.gitkeep`.
- [x] `src/config/marque.ts` : `nom: 'Wagoo'`, `slogan`, `description`, `url` (depuis `URL_APP`).
- [x] `src/config/parametres.ts` : réexporte les paramètres de `@tourisme/commun` (aucun second schéma) ; `next.config` : `transpilePackages: ['@tourisme/commun']`.
- [x] `src/lib/env.ts` : schéma Zod des variables ; échec explicite si manquante.
- [x] `src/lib/journal.ts` : journal JSON (niveaux info/avertissement/erreur).
- [x] `src/lib/dates/` : `secondesVersHeure(s)` → `{ texte, lendemain }` (tests : 25:10:00, 23:50:00) ; `dateDuJour` vient de `@tourisme/commun`.
- [x] Vitest configuré ; `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm verifier`.
- [x] Page d'accueil provisoire : affiche `marque.nom` et « En construction ».

**Traitement des données (`etl`, paquet `@tourisme/etl`)**
- [x] `package.json` : dépendances `csv-parse`, `pg`, `pg-copy-streams`, `yauzl`, `zod`, `@tourisme/commun` ; exécution avec `tsx` ; mêmes règles TypeScript, ESLint et Prettier que l'app.
- [x] `src/config.ts` : variables d'environnement validées par Zod (`BDD_URL_ETL`, `DOSSIER_DONNEES`) + paramètres importés de `@tourisme/commun`.
- [x] `src/run.ts` : squelette avec l'argument `<source|all>`, `--force`, `--hors-ligne`, `--help` (via `node:util` `parseArgs`) ; journal JSON ; code retour.
- [x] Vitest configuré pour `etl/tests/` ; inclus dans `pnpm test`.

## Critères d'acceptation
- [x] `pnpm verifier` passe sur tout l'espace de travail.
- [x] Un seul schéma de `parametres.json` existe dans le dépôt (recherche dans le code).
- [x] Les tests de `dateDuJour` couvrent été, hiver et le passage de minuit UTC.
- [x] Aucun nom « Wagoo » en dur hors de `marque.ts` (recherche dans le code).
- [x] Le dépôt est poussé sur GitHub ; `CODEOWNERS` actif.
- [x] `CLAUDE.md` § 16 complété avec les commandes réelles.

## Vérifications manuelles
- Ouvrir `http://localhost:3000` : le nom s'affiche.
- Supprimer une variable obligatoire de `.env` : l'app refuse de démarrer avec un message clair (puis la remettre).

## À ne pas toucher
- `docs/` (sauf `CLAUDE.md` § 16 et mises à jour de fin d'étape).
- Aucune table, aucun Docker (E01).

## Fin d'étape
Voir `_MODELE.md` § Fin d'étape.

## Notes et modifications après coup
- 02/10/2026 : `README.md` et `.gitignore` minimaux créés avant E00 (dépôt public dès la documentation) ; E00 les **complète** au lieu de les créer.
- 05/10/2026 : traitement des données en TypeScript (paquet `@tourisme/etl`), espace de travail pnpm, `packages/commun` avec le schéma unique de `parametres.json` ; Python retiré (D024).
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
- 07/10/2026 : Node.js 24 au lieu de 22, `.nvmrc` et `engines.node` à la racine — D028 (note ajoutée après coup le 09/10).
- 09/10/2026 : plan validé après audit. Versions fixées (Next.js 16 sous réserve d'un essai Serwist de 30 min, Zod 4, TypeScript 5.9.3, pnpm 11.24.0) — D029 ; `BDD_PORT_HOTE` dans `.env.example` — D030 ; `marque.ts` sans URL, `maintenantParis()` en plus de `dateDuJour()`, journal JSON dans `@tourisme/commun`, exceptions `export default` et `server-only` — D031. Le dépôt GitHub existait déjà (PR #1) : les critères correspondants sont vérifiés, pas refaits.
