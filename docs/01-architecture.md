# 01 — Architecture

> **Version** 1.14 · **Date** 06/11/2026
> **Dépend de :** `00-vision.md`, `GLOSSAIRE.md`
> **Utilisé par :** tous les documents techniques (02 → 08), toutes les fiches d'étape
> **Document de référence pour :** composants, couches, dépendances autorisées, organisation du code, environnements, choix techniques.

---

## 1. Vue d'ensemble

```
                         ┌──────────────────────────── Navigateur (mobile d'abord) ─────────────┐
                         │  PWA : pages React, carte MapLibre, cache Serwist, TanStack Query     │
                         └───────────────────────────────┬──────────────────────────────────────┘
                                                         │ HTTP(S) — JSON
┌────────────────────────────────── web : Next.js ───────▼──────────────────────────────────────┐
│  app/ (pages + routes API, fines)                                                              │
│    └→ features/*/server/  services (logique métier) + requêtes                                 │
│          ├→ lib/db/        PostgreSQL + PostGIS (lecture seule, rôle app_lecture)              │
│          ├→ lib/external/  adaptateurs : API Adresse, API SNCF (P1)                            │
│          └→ lib/geo, lib/dates, lib/impact : fonctions pures                                   │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                         ▲ lecture
┌──────────────────────── db : PostgreSQL 16 + PostGIS 3 ─┴──────────────────────────────────────┐
│  gares, horaires, liaisons directes, lieux, rattachements, mobilités, sources, exécutions      │
└────────────────────────────────────────────────────────▲───────────────────────────────────────┘
                                                         │ écriture (rôle etl_ecriture)
┌──────────────────── etl : TypeScript (Node 24) + SQL ──┴───────────────────────────────────────┐
│  sources/ (téléchargement + lecture) → chargement/ (COPY) → transformations/ (SQL) → controles/ │
└────────────────────────────────────────────────────────▲───────────────────────────────────────┘
                                                         │ fichiers téléchargés
                              Données ouvertes : SNCF, DATAtourisme, OSM, Culture, transport.data.gouv
```

**Principe directeur :** tout le travail lourd (télécharger, nettoyer, classer, calculer les trains directs, rattacher les lieux aux gares) se fait **en amont** dans l'ETL. L'application ne fait que **lire** une base déjà prête. Résultat : réponses rapides, aucune dépendance à des API lentes pendant la démo.

## 2. Style d'architecture

| Décision | Choix | Pourquoi | Écarté |
|---|---|---|---|
| Dépôt | **Monorepo pnpm** : espace de travail `apps/web` · `etl` · `packages/commun` | Un seul endroit, un seul langage ; code partagé (schéma de `parametres.json`, date du jour) écrit une seule fois | Turborepo, Nx : inutiles à cette taille |
| Langage | **TypeScript partout** (+ SQL dans PostgreSQL) | Un seul développeur : un seul langage, une seule validation (Zod), un seul outil de tests | Python pour le traitement des données (D024) |
| Application | **Monolithe découpé par fonctionnalité** | Un seul développeur, 8 semaines, logique surtout en lecture | Microservices |
| Couches | **3 couches légères** : route → service → requête/adaptateur | Lisible, testable, sans cérémonie | Hexagonale complète : trop de fichiers pour peu de bénéfice ici |
| Frontières isolées | **Base et API externes** derrière des modules dédiés | Une API qui change = un seul fichier à modifier | — |
| Schéma | **SQL versionné** dans `db/migrations/` | Partagé entre l'app et le traitement des données | Schéma défini deux fois |
| Calculs géographiques et transformations lourdes | **Dans PostgreSQL + PostGIS** (SQL) | Rapide, fiable, au plus près des données ; le TypeScript ne fait que télécharger, valider et charger | Turf.js, traitement ligne à ligne en mémoire |
| CO₂ et prix | **Calcul local** à partir de facteurs publiés, stockés dans `parametres.json` | Fonctionne sans Internet pendant la soutenance | Appel systématique à une API externe |

## 3. Organisation de l'application web

