# Journal des décisions

> **Rôle :** garder la trace de **pourquoi** chaque choix a été fait. `CLAUDE.md` dit ce qui est vrai aujourd'hui ; ce fichier dit comment on y est arrivé.
> **Règle :** on n'efface jamais une décision. Si elle change, on ajoute une nouvelle décision qui « remplace Dxxx », et on marque l'ancienne « Remplacée par Dyyy ».
> **Format :** numéro, date, **en clair** (une phrase sans jargon, depuis D041), décision, raison, alternatives écartées, impact (documents touchés).
> **Pour réviser ou préparer la soutenance :** le sommaire ci-dessous range les décisions par thème. Les leçons réutilisables dans d'autres projets sont dans `LECONS.md`.

## Sommaire par thème

| Thème | Décisions |
|---|---|
| **Produit et périmètre** (ce que l'application fait ou ne fait pas) | D001 trains directs · D003 sans compte · D008 région pilote · D010 CO₂ et prix calculés · D011 CO₂ honnête · D018 partage en P1 · D019 vélos en direct · D020 transport à la demande exclu · D022 nom de la commune de l'utilisateur |
| **Architecture et outils** | D002 données en base, API pour le temps réel · D004 stack · D005 monorepo · D009 PostGIS `geography` · D024 TypeScript au lieu de Python · D028 Node 24 · D029 versions fixées · D030 port de la base · D033 mise en place de la base |
| **Données et traitement** (sources, gares, horaires, liaisons, lieux) | D013 sources retenues · D027 multi-région préparé · D034 gares · D035 socle du traitement · D036 horaires GTFS · D037 chargement GTFS · D038 table `commune` · D039 codes UIC · D040 liaisons directes · D041 lieux · D042 règles de catégories relues · D043 rattachements (doublons, sites, lieux en longueur) · D044 décisions manuelles sur les doublons, lieux fermés au public · D045 noms exclus, parc d'un château |
| **Règles et conventions** | D006 nom de code et marque · D007 tout en français · D012 paramètres partagés · D031 conventions avant le code |
| **Interface** | D017 maquette de référence · D021 carte et temps réel |
| **Équipe, calendrier, livraison** | D014 démo sous Docker · D015 indépendance vis-à-vis des SR · D016 pas de skills · D023 GitHub · D025 calendrier · D026 fichier maître des SR · D032 backlog |

---

## D001 — Périmètre : trains directs uniquement
- **Date :** 29/09/2026
- **Décision :** aucune recherche d'itinéraire avec correspondances.
- **Raison :** le défi l'identifie comme trop difficile ; un résultat faux serait pire que pas de résultat.
- **Écarté :** moteur d'itinéraire (Navitia en direct, OpenTripPlanner).
- **Impact :** `00`, `04` § 4.3, `05`.

## D002 — Architecture hybride : données préparées en base + API seulement pour le temps réel
- **Date :** 29/09/2026
- **Décision :** l'ETL prépare gares, horaires, trains directs, lieux et rattachements ; l'app lit la base. API externes uniquement pour la recherche de ville et le temps réel (P1).
- **Raison :** rapidité, fiabilité en démo, quotas des API, DATAtourisme non interrogeable à la volée.
- **Écarté :** approche « 100 % API » (Overpass et Navitia en direct à chaque ouverture).
- **Impact :** `01`, `04`.

## D003 — Application sans compte ni inscription
- **Date :** 29/09/2026
- **Décision :** aucune authentification en v1 ; Auth.js (Google) prévu plus tard.
- **Raison :** promesse « 30 secondes, zéro friction » ; RGPD simplifié.
- **Impact :** `00`, `01` § 9, `03` § 7.

## D004 — Stack
- **Date :** 29/09/2026
- **Décision :** Next.js 15 + TypeScript + Tailwind 4 + Zod + TanStack Query + MapLibre/OpenFreeMap + Serwist ; PostgreSQL 16 + PostGIS ; Drizzle ; Python 3.12 + pandas + Pydantic + psycopg ; Docker Compose ; pnpm, uv.
- **Raison :** stack maîtrisée (proche de Lexio), gratuite, adaptée à la géographie.
- **Impact :** `CLAUDE.md` § 4, `01` § 8.
- **Modifiée par :** D024 (traitement des données en TypeScript + SQL ; Python, pandas, Pydantic, psycopg et uv retirés).

## D005 — Monorepo simple et monolithe par fonctionnalité
- **Date :** 30/09/2026
- **Décision :** un dépôt, un dossier par partie (`apps/web`, `etl`, `db`, `infra`, `docs`) ; application découpée par fonctionnalité en 3 couches légères.
- **Raison :** un seul développeur, deux langages, 10 semaines ; les dossiers matérialisent la répartition Hardy / SR.
- **Écarté :** architecture hexagonale complète (sur-dimensionnée), Turborepo/workspaces (inutiles avec deux langages).
- **Impact :** `01`.
- **Modifiée par :** D024 (un seul langage → espace de travail pnpm avec `packages/commun`).

## D006 — Nom de code technique et marque séparés
- **Date :** 30/09/2026
- **Décision :** nom de code `tourisme-en-train` (définitif) ; marque « Wagoo » (provisoire) centralisée dans `apps/web/src/config/marque.ts`.
- **Raison :** le nom commercial n'est pas arrêté ; le changer ne doit toucher qu'un fichier.
- **Impact :** `CLAUDE.md` § 1, `06` § 9.

## D007 — Projet entièrement en français
- **Date :** 30/09/2026
- **Décision :** documents, interface, commits et vocabulaire métier du code en français (sans accents dans les identifiants).
- **Raison :** exigence du projet ; cohérence pour l'équipe et le jury.
- **Impact :** `GLOSSAIRE.md`, `08` § 4. Conséquence : tables `lieu`/`lieu_gare` (et non `poi`), route `/api/sante`.

## D008 — Région pilote Bourgogne-Franche-Comté
- **Date :** 29/09/2026
- **Décision :** données de lieux limitées à la région 27 ; toutes les gares de France chargées pour les destinations hors région.
- **Raison :** volume maîtrisé, région de l'équipe (Dijon), extension nationale par paramètre.
- **Impact :** `00` § 8, `03` § 2, `04` § 4.

## D009 — Géographie dans PostGIS, en `geography`
- **Date :** 30/09/2026
- **Décision :** calculs de distance et de proximité en SQL ; type `geography(…, 4326)`.
- **Raison :** distances directement en mètres ; pas de bibliothèque géographique côté Python.
- **Écarté :** geopandas, `geometry` + conversions.
- **Impact :** `03` § 1, `04`.

## D010 — CO₂ et prix calculés localement
- **Date :** 30/09/2026
- **Décision :** facteurs d'émission ADEME recopiés (avec source et date) dans `config/parametres.json` ; calcul par fonctions pures.
- **Raison :** démo fonctionnelle sans réseau ; valeurs stables.
- **Écarté :** appel à l'API Impact CO2 à chaque demande.
- **Impact :** `02` § 4, `04` § 6, `05` § 3.10.

## D011 — Comparaison CO₂ honnête
- **Date :** 30/09/2026
- **Décision :** afficher train, voiture seule, voiture partagée (et avion au-delà d'un seuil).
- **Raison :** pour une famille dans une seule voiture, l'écart avec le TER est faible ; le cacher serait trompeur. Le défi demande aussi la comparaison avec la voiture partagée et l'avion.
- **Impact :** `04` § 6, `06` § 4.

## D012 — Paramètres métier partagés dans un fichier unique
- **Date :** 30/09/2026
- **Décision :** `config/parametres.json`, validé par Zod (app) et Pydantic (ETL).
- **Raison :** deux copies d'un seuil divergent sans erreur visible.
- **Impact :** `04` § 2.
- **Modifiée par :** D024 (un seul schéma Zod, dans `packages/commun`).

## D013 — Sources retenues et écartées
- **Date :** 30/09/2026
- **Décision :** voir `02` § 1 et § 5. DATAtourisme en **CSV par région** (plus simple que le flux JSON) ; OSM via GéoDataMine en priorité.
- **Raison :** couverture, simplicité, alignement avec les exemples du défi (aménagements cyclables, isochrone).
- **Impact :** `02`.

## D014 — Démo en local sous Docker, mise en ligne optionnelle
- **Date :** 29/09/2026
- **Décision :** soutenance en local (`docker compose --profile demo up`) ; mise en ligne v1 par les SR si le temps le permet.
- **Raison :** coût nul, indépendance vis-à-vis du réseau et du serveur le jour J.
- **Impact :** `01` § 7, `07`, E16, E17.

## D015 — Le développeur ne dépend jamais des SR
- **Date :** 30/09/2026
- **Décision :** l'application complète tourne en local ; le lien avec l'infrastructure passe par `07-contrat-infra.md`.
- **Raison :** les retours d'équipe sont lents ; le travail doit avancer sans attente.
- **Impact :** `07`, `equipe/guide-SR.md`.

## D016 — Pas de skills Claude Code pour l'instant
- **Date :** 30/09/2026
- **Décision :** aucun skill installé au démarrage. Candidats identifiés pour plus tard : frontend-design, webapp-testing (Anthropic), vercel-react-best-practices, web-design-guidelines (Vercel), postgres-best-practices (Supabase).
- **Raison :** garder la méthode du projet (`CLAUDE.md`) comme seule référence au départ.
- **Impact :** `A-FAIRE.md`.

## D017 — Maquette Explorer validée comme référence d'aspect
- **Date :** 30/09/2026
- **Décision :** la maquette Claude Design « Explorer » (mobile + desktop, fiche destination intégrée) est la référence visuelle. Elle est écrite dans le format propre à Claude Design (gabarits + classe `DCLogic`) : **aucun code n'en est copié**, l'écran est reconstruit en React avec nos composants et nos tokens.
- **Raison :** la maquette correspond au périmètre demandé ; seuls quelques détails dépassent la v1.
- **Impact :** `06` § 3, § 4, § 4 bis.

## D018 — Partage et « Ce week-end » en P1
- **Date :** 30/09/2026
- **Décision :** bouton « Partager » (lien de la page) en P1 ; « Ce week-end » = début du week-end (samedi, ou aujourd'hui si samedi/dimanche) avec bascule Samedi / Dimanche dans la fiche.
- **Raison :** coût très faible (filtres déjà dans l'URL ; une fonction de date pure), gain d'usage réel.
- **Écarté :** recherche sur deux dates en une seule requête.
- **Impact :** `00` F21, F25 ; `05` § A.3, A.4 ; `06` § 3, § 4.

## D019 — Vélos disponibles en direct (P1)
- **Date :** 30/09/2026
- **Décision :** nombre de vélos disponibles lu en direct dans le flux GBFS `station_status` (cache 60 s), pour les villes qui le publient ; sinon station affichée sans nombre.
- **Raison :** donnée ouverte, gratuite, sans clé ; répond au frein « se déplacer sur place ».
- **Impact :** `00` F26 ; `02` § 3.3 ; `05` § A.1 ; `06` § 4 ; E07, E09, E12.

## D020 — Transport à la demande exclu
- **Date :** 30/09/2026
- **Décision :** pas d'information « transport à la demande » (présente dans la maquette).
- **Raison :** presque jamais publiée en données ouvertes ; une saisie manuelle serait vite fausse et contraire au principe open data.
- **Impact :** `00` § 9 ; `06` § 4.

## D021 — Carte : segments droits + étiquettes limitées ; temps réel limité à aujourd'hui
- **Date :** 30/09/2026
- **Décision :** liaisons dessinées en segments droits (P0), vrais tracés en P1 ; étiquettes pour les 5 destinations les plus proches, au survol et à la sélection. Statuts temps réel uniquement pour les trains des 3 prochaines heures aujourd'hui ; par défaut horaires théoriques sans statut.
- **Raison :** la maquette dessine des lignes idéales et des statuts sur tous les trains, impossibles à reproduire tels quels avec les vraies données.
- **Impact :** `05` § A.2 ; `06` § 3, § 4.

## D022 — Nom de la commune de l'utilisateur par géocodage inverse (API Adresse)
- **Date :** 02/10/2026
- **Décision :** la puce « Autour de <commune> » obtient le nom de la commune par la recherche inverse de l'API Adresse (route `/api/geocodage/inverse`) ; repli sur la commune de la gare la plus proche si l'API ne répond pas.
- **Raison :** le besoin existait dans la maquette mais n'était documenté nulle part ; l'API Adresse est déjà utilisée, gratuite, sans clé, officielle pour la France.
- **Écarté :** Nominatim (serveur public OpenStreetMap) : 1 requête par seconde maximum, saisie semi-automatique interdite, inutile pour une application limitée à la France.
- **Impact :** `02` § 3.1 ; `05` § 2, § 3.11 bis ; `06` § 3 ; E09, E11.

## D023 — Organisation de l'équipe sur GitHub
- **Date :** 02/10/2026
- **Décision :** un seul dépôt ; Hardy hors `infra/`, les SR uniquement dans `infra/` ; `main` protégée par un ruleset (pull request obligatoire, 1 approbation, relecture des Code Owners, suppression et force push interdits, contournement réservé à l'administrateur) ; `.github/CODEOWNERS` désigne Hardy comme relecteur de tout ; modèle de PR ; tableau GitHub Projects `tourisme-en-train` (nom de code, indépendant de la marque provisoire) ; point d'équipe hebdomadaire de 30 min. Dépôt public conseillé.
- **Raison :** l'équipe n'a pas d'expérience du travail à plusieurs sur un dépôt distant ; des dossiers séparés et une relecture obligatoire évitent les conflits sans ralentir Hardy, qui fusionne ses propres PR par contournement.
- **Écarté :** dépôts séparés pour l'infrastructure (contrat et code éloignés) ; approbation exigée pour les PR de Hardy (le bloquerait quand les SR sont indisponibles).
- **Impact :** `CLAUDE.md` § 6, § 15 ; `.github/` ; `docs/equipe/travail-en-equipe.md`, `demarrage-SR.md`, `guide-SR.md`.

## D024 — Traitement des données en TypeScript + SQL (Python retiré)
- **Date :** 05/10/2026
- **Décision :** le traitement des données (`etl/`) est écrit en **TypeScript** (Node 22, exécuté avec `tsx` ; Node 24 depuis D028) : téléchargement, lecture en flux (csv-parse, yauzl), validation Zod, chargement `COPY` (pg, pg-copy-streams). Les transformations lourdes (heures et calendrier GTFS, liaisons directes, rattachements, doublons, statistiques) sont faites **en SQL** dans PostgreSQL + PostGIS. Le dépôt devient un **espace de travail pnpm** : `apps/web`, `etl`, `packages/commun` (schéma Zod unique de `parametres.json`, `dateDuJour()` à Paris, types partagés). Commande : `pnpm etl <source|all>` ; Docker : `docker compose run --rm etl <source|all>`.
- **Raison :** un seul développeur, déjà à l'aise en TypeScript ; un seul langage, une seule validation (fin du double schéma Zod + Pydantic), un seul outil de tests (Vitest), un seul style (ESLint + Prettier) ; aucune différence de performance pour l'utilisateur (le traitement tourne en coulisse et le travail lourd est fait par PostgreSQL dans les deux cas) ; volumes suffisants pour une extension nationale. Décidé avant E00 : aucun code à réécrire.
- **Écarté :** Python (pandas, Pydantic, psycopg, httpx, uv, Ruff, pytest) : deuxième écosystème sans gain pour ce projet. Un éventuel besoin d'apprentissage automatique (prévision, recommandations entraînées) serait un programme Python **séparé**, lisant et écrivant dans la même base, sans toucher à ce traitement.
- **Impact :** `CLAUDE.md` § 2 (règle 3), § 4, § 5, § 6, § 11, § 12 ; `01` § 2, § 3, § 4, § 6, § 7, § 8 ; `03` § 3.7 ; `04` § 1, § 2, § 3, § 4.1, § 4.2, § 4.5 ; `07` § 1, § 3, § 4 (contrat : seule la commande de planification change pour les SR) ; `08` § 2, § 6, § 7, § 8, § 10 ; `GLOSSAIRE` ; fiches E00 → E07, E15 ; `equipe/guide-SR.md` (I15) ; `A-FAIRE`.
- **Remplace :** D004 (partie traitement des données), D005 (workspaces), D012 (double schéma).

## D025 — Calendrier recalé sur le démarrage réel
- **Date :** 05/10/2026
- **Décision :** démarrage réel le 05/10 (au lieu du 28/09) ; étapes regroupées par deux chaque semaine (S1 = 05/10 → S8 = 23/11, puis « Fin » = 30/11 → 02/12). Jalons : données en base le 01/11, API complète le 08/11, **P0 le 22/11** (au lieu du 15/11), décision de mise en ligne le 25/11, gel le 27/11, livraison le 30/11, soutenance le 03/12.
- **Raison :** une semaine perdue avant le démarrage ; le gel et le rendu sont fixes. Avec le traitement en TypeScript + SQL (D024), il reste 5 jours de marge entre le P0 et le gel pour les P1.
- **Écarté :** garder le P0 au 15/11 (irréaliste avec une semaine de moins) ; repousser le gel (plus de temps pour corriger et répéter).
- **Impact :** `CLAUDE.md` § 8 ; en-têtes de toutes les fiches E00 → E18 ; E15 ; `equipe/guide-SR.md` § 5 ; `equipe/travail-en-equipe.md` § 8–9 ; `A-FAIRE` ; `01` § 2.

## D026 — Fichier maître propre aux SR : `infra/CLAUDE.md`
- **Date :** 05/10/2026
- **Décision :** les SR ont leur propre fichier maître `infra/CLAUDE.md` (périmètre, règles de l'infrastructure, contrat résumé, état des tâches I01 → I22, organisation du dossier, protocole « garde le contexte » avec `infra/JOURNAL.md`). Le `CLAUDE.md` racine renvoie vers lui et précise que ses sections 8, 9, 10 et 14 ne concernent que Hardy. Exception de périmètre : les SR peuvent créer `.github/workflows/deploiement*.yml` (déploiement automatique, I16), seul emplacement possible pour ce fichier.
- **Raison :** les SR peuvent travailler avec un assistant de code ; sans fichier propre, celui-ci lirait seulement le `CLAUDE.md` racine, écrit pour le développement de l'application, et pourrait sortir de `infra/` ou suivre les étapes E00 → E18.
- **Écarté :** un seul `CLAUDE.md` pour tous (trop long, consignes contradictoires) ; dépôt séparé pour l'infrastructure (contrat et code éloignés, D023).
- **Impact :** `CLAUDE.md` (en-tête, § 6, § 15) ; `07` ; `equipe/guide-SR.md`, `demarrage-SR.md`, `travail-en-equipe.md` ; `.github/pull_request_template.md` ; nouveaux `infra/CLAUDE.md`, `infra/JOURNAL.md`.

## D027 — Préparer le multi-région sans le construire
- **Date :** 05/10/2026
- **Décision :** les adresses et licences de toutes les sources de données vivent dans `config/sources.json` (schéma Zod dans `packages/commun`), jamais dans le code. Le multi-région complet (dossier de configuration par région, une instance par client) est **reporté** (`A-FAIRE`).
- **Raison :** l'intérêt commercial d'une vente à plusieurs régions n'est pas encore validé ; mettre les adresses en configuration ne coûte rien maintenant (elles doivent de toute façon être écrites quelque part) et réduit le futur passage au multi-région à environ 1 jour. Le reste est déjà paramétré : périmètre (`parametres.json`), couleurs (tokens), nom (`marque.ts`).
- **Écarté :** construire maintenant le multi-région (temps pris sur le P0 pour une idée non validée) ; une base partagée par plusieurs clients (multi-locataire : plus complexe et plus risqué qu'une instance par client).
- **Impact :** `CLAUDE.md` § 2 (règle 3), § 6, § 12 ; `01` § 6 (code commun), § 9 ; `05` § A.1 ; `02` § 1 ; `04` § 2 bis ; fiches E02, E03, E05, E06, E07 ; `A-FAIRE`.

## D028 — Node.js 24 au lieu de 22
- **Date :** 07/10/2026
- **Décision :** Node.js **24 LTS** partout : poste de Hardy, images Docker (`apps/web/Dockerfile`, `etl/Dockerfile`), CI. Version fixée à la racine par `.nvmrc` (`24`) et `engines.node` (`>=24`) dans `package.json` (créés en E00).
- **Raison :** Node 24 est la version LTS active (Node 22 est en maintenance) ; c'est déjà la version installée sur le poste de Hardy (WSL, partagé avec d'autres projets) ; Next.js 15 et les outils du projet la prennent en charge. Une seule version en local et dans Docker évite les écarts invisibles.
- **Écarté :** rester en Node 22 avec nvm (deux versions à gérer sur le même poste sans bénéfice).
- **Impact :** `CLAUDE.md` § 4 ; `01` ; `07` ; fiches E00, E02 ; `A-FAIRE` ; `infra/CLAUDE.md` (résumé du contrat).

## D029 — Versions de la stack fixées au démarrage du code
- **Date :** 09/10/2026
- **Décision :** **Next.js 16** (App Router) **sous réserve d'un essai de Serwist de 30 minutes en E00** : s'il échoue, Next.js 15 (dernière 15.5.x). **Zod 4**. **TypeScript fixé en 5.9.3**. **pnpm fixé en 11.24.0** (`packageManager`). ESLint 10 (configuration « flat »), Vitest 5, Drizzle ORM 0.45 (pas de version candidate 1.0).
- **Résultat de l'essai Serwist (09/10, ~5 min) : réussi, Next.js 16 retenu.** App minimale Next.js 16.4.0 + `@serwist/turbopack` 9.5.13 : construction de production avec Turbopack (`10 precache entries`), `/serwist/sw.js` servi (200, `Service-Worker-Allowed: /`) en production et avec `pnpm dev` ; vérifié par Hardy dans le navigateur : service worker activé, page affichée hors ligne (servie par le service worker). Architecture retenue pour E14 : route `app/serwist/[path]/route.ts` (`createSerwistRoute`), `withSerwist()` dans `next.config.ts`, `SerwistProvider` côté client, esbuild natif. pnpm 11 : les autorisations se déclarent dans `allowBuilds` (`pnpm-workspace.yaml`) ; esbuild autorisé, `@swc/core` refusable sans effet sur la construction.
- **Raison :** au 09/10/2026, Next.js 16 est la version maintenue (la 15 ne reçoit plus que des correctifs) ; Serwist, nécessaire à la PWA (E14), dépend de l'outil de construction, d'où l'essai avant de s'engager. Zod 4 est la version actuelle. TypeScript 7 est sorti mais typescript-eslint exige TypeScript < 6.1 : sans version fixée, une installation casserait le lint. pnpm ≥ 10 bloque par défaut les scripts d'installation des dépendances : chaque autorisation est listée dans `pnpm-workspace.yaml`.
- **Écarté :** Next.js 15 par défaut (version en fin de vie pour un projet livré en décembre) ; Zod 3 ; TypeScript « dernière version ».
- **Impact :** `CLAUDE.md` § 4 ; `01` § 8 ; fiche E00 ; E14.
- **Modifie :** D004 (versions).

## D030 — Port de la base côté hôte réglable (développement local)
- **Date :** 09/10/2026
- **Décision :** le port **côté hôte** du service `db` est lu dans la variable `BDD_PORT_HOTE` (défaut `5432`) : `127.0.0.1:${BDD_PORT_HOTE}:5432`. Le conteneur écoute toujours sur 5432 ; les autres conteneurs utilisent `db:5432`. Les adresses de `.env.example` sont celles du poste (`localhost:<BDD_PORT_HOTE>`), utilisées par `pnpm dev`, `pnpm etl` et les migrations lancées sur la machine.
- **Raison :** un autre projet (Lexio) occupe déjà le port 5432 sur le poste de Hardy, qui utilisera 5433.
- **Écarté :** changer le port à l'intérieur du conteneur (touche toutes les adresses internes et la production) ; arrêter l'autre projet à chaque session.
- **Impact :** `07` § 3, § 4 (local uniquement) ; `.env.example` ; E01.

## D031 — Ajustements des conventions avant le code
- **Date :** 09/10/2026
- **Décision :**
  1. **`server-only`** : obligatoire dans `server/`, `lib/db/`, `lib/external/`, **sauf** `lib/db/schema.ts` et `lib/db/types-postgis.ts`, lus aussi par drizzle-kit hors de Next.js. Dans Vitest, `server-only` est remplacé par un module vide (alias).
  2. **`export default`** : autorisé dans les fichiers imposés par Next.js **et** dans les fichiers de configuration des outils (`next.config`, `postcss.config`, `eslint.config`, `prettier.config`, `vitest.config`, `drizzle.config`, `playwright.config`).
  3. **Horloge** : deux fonctions seulement lisent l'horloge, toutes deux dans `@tourisme/commun` : `dateDuJour()` et `maintenantParis()` (date du jour + heure actuelle en secondes depuis minuit, à Paris). Elles acceptent un instant en paramètre pour les tests.
  4. **Rôles de la base** : `etl_ecriture` et `app_lecture` sont créés **avec leur mot de passe par un script** (lisant `MDP_APP_LECTURE`, `MDP_ETL_ECRITURE`), lancé par `pnpm db:migrer` avant les migrations ; les migrations ne contiennent que les droits (`GRANT`, `ALTER DEFAULT PRIVILEGES`), jamais de mot de passe.
  5. **Journal** : un seul module de journal JSON, dans `@tourisme/commun` ; `apps/web/src/lib/journal.ts` le réexporte, l'ETL l'importe.
  6. **URL de l'application** : `config/marque.ts` ne contient plus d'URL. `URL_APP` est lue uniquement côté serveur (`lib/env.ts` : métadonnées, manifest) ; le bouton « Partager » utilise l'adresse de la page affichée.
  7. **Valeurs `null` de `parametres.json`** : un facteur CO₂ à `null` (pas encore relevé) est toujours accepté, et `/api/impact` renvoie alors `co2Kg.train: null` pour ce type de train ; un prix au kilomètre à `null` n'est accepté que tant que `prix.aCalibrer` est vrai.
- **Raison :** écarts relevés par l'audit du 09/10 : `server-only` lève une erreur hors de Next.js ; les fichiers de configuration exigent un export par défaut ; `/api/trains` et le temps réel ont besoin de l'heure, pas seulement de la date ; une migration SQL ne lit pas les variables d'environnement ; une variable `NEXT_PUBLIC_*` serait figée dans l'image Docker alors que l'URL change entre le local et la production ; les facteurs CO₂ manquants n'ont aucun lien avec le calibrage du prix.
- **Écarté :** mots de passe écrits dans une migration ; heure lue directement dans les routes ; deux modules de journal.
- **Impact :** `CLAUDE.md` § 1 ; `01` § 3 ; `03` § 4 ; `04` § 2 ; `05` § 3.10 ; `08` § 1, § 5, § 6 ; `GLOSSAIRE` ; fiches E00, E01.

## D032 — Backlog produit et lien fonctionnalités ↔ tickets
- **Date :** 11/10/2026
- **Décision :** `docs/BACKLOG.md` devient le document de référence pour les *user stories*, l'estimation (MoSCoW, points), les critères d'acceptation par fonctionnalité, le lien fonctionnalités ↔ tâches et la planification par sprint. `00-vision.md` § 6 reste la référence pour la liste et les priorités ; sa colonne « Étape » reprend la colonne « Tâches » du backlog. Chaque ticket GitHub (E00 → E18, I01 → I22) se termine par une ligne « Fonctionnalités : … » reprise de BACKLOG § 5. Le backlog est mis à jour au « garde le contexte » qui termine une étape. Les requêtes de référence de `03` § 5 sont exécutées sur les vraies données dès l'étape qui les charge (E02, E03, E04), temps mesuré. Les pull requests ferment leur ticket par `Closes #`.
- **Raison :** suivi par le tuteur et point d'équipe du lundi ; une seule correspondance tâches ↔ fonctionnalités au lieu de deux colonnes divergentes ; le risque « interroger la base » est vérifié au plus tôt, et non découvert en E08.
- **Écarté :** décrire les fonctionnalités uniquement dans GitHub Projects (pas versionné, pas lisible hors GitHub) ; recopier le backlog dans `00` § 6.
- **Impact :** `CLAUDE.md` § 6, § 7, § 14 ; `00` § 6 ; fiches E02, E03, E04 ; `.github/pull_request_template.md` ; `equipe/demarrage-SR.md` § 5, § 6 ; descriptions des 41 tickets.

## D033 — Mise en place de la base (E01) : geography, scripts lancés par Node, pilote unique
- **Date :** 11/10/2026
- **Décision :**
  1. **Type `geography` :** `customType` `geographyPoint` (lu en `{ lon, lat }` depuis le format EWKB). drizzle-kit 0.31 met tout type absent de sa liste interne entre guillemets (`"geography(Point, 4326)"`, refusé par PostgreSQL) : `pnpm db:generer` lance drizzle-kit puis retire ces guillemets dans `db/migrations/*.sql`, et échoue s'il en reste.
  2. **Migrations personnalisées :** `0000_extensions` (`IF NOT EXISTS` : l'image PostGIS crée déjà `postgis` dans la base principale) et `0002_droits` (`GRANT`, droits sur les séquences, `TEMPORARY` sur `current_database()`, `ALTER DEFAULT PRIVILEGES` pour les tables futures). Index GIST, GIN trigramme et CHECK : générés par Drizzle.
  3. **Scripts de base dans `apps/web/scripts/`**, exécutés par `node` (Node 24 retire nativement les types TypeScript, sans `tsx`) : `generer`, `migrer`, `reinitialiser`, `preparer-base-test`. Dans l'image web : `node scripts/migrer.ts` (au lieu de `.mjs` dans `07`).
  4. **`@tourisme/commun` importe ses fichiers avec l'extension `.ts`** (`allowImportingTsExtensions` dans `tsconfig.base.json`) : Node peut le lire directement, donc les scripts utilisent le journal commun.
  5. **Pilote `pg` (node-postgres)** dans l'application comme dans l'ETL : un seul pilote à connaître.
  6. **Base de test `<base>_test`** sur le même serveur, recréée à chaque `pnpm test:integration` ; ses adresses sont déduites des `BDD_URL_*` : aucune nouvelle variable.
  7. **Contrôle de cohérence des mots de passe :** les scripts refusent de démarrer si une adresse `BDD_URL_*` contient un mot de passe différent de sa variable (`POSTGRES_PASSWORD`, `MDP_*`), en nommant les variables et jamais les valeurs.
- **Raison :** essai sur PostGIS 16-3.4 (11/10) : le SQL généré tel quel ne s'applique pas. Le contrat `07` impose une commande de migration exécutable dans l'image web sans outil de développement. Un `.env` incohérent produisait seulement « password authentication failed », sans dire quoi corriger.
- **Écarté :** corriger chaque migration à la main (oubli assuré) ; domaine SQL autour de `geography` (plus caché, efficacité des index « au plus près » à revérifier) ; `postgres.js` dans l'application (deuxième pilote) ; une variable `BDD_URL_TEST` (une de plus à maintenir).
- **Impact :** `CLAUDE.md` § 4, § 6, § 16 ; `01` § 8 ; `03` § 1, § 6 ; `07` § 1, § 4 ; `08` § 8 ; `GLOSSAIRE` ; fiches E01, E16.

---

## Modèle pour une nouvelle décision

```
## Dxxx — Titre court
- **Date :** JJ/MM/AAAA
- **En clair :** une phrase sans jargon, à pouvoir dire devant le jury
- **Décision :**
- **Raison :**
- **Écarté :**
- **Impact :** documents et code touchés
- **Remplace :** Dyyy (si applicable)
```

## D034 — Gares : tous les codes UIC, nom de commune par le COG INSEE, mise à jour par `uic`
- **Date :** 19/10/2026
- **Point 2 remplacé par D038** (le COG remplit la table `commune`, plus `gare.commune`). **Point 3 précisé par D039** (gare reconnue par un code UIC commun, plus par le seul `uic`).
- **Décision :**
  1. **Colonne `gare.codes_uic` (char(8)[])** : tous les codes UIC du fichier ; `uic` reste le premier code et la clé de rapprochement des chargements.
  2. **Nouvelle source `communes`** (Code officiel géographique INSEE, Licence Ouverte) pour remplir `gare.commune` à partir du code INSEE.
  3. **Gares mises à jour par `uic`** (insertion ou mise à jour), jamais supprimées puis réinsérées ; une gare disparue n'est supprimée que si rien ne la référence.
  4. **Toutes les gares de France** sont chargées ; la région n'est qu'un filtre (`dans_region`).
  5. **Seuils et emprise des contrôles dans `parametres.json`** (`controles.garesFranceMin`, `controles.garesRegionMin`, `region.emprise`).
  6. **`config/sources.json` porte un champ `verifie`** : `false` tant que l'adresse et la licence n'ont pas été vérifiées sur la vraie source à son étape.
- **Raison :** audit du fichier réel (19/10). 11 gares ont plusieurs codes, et pour Paris Montparnasse le code principal est le dernier : garder seulement le premier ferait échouer le rapprochement des horaires (E03). Le fichier ne donne que le code de la commune, alors que `/api/gares` et le repli hors ligne (recherche de ville, « Autour de <commune> ») ont besoin du nom. Les tables d'horaires, de lieux et de mobilités référenceront `gare.id` : une suppression complète échouerait dès E03. Les destinations hors région (Paris, Lyon) doivent exister comme gares d'arrivée.
- **Écarté :** garder le seul premier code (rapprochement par distance seulement, risque d'erreur dans les grandes gares) ; `commune` laissée vide (repli hors ligne cassé) ; déduire la commune du nom de la gare (faux pour les gares TGV) ; gares de la région seulement (destinations hors région perdues, aucun gain : 2 792 lignes).
- **Impact :** `02` § 1, § 2.1, § 2.1 bis ; `03` § 3.1 (migration à faire en E02) ; `04` § 2, § 4.1 ; fiche E02 ; `A-FAIRE` § 2 bis.

## D035 — Socle du traitement des données (E02)
- **Date :** 22/10/2026
- **Décision :**
  1. **Un déroulé commun à toutes les sources** : `obtenirFichier` (téléchargement en flux vers un fichier `.partiel` renommé à la fin, SHA-256 au passage, `--hors-ligne`) → `charger` (CSV lu en flux et validé par Zod, `COPY` en table temporaire, contrôles, **fusion propre à chaque source**, empreinte enregistrée, le tout dans une transaction) → `executerSource` (ligne `execution_etl` écrite **hors** de la transaction, rapport Markdown, erreur relancée pour le code retour).
  2. **La fusion est fournie par la source** : suppression puis insertion pour la plupart, mise à jour par `uic` pour les gares (D034).
  3. **Durée d'une exécution mesurée par la base** (`clock_timestamp()`), date du rapport par `maintenantParis()` : aucune autre lecture de l'horloge (CLAUDE.md § 3).
  4. **Gares `IGNORE` seulement si les deux fichiers** (gares et COG) sont inchangés ; l'empreinte du COG est enregistrée dans la même transaction.
  5. **Contrôle bloquant « UIC principal en double »** en plus des trois de `04` § 4.1.
  6. **`DOSSIER_DONNEES` relatif lu depuis la racine du dépôt** (`pnpm --filter` lance le traitement depuis `etl/`) ; absolu (`/data` dans Docker) inchangé.
  7. **`.dockerignore` à la racine** : `.env`, `node_modules`, `data/`, `.git`, documentation et tests exclus du contexte de construction ; image `etl` lancée par `tsx` directement (pas `pnpm start`, qui ajouterait une ligne non JSON à la sortie), utilisateur `node`.
- **Raison :** un téléchargement interrompu ne doit jamais écraser le fichier que `--hors-ligne` réutilisera le jour de la soutenance ; un ECHEC doit rester visible après l'annulation de la transaction ; une source dont seul le fichier annexe change (nouveau millésime du COG) doit être retraitée ; sans `.dockerignore`, `.env` (mots de passe) partait dans le contexte de construction.
- **Écarté :** tout charger en mémoire (inutile pour les gares, impossible pour les horaires en E03) ; journal dans la transaction (un échec effacerait sa propre trace) ; durée par `Date.now()` (lecture de l'horloge hors des deux fonctions autorisées).
- **Impact :** `04` § 4.1 ; `07` § 1, § 3 ; `CLAUDE.md` § 16 ; fiche E02.

## D036 — Horaires GTFS SNCF : type de train par le `stop_id`, cars exclus, montée et descente
- **Date :** 22/10/2026
- **Décision :**
  1. **Source :** « Réseau SNCF TGV, Intercités et TER » (transport.data.gouv.fr), licence ODbL.
  2. **Type de train lu dans le mode du `stop_id`** (`StopPoint:OCE<mode>-<UIC>`) : TER (`Train TER`, `TramTrain`), TGV (`TGV INOUI`, `OUIGO`, `Lyria`, `ICE`), INTERCITES (`INTERCITES`, `INTERCITES de nuit`), AUTRE (tout autre mode, compté dans le rapport).
  3. **Cars et navettes exclus** (`Car TER`, `Car à réservation`, `Navette`), comptés dans le rapport.
  4. **`calendar.txt` pris en charge** bien qu'absent du fichier actuel.
  5. **Aucun rattrapage par distance** : un arrêt dont l'UIC n'est pas dans `gare.codes_uic` est ignoré et compté ; le seuil de 300 m disparaît.
  6. **`passage.montee_interdite` et `passage.descente_interdite`** (migration) ; les trains directs A → B exigent montée possible en A et descente possible en B.
  7. **Corbigny et Flez-Cuzy - Tannay** (cars seulement jusqu'au 26/12) restent sans train et sont nommées dans le rapport.
- **Raison :** audit du 22/10. `route_type` et l'agence classent des cars comme des trains, alors que le mode du `stop_id` est fiable (un seul par trajet). La promesse est « y aller en train ». Les seuls arrêts non rapprochés sont des gares étrangères à plus de 5 km de toute gare française : le rattrapage n'aurait rien apporté et pouvait rattacher une mauvaise gare. ~3 100 arrêts intermédiaires interdisent la montée ou la descente : sans ces colonnes, E04 proposerait des trajets impossibles.
- **Écarté :** type par `route_type` ou par l'agence (faux) ; cars classés AUTRE (présentés comme des trains) ; filtrer montée/descente au chargement en supprimant les passages (l'arrêt existe : un train peut y prendre des voyageurs sans en laisser).
- **Impact :** `02` § 2.2 ; `03` § 3.3, § 5 ; `04` § 4.2, § 4.3 ; `GLOSSAIRE` ; `A-FAIRE` § 2 bis ; `config/sources.json` ; fiches E03, E04.

## D037 — Chargement du GTFS (E03) : IGNORE du jour, règle en un seul fichier, GTFS miniature en dossier
- **Date :** 22/10/2026
- **Décision :**
  1. **`gtfs_sncf` est `IGNORE` seulement si le fichier est inchangé ET déjà chargé le jour même** (date à Paris de `source_donnees.date_telechargement`) ; sinon rechargé (~26 s).
  2. **Règle du type de train dans `etl/src/regles/types-train.ts`**, seul endroit où elle est écrite ; le SQL la reçoit en paramètres.
  3. **Le chargement reçoit une fonction « ouvre tel fichier »** : ZIP en production (`yauzl`), dossier en clair dans les tests (`etl/tests/donnees/gtfs_mini/`) ; lecture du ZIP testée sur un petit `mini.zip` versionné. Aucune nouvelle dépendance.
  4. **Fichiers SQL découpés en sections `-- @nom`**, paramètres `:nom` (comme `03` § 5), transformés en `$1`, `$2`… ; fonctions pures testées (`transformations/sql.ts`).
  5. **Colonnes GTFS lues par leur nom dans l'en-tête** (l'ordre peut changer), colonnes facultatives du standard créées vides si absentes.
  6. **Seuil `controles.rapprochementGtfsMinPct` (90)** dans `parametres.json` (règle 3).
- **Raison :** la fenêtre de 60 jours avance chaque jour : un fichier inchangé chargé la veille laisserait un jour manquant en fin de fenêtre. Un GTFS de test lisible se relit et se corrige sans outil. Un seuil métier n'a pas sa place dans le code.
- **Écarté :** `IGNORE` sur la seule empreinte (fenêtre figée) ; charger tout le fichier jusqu'au 31/03 sans fenêtre (contraire à `fenetreJoursHoraires`) ; dépendance `yazl` pour fabriquer des ZIP de test.
- **Impact :** `04` § 1, § 2, § 4.2 ; fiche E03.

## D038 — Table `commune` : le nom et le département quittent `gare`
- **Date :** 23/10/2026
- **Remplace :** D034, point 2 (nom de commune recopié dans `gare.commune`).
- **Décision :**
  1. **Table `commune`** (`code_insee` clé, `nom`, `departement`), remplie par une commande à part, **`pnpm etl communes`**, lancée avant `gares` ; une ligne par code du COG, arrondissements et communes déléguées compris (nom et département de la commune de rattachement). Mise à jour par `code_insee`, jamais de suppression d'une commune référencée.
  2. **`gare.code_insee` devient une clé étrangère vers `commune`** (indexée) ; `gare.commune` et `gare.departement` sont supprimés, on les lit par jointure.
  3. **Code de gare absent du COG** (8 gares, toutes hors région, communes fusionnées) : `gare.code_insee` vide, gare listée dans le rapport ; une gare **de la région** sans commune est un contrôle bloquant.
  4. **`dans_region` reste dans `gare`**, calculé au chargement : c'est un réglage du projet (région pilote de `parametres.json`), pas une propriété de la commune.
  5. **`lieu` n'est pas touché maintenant** : le lien vers `commune` sera décidé à l'audit de E05, selon que DATAtourisme et OSM donnent ou non le code INSEE.
  6. **Migration `0005_table_commune` complétée à la main** : communes des gares recopiées avant la clé étrangère, empreinte de `communes` oubliée pour forcer le premier chargement.
  7. **Seuil `controles.communesFranceMin` (34 000)** dans `parametres.json`.
- **Raison :** remarque du professeur sur le schéma (normalisation). Le nom et le département décrivent la commune, pas la gare : recopiés dans `gare` puis `lieu`, ils seraient répétés et pourraient diverger entre deux chargements. Une table à part les stocke une fois et accueille les futures informations sur les communes (fréquentation, `03` § 7). Fait avant E04, tant que `lieu` est vide.
- **Écarté :** garder les copies dans `gare` (redondance) ; mettre `dans_region` dans `commune` (mélange donnée officielle et réglage du projet, et perdu pour les 8 gares sans commune) ; lire le COG dans `gares` comme avant (deux sources dans une commande, `IGNORE` sur deux empreintes) ; table `departement` en plus (aucun besoin aujourd'hui).
- **Impact :** `03` § 2, § 3.1, § 3.1 bis, § 3.6, § 7 ; `02` § 2.1 bis ; `04` § 2, § 3, § 4.0, § 4.1 ; `GLOSSAIRE` ; fiche E02 ; `CLAUDE.md` § 16 ; `A-FAIRE` § 1.

## D039 — Gares reconnues par un code UIC commun, pas par le seul code principal
- **Date :** 23/10/2026
- **Précise :** D034, point 3 (mise à jour « par `uic` »).
- **Décision :**
  1. **Au chargement, une ligne du fichier met à jour la gare qui partage au moins un code UIC avec elle** (`codes_uic && …`, index GIN) ; `uic` (premier code) est recopié du fichier et peut donc changer. Aucun code commun → nouvelle gare.
  2. **Deux contrôles bloquants remplacent « UIC principal en double »** : aucun code dans plusieurs lignes du fichier ; aucune ligne du fichier correspondant à plusieurs gares en base.
  3. **Un doublon déjà en base se fusionne à la main**, jamais automatiquement : le contrôle bloque et le rapport le signale.
- **Raison :** le fichier SNCF du 23/10 a inversé les codes de Paris Gare de Lyon (`87686030;87686006`). Reconnue par son seul premier code, la gare a été recréée (id 27041) à côté de l'ancienne (id 1913, gardée car 530 passages la référencent), avec les mêmes codes. Au rechargement suivant, le GTFS aurait réparti ses trains entre les deux gares (chaque code vers la gare dont il est le code principal), et E04 aurait calculé des liaisons fausses. Les contrôles d'alors ne voyaient rien.
- **Écarté :** garder `uic` comme clé en le choisissant de façon stable (plus petit code) : le fichier peut aussi ajouter ou retirer un code ; fusionner automatiquement les doublons (déplacer les passages, lieux et mobilités) : rare, risqué, et mieux vu par un humain ; une contrainte d'exclusion en base sur les tableaux : extension supplémentaire pour un cas que les contrôles couvrent.
- **Impact :** `03` § 3.1 ; `04` § 4.1 ; fiche E02. Base locale : doublon 27041 supprimé (aucune référence), gare 1913 passée au code principal `87686030`.

## D040 — Liaisons directes : deux sens, faisable dans la journée, trains en jumelage
- **Date :** 01/11/2026
- **Décision :**
  1. **Liaisons calculées dans les deux sens** : une paire (gare A, gare B) est gardée si A **ou** B est dans la région. Dijon → Lyon et Lyon → Dijon existent tous les deux, ce qui donne les retours depuis une destination hors région.
  2. **`liaison_directe.premiere_arrivee_s`** (arrivée la plus tôt à la gare B ce jour-là) et **`liaison_directe.faisable_journee`** (booléen, non nul) calculé par l'ETL : première arrivée ≤ `journee.arriveeMaxAller` **et** dernier retour ≥ première arrivée + `journee.dureeVisiteMin`. Aucun retour → faux.
  3. **Le dernier retour n'est pas stocké** : c'est le `dernier_depart_s` de la liaison inverse (B → A, même date), lu par jointure sur la clé. Le stocker en plus en ferait une copie.
  4. **Trains en jumelage comptés une fois** : `nb_trains` compte les couples distincts (heure de départ, heure d'arrivée) d'une paire de gares, pas les trajets. `/api/trains` regroupe ces trajets en un train portant `numeros: string[]`, affiché « TGV 12177 / 5537 ».
  5. **`/api/destinations`** (E08) : `prochainDepart` calculé à la demande, en **une seule requête groupée** pour toutes les destinations (jamais un appel par carte) ; `dernierRetour` lu par la jointure du point 3 ; `faisableJournee` devient P0 et n'est plus jamais nul.
  6. **`gare.dans_region` reste dans `gare`** (D038, point 4) : valeur calculée assumée, utilisée par presque toutes les requêtes. Un contrôle bloquant du chargement des gares vérifie qu'elle correspond au département de la commune.
- **Raison :** l'interface (`06` § 3.4) affiche dernier retour, prochain train et « Faisable dans la journée » sur chaque carte de destination, que `/api/destinations` ne pouvait pas fournir. Fait avant la création de `liaison_directe` : le coût est faible (≈ 1 jour, choix A de Hardy). Jumelage relevé en E03 (139 départs en double le 26/10 ; 12 314 couples gare, date, heures en double au 01/11) : sans regroupement, un même train serait compté et affiché deux fois. `dans_region` : discutée après la remarque du professeur sur la normalisation (dépendance transitive gare → commune → département → région). La supprimer obligerait chaque requête à joindre `commune` et à recevoir la liste des départements en paramètre ; le contrôle garantit qu'elle ne diverge pas.
- **Écarté :** choix B (dernier retour seul, reste reporté) et C (retirer ces informations de la carte) ; `dernier_retour_s` stocké (copie de la liaison inverse) ; « prochain train » précalculé (dépend de l'heure) ou demandé carte par carte (60 requêtes) ; compter les trajets (`COUNT(DISTINCT trajet_id)`) ; supprimer `dans_region` et la calculer par jointure (≈ 2 à 3 h, un paramètre à ne pas oublier dans chaque requête, aucun effet visible).
- **Impact :** `01` § 5 ; `03` § 2, § 3.1, § 3.5, § 5 ; `04` § 4.1, § 4.3, § 6 ; `05` § 3.4, § 3.8 ; `GLOSSAIRE` ; fiche E04 ; `CLAUDE.md` § 16 ; `A-FAIRE` § 1. Migrations `0006_liaison_directe`, `0007_liaison_directe_index_arrivee` (index par gare d'arrivée : chargement des gares à 60 s sans lui).

## D041 — Lieux (E05) : Overpass seul, commune par contour, événements écartés
- **Date :** 01/11/2026
- **En clair :** on prend les lieux OpenStreetMap avec un seul outil (Overpass), on retrouve la commune de chaque lieu en regardant dans quel contour de commune il tombe, et on garde les lieux qu'on peut visiter, pas les événements datés.
- **Décision :**
  1. **OpenStreetMap par Overpass uniquement**, pour toutes les familles de lieux. Les requêtes sont **construites à partir des règles OSM de `categories.csv`** (une seule liste de tags), **une petite requête par règle** : une seule grosse requête dépassait le délai du serveur (306 s) le 01/11.
  2. **Contours des communes de la région** (geo.api.gouv.fr, nouvelle source `contours`), rattachés à la table **`commune`** (une colonne de contour, vide hors région), **pas à `lieu`**. La commune d'un lieu = le contour qui contient son point, quelle que soit la source. `lieu.commune` (texte) est supprimée, et `lieu.code_insee` devient une clé vers `commune`. Les lieux dont le point tombe hors des contours de la région sont écartés.
  3. **Événements DATAtourisme écartés en v1** (3 826 lignes datées), ainsi que les hébergements, la restauration et les commerces. Les circuits ne sont écartés que s'ils n'ont aucune autre catégorie de lieu.
  4. **Lieux culturels et festivals (P1) reportés** après le P0.
  5. **Photos en v1** : tags OSM (`image`, `wikimedia_commons`) quand ils existent, sinon une illustration par catégorie (E10–E12). Le flux complet DATAtourisme sera évalué plus tard, sans bloquer E05.
  6. **Patrimoine OSM** : seulement les éléments **nommés** qui sont un vrai lieu (château, ruines, site archéologique…), un Monument historique (`ref:mhs`) ou qui ont un lien Wikipédia.
  7. **Plans d'eau** : seulement ceux qui ont un signe de sortie (Wikipédia ou Wikidata, étiquette tourisme ou loisirs, baignade), 111 sur 3 035 au 01/11, dont le lac des Settons.
  8. **Mise en œuvre** : `lieu` mis à jour par (`source`, `id_source`) puis lieux disparus supprimés (l'`id` reste stable pour les futurs liens et favoris) ; empreinte = fichier + règles (une règle modifiée reclasse la source) ; un identifiant déjà lu dans le fichier est ignoré (même lieu publié par deux diffuseurs) ; Overpass saturé → jusqu'à 6 tentatives en doublant l'attente ; `doublon_de` remis à nul si le lieu visé disparaît.
  9. **Priorités des règles** : 10 exclusion forte, 15 lieu phare, 20 classement précis, 45–50 classement large, 150–200 règles OSM larges, 900 exclusion faible (`04` § 4.5) ; colonne `condition` ajoutée à `categorie_regle`.
  10. **Usage poli d'Overpass** : `osm` une fois par semaine au plus (jamais dans un chargement de chaque nuit), fichier `overpass.json` gardé entre-temps et relu par `--hors-ligne` ; requêtes envoyées une à une, jamais en parallèle ; en-tête `User-Agent` avec le nom du projet et l'adresse du dépôt, comme le demandent ses règles d'usage.
- **Raison :** l'audit du 01/11 montre que GéoDataMine ne couvre que 2 des 5 familles (aires de jeux, patrimoine) : il aurait fallu deux programmes et deux formats pour une même source. La commune arrive sous trois formes (code INSEE chez GéoDataMine, « code postal#nom » chez DATAtourisme, rien chez Overpass) ; le croisement code postal + nom laisse 8,4 % de DATAtourisme ambigu ou introuvable (communes déléguées, fusionnées, code postal d'un autre département). Le contour décrit la **commune**, pas le lieu : rattaché à `commune`, il sert une seule fois à tous ceux qui en ont besoin (lieux, plus tard gares ou arrêts), sans copie dans chaque lieu ; une table séparée, liée une à une, n'apporterait qu'une jointure de plus pour une seule colonne. Il donne aussi le filtre « dans la région » exact.
- **Écarté :** fichier régional Geofabrik (`.pbf`) en secours d'Overpass : nouvelle dépendance et deuxième programme pour une même source, pour un risque déjà couvert par le fichier gardé et `--hors-ligne` ; à reconsidérer seulement si Overpass reste inutilisable plusieurs semaines ; GéoDataMine + Overpass (deux adaptateurs) ; code postal + nom de commune (incomplet, ajoutait une colonne « commune parente » à `commune`) ; contour stocké dans `lieu` (copie de la commune) ou dans une table `commune_contour` à part ; garder tous les plans d'eau nommés (surtout des étangs) ou tous les écarter (perdre le lac des Settons) ; garder les événements (datés, ce sont des sorties ponctuelles, pas des lieux).
- **Impact :** `02` § 1, § 2.1 bis, § 2.3, § 2.4 ; `03` § 3.1 bis, § 3.6 ; `04` § 4.4, § 4.5 ; `GLOSSAIRE` ; `config/sources.json` ; `config/parametres.json` (longueur de description) ; fiche E05 ; `CLAUDE.md` § 16 ; `A-FAIRE`.

## D042 — Règles de catégories relues : attractions sans règle, compléments de destination écartés
- **Date :** 02/11/2026
- **En clair :** on ne classe pas un lieu juste parce qu'OpenStreetMap le dit « attraction », car cette étiquette ne trie rien ; et les cinémas, bibliothèques, aires de pique-nique ou caves ne sont pas des buts de sortie : ils serviront plus tard de compléments autour d'une destination.
- **Décision :**
  1. **`tourism=attraction` reste sans règle.** Sur les 241 éléments de l'extraction du 01/11, une règle « patrimoine, attraction » (priorité 50, condition `notable`) aurait : renommé **102 Monuments historiques** en « attraction » (sous-catégorie moins précise : Couvent des Ursulines, Viaduc de Fin, Église Saint-Georges) ; fait passer **3 plans d'eau** en patrimoine ; réintégré **5 éléments de petit patrimoine** écartés exprès (Statue Vierge Marie, Notre-Dame de Faucogney). La condition `notable` ne filtre rien ici : l'étiquette `tourism` est elle-même un signe de sortie. Presque tous ces éléments sont déjà gardés par une autre règle (château, abbaye, Monument historique…).
  2. **Éléments naturels et lavoirs : condition `notable`** (nom + Wikipédia/Wikidata, Monument historique, `tourism` ou `leisure`) : grottes, sommets, sources, observatoires d'oiseaux, canaux, barrages, lavoirs. Sans elle, la prochaine extraction ramènerait chaque grotte ou source nommée de la région. Effet au 02/11 (reclassement, aucun lieu en plus) : 32 grottes, 24 lavoirs, 9 sommets, 2 baignades, 2 observatoires, 1 canal, 1 barrage, 1 port de plaisance, 1 source.
  3. **Compléments de destination écartés des destinations** : OSM aire de pique-nique, cave, cinéma, pêche, écluse, bibliothèque (exclusion faible, 900) ; DATAtourisme **cinémas (59) et bibliothèques (156)** retirés (4 256 → 4 045 lieux ; 3 deviennent « théâtre », 1 « aire de jeux »). Pour DATAtourisme, **nouvelle priorité 40** : toutes les bibliothèques portent aussi `CulturalSite` (50) et resteraient sinon « site culturel » ; un théâtre ou un musée (20) l'emporte toujours. Leur réutilisation comme compléments est dans `A-FAIRE` § 3.
  4. Les autres valeurs non classées (lieux de culte, fontaines, bâtiments publics, petit patrimoine, étiquettes vagues) : **exclusion faible** (900), une vraie catégorie l'emporte (une église Monument historique reste gardée).
- **Raison :** relecture par Hardy des 59 valeurs non classées (`04` § 4.5) ; Explorer ne doit montrer que des buts de sortie, au même niveau.
- **Écarté :** règle « attraction » (chiffres du point 1) ; exclusion faible pour les bibliothèques DATAtourisme (restées « site culturel ») ; exclusion forte (10) pour les cinémas (un cinéma-théâtre serait perdu) ; 6ᵉ catégorie « complément » dans `lieu` (voir `A-FAIRE`).
- **Impact :** `etl/src/regles/categories.csv` ; `etl/tests/categories.test.ts` ; `04` § 4.5 ; `A-FAIRE` § 3.

## D043 — Rattachements (E06) : doublons en deux paliers, sites, lieux en longueur, rayon à pied
- **Date :** 02/11/2026
- **En clair :** un même lieu publié par DATAtourisme et OpenStreetMap n'apparaît qu'une fois ; 29 grottes voisines deviennent un seul site ; un canal est rattaché à chaque gare proche de son tracé ; et « à pied d'une gare » veut dire au plus 1,5 km de marche, pas 1,5 km à vol d'oiseau.
- **Décision :**
  1. **Doublons en deux paliers**, noms comparés sans accents ni ponctuation (extension `unaccent`, migration `0009`) : moins de 75 m et similarité ≥ 0,6 ; ou moins de 300 m, similarité ≥ 0,8, même catégorie et nom non générique. Paires entre 0,5 et 0,6 à moins de 75 m : rapport à relire, pas de fusion. DATAtourisme gardé, OSM marqué doublon (complète photo, site, horaires).
  2. **Sites** : liste fermée de sous-catégories avec leur distance (`regroupementSites` : grotte 500 m, site archéologique 300 m, aire de jeux 50 m) ; nouvelle colonne **`lieu.site_de`** vers un représentant (source prioritaire, puis le plus proche du centre). Les membres d'un site sont ignorés comme les doublons (Explorer, `lieu_gare`, `gare_stats`).
  3. **Lieux en longueur** : colonne **`lieu.trace`** ; tags de `lieux.enLongueurOsm` (`waterway=canal`) demandés en lignes avec leur tracé ; tronçons de même nom à moins de 1 km réunis ; `lieu_gare` mesure la distance au point du tracé le plus proche, une ligne par gare.
  4. **`rayons.lieuxGareM` est une distance à pied** (vol d'oiseau × 1,3) : 1 500 m de marche, soit 20 min au plus.
  5. **Qualité Tourisme** : lu dans DATAtourisme (60 lieux) ; fichier séparé de 2024 non utilisé.
- **Raison :** audit E06 du 02/11. Doublons : 616 paires à moins de 75 m avec similarité ≥ 0,6 ; « Le Scènacle » / « Le Scénacle » reconnus seulement sans accents ; de vrais doublons jusqu'à 300 m (« Château de Vaux-sur-Poligny », 294 m ; « Parc de la Verrerie », 119 m). Sites : un regroupement par distance seule enchaîne les centres historiques (92 monuments à Dijon à 150 m, 26 à Besançon) ; la liste fermée donne Arcy-sur-Cure 29 → 1, Bibracte 17 → 1. Rayon : mesuré à vol d'oiseau, 810 liens dépassaient 1,5 km à pied (jusqu'à 1,95 km, 26 min) alors que l'interface affiche une distance à pied. Résultat au 02/11 : 760 doublons, 296 sites, 2 187 lieux à pied d'une gare (au lieu de 3 026), 175 gares de la région sur 196 avec au moins un lieu.
- **Écarté :** un seul palier à 75 m (perd les grands lieux) ; similarité sans `unaccent` ; regroupement de toutes les sous-catégories (centres-villes) ; réutiliser `doublon_de` pour les sites (un site n'est pas un doublon) ; canal représenté par son seul point (rattaché à aucune gare ou à une seule) ; rayon à vol d'oiseau ; fichier Qualité Tourisme 2024 (plus ancien, rapprochement par nom incertain).
- **Impact :** migration `0009_sites_traces_unaccent` ; `config/parametres.json` et son schéma ; `etl/src/transformations/rattachements.sql`, `chargement/rattachements.ts`, `sources/rattachements.ts`, `transformations/osm.ts`, `chargement/lieux.ts` ; tests ; `02` § 2.8 ; `03` § 3.6, § 3.8 ; `04` § 4.6 ; `GLOSSAIRE` ; fiche E06 ; `CLAUDE.md` § 16.

## D044 — Doublons : décisions manuelles, même source prudente ; Monuments historiques fermés au public écartés
- **Date :** 02/11/2026
- **En clair :** quand le calcul hésite sur deux lieux, c'est Hardy qui tranche dans un fichier relu à chaque chargement ; deux lieux d'une même source ne sont fusionnés seuls que s'ils portent exactement le même nom ; et une école ou un hôpital classés Monument historique ne sont pas proposés comme sortie.
- **Décision :**
  1. **`etl/src/regles/doublons_manuels.csv`** (versionné, comme `categories.csv`) : une ligne par paire, lieux repérés par **source + identifiant** (jamais par le nom : plusieurs « Église Saint-Pierre ») ; colonne `decision` : `oui` = fusion, `non` = jamais fusionnée (y compris une paire que le calcul fusionnerait), vide = ignorée. Les rapports `doublons_a_relire.csv` et `doublons_fusionnes.csv` ont les mêmes colonnes : une ligne se recopie telle quelle. Une paire décidée sort de la liste à relire.
  2. **Seuil inchangé** (0,6) : la zone 0,5–0,6 mêle vrais doublons (« Atelier Courbet » / « Atelier de Gustave Courbet ») et faux (« Escape game au Château de Rosières » / le château).
  3. **Même source** : fusion automatique seulement pour un nom comparable **identique**, non générique, à moins de 75 m (108 au 02/11 : « Château de Vallery » ×2, « Abbaye de Jully-les-Nonnains » ×2) ; nom seulement semblable : à relire (86 paires). Noms génériques (« Aire de jeux ») : laissés au regroupement en site.
  4. **Rapport des fusions** : seulement la paire retenue pour chaque doublon (avant : 780 lignes pour 760 doublons, 20 lieux OSM ayant deux candidats, ex. « Château de Drée » et « Parc du Château de Drée »).
  5. **Lieux fermés au public** : `amenity=school, college, university, music_school, social_facility, hospital`, `office=government` à la priorité **140**, avant `ref:mhs` (150) ; un classement précis l'emporte (château qui abrite une école). 32 Monuments historiques écartés (EHPAD, lycées, préfecture, CHS) ; fontaines, halles, maisons et hôtels particuliers gardés.
- **Raison :** relecture des rapports E06 par Hardy. Dans une même source, à moins de 75 m, les noms semblables sont surtout des parties d'un lieu (« Château de Ray-sur-Saône » / « Parc du château… », « Fanum I et II » / « Fanum III ») : 53 paires DATAtourisme et 165 OSM auraient été fusionnées à tort au seuil 0,6. Les exemples de Hardy (« Parc Buffon » / « Musée et Parc Buffon », 131 m) n'auraient de toute façon pas été attrapés : ils relèvent d'une décision manuelle. MH : 249 ont un usage non touristique dans OSM, très mélangé (Abbaye de Pontigny, Halles de Sens à garder) ; seuls les usages clairement fermés sont écartés.
- **Écarté :** baisser le seuil à 0,5 ; dédoublonnage approximatif dans une même source ; paires repérées par nom ; écarter tous les MH à usage non touristique (perd des visites réelles).
- **Impact :** `etl/src/regles/doublons_manuels.csv`, `chargement/decisions-doublons.ts`, `chargement/rattachements-rapports.ts`, `rattachements.sql`, `categories.csv` ; tests ; `04` § 4.5, § 4.6 ; `A-FAIRE`.

## D045 — Lieux écartés par leur nom (activités, objets, fermés) ; parc d'un château dans le site du château
- **Date :** 02/11/2026
- **En clair :** une visite guidée, un escape game ou un retable ne sont pas des lieux à part, et un musée « fermé temporairement » n'est pas proposé ; le parc d'un château est montré avec le château, pas comme une deuxième destination.
- **Décision :**
  1. **`etl/src/regles/noms_exclus.csv`** (`motif;raison`), versionné, appliqué aux deux sources après le classement ; motif comparé sans majuscules ni accents, par mots entiers, partout dans le nom, ou **en début de nom** s'il commence par `^`. Motifs : fermé temporairement / définitivement ; visite guidée, visite commentée, offre groupe, escape game, chasse au trésor, jeu de piste, `^location de`, `^application` ; `^retable`, `^retables`, `^orgue`, `^trésor de`, `^vitrail`, `^vitraux`, `^cloche`, `^tapisserie`, `^cadran solaire`, `^chaire`, `^gisant`, `^reliquaire`, `^stalles`. Liste des lieux écartés : `traite/rapports/lieux_exclus_par_nom_<source>.csv`, relue par Hardy.
  2. **Parc d'un château** : nom commençant par parc, jardin(s), potager, verger, roseraie ou domaine et contenant le nom **complet** d'un « Château de … » à moins de 500 m (`regroupementParcChateau`) → partie du site du château.
- **Raison :** relecture des doublons par Hardy. Les classes DATAtourisme ne reconnaissent pas les activités : exclure `Visit`, `Product`, `Practice` (simulation) ne retire aucun lieu, car elles portent aussi une classe précise (« site industriel », « base de loisirs »). Objets : les rattacher au monument le plus proche se trompe (« Retable de l'église de l'Assomption » → « Lavoir de Montot »). « Trésor » seul aurait écarté « Musée du Pays Châtillonnais – Trésor de Vix » : motif en début de nom. Résultat au 02/11, après relecture de la liste par Hardy (statues gardées : certaines sont de vrais buts de promenade, comme la Statue Quand-Même ou la Statue du Mont Ardoux ; `^retables` et `^application` ajoutés) : 72 lieux écartés (71 DATAtourisme : 58 activités dont 2 applications, 2 fermés, 11 objets ; 1 cadran solaire OSM), 26 parcs rattachés à leur château (de 0 à 355 m).
- **Écarté :** exclusion par classes DATAtourisme ; objets rattachés au monument le plus proche ; règle large « nom contenu dans un autre » (182 liens dont « Aire de jeux » dans « Aire de jeux de l'Égalité ») ; motif « trésor » partout dans le nom.
- **Impact :** `etl/src/regles/noms_exclus.csv`, `transformations/noms-exclus.ts`, `chargement/noms-exclus.ts`, `sources/lieux.ts` (empreinte), `rattachements.sql` ; `config/parametres.json` et son schéma ; tests ; `04` § 2, § 4.5, § 4.6 ; `A-FAIRE`.