```
apps/web/src/
├─ app/
│  ├─ (app)/layout.tsx                  ← écran Explorer, gardé en vie (D069) ; page.tsx est vide
│  ├─ (app)/destinations/[gareId]/      ← fiche destination (page ou panneau)
│  ├─ (app)/a-propos/ · sources/ · mentions-legales/ ← « L'âme du produit » · Sources · mentions
│  ├─ api/…/route.ts                    ← routes API (contrats dans 05-api.md)
│  ├─ layout.tsx · manifest.ts          ← manifest généré depuis config/marque.ts
│  ├─ sw.ts                             ← service worker (Serwist, D071)
│  └─ serwist/[path]/route.ts           ← sert le service worker
├─ features/
│  ├─ localisation/                     ← position du navigateur, recherche de ville
│  ├─ gares/                            ← gares proches
│  ├─ lieux/                            ← lieux, autour de moi, fiche lieu
│  ├─ destinations/                     ← destinations en train direct
│  ├─ trains/                           ← trains aller/retour, temps réel (P1)
│  ├─ mobilites/                        ← transports sur place
│  ├─ impact/                           ← CO₂, prix estimé
│  ├─ carte/                            ← composants de carte, couches, épingles
│  ├─ explorer/                         ← composition de l'écran principal, filtres
│  ├─ presentation/                     ← page « L'âme du produit », écran Sources
│  └─ sante/                            ← route de santé (état de la base et des données, D047)
├─ components/ui/                       ← boutons, puces, feuilles, onglets (Radix sur tokens, D053)
├─ config/
│  ├─ marque.ts                         ← nom, slogan, description (l'URL est la variable URL_APP, lue côté serveur)
│  └─ parametres.ts                     ← réexporte les paramètres validés de @tourisme/commun
├─ lib/
│  ├─ db/                               ← client, schema.ts (Drizzle), requêtes PostGIS partagées
│  ├─ external/                         ← adresse.ts, sncf.ts, gbfs.ts (vélos disponibles, P1)
│  ├─ geo/                              ← distances, durées (pur)
│  ├─ dates/                            ← secondes ↔ « HH:MM » (pur) ; dateDuJour() vient de @tourisme/commun
│  ├─ impact/                           ← co2(), prixEstime() (pur)
│  ├─ http/                             ← format d'erreur, validation des paramètres, cache
│  ├─ journal.ts                        ← réexporte le journal JSON de @tourisme/commun
│  └─ env.ts                            ← variables d'environnement validées (Zod, côté serveur)
└─ styles/globals.css                   ← design system
```

### Anatomie d'une fonctionnalité

```
features/destinations/
├─ ui/                        ← composants React de la fonctionnalité
│  ├─ carte-destination.tsx
│  └─ liste-destinations.tsx
├─ server/                    ← code serveur uniquement (import 'server-only')
│  ├─ service.ts              ← logique métier, orchestration
│  └─ requetes.ts             ← SQL / Drizzle
├─ schemas.ts                 ← schémas Zod des paramètres et réponses (partagés client/serveur)
├─ types.ts                   ← types publics (dérivés des schémas Zod)
└─ hooks.ts                   ← hooks TanStack Query côté client
```

## 3 bis. Structure complète du dépôt

Déplacée de `CLAUDE.md` § 6, qui en garde un résumé (D066). Toute nouvelle arborescence respecte cette structure ; la modifier = mettre à jour cette section, `CLAUDE.md` § 6 et `DECISIONS.md`.

```
tourisme-en-train/
├─ CLAUDE.md · README.md · .env.example · docker-compose.yml · package.json · pnpm-workspace.yaml
├─ .github/                     ← CODEOWNERS (Hardy relit tout) · modèle de pull request · dependabot.yml (D065)
├─ design/                      ← globals.css source, prompt et captures Claude Design (référence, hors code)
├─ config/
│  ├─ parametres.json            ← seuils métier partagés app + traitement (rayons, vitesses, durées)
│  └─ sources.json               ← adresses et licences des sources de données (dont fichier régional DATAtourisme, réseaux locaux)
├─ docs/
│  ├─ 00-vision.md               ← produit, utilisateurs, fonctionnalités, périmètre
│  ├─ 01-architecture.md         ← composants, couches, flux, choix techniques
│  ├─ 02-sources-donnees.md      ← chaque source : format, champs, licence, usage
│  ├─ 03-base-de-donnees.md      ← tables, colonnes, index, rôles
│  ├─ 04-traitement-donnees.md   ← pipeline ETL et ses algorithmes
│  ├─ 05-api.md                  ← contrat de chaque route
│  ├─ 06-interface.md            ← écrans, états, composants, design system, PWA
│  ├─ 07-contrat-infra.md        ← lien entre l'application et l'infrastructure
│  ├─ 08-conventions-qualite.md  ← règles de code détaillées, tests, définition de « terminé »
│  ├─ GLOSSAIRE.md               ← un terme = un sens = un nom dans le code
│  ├─ BACKLOG.md                 ← user stories, estimations, lien fonctionnalités ↔ tickets, sprints
│  ├─ DECISIONS.md · A-FAIRE.md · JOURNAL.md · LECONS.md (leçons réutilisables, pour Hardy)
│  ├─ etapes/                    ← _MODELE.md + une fiche par étape (E00 → E18)
│  └─ equipe/                    ← travail-en-equipe.md · pitch.md (E13) · scenario-demo.md (E16)
├─ apps/web/scripts/            ← scripts de base lancés par node : generer · migrer · reinitialiser · preparer-base-test (D033)
├─ apps/web/public/icones/      ← icônes de la PWA, provisoires (source : design/icone-provisoire.svg, D071)
├─ apps/web/src/
│  ├─ app/                       ← pages et routes API, fines
│  ├─ features/                  ← localisation/ gares/ lieux/ destinations/ trains/ mobilites/
│  │                                impact/ carte/ explorer/ presentation/ sante/
│  │                                chacune : ui/ · server/ · schemas.ts · types.ts · hooks.ts
│  ├─ components/ui/             ← composants génériques (shadcn/ui sur tokens)
│  ├─ config/                    ← marque.ts · parametres.ts (réexporte @tourisme/commun)
│  ├─ lib/db/                    ← connexion, schéma Drizzle, requêtes PostGIS partagées
│  ├─ lib/external/              ← adaptateurs : adresse.ts · sncf.ts · gbfs.ts
│  ├─ lib/http/                  ← erreurs, validation des paramètres, réponses, cache
│  ├─ lib/geo/ · lib/dates/ · lib/impact/  ← calculs purs (distances, durées, heures, CO₂, prix) ; dateDuJour(), maintenantParis() : @tourisme/commun
│  ├─ lib/env.ts                 ← variables d'environnement validées par Zod
│  └─ styles/globals.css         ← design system
├─ packages/commun/src/         ← @tourisme/commun : schémas Zod de parametres.json et sources.json · dateDuJour() et maintenantParis() à Paris · journal JSON · types partagés
├─ etl/                          ← @tourisme/etl : traitement des données (TypeScript + SQL)
│  ├─ src/run.ts                 ← pnpm etl <source|all> [--force] [--hors-ligne]
│  ├─ src/                       ← config.ts · db.ts · sources/ · transformations/ (TS pur + .sql) · chargement/ · controles/ · regles/
│  └─ tests/                     ← Vitest, GTFS miniature
├─ db/migrations/ · db/echantillon/  ← migrations SQL · données d'exemple (base de test uniquement)
├─ vitest.integration.config.ts ← tests d'intégration sur la base de test (`pnpm test:integration`)
├─ data/brut/ · data/traite/     ← ignorés par Git
└─ infra/                        ← production : README.md (exploitation) · compose.prod.yml · .env.prod.example · scripts/
```

## 4. Règles de dépendance (qui a le droit d'importer quoi)

| Depuis | Peut importer | Ne peut **pas** importer |
|---|---|---|
| `app/**/page.tsx` | `features/*/ui`, `features/*/hooks`, `components/`, `config/` | `lib/db`, `lib/external`, `features/*/server` |
| `app/api/**/route.ts` | `features/*/server/service`, `features/*/schemas`, `lib/http` | `lib/db` directement |
| `features/X/server/service.ts` | ses `requetes.ts`, `lib/*`, `config/`, les **types publics** d'autres fonctionnalités | `features/Y/server/*` |
| `features/X/server/requetes.ts` | `lib/db` | `lib/external` |
| `features/*/ui` | `components/ui`, `features/*/hooks`, `features/*/types` | tout `server/` |
| `lib/geo`, `lib/dates`, `lib/impact` | rien d'autre que `config/` et `@tourisme/commun` | base, réseau, horloge |
| `packages/commun` | `zod` uniquement | `apps/web`, `etl`, base, réseau |
| `etl/` | `@tourisme/commun`, ses propres modules | `apps/web` (l'app et le traitement ne s'importent jamais l'un l'autre) |

*Pourquoi :* ces règles gardent la logique au même endroit et rendent les calculs testables sans base. Une violation est un défaut, même si le code fonctionne.

Si deux fonctionnalités ont besoin de la même requête, elle descend dans `lib/db/requetes-partagees.ts`.

## 5. Flux d'une requête (exemple : destinations)

```
Page Explorer (client)
  → useDestinations({ gareId, date, categories, dureeMaxMin })        features/destinations/hooks.ts
  → GET /api/destinations?gare=…&date=…&categories=…&dureeMax=…       app/api/destinations/route.ts
      1. valider les paramètres (Zod)                                  features/destinations/schemas.ts
      2. appeler le service                                            features/destinations/server/service.ts
           → requetes.destinationsDepuis(gareId, date, …)              SQL sur liaison_directe + gare_stats
             (faisable_journee précalculé par l'ETL, dernier retour par jointure, prochain départ groupé — D040)
           → trancheTemps(duree)                                       fonction pure
      3. répondre en JSON + en-têtes de cache                          lib/http
```

## 6. Le traitement des données (ETL)

```
packages/commun/                  ← @tourisme/commun, importé par l'app ET par le traitement
└─ src/
   ├─ parametres.ts               ← schéma Zod unique de config/parametres.json + valeurs validées
   ├─ sources.ts                  ← schéma Zod de config/sources.json (adresses, licences, réseaux locaux)
   ├─ dates.ts                    ← dateDuJour() et maintenantParis() (seules lectures de l'horloge)
   ├─ journal.ts                  ← journal JSON (une ligne par événement), utilisé par l'app et le traitement
   └─ categories.ts               ← catégories et types partagés

etl/                              ← @tourisme/etl
├─ package.json                   ← csv-parse, pg, pg-copy-streams, yauzl ; exécuté avec tsx
├─ Dockerfile
├─ src/
│  ├─ run.ts                      ← pnpm etl <source|all> [--force] [--hors-ligne]   (code retour 0 = succès)
│  ├─ config.ts                   ← variables d'environnement (Zod) + paramètres (@tourisme/commun)
│  ├─ db.ts                       ← connexion pg, COPY en flux, transaction
│  ├─ sources/                    ← un module par source : telecharger() + lire()
│  ├─ transformations/            ← fonctions pures TS (petites conversions) + fichiers .sql (liaisons, rattachements…)
│  ├─ chargement/                 ← tables temporaires → contrôles → remplacement en une transaction
│  ├─ controles/                  ← vérifications de qualité, rapport
│  └─ regles/categories.csv       ← règles de classement des lieux (éditables sans code)
└─ tests/                         ← Vitest, GTFS miniature
```

**Répartition du travail :**
- **TypeScript** télécharge les fichiers, lit les CSV **en flux** (sans tout charger en mémoire), valide les lignes avec Zod pour les fichiers de taille modeste (gares, lieux), puis charge dans une table temporaire avec `COPY` (le moyen le plus rapide d'entrer des données dans PostgreSQL).
- **PostgreSQL + PostGIS** fait le reste en SQL : conversion des heures GTFS, dépliage du calendrier, liaisons directes, rattachement des lieux aux gares, doublons, statistiques. Pour les gros fichiers (horaires GTFS), le contenu brut est chargé tel quel puis transformé et contrôlé directement en SQL.
- Les requêtes SQL longues vivent dans des fichiers `.sql` versionnés, exécutés avec des paramètres (jamais de valeurs concaténées).

Détail des étapes et algorithmes : `04-traitement-donnees.md`.

## 7. Environnements

| Environnement | Ce qui tourne où | Usage |
|---|---|---|
| **Développement (poste de Hardy)** | `db` + `adminer` dans Docker · `web` avec `pnpm dev` sur la machine · traitement des données avec `pnpm etl <source>` sur la machine (ou dans Docker) | Travail quotidien, rechargement rapide |
| **Démo locale (soutenance)** | **Tout dans Docker** : `db`, `web` (image de production), données figées | `docker compose --profile demo up` — une seule commande |
| **Mise en ligne** | VPS géré par Coolify : mêmes images + proxy HTTPS | Voir `07-contrat-infra.md`, E17, D076 |

*Pourquoi `web` hors Docker en développement :* sous Windows, le rechargement à chaud de Next.js dans un conteneur est lent. La base, elle, est toujours dans Docker pour être identique partout.

## 8. Choix techniques et versions

| Composant | Version cible | Remarque |
|---|---|---|
| Node.js | 24 LTS | `.nvmrc` et `engines.node` (D028) |
| pnpm | 11.24.0 (fixé) | `packageManager` ; scripts d'installation autorisés un par un (`allowBuilds` dans `pnpm-workspace.yaml`, D029) |
| Next.js | 16 (App Router), Turbopack | `params` et `searchParams` sont asynchrones (D029) |
| React | 19 | |
| TypeScript | 5.9.3 (fixé) strict | `noUncheckedIndexedAccess` activé ; pas de 6.1+ ni 7 tant que typescript-eslint ne les prend pas en charge (D029) |
| Tailwind CSS | 4 | Tokens dans `globals.css` via `@theme` |
| Drizzle ORM / drizzle-kit | 0.45 / 0.31 | Migrations SQL générées dans `db/migrations/` par `pnpm db:generer` (correction du type `geography`, D033) ; pilote `pg` (node-postgres) dans l'application comme dans le traitement des données |
| Zod | 4 | |
| ESLint / Prettier | 10 (configuration « flat ») / 3 | Une seule configuration à la racine |
| Vitest / Playwright | 5 / 1.x | Un projet Vitest par paquet, lancés ensemble par `pnpm test` |
| MapLibre GL / react-map-gl | dernière stable | Fond OpenFreeMap |
| Serwist | 9 (`@serwist/turbopack`) | Service worker servi par une route Next.js, construit par esbuild — essai validé (D029) |
| PostgreSQL / PostGIS | 16 / 3.4 | Image `postgis/postgis:16-3.4` |
| tsx | dernière stable | Exécute le traitement des données en TypeScript sans étape de compilation |
| csv-parse, pg, pg-copy-streams, yauzl | dernières stables | Lecture CSV en flux, connexion PostgreSQL, chargement `COPY`, lecture des ZIP GTFS |

Toute nouvelle dépendance majeure : entrée dans `DECISIONS.md` **avant** installation.

## 9. Préparé pour plus tard (sans rien construire maintenant)

- **Connexion Google :** Auth.js s'ajoutera dans `features/compte/` + tables `utilisateur`, `compte`, `session` par migration. Aucun code actuel ne doit supposer l'absence d'utilisateur de façon irréversible.
- **Extension nationale :** tout filtre régional passe par `parametres.region`, jamais par une valeur en dur.
- **Plusieurs régions / clients (reporté, voir `A-FAIRE`) :** une instance par client (application + base séparées) et un dossier de configuration par région. Préparé dès maintenant : périmètre dans `parametres.json`, adresses des sources dans `sources.json`, couleurs dans les tokens, nom dans `marque.ts`.
- **Itinéraire piéton réel :** `lib/geo/distanceMarche()` est l'unique point à remplacer.

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 30/09/2026 | 1.0 | Création |
| 30/09/2026 | 1.1 | Adaptateur `gbfs.ts` |
| 05/10/2026 | 1.2 | Traitement des données en TypeScript + SQL (au lieu de Python), espace de travail pnpm, `packages/commun` — D024 |
| 05/10/2026 | 1.3 | `config/sources.json` et son schéma dans `packages/commun` — D027 |
| 09/10/2026 | 1.4 | § 8 : versions fixées (Node 24 — D028 ; Next.js 16, Zod 4, TypeScript 5.9, pnpm 11 — D029) ; `marque.ts` sans URL, `maintenantParis()`, journal dans le code commun — D031 |
| 11/10/2026 | 1.5 | § 8 : pilote `pg` dans l'application, génération des migrations par `pnpm db:generer` — D033 |
| 01/11/2026 | 1.6 | § 5 : faisable dans la journée précalculé par l'ETL, prochain départ en une requête groupée — D040 |
| 03/11/2026 | 1.7 | § 3 : fonctionnalité `sante/` — D047 |
| 04/11/2026 | 1.8 | § 3 : composants sur Radix, sans l'installateur shadcn — D053 |
| 05/11/2026 | 1.9 | § 3 bis : structure complète du dépôt, déplacée de `CLAUDE.md` § 6 — D066 |
| 05/11/2026 | 1.10 | § 3 : Explorer dans la mise en page — D069 |
| 05/11/2026 | 1.11 | § 3 et § 3 bis : service worker, icônes — D071 |
| 06/11/2026 | 1.12 | § 3 : écran Sources à sa propre adresse — D075 |
| 06/11/2026 | 1.13 | § 1, § 3 bis, § 7 : infrastructure confiée à Hardy, sur Coolify — D076 |
| 06/11/2026 | 1.14 | § 3 bis : contenu d'`infra/` — D076 |
