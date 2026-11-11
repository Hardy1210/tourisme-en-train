# Journal des décisions

> **Rôle :** garder la trace de **pourquoi** chaque choix a été fait. `CLAUDE.md` dit ce qui est vrai aujourd'hui ; ce fichier dit comment on y est arrivé.
> **Règle :** on n'efface jamais une décision. Si elle change, on ajoute une nouvelle décision qui « remplace Dxxx », et on marque l'ancienne « Remplacée par Dyyy ».
> **Format :** numéro, date, **en clair** (une phrase sans jargon, depuis D041), décision, raison, alternatives écartées, impact (documents touchés).
> **Pour réviser ou préparer la soutenance :** le sommaire ci-dessous range les décisions par thème. Les leçons réutilisables dans d'autres projets sont dans `LECONS.md`.

## Sommaire par thème

| Thème | Décisions |
|---|---|
| **Produit et périmètre** (ce que l'application fait ou ne fait pas) | D001 trains directs · D003 sans compte · D008 région pilote · D010 CO₂ et prix calculés · D011 CO₂ honnête · D018 partage en P1 · D019 vélos en direct · D020 transport à la demande exclu · D022 nom de la commune de l'utilisateur · D047 destinations par ville · D048 CO₂ une seule source, prix calibré · D049 gare TGV, sa propre carte · D050 peu de lieux en fin de liste · D051 contrats de l'API complète · D052 identifiants publics stables · D056 onglet Lieux · D057 fiches de ville, piscines, aires de jeux, gares classées · D058 aucune position dans les liens · D059 balnéo hors de « enfants » · D060 catégorie secondaire · D061 corrections manuelles, « enfants » justifié |
| **Architecture et outils** | D002 données en base, API pour le temps réel · D004 stack · D005 monorepo · D009 PostGIS `geography` · D024 TypeScript au lieu de Python · D028 Node 24 · D029 versions fixées · D030 port de la base · D033 mise en place de la base |
| **Données et traitement** (sources, gares, horaires, liaisons, lieux) | D013 sources retenues · D027 multi-région préparé · D034 gares · D035 socle du traitement · D036 horaires GTFS · D037 chargement GTFS · D038 table `commune` · D039 codes UIC · D040 liaisons directes · D041 lieux · D042 règles de catégories relues · D043 rattachements (doublons, sites, lieux en longueur) · D044 décisions manuelles sur les doublons, lieux fermés au public · D045 noms exclus, parc d'un château · D046 transports sur place (réseaux, cars, arrêt-gare) |
| **Règles et conventions** | D006 nom de code et marque · D007 tout en français · D012 paramètres partagés · D031 conventions avant le code · D066 `CLAUDE.md` raccourci |
| **Interface** | D017 maquette de référence · D021 carte et temps réel · D053 dépendances de l'interface · D054 design system centralisé et maquette mobile v3 · D062 carte : MapLibre 5, cadrage · D055 légende des temps de trajet · D063 fiche destination et billetterie · D064 gare de départ par défaut · D067 écran Lieux · D068 position gardée, durées de cache, train parti jamais affiché · D069 Explorer gardé en vie · D070 filtres gardés entre les onglets · D071 PWA : réseau d'abord, aucune position gardée · D072 carte sous les filtres, marges iPhone · D065 MapLibre 5 jusqu'au P0, risque accepté · D073 mention du fond de carte · D074 ligne du train à la sélection · D075 écran Sources, facteur CO₂ de la voiture · D081 recherche de ville : communes seules · D082 « TER Mobigo » selon les terminus du train · D083 guidage de la localisation selon l'appareil · D084 barre du trajet et recherche de destination, en-tête repliable |
| **Équipe, calendrier, livraison** | D080 versions, CHANGELOG, intégration continue, test avant correction, design du 23 au 25/11 · D079 étapes prévues avant le design et la structure · D078 dates du P0 et du gel, essai avant fusion · D077 procédure de mise en ligne · D076 infrastructure confiée à Hardy, mise en ligne anticipée · D014 démo sous Docker · D015 indépendance vis-à-vis des SR · D016 pas de skills · D023 GitHub · D025 calendrier · D026 fichier maître des SR · D032 backlog |

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

## D046 — Transports sur place (E07) : réseaux retenus, cars Mobigo, une ligne par couple arrêt-gare, rayon à pied
- **Date :** 02/11/2026
- **En clair :** à l'arrivée en gare, l'application montre les bus, trams, cars régionaux et vélos à moins de 800 m de marche, en citant chaque réseau avec sa licence ; un réseau sans licence n'est pas utilisé.
- **Décision :**
  1. **Réseaux** (audit transport.data.gouv.fr du 02/11) : 13 réseaux urbains GTFS — DiviaMobilités (Dijon), Ginko (Besançon), Optymo (Belfort), évolitY (Montbéliard), Zoom (Chalon-sur-Saône), TréMA (Mâcon), Léo (Auxerre), Tanéo (Nevers), Grandole (Dole), Côte&Bus (Beaune), ECLA (Lons-le-Saunier), MonRéZO (Le Creusot – Montceau), moova (Vesoul) ; **Mobigo** (cars régionaux, 7 fichiers départementaux) ; **vélos en libre-service** GBFS VéloCité (Besançon) et Optymo (Belfort), avec leur adresse `station_status` (disponibilité en direct, P1). Écartés : « ça roule » (Autun, aucun arrêt près d'une gare) ; homonymes hors région.
  2. **Licence obligatoire** : chaque réseau a sa licence (relevée réseau par réseau : Licence Ouverte 2.0, ODbL, Licence Ouverte) dans `config/sources.json` et `source_donnees` ; un réseau sans licence n'est pas chargé.
  3. **Type `CAR`** pour Mobigo. En E03, les cars sont **exclus des trajets** parce que la promesse est d'y aller **en train** ; en E07, ils servent à **se déplacer sur place**, et sont souvent la seule solution autour d'une petite gare (plus de 60 gares desservies par Mobigo, contre une vingtaine par les réseaux urbains). Transport à la demande (`route_type` 715) exclu (D020).
  4. **Une ligne par couple (arrêt, gare)** dans le rayon, comme `lieu_gare`, au lieu de la seule gare la plus proche : un arrêt entre Dijon et Dijon Porte Neuve apparaît pour les deux gares.
  5. **Rayon `rayons.mobiliteM` = 800 m mesurés à pied** (vol d'oiseau × `marche.coefDetour`), comme les lieux (D043). Quais de même nom regroupés à moins de `mobilite.regroupementQuaisM` (100 m).
  6. **P1 reporté après le P0** : tracés des lignes de train et aménagements cyclables ; les **aménagements cyclables en tête des pistes après le P0**, le défi citant les voies vertes comme premier exemple de livrable.
- **Raison :** audit E07 ; jalons « données en base » (01/11) et « API complète » (08/11) dépassés.
- **Écarté :** un seul réseau par grande ville ; cars rangés en `AUTRE` (indistincts dans l'interface) ou non chargés (petites gares sans rien) ; gare la plus proche seule ; rayon à vol d'oiseau ; P1 en même temps que le P0.
- **Impact :** `config/sources.json` et son schéma, `config/parametres.json` (`mobilite.regroupementQuaisM`), migration (`mobilite_locale`), `etl/src/sources/transport-local.ts`, `02` § 2.5, `03` § 3.10, `04` § 4.7, fiche E07, `A-FAIRE`.

## D047 — Destinations par ville (E08) : gare en tête, aucune durée minimale, destinations sans lieu en fin de liste, limite à 150
- **Date :** 03/11/2026
- **En clair :** une ville atteinte par plusieurs gares (Paris, Lyon, Besançon…) n'apparaît qu'une fois dans la liste, avec la gare qui a le plus de trains en tête ; la fiche reste celle d'une gare, parce qu'on arrive à une gare précise et qu'on marche depuis elle.
- **Décision :**
  1. **Une carte par ville** (commune de rattachement de `gare.code_insee` : nom + département ; les arrondissements comptent comme « Paris »), **une fiche par gare** (`/api/destinations/[gareId]`). La carte affiche le nom de la gare sous celui de la ville ; les autres gares de la ville sont listées (`autresGares`).
  2. **Gare en tête** = celle qui a **le plus de trains** ce jour-là ; à égalité, la plus rapide. Les valeurs de la carte (durée, trains, horaires, lieux, CO₂, prix) sont celles de la gare en tête ; le tri se fait sur sa durée.
  3. **Destinations de la même commune que le départ exclues** (Dijon → Dijon Porte Neuve, Nevers → Nevers Le Banlay : 16 liaisons au départ de 15 gares le 03/11).
  4. **Aucune durée minimale.** Mesure du 03/11 (3 562 cartes de ville au départ des 194 gares de la région) : 5 min retire 143 cartes, 10 min 434, 15 min 699 — et **même 5 min coupe de vraies sorties** (Mouchard → Arc-et-Senans et ses Salines royales, 4 min ; à 15 min, Belfort → Montbéliard). L'exclusion de la même commune et le classement en fin de liste des destinations sans lieu suffisent.
  5. *(Remplacé par D050 : seuil de 3 lieux.)* **Destination de la région sans aucun lieu à pied** : gardée, **en fin de liste** (20 gares de la région sur 194 ; 242 cartes de ville sur 2 852, 8,5 %). **Filtre des envies** : retire les destinations de la région sans lieu des catégories choisies ; les destinations **hors région** restent toujours (« trains seulement »).
  6. **`limites.destinations` = 150** (au lieu de 60) : à 60, **Paris (73ᵉ) et Lyon (74ᵉ) disparaissaient depuis Dijon** (119 villes atteintes ; 120 au plus pour une gare de la région). La limite reste un garde-fou ; c'est `dureeMax` qui réduit la liste.
  7. **CO₂ économisé, prix estimé et prochaine arrivée dans `/api/destinations`**, calculés par les fonctions pures de `lib/impact` que réutilisera `/api/impact` : une carte n'appelle pas une route de plus (60 à 150 appels évités). CO₂ comparé à la voiture seule, avec le facteur **le moins favorable** des types de train de la liaison.
  8. Le filtre « faisable dans la journée » de la maquette se fait **côté interface**.
  9. **Route `/api/sante`** dans `features/sante/` (une route ne peut pas importer `lib/db` directement).
  10. **Aucune URL de requête dans les journaux** : `next dev` écrivait `GET /api/autour?lat=…&lon=…` ; journal des requêtes de Next.js désactivé (`logging.incomingRequests: false`, règle 5). Positions acceptées : `parametres.empriseFrance` (règle 3).
  11. **Cache de `/api/destinations` : 300 s** au lieu de 3 600 (le prochain départ dépend de l'heure).
- **Raison :** relevé du 01/11 (Paris en deux cartes depuis Dijon) ; mesure du 03/11 : 13 villes concernées, 104 gares de départ sur 194 avec au moins un doublon, jusqu'à 4 cartes « Lyon » depuis Mâcon ; maquette Explorer desktop v2 (carte de destination). La gare en tête « la plus rapide » mettait en avant des haltes rattachées à la commune voisine (Danjoutin pour Belfort).
- **Écarté :** une carte par gare (Paris et Lyon en double, la moitié des listes touchées) ; tout par ville (la fiche réunirait des lieux à pied de gares différentes : un musée près de Bercy n'est pas à pied de Gare de Lyon) ; durée minimale de 5, 10 ou 15 min ; appel de `/api/impact` par carte.
- **Impact :** `05` § 3.4, `config/parametres.json` (`limites.destinations`), `GLOSSAIRE` (gare en tête), `CLAUDE.md` § 6 (`features/sante`), fiche E08, `A-FAIRE`.

## D048 — CO₂ : une seule source (ImpactCO2) ; prix au km calibré sur les tarifs TGV de la SNCF
- **Date :** 03/11/2026
- **En clair :** les émissions des Intercités et de l'avion viennent de la même page de l'ADEME que celles du TER et du TGV ; le prix affiché « ≈ » est calculé au kilomètre à partir des tarifs publiés par la SNCF.
- **Décision :**
  1. **Facteurs CO₂** relevés le 03/11/2026 sur ImpactCO2 (ADEME, Base Empreinte) : **Intercités 8,98 g CO₂e/km**, **avion court-courrier 225 g** (traînées de condensation comprises, trajets de 300 à 1 000 km). TER (27,7) et TGV (2,93) y ont été revérifiés : identiques. **Une seule source pour tous les types, pour une comparaison juste** : les valeurs de la SNCF (Intercités 4,9 g, méthode InfoGES) suivent une autre méthode.
  2. **Prix : option « prix au km calibré maintenant, grilles par trajet plus tard (P1) ».** Le fichier « Tarifs TER Bourgogne-Franche-Comté » a une **licence non spécifiée** sur data.gouv.fr et il est archivé (03/12/2025) : écarté. Calibrage sur **« Tarifs TGV INOUI et OUIGO » (SNCF, ODbL ; tarifs INOUI au 01/04/2026)**, 2ᵈᵉ classe, 2 211 couples de gares rapprochés par code UIC à 450 km au plus, distance calculée comme l'application (vol d'oiseau × `rail.coefDetour`) :
     - **TGV : 0,17 €/km** (médiane du milieu de la fourchette « Tarif Normal ») ;
     - **TER et Intercités : 0,22 €/km** (médiane du « Tarif Réglementé », le barème kilométrique national ; aucune grille ouverte pour les Intercités).
     - Fourchette **± 25 %** (`margeFourchette` inchangée) : environ 3 trajets sur 4 ont leur prix réel moyen dedans. Un modèle affine (part fixe + prix au km) ne fait pas mieux (erreur médiane 12,9 % contre 13,3 %) : contrat `parKm` gardé.
  3. Source et **date du calibrage** écrites dans `parametres.json` (`prix.source`, `prix.dateCalibrage`, nouveau champ obligatoire une fois calibré) ; source `tarifs_tgv` ajoutée à `config/sources.json` pour l'écran « Sources ». Le prix reste affiché **« ≈ »** avec le lien vers la billetterie (règle 7).
- **Raison :** deux trous relevés à l'audit E08 (`INTERCITES` et `AVION` à `null`, prix jamais affiché tant que `aCalibrer`), alors que la carte de destination de la maquette affiche CO₂ et prix.
- **Écarté :** valeurs CO₂ de la SNCF (méthode différente) ; grilles de prix par trajet tout de suite (deux sources de plus, rapprochement des gares, rien pour les Intercités : reporté en P1) ; fichier TER BFC (licence non claire).
- **Impact :** `config/parametres.json`, schéma `packages/commun/src/parametres.ts`, `config/sources.json`, `02` § 4.1 et § 4.2, `04` § 6, `05` § 3.4, `A-FAIRE`.

## D049 — Gare hors de la ville (TGV) : sa propre carte, au nom de la gare
- **Date :** 03/11/2026
- **En clair :** une gare TGV construite hors de la ville a sa propre carte, au nom de la gare (« Belfort - Montbéliard TGV »), avec sa commune en dessous (« à Meroux-Moval ») : le voyageur sait que le train n'arrive pas en ville.
- **Décision :**
  1. **Règle, pas une liste** : une gare dont le nom contient le mot `destinations.motGareHorsVille` (« TGV », en mot entier) est une **arrivée hors de la ville**. Sa carte prend le **nom de la gare** au lieu de celui de la commune ; la commune est affichée dessous (« à … »). Champs : `titre`, `commune`, `horsVille`.
  2. Elle forme **toujours sa propre carte**, même dans la commune d'une gare de ville (Mâcon Loché TGV, « à Mâcon », à côté de la carte « Mâcon ») : ce n'est pas la même arrivée.
  3. L'exclusion de la commune de départ s'applique aussi à elle.
- **Raison :** vérification d'E08 sur les vraies données (03/11) : depuis Dijon, Belfort n'est desservie en direct que par Belfort - Montbéliard TGV, rattachée à Meroux-Moval, et la carte s'appelait « Meroux-Moval ». Gares concernées dans la région : Belfort - Montbéliard TGV (Meroux-Moval), Besançon Franche-Comté TGV (Les Auxons), Le Creusot - Montceau - Montchanin TGV (Écuisses), Mâcon Loché TGV (Mâcon) ; hors région, Valence TGV (Alixan), Avignon TGV… **Honnête** (le train n'arrive pas en ville) et **sans entretien** si on élargit à d'autres régions.
- **Écarté :** table de correspondance gare → ville desservie (à tenir à jour région par région) ; garder le nom de la commune (« Meroux-Moval » : personne ne le reconnaît).
- **Impact :** `config/parametres.json` (`destinations.motGareHorsVille`) et son schéma, `05` § 3.4, `GLOSSAIRE` (gare hors de la ville), `features/destinations`, échantillon (deux gares TGV), fiche E08, `A-FAIRE`.

## D050 — Destinations avec peu de lieux à pied en fin de liste (seuil de 3)
- **Date :** 03/11/2026
- **En clair :** une destination de la région qui a moins de 3 lieux à pied de la gare passe en fin de liste, sans disparaître : Wagoo montre d'abord ce qui vaut un trajet en train, pas seulement ce qui est rapide.
- **Décision :**
  1. **Règle générale** (pas seulement pour les gares TGV) : destination de la région avec moins de `destinations.lieuxMinEnTete` = **3** lieux à pied (catégories demandées) → **en fin de liste**, triée par durée avec les autres, jamais supprimée. Champ `peuDeLieux` (remplace `sansLieu` ; **remplace le point 5 de D047**, qui ne visait que 0 lieu).
  2. **Filtre des envies** : 0 lieu des catégories choisies → destination **retirée** ; de 1 à N−1 → **en fin de liste** ; le seuil compte les lieux des catégories demandées, comme les pastilles.
  3. Hors région (lieux non chargés) : ni retirée, ni en fin de liste.
  4. **Pas d'exception** dans le classement pour les villages connus qui ont peu de lieux dans les données (Gevrey-Chambertin, Meursault : 1 lieu chacun) : c'est un problème de données, à corriger à la source (`A-FAIRE`).
- **Raison :** mesure du 03/11 depuis Dijon (76 cartes de la région) : N = 1 → 8 en fin de liste, **N = 3 → 30**, N = 5 → 45 (59 % de la région). Avec 3, les gares TGV (1 ou 2 lieux) et les haltes passent derrière les vraies villes (Les Auxons, 2 lieux, ne passe plus devant Besançon Viotte, 94 lieux), sans rejeter des petites villes comme Genlis (4 lieux, 27 trains).
- **Écarté :** N = 1 (une gare TGV à 2 lieux reste devant la ville), N = 5 (trop de destinations reléguées) ; règle réservée aux gares TGV ; exception pour Gevrey-Chambertin et Meursault.
- **Impact :** `config/parametres.json` (`destinations.lieuxMinEnTete`) et son schéma, `05` § 3.4, `GLOSSAIRE`, `features/destinations`, échantillon, fiche E08, `A-FAIRE`.

## D051 — Contrats de l'API complète (E09) : fiche destination, heures, impact, recherche inverse, sources
- **Date :** 03/11/2026
- **En clair :** la fiche d'une destination affiche exactement les mêmes chiffres que sa carte ; la recherche de la commune de l'utilisateur ne garde aucune position, même en mémoire ; l'écran « Sources » cite toutes les sources réellement utilisées, avec l'attribution que leur licence impose.
- **Décision :**
  1. **Routes P1 hors E09** (tracés des lignes, aménagements cyclables, temps réel, vélos disponibles) : le P0 passe d'abord (D046).
  2. **`/api/destinations/[uic]`** : gare (avec `titre`, `commune`, `horsVille`, D049), lieux par catégorie, et la liaison depuis `depuis` (durée, trains, horaires, faisable dans la journée, CO₂, prix) calculée comme la carte.
  3. **Heures `{ s, texte, lendemain }`** partout, `/api/trains` compris (départ **et** arrivée : un train de 23:50 peut arriver le lendemain).
  4. **`/api/impact`, type par défaut = le moins favorable** des types de la liaison (la base ne stocke pas la fréquence par type ; mêmes chiffres que la carte, D047). `404` sans liaison directe (règle 6).
  5. **Recherche inverse sans cache** (le « cache 24 h par position arrondie » est retiré) : la réponse prend ≈ 110 ms ; aucune position gardée, même en mémoire.
  6. **API Adresse de la Géoplateforme** (`data.geopf.fr/geocodage`) : l'ancien domaine `api-adresse.data.gouv.fr` est déclaré obsolète (en-tête `sunset` du 31/01/2026). Recherche inverse **sans filtre `type=municipality`**, qui ne renvoie rien (Talant). Adresse de l'API dans `config/sources.json` (champ `api`, règle 3).
  7. **Écran « Sources »** : champ `affichee` dans `config/sources.json` (faux pour les sources P1 non activées et les sources non utilisées) ; `/api/sources` renvoie nom, producteur, page, licence, **attribution** (ODbL : « © les contributeurs d'OpenStreetMap ») et date des données.
  8 bis. Précisions prises pendant le codage : `/api/trains` — **retours qui partent après l'arrivée du premier aller de la liste**, dans la limite de `limites.trains`, `dernierRetour` toujours indiqué (règle de Hardy le 03/11 : avec `depuis=16:00`, les retours commençaient à 14:37, avant l'arrivée à Beaune à 16:37 ; remplace « les derniers retours du jour », proposé au codage) ; `/api/geocodage` met les **gares de la base en tête** (une application de train), puis les résultats de l'API ; nombre de résultats dans `parametres.limites.geocodage`.
  8 ter. **Ce que couvre chaque chiffre** (remarque de Hardy) : le CO₂ est calculé pour un **aller-retour**, le prix pour un **aller simple** ; `/api/impact` le dit dans un champ `trajet: { co2: "aller-retour", prix: "aller-simple" }`. Un seul champ « aller-retour » aurait été faux pour le prix.
  8. **Trains de la veille après minuit** (aujourd'hui à 00:30, un train « 24:52 » du jour de service précédent) : **limite connue, documentée, non traitée** — très rare dans la région (Joigny).
- **Raison :** audit E09 du 03/11 (contrats § 3.5 et § 3.12 sans forme écrite, fréquence des types absente de la base, API Adresse déplacée, recherche inverse vide avec le filtre de type).
- **Écarté :** cache serveur des positions ; type « le plus fréquent » (exigerait une colonne de plus pour une différence invisible) ; liste des sources tirée de la base seule (la date y manque pour les réseaux et les valeurs locales).
- **Impact :** `05` § 1.8, § 3.5 → 3.12, `02` § 3.1, `config/sources.json` (`api`, `affichee`) et son schéma, fiche E09.

## D052 — Identifiants publics stables : code UIC pour les gares, clé de source pour les lieux
- **Date :** 03/11/2026
- **En clair :** un lien partagé vers une destination ou un lieu marche toujours, même sur une autre base (production, démo de la soutenance), parce qu'il utilise l'identifiant officiel de la gare ou du lieu, pas un numéro interne.
- **Décision :**
  1. **Gare : code UIC** (`uic`, ex. `87713040`). Les routes l'acceptent et le cherchent parmi **tous** les codes de la gare (`codes_uic`, index GIN) : le code principal peut changer d'un chargement à l'autre (D039), la gare non. Aucun code n'appartient à deux gares (vérifié le 03/11, contrôle bloquant de l'ETL).
  2. **Lieu : clé de source** (`cle`) = `source-identifiant`, lisible dans une URL : `osm-way-123456` (OSM `way/123456`), `datatourisme-49c77017-…` (dernier segment de l'URI DATAtourisme). **Colonne générée** `lieu.cle` + **index unique** (migration) : calculée par la base, toute collision est refusée.
  3. **Lien vers un doublon ou un membre de site** : la route renvoie le lieu gardé (ou le représentant du site), avec `demande` = la clé suivie ; `404` seulement si la clé est inconnue (remplace le « 404 si doublon » de `05` § 3.7).
  4. L'`id` interne n'apparaît plus dans les réponses ni les URL : E08 ajustée (`/api/destinations?gare=<uic>`, `uic` dans les gares, `cle` dans les lieux).
- **Raison :** l'`id` d'un lieu est stable d'un chargement à l'autre (mise à jour par source et identifiant, `04` § 4.4), mais **pas** quand la base est recréée (production des SR, données figées de E16, `pnpm db:reinitialiser`), ni pour un lieu qui disparaît de sa source puis revient ; un lieu devenu doublon renverrait `404`. Question de Hardy (liens partagés, favoris).
- **Écarté :** garder l'`id` numérique ; clé construite par l'application (deux endroits pour une même règle) ; identifiant interne de la gare.
- **Impact :** migration (`lieu.cle`), `03` § 3.6, `05` § 1.8 bis, § 3.2 → 3.10, `GLOSSAIRE` (clé de lieu, code UIC), `features/gares`, `features/lieux`, `features/destinations`, échantillon, fiches E08 (modifié après coup) et E09.

## D053 — Dépendances de l'interface : composants écrits à la main, sans l'installation automatique de shadcn
- **Date :** 04/11/2026
- **En clair :** on écrit nos composants nous-mêmes sur des briques accessibles (Radix), en suivant la façon de faire de shadcn/ui, sans son outil d'installation qui écraserait notre design system.
- **Décision :** `lucide-react` (icônes), `radix-ui` (paquet unique : comportement et accessibilité), `vaul` (feuille glissante), `@tanstack/react-query` (données client), `clsx` + `tailwind-merge` (fonction `cn`) et `class-variance-authority` (variantes des composants). Pas de `npx shadcn` ; pas de `next-themes` : si le mode sombre (P1) est fait, ce sera par un petit script.
- **Raison :** l'outil de shadcn réécrit `globals.css`, et son `--accent` entre en conflit avec notre palette (règle 1). React 19 est accepté par les sept paquets (vérifié le 04/11).
- **Écarté :** `npx shadcn init` ; `next-themes` (une dépendance pour une bascule de classe, en P1).
- **Impact :** `CLAUDE.md` § 4, `01` § 3, `06` § 2, fiche E10.

## D054 — Design system centralisé en 3 niveaux, palette et navigation de la maquette mobile v3
- **Date :** 04/11/2026
- **En clair :** tout l'aspect de l'application (couleurs, tailles, police, arrondis, animations) se règle dans un seul fichier, pour pouvoir adapter le produit à un client ; on reprend les couleurs et les 4 onglets de la maquette de Hardy.
- **Décision :**
  1. **`globals.css` en 3 niveaux :** réglages → rôles → composants. Une couleur se règle sur une ligne en clair et une en sombre ; une échelle (`--echelle-texte`) agrandit tous les textes. Le chargement d'une police reste dans `app/polices.ts` (imposé par `next/font`).
  2. **Palette prune et ocre** de `tokens-v3.css`, sans teinte de marque calculée. Les noms de tokens espagnols passent en français.
  3. **`--action` reste prune** (« Acheter mon billet ») ; « Voir la sortie » a son propre token de composant, ocre (`--sortie-*`). Ainsi, l'écran reste celui que Hardy a validé, sans couleur en dur.
  4. **Catégories en une seule couleur** par défaut, distinguées par l'icône et le nom ; chacune garde ses tokens.
  5. **Navigation : Explorer, Lieux, Mon espace, Menu.** Lieux montre des données réelles (nouvelle route à prévoir). Mon espace, favoris et récompenses sont **fictifs, marqués « Aperçu · bientôt »** : aucune fonctionnalité réelle derrière en v1.
- **Raison :** Hardy veut pouvoir tout changer à un seul endroit, dans l'optique de proposer le produit à une région ou à la SNCF. Il a jugé les couleurs de sa maquette bonnes et a demandé une solution aux contradictions plutôt qu'un changement d'aspect.
- **Écarté :** `--action` ocre (aurait changé « Acheter mon billet ») ; sombre calculé depuis le clair (moins lisible) ; deux onglets au lieu de quatre.
- **Impact :** `apps/web/src/styles/globals.css`, `06` § 2 et § 3, fiche E10, `GLOSSAIRE`, `A-FAIRE`.

## D055 — Légende des temps de trajet : 30, 60, 90 min, limite comprise
- **Date :** 04/11/2026
- **En clair :** sur la carte, quatre couleurs : jusqu'à 30 min, 1 h, 1 h 30, puis plus de 1 h 30 ; un train de 60 min tombe dans « jusqu'à 1 h », comme le lit l'utilisateur.
- **Décision :** `durees.tranchesTempsMin` = 30, 60, 90 ; `trancheTemps` compare avec `<=` et renvoie `<=30`, `<=60`, `<=90` ou `>90`. La dernière tranche couvre tout le reste, jusqu'à la limite de 3 h du filtre (`trainMaxOptionsMin`) : Paris (94 min depuis Dijon) a donc une couleur. La tranche ne filtre rien ; au-delà de 3 h, c'est `dureeMax` qui écarte la destination de la liste.
- **Raison :** pour une sortie à la journée, surtout avec des enfants, 1 h 05 et 2 h de train ne demandent pas le même effort. La répartition des liaisons ne départage pas (31, 25, 17, 28 % contre 31, 25, 28, 17 % avec 2 h). Choix de Hardy.
- **Écarté :** 30, 60, 120 (premier choix de Claude Code, contraire à la maquette) ; 5 tranches (trop de couleurs à distinguer).
- **Impact :** `config/parametres.json`, `lib/dates/tranche-temps`, tests, `04` § 2 et § 6, `05` § 3.4, `GLOSSAIRE`, fiche E08 (modifié après coup).

## D056 — Onglet Lieux : tous les lieux atteignables en train direct depuis la gare de départ
- **Date :** 04/11/2026
- **En clair :** l'onglet Lieux montre où l'on peut aller à pied depuis une gare, en train direct depuis la sienne ; chaque lieu n'apparaît qu'une fois, du plus rapide au plus long, 30 à la fois.
- **Décision :** nouvelle route `GET /api/lieux` (`05` § 3.6 bis). (1) Un lieu proche de plusieurs gares apparaît une fois, par la gare au temps total le plus court. (2) `limites.lieuxParPage` = 30, avec « Voir plus ». (3) Tri par temps total, train + marche. (4) Les lieux de la ville de départ sont écartés, y compris à côté d'une autre gare de la même commune : pas besoin de train, et ils sont déjà dans « À deux pas de vous ».
- **Raison :** depuis Dijon, près de 1 000 lieux sont atteignables : la limite de 40 de la maquette en rendrait la plupart inaccessibles. Validé par Hardy.
- **Écarté :** assembler les lieux gare par gare côté interface (une requête par destination, doublons à gérer dans l'écran).
- **Impact :** `05`, `config/parametres.json`, `04` § 2, `features/lieux`, échantillon, fiche E11, `GLOSSAIRE`, `A-FAIRE`.

## D057 — Ce qui est listé : fiches de ville, piscines, aires de jeux, gares classées
- **Date :** 04/11/2026
- **En clair :** une fiche qui décrit une ville entière ou une gare n'est pas une sortie ; une piscine municipale ou une aire de jeux sans nom ne vaut pas un trajet en train, mais reste utile une fois sur place.
- **Décision :**
  1. **Fiches de ville** (DATAtourisme, « Ville de … » ou nom de la commune) : colonne `lieu.fiche_ville`, calculée par `pnpm etl rattachements` depuis `lieux.fichesVille` ; gardées en base, ouvertes par leur lien, **jamais listées ni comptées**, jamais fusionnées avec un autre lieu. Exceptions : « Village du Livre », « Lac des Rouges-Truites ». 57 fiches.
  2. **Onglet Lieux seulement** (`lieux.ongletLieux`) : retire les piscines ordinaires et les aires de jeux dont le nom n'est que « Aire de jeux ». Elles restent dans « À deux pas de vous » et sur la fiche destination, parce que les familles sont notre point fort.
  3. **Piscines thermales ou de balnéo** : classe calculée `SwimmingPool+BalneotherapyCentre` → « centre aquatique », gardées dans l'onglet (spas : voir D059).
  4. **`building=train_station`** : écarté (exclusion forte), même classé monument historique. 2 lieux.
- **Raison :** mesures du 04/11 et choix de Hardy. Un essai a écarté une règle sur `BalneotherapyCentre` seul : sur 137 fiches brutes de ce type, elle aurait fait entrer plus de 100 spas d'hôtel et cabinets de massage.
- **Résultat (Dijon, 10/11) :** onglet Lieux de 867 à 697 lieux ; enfants de 181 à 18.
- **Écarté :** supprimer ces lieux de la base ; afficher les labels (après le P0, `A-FAIRE`).
- **Impact :** migration `0012`, `03` § 3.6, `04` § 2, `05` § 3.3 et 3.6 bis, `GLOSSAIRE`, `A-FAIRE`, `categories.csv`, `parametres.json`, échantillon.

## D058 — Aucune position dans les liens : `?gare=<uic>` à la place de `?lat&lon`
- **Date :** 04/11/2026
- **En clair :** un lien partagé ne doit jamais révéler où se trouve la personne qui l'a envoyé.
- **Décision :** l'état de l'écran Explorer dans l'URL utilise `?gare=<uic>` (`date`, `categories`, `rayon`, `dureeMax` inchangés), jamais `lat` ni `lon`. **La gare n'y est écrite que si l'utilisateur la choisit** (recherche, « Changer de gare ») : la gare la plus proche, calculée depuis sa position, en dit trop sur l'endroit où il est. Sans `gare`, l'écran redemande la position.
- **Raison :** règle 5 ; un lien se copie, s'envoie et finit dans des historiques. Demandé par Hardy.
- **Écarté :** `?lat&lon` (fiche E11 d'origine) ; écrire d'office la gare la plus proche.
- **Impact :** fiche E11, `06`.

## D059 — La balnéo n'est pas classée « enfants »
- **Date :** 04/11/2026
- **En clair :** un spa n'est pas une sortie pour enfants ; on garde les centres aquatiques, on écarte les spas.
- **Décision :** les noms commençant par « Spa » sont écartés (`noms_exclus.csv`), comme les autres spas d'hôtel déjà écartés par `BalneotherapyCentre` : Spa NUXE au Vertigo, Spa Les Rives Sauvages, Spa Alaena, SPA Thermal Valvital. Les 8 restants deviennent « centre aquatique » (bassins, pataugeoire), catégorie `enfants`. Complète D057.
- **Raison :** demande de Hardy. Aucune des 5 catégories ne convient à un spa ; SPA Thermal Valvital n'est pas un spa d'hôtel et suit la même règle, à revoir si Hardy veut le garder.
- **Écarté :** classer les spas en « nature » ou « patrimoine » (faux).
- **Impact :** `noms_exclus.csv`, `categories.csv`, échantillon, `A-FAIRE`.

## D060 — Catégorie secondaire : un lieu peut apparaître sous une autre envie, sans changer pour les autres visiteurs
- **Date :** 04/11/2026
- **En clair :** un parc animalier reste « nature » pour tout le monde, et apparaît aussi quand on cherche une sortie pour enfants. Wagoo s'adresse à tous : sans filtre, la liste reste la même.
- **Décision :** colonne `lieu.categories_secondaires`, remplie au chargement des lieux depuis `regles/categories_secondaires.csv` (classes DATAtourisme, tags OSM, mots du nom). Filtre : catégorie principale **ou** secondaire ; sans filtre, aucune condition. `gare_stats.nb_secondaires` les compte à part : les destinations ne les ajoutent que sous un filtre, pour qu'un lieu ne compte qu'une fois et que l'ordre sans filtre ne bouge pas.
- **Raison :** demande de Hardy. Simulation du 04/11 : ordre sans filtre identique (Dijon, 697 lieux). L'effet reste faible (Dijon de 18 à 20 lieux) : les vraies sorties pour enfants sont déjà en `enfants`, mais peu sont à pied d'une gare.
- **Écarté :** changer la catégorie principale (changerait la liste de tout le monde) ; élargir le rayon à pied (5 km à pied avec des enfants serait trompeur).
- **Limite :** avec plusieurs envies choisies, un lieu peut compter dans deux d'entre elles sur le compteur d'une destination.
- **Impact :** migration, `03` § 3.6, `04` § 4.5, `05`, `GLOSSAIRE`, échantillon.

## D061 — Corrections manuelles, et un lieu n'est marqué « enfants » que si une source le justifie
- **Date :** 04/11/2026
- **En clair :** on n'affirme pas qu'une sortie convient aux enfants sans preuve : une fiche, un âge indiqué ou un public famille.
- **Décision :** `regles/corrections_manuelles.csv`, relu ligne par ligne par Hardy, s'applique à chaque chargement (lignes « oui »). Validé : Médiathèque Henri Vincenot retirée ; Dolescapegame, Les Secrets du Heurtoir, jeu holographique de Tournus et HalluCiné en culture / jeu d'aventure, seul Dolescapegame gardant « enfants » (salle dès 8 ans, enquête 6-11 ans, relevé par Hardy) ; Amphélia en centre aquatique.
- **Règle :** un lieu n'est marqué « enfants » que si une source le justifie. La classe DATAtourisme `LeisureComplex` seule ne prouve donc rien sur un escape game : les autres jeux restent à relire (`A-FAIRE`).
- **Raison :** choix de Hardy ; chaque filtre doit donner un résultat fiable.
- **Impact :** `etl/src/chargement/corrections.ts`, `04` § 4.5, `A-FAIRE`.

## D062 — Carte : MapLibre 5, premier cadrage sur les destinations proches
- **Date :** 04/11/2026
- **En clair :** on garde la version de la carte qui fonctionne avec notre outil de construction, et la carte s'ouvre sur les destinations à moins d'une heure pour rester lisible.
- **Décision :** `maplibre-gl` fixé en version 5. Premier cadrage et « Recentrer » : le départ et les destinations à moins de `carte.dureeCadrageMin` (60 min), toutes s'il y en a moins de 3. Étiquettes en couche MapLibre, qui gère leurs collisions (`06` § 3), sur les 5 destinations avec le plus de trains : les plus proches se serraient toutes autour de la gare (choix de Hardy). Épingles de lieux à partir du zoom `carte.zoomMinLieux`.
- **Raison :** essai du 04/11 : MapLibre 6 charge un module de travail séparé que Next.js ne sert pas (« Worker failed to load »), et le fond de carte reste vide. Depuis Dijon, cadrer les 101 destinations jusqu'à Paris et Lyon entassait tout.
- **Écarté :** servir à la main le module de MapLibre 6 (une pièce de plus à maintenir, y compris pour la PWA).
- **Impact :** `apps/web/package.json`, `config/parametres.json`, `features/carte`, E14 à vérifier hors ligne.

---

## D063 — Fiche destination : une vraie page, billetterie SNCF Connect, fiche lieu dans E12
- **Date :** 04/11/2026
- **En clair :** la fiche est une page avec sa propre adresse (plein écran sur mobile, panneau et carte sur grand écran), le bouton « Acheter mon billet » mène à SNCF Connect, et la fiche d'un lieu est faite en même temps, sinon les lieux ne seraient pas cliquables.
- **Décision :** routes `(app)/destinations/[uic]` et `(app)/lieux/[cle]` ; `parametres.billetterie.url` = SNCF Connect ; l'onglet ouvert et la date sont dans l'URL, sans entrée d'historique pour que « Retour » ramène à l'écran d'avant.
- **Raison :** choix de Hardy. SNCF Connect couvre aussi les TGV et les destinations hors région, ce que le site TER régional ne couvre pas. Une page reste partageable, et elle est plus simple qu'une feuille posée sur Explorer.
- **Écarté :** feuille interceptant la navigation par-dessus Explorer (routes parallèles de Next.js : plus de code, à l'œil le même plein écran) ; lien TER Bourgogne-Franche-Comté de la maquette.
- **Impact :** `config/parametres.json`, `06` § 4, fiche E12. La liste de l'onglet Lieux montre nom, durée, sous-catégorie et Qualité Tourisme : description et horaires restent dans la fiche lieu, car `LieuResume` (`05` § 3.6) ne les contient pas.

---

## D064 — Gare de départ par défaut : à pied, nettement mieux desservie, sans destination perdue
- **Date :** 05/11/2026
- **En clair :** quelqu'un qui habite à Dijon part par défaut de la gare de Dijon, même si la petite gare de Porte Neuve est un peu plus près de chez lui. On ne change de gare que si l'autre se rejoint à pied, a nettement plus de trains et ne fait disparaître aucune destination.
- **Décision :** par défaut, la gare la plus proche. Elle n'est remplacée que par une gare de la région qui, le même jour, remplit trois conditions : à `gareConseillee.distanceMaxM` (3 km) au plus de la position ; au moins `gareConseillee.ratioTrainsMin` (1,5) fois plus de trains ; desserte d'au moins toutes les destinations de la plus proche (la gare remplaçante elle-même mise à part). S'il y en a plusieurs, celle qui a le plus de trains, à égalité la plus proche. Si la plus proche est hors région, aucune destination n'y est affichée : il n'y a rien à préserver, seules la région et la distance comptent. Même règle pour une ville choisie dans la recherche. « Changer de gare » reste libre, et un choix de l'utilisateur prime toujours.
- **Mesure des trains :** somme des `nb_trains` de chaque destination, utilisée seulement pour comparer des gares et jamais exposée par l'API : un train y est compté une fois par arrêt desservi. Le 05/11, Dijon : score 1 035 pour 148 départs réels ; Porte Neuve : score 97 pour 20 départs.
- **Raison :** constat de Hardy : Beaune et tout le sud absents depuis Dijon Porte Neuve (aucun train vers Beaune dans les horaires), alors que Dijon est à 2,1 km. Mais le critère « le plus de trains » dans 5 km posait trois problèmes mesurés : des destinations perdues (Belfort-Montbéliard TGV → Méroux : 26, dont Paris), des changements pour un seul train (Bretigny-Norges → Ruffey), et des gares qu'on ne rejoint pas à pied (Santenay → Chagny, Mesvres → Étang-sur-Arroux, Liesle → Arc-et-Senans, choix de Hardy : prendre une voiture pour rejoindre la gare va contre le but de Wagoo).
- **Mesure de la distance (05/11, seuil de 1,5) :** route appelée sur les 194 gares de la région ayant des trains et 8 points autour de chacune, soit 1 746 positions, dont 2 hors région. Aucune destination perdue et aucun cas sous le seuil pour les trois distances.

| Distance | Marche (`dureeMarcheMin`) | Positions où la gare change | Sur la position exacte d'une gare | Porte Neuve → Dijon, position sur la gare |
|---|---|---|---|---|
| 1,5 km | 26 min | 6 | 1 | non |
| 2 km | 35 min | 14 | 2 | non |
| 3 km | 52 min | 48 | 8 | **oui** (2 092 m, 37 min) |

  3 km retenus : seule valeur mesurée qui garde Porte Neuve → Dijon sur la position de la gare. Besançon Mouillère → Viotte (1 166 m, 21 min) est corrigé dans les trois cas.
- **Condition de Hardy pour garder 3 km (05/11) :** quand la gare proposée n'est pas la plus proche, l'écran affiche le temps à pied jusqu'à elle et la gare la plus proche, avec « Changer de gare » en un geste. Fait : bouton « Partir de <gare la plus proche> » sur « Votre gare » ; `dureeMarcheMin` ajouté à `/api/gares/proches`.
- **Limite connue, gardée pour l'instant (choix de Hardy) :** la comparaison se fait sur le jour même. Si l'utilisateur choisit ensuite une autre date, la gare proposée ne change pas. Mesuré sur les couples du 05/11, jusqu'au 31/12 : seul Nevers Le Banlay → Nevers perd une destination (Les Perrières, sur 6 jours entre le 07/11 et le 12/12).
- **Écarté :** garder la plus proche et afficher une suggestion (l'utilisateur tombe d'abord sur la liste pauvre) ; réunir les destinations de plusieurs gares (le départ deviendrait flou) ; 1,5 km et 2 km (voir la mesure).
- **Impact :** `config/parametres.json`, `05` § 3.2, `features/gares/conseil.ts`, `features/gares/server/requetes.ts`, `features/explorer/depart.ts`. La carte reste honnête : « Votre gare » affiche la vraie distance.

## D065 — MapLibre reste en 5 jusqu'au P0 : risque de sécurité accepté
- **Date :** 05/11/2026
- **En clair :** une faille de sécurité de la carte n'est corrigée que dans une version qui, aujourd'hui, vide notre carte. On garde la version actuelle jusqu'au P0, car l'application n'utilise pas le code touché, puis on passe à la nouvelle version.
- **Décision :** `maplibre-gl` reste en 5.24.0, dernière 5.x publiée (vérifié le 05/11). PR Dependabot #58 fermée ; `.github/dependabot.yml` exclut `maplibre-gl` à partir de la 6.0.0 et ne crée aucune PR de mise à jour de version (`open-pull-requests-limit: 0`). Passage en 6.4.1 ou plus prévu après le P0, sur une branche dédiée (`A-FAIRE` § 3).
- **Risque accepté :** `CVE-2026-85061`, classée critique par Dependabot (alertes n° 11 et 12) : contournement du filtre XSS de `DOM.sanitize`, versions touchées jusqu'à 6.4.0, corrigée en 6.4.1. Dans le code de la 5.24.0, `DOM.sanitize` n'est appelé que par le contrôle d'attribution, que les deux cartes désactivent (`attributionControl={false}`) ; l'application n'utilise ni `Popup` ni `setHTML`. Constat par lecture du code : aucune attaque n'a été essayée. Les alertes restent ouvertes.
- **Raison :** la PR #58 (MapLibre 6.16.0) vide la carte sur mobile et desktop, cause déjà établie par D062 ; corriger cela maintenant retarderait le P0.
- **Écarté :** fusionner la PR #58 (plus de fond de carte) ; une 5.x corrigée (aucune n'est publiée) ; `update-types` dans `ignore` : la documentation de GitHub ne dit pas si ce filtre s'applique aux mises à jour de sécurité, alors qu'elle dit que `ignore` les couvre.
- **Impact :** `.github/dependabot.yml`, `A-FAIRE` § 3, `CLAUDE.md` § 6. Annule D062 sur un point seulement si le passage en 6 aboutit.

## D066 — `CLAUDE.md` raccourci : historique et arborescence détaillée déplacés
- **Date :** 05/11/2026
- **En clair :** le fichier lu à chaque session reste court ; l'historique et le plan détaillé des dossiers sont déplacés tels quels dans `docs/`, sans retirer de règle.
- **Décision :** historique dans `docs/HISTORIQUE-CLAUDE.md` ; arborescence complète dans `01` § 3 bis, résumé gardé en `CLAUDE.md` § 6. Numéros de sections inchangés, car d'autres documents y renvoient.
- **Raison :** demande de Hardy : `CLAUDE.md` dépassait 350 lignes (400 au 05/11).
- **Écarté :** résumer les règles ou fusionner des sections (risque de perdre une règle ou de casser les renvois « `CLAUDE.md` § n »).
- **Impact :** `CLAUDE.md` § 6 et historique, `01` § 3 bis, `HISTORIQUE-CLAUDE.md`.

## D067 — Écran Lieux : liste d'après la maquette mobile, sans favoris ni récompenses
- **Date :** 05/11/2026
- **En clair :** l'onglet Lieux suit la maquette mobile. La gare choisie et la date suivent quand on passe d'Explorer à Lieux. Les boutons favoris et récompenses de la maquette ne sont pas repris, car ils ne feraient rien.
- **Décision :** liste seule pour le moment (carte à décider pour le P0, choix de Hardy) ; filtres réduits à ceux de `/api/lieux` (catégories, temps de train, date) ; `gare` et `date` gardées dans les liens Explorer et Lieux, les autres filtres restent à leur écran ; illustration de catégorie sur toutes les cartes, comme « À deux pas de vous » ; « Parcs · parc » affiché « Parcs ».
- **Raison :** maquette `Explorer Mobile v3` (`design/maquettes/`), référence d'aspect et non de comportement. Photos : 126 lieux sur 12 242 ont une image en base (mesuré le 05/11), et le crédit de chaque photo n'est pas encore prévu à l'écran.
- **Grand écran :** maquette `Explorer Desktop v3` : contrôles dans le panneau de gauche, titre et grille de cartes à droite, à la place de la carte. La colonne de gauche ne reprend pas la liste d'Explorer que la maquette y laisse.
- **Choix confirmés par Hardy (05/11) :** favoris et récompenses gardés pour Mon espace ; photos après les objectifs principaux (`A-FAIRE` § 1) ; maquettes HTML hors du dépôt (2,5 Mo chacune, `.gitignore`).
- **Écarté :** boutons favoris et récompenses (message « bientôt » seulement) ; la limite de 40 cartes de la maquette (`limites.lieuxParPage` et « Voir plus », D056).
- **Impact :** `06`, `features/explorer/ui/ecran-lieux.tsx`, `controles-depart.tsx`, `features/lieux/ui/liste-lieux-accessibles.tsx`, `app/(app)/nav-basse.tsx`, `A-FAIRE`, fiche E11.

## D068 — Position gardée entre les écrans, durée de cache par type de données, train parti jamais affiché
- **Date :** 05/11/2026
- **En clair :** passer d'Explorer à Lieux ne relance plus la recherche de position ni les appels récents, et un train déjà parti disparaît de l'écran, même si la réponse enregistrée l'annonce encore.
- **Décision :**
  1. **Position** gardée au-dessus des écrans (`FournisseurPosition`), en mémoire seulement : ni stockage du navigateur, ni base, ni journal (règle 5). Redemandée au rechargement de la page ou avec « Ma position ». Compromis accepté par Hardy : elle ne suit pas un déplacement pendant que l'application reste ouverte.
  2. **Durées par type de données** dans `parametres.cache` : `horairesPrevusS` (60 s : réponses avec le prochain train, navigateur, réutilisation et rafraîchissement) ; `donneesStablesS` (600 s : lieux, gares, sources, réutilisation pendant la navigation) ; `horlogeTrainsS` (10 s : voir 3). Le temps réel (P1) aura sa propre durée, sans toucher aux autres.
  3. **Train parti :** la durée de cache n'est pas ce qui protège. L'écran compare l'heure de chaque train à l'heure actuelle (`trainParti`, en secondes de la date de service, y compris après minuit), relue toutes les `horlogeTrainsS` et au retour sur l'onglet. Un train parti disparaît donc en 10 s au plus, quel que soit l'âge de la réponse. La carte annonce « Prochain train : mise à jour… » et non « Plus de train », qui serait faux. Une autre date, choisie exprès, montre sa journée entière.
- **Raison :** constat de Hardy : rechargement à chaque changement d'onglet, mesuré aussi en production. Avant cette décision, le cache du navigateur gardait `/api/destinations` 5 min et `/api/trains` 15 min : un train parti pouvait déjà rester affiché aussi longtemps.
- **Limite :** l'heure vient de l'appareil de l'utilisateur : une horloge fausse fausse la comparaison.
- **Écarté :** une durée de cache plus courte, seule (ne protège ni d'un cache plus ancien, ni du futur cache hors ligne, E14).
- **Impact :** `config/parametres.json` et son schéma, `05` § 3.4 et § 3.8, `06`, `features/localisation/fournisseur-position.tsx`, `lib/dates/heures.ts`, `lib/dates/use-maintenant.ts`, `A-FAIRE`, E14 à vérifier.

## D069 — Explorer gardé en vie entre les écrans, sans aucun appel quand il est caché
- **Date :** 05/11/2026
- **En clair :** une fois ouvert, Explorer reste caché quand on va ailleurs : au retour, la carte et ses points sont déjà là, sans rien recharger.
- **Décision :** `ExplorerPersistant` dans la mise en page de `(app)`, créé à la première visite, caché ensuite (`features/explorer/ui/explorer-persistant.tsx`). Conditions de Hardy : caché, il ne fait aucun appel (`useEcranVisible`, et `useUrlEcran` garde son adresse) ; au retour, il ne se met à jour que si les filtres ou la date ont changé, ou si la durée de réutilisation est dépassée. Un train parti pendant qu'il était caché disparaît dès le retour (D068).
- **Mesure de la mémoire (05/11, production, 390 px, 5 allers-retours, 3 essais, sans carte graphique) :** tas JavaScript après ramassage. Sur Lieux : de 12,6 à 21,2 Mo, et de 1 654 à 12 170 nœuds. Sur Explorer : de 19 à 20,7 Mo. Mémoire de tous les processus du navigateur : sur Lieux, de 710-721 à 725-738 Mo ; sur Explorer, de 841-850 à 761-788 Mo, car la carte n'est plus recréée. La mémoire réelle d'un téléphone n'est pas mesurée : essai de Hardy.
- **Écarté :** `reuseMaps` de react-map-gl seul : 0 tuile, mais retour de 666 à 2 334 ms ; `cacheComponents` de Next.js, qui préserve les écrans avec `<Activity>` d'après sa documentation : non essayé.
- **Limite :** les liens de navigation ne gardent que la gare et la date (D067) : des catégories choisies sur Explorer sont perdues au retour.
- **Impact :** `app/(app)/layout.tsx`, `app/(app)/page.tsx`, `lib/ecran-visible.tsx`, `01` § 3 et § 3 bis, `06`, `A-FAIRE`, parcours `explorer-en-vie.e2e.ts`.

## D070 — Chaque écran retrouve ses filtres quand on revient sur son onglet
- **Date :** 05/11/2026
- **En clair :** les filtres choisis sur Explorer ou sur Lieux sont encore là quand on revient sur cet onglet, sans passer d'un écran à l'autre.
- **Décision :** chaque lien de la navigation retient les filtres de son écran, en mémoire (`filtresDeLUrl`, `lienAvecDepart`). La gare choisie et la date restent communes aux deux écrans. Remplace la limite notée dans D067 et D069.
- **Raison :** demande de Hardy. Aucune position dans les liens (D058) : seuls les filtres connus sont repris.
- **Écarté :** partager les filtres entre les écrans : un filtre choisi sur Lieux changerait Explorer sans qu'on le voie.
- **Impact :** `app/(app)/nav-basse.tsx`, `features/explorer/filtres.ts`, `06`, parcours `explorer-en-vie.e2e.ts`. Aucun changement d'apparence. Perdus au rechargement de la page, car ils sont en mémoire et dans l'adresse de l'écran seulement.

## D071 — PWA : réseau d'abord, liste explicite des routes gardées, dernière gare pour le hors-ligne
- **Date :** 05/11/2026
- **En clair :** l'application s'installe sur Android et iPhone et reste lisible sans réseau, avec les dernières réponses. Elle ne garde jamais une adresse contenant la position, et sert toujours les données fraîches quand le réseau répond.
- **Décision :**
  1. `@serwist/turbopack` et `serwist` 9.5.13, avec `esbuild` natif (essai de D029). `@swc/core` n'a pas besoin de ses scripts d'installation : refusés dans `allowBuilds`.
  2. **Liste explicite** des routes gardées (`lib/pwa/routes-hors-ligne.ts`), au lieu du cache par défaut de Serwist, qui garde tout `/api/*`. `/api/autour`, `/api/gares/proches`, `/api/geocodage` et toute adresse avec `lat` ou `lon` : jamais (règle 5).
  3. **Réseau d'abord** (`NetworkFirst`, `cache.reseauMaxS` = 4 s), et non `StaleWhileRevalidate` comme le prévoyait `06` § 7 : celui-ci afficherait d'anciens horaires même en ligne, contre D068. Copies : `cache.horsLigneS` (24 h) et `cache.horsLigneEntrees` (50 par cache).
  4. **Dernière gare gardée sur l'appareil** (`localStorage`) : code, nom, commune et coordonnées de la gare, jamais la position de l'utilisateur. Sans elle, Explorer ne saurait pas quoi afficher hors ligne, puisque `/api/gares/proches` n'est pas gardée.
  5. TanStack Query en `networkMode: 'offlineFirst'` : sinon, hors ligne, les requêtes attendent le réseau et n'atteignent jamais le service worker.
  6. **Message de secours** si les scripts ne se chargent pas (`SecoursChargement`) : dans le HTML de départ, visible après 8 s seulement, retiré au démarrage de l'application. Cause : écran blanc du 05/11 sur l'iPhone de Hardy, dû à un `.next` reconstruit pendant que son serveur tournait.
  7. **Icônes provisoires** tirées du logo actuel (`design/icone-provisoire.svg`, `public/icones/`) : Hardy fera le design à la fin.
  8. **Page jamais ouverte, sans réseau :** page « Pas disponible hors ligne » servie par le service worker, avec la navigation et un bouton vers Explorer, au lieu de la page d'erreur du navigateur qui laissait l'application sans issue (gel constaté par Hardy sur iPhone). **Réseau revenu :** cette page interroge `/api/sante` toutes les `cache.verificationReseauS` (5 s) et se recharge quand le serveur répond (l'événement `online` part trop tôt), les données sont redemandées et une position introuvable est redemandée.
- **Vérifié le 05/11 (Chromium) :** aucune erreur d'installabilité d'après le navigateur (Lighthouse n'a plus de catégorie PWA dans les versions récentes : non utilisé) ; mode hors ligne simulé : liste, fiche ouverte et bandeau affichés ; aucune adresse gardée avec une position ; train parti absent hors ligne ; deux builds successifs : la page ouverte continue, et l'ouverture suivante prend la nouvelle version sans erreur de fichier.
- **Non vérifié :** vrai iPhone, vrai Android, autorisation de la position dans l'application installée. La carte n'a pas de fond hors ligne : ses tuiles ne sont pas gardées.
- **Reporté :** invitation discrète à installer (`A-FAIRE`) : ni dans les critères d'acceptation de E14, ni utile tant que l'adresse n'est pas fixe.
- **Écarté :** le cache par défaut de Serwist (garderait la position) ; garder `/api/gares/proches` (règle 5).
- **Impact :** `06` § 7, `05` § 4, `01` § 3 et § 3 bis, `config/parametres.json`, fiche E14, `A-FAIRE`, parcours `pwa.e2e.ts`.

## D072 — Explorer sur mobile : carte sous les filtres, marges des téléphones
- **Date :** 05/11/2026
- **En clair :** sur téléphone, la carte occupe tout l'écran, derrière le logo et les filtres, et plus rien ne touche les bords de l'iPhone. Le grand écran ne change pas.
- **Décision :**
  1. `viewportFit: 'cover'` : la carte peut passer sous l'heure. En haut, `safe-top` respecte la caméra. **En bas, `safe-bottom` ne vaut que `--espace-bas` (5 px), partout** : choix de Hardy, après un premier essai avec toute la marge de l'iPhone (34 px), jugé trop haut. `--hauteur-app` corrige la hauteur annoncée par iOS dans l'application installée, qui laissait une bande vide en bas. Le bandeau hors ligne descend sous la caméra.
  2. Sur mobile, l'en-tête d'Explorer flotte sur la carte, sans fond ; le logo reste sans fond (choix de Hardy). La carte reste utilisable entre les boutons.
  3. `statusBarStyle: 'black-translucent'` : la carte passe sous l'heure et la batterie sur iPhone, avec un léger dégradé (`degrade-statut`) pour les garder lisibles. Android garde sans doute sa barre colorée : à voir sur un vrai téléphone.
  4. Cadrage : la carte centre ses points sous l'en-tête (`masqueEnHaut`), et ses boutons passent en dessous.
  5. Feuille repliée : seule la poignée dépasse, posée sur le menu.
- **Raison :** essai de Hardy sur iPhone. Réversible : retirer `flottant` et `masqueEnHaut` rétablit l'ancien affichage.
- **Vérifié le 05/11 :** Chromium, marges d'iPhone simulées (haut 59 px, bas 34 px), 390 px ; grand écran comparé. **Non vérifié :** vrai iPhone, vrai Android.
- **Impact :** `app/layout.tsx`, `globals.css`, `components/ui/en-tete.tsx`, `features/explorer`, `features/carte`, `06`.
- **Modifié après coup, 06/11/2026 :** choix de Hardy après essai : `--espace-bas` passe de 5 à 16 px ; 24 px sous le pied de la fiche destination (`pb-6`, sans `safe-bottom`).

## D073 — Mention du fond de carte : une ligne, trois liens discrets
- **Date :** 05/11/2026
- **En clair :** la mention de la carte passe sur une ligne, avec des liens qui ne se voient pas, et la mini-fiche se rapproche de la feuille.
- **Décision :**
  1. Texte : `OpenFreeMap © OpenMapTiles © OpenStreetMap`. Les trois restent : OpenFreeMap, OpenMapTiles et OpenStreetMap demandent chacun une mention.
  2. Chaque morceau est un lien (`attributionLiens` de `config/sources.json`) : OpenMapTiles exige le sien, et celui d'OpenStreetMap signale la licence ODbL. Sans couleur ni soulignement, taille inchangée : choix de Hardy, pour ne pas alourdir la carte.
  3. Le schéma refuse des liens qui ne redisent pas exactement `attribution` : deux copies ne peuvent pas diverger.
  4. Mini-fiche à 2 rem de la feuille au lieu de 3 : la mention prend moins de place.
- **Raison :** pages de licence relues le 05/11 (conditions d'OpenFreeMap, licence d'OpenMapTiles, règles d'attribution d'OpenStreetMap). C'est une lecture de ces pages, pas un avis juridique.
- **Écarté :** mention derrière un bouton (i) : OpenMapTiles demande un crédit visible dans un coin de la carte.
- **Impact :** `config/sources.json`, `packages/commun/src/sources.ts`, `features/carte`, `features/explorer`, `02`, `06`. L'écran Sources relit la base : `pnpm etl sources` y met le nouveau texte.

## D074 — Ligne du train à la sélection d'une destination
- **Date :** 06/11/2026
- **En clair :** quand on touche une carte de la liste ou un point, une ligne relie les arrêts du prochain train jusqu'à la destination. Elle est droite entre deux arrêts : ce n'est pas le vrai tracé des rails.
- **Décision :**
  1. La ligne suit **le prochain train direct, celui de la carte** ; le premier du jour s'il n'en reste plus. Autant de segments que d'arrêts réels (demande de Hardy, pour ne pas faire croire à des arrêts qui n'existent pas).
  2. Aucune donnée nouvelle : `passage` donne déjà les arrêts dans l'ordre. Route `/api/trains/arrets`.
  3. Segments droits vers toutes les destinations cachés, à l'essai. Le comportement des points ne change pas.
  4. La ligne peut passer sous la feuille ou la mini-fiche : accepté par Hardy, la carte ne se recentre pas.
  5. Toucher une carte de la liste referme la mini-fiche ouverte : sinon elle montre une autre destination que la ligne (demande de Hardy).
  6. Les couches de la carte ne sont recalculées que si leurs données changent (`useMemo`) : la ligne attendait les autres couches. Mesuré le 06/11, Chromium sans carte graphique, avant / après : premier toucher 2 469 / 1 250 ms, téléphone simulé 3 641 / 2 798 ms. **Non mesuré :** vrai téléphone.
- **Écarté :** le train qui a le plus d'arrêts : la ligne ressemblait plus aux rails, mais pouvait montrer des arrêts que le train proposé ne fait pas. Vrais tracés : données absentes, reportés (`A-FAIRE`).
- **Mesuré le 06/11 :** base locale, depuis Dijon : 121 destinations, dont 50 servies par des trains aux arrêts différents ; tous les arrêts intermédiaires sont déjà des destinations sur la carte.
- **Impact :** `features/trains`, `features/carte`, `features/explorer`, `05` § 3.8 bis, `06`.

---

## D075 — Écran Sources : thèmes, licence des facteurs CO₂ ; Impact CO2 gardé après comparaison
- **Date :** 06/11/2026
- **En clair :** les 26 sources sont rangées en quatre thèmes. Les facteurs CO₂ de l'ADEME ne sont pas en Licence Ouverte comme on l'écrivait : leur réutilisation est permise sans usage commercial, en citant l'ADEME. L'écran le dit, et ne parle plus de données « ouvertes » pour toutes les sources. Après comparaison avec la Base Carbone et les applications du marché, on garde les chiffres d'Impact CO2 : 14 kg contre 2,8 kg pour 100 km, vérifiables par n'importe qui sur le site de l'ADEME.
- **Décision :**
  1. Champ `groupe` obligatoire dans `config/sources.json` (`trains`, `lieux`, `transports`, `carte_calculs`), renvoyé par `/api/sources` : choix de Hardy, 16 des 26 sources sont des réseaux de transport.
  2. `facteurs_co2` : licence « Réutilisation non commerciale », attribution « ADEME — Impact CO2 », `verifie` à vrai. Lu le 06/11 dans les mentions légales d'impactco2.fr (mises à jour le 29/05/2024) : « réutilisation non commerciale et pédagogique », à condition de citer l'ADEME ; pour un usage commercial, « une licence de réutilisation ». C'est une lecture de cette page, pas un avis juridique. **Non trouvé :** la licence de la Base Empreinte elle-même.
  3. Introduction : « construit avec des données publiques », au lieu de « uniquement avec des données publiques ouvertes » de la maquette, devenu faux à cause du point 2.
  4. Date affichée « Relevé le », et non « Mis à jour le » de la maquette : c'est notre chargement ou relevé, pas la mise à jour du producteur.
  5. L'attribution exigée est affichée sur chaque carte de source ; la maquette ne la prévoyait pas (D051).
  6. Adresse `/sources`, séparée de `/a-propos`. Grand écran : à côté du rail, deux colonnes, **sans carte**, contrairement à la maquette (panneau gauche devant la carte) : rien à y montrer et un fond de carte à charger pour rien.
  7. Critère de la fiche E13 aligné sur D051 : sources marquées `affichee`, et non toutes celles de `source_donnees`.
  8. **Facteurs inchangés : Impact CO2 reste la source (choix de Hardy, 06/11).** Le 142 g/km est sa valeur par défaut : voiture thermique moyenne, diesel, usage et fabrication, une personne à bord, modèle 2025 (`Moyenne - Diesel` = 14,23 kg pour 100 km sur son API). À écrire ainsi partout.
  9. **Règle d'honnêteté** (`00` § 2) chiffrée : 14,2 kg seul, 3,6 kg à quatre, 2,8 kg en TER, pour 100 km et par personne.
  10. **Page `/a-propos` construite avant la fin du pitch (Hardy optimisera les textes à la fin) :** seules les sections déjà écrites sont affichées. La comparaison voiture et TER est calculée depuis `parametres.json`. 97 Mt et 69 % restent masqués (`confirme: false`). « Une à deux heures d'organisation » est retiré, faute de source. Les liens des chiffres sont des citations, pas des sources de données de l'application : ils restent dans le fichier de contenu.
- **Comparé le 06/11 :** même calcul partout où la méthode est publiée, distance × facteur moyen par personne. Voiture par personne : SNCF 119 g (TER, usage seul, 1,6 passager) et 108 g (longue distance, 2,2 passagers), Google 148 g, Trainline 116 g (Royaume-Uni). Détail et sources : `LECONS.md`, dossier CO₂.
- **Écarté :**
  - Lien « Sources » dans la mention de la carte (prompt 6) : alourdit la ligne validée en D073. Liste simple sans thèmes : longue à parcourir.
  - **Base Carbone V23.6** (ADEME, Licence Ouverte 2.0) : meilleure licence, mais voiture à 256 g par véhicule (43791) ou 160 g par passager à 1,6 personne (43809), Intercités à 7,50 g au lieu de 8,98 g (archivé dans cette base) et deux tranches pour l'avion. Le jury verrait 25,6 kg dans le pitch et 14,2 kg sur le site de l'ADEME ; tout changer demandait aussi un nouveau calcul et un sélecteur, sans utilité pour la démo. **À reprendre pour commercialiser** (`A-FAIRE`).
  - Page Datagir de l'ADEME (« Licence Ouverte Etalab ») comme justification : elle ne nomme ni Impact CO2, ni version, ni date.
- **Limites :** lecture de pages, pas un avis juridique. Écart entre 142 g et 256 g seulement en partie expliqué : diesel moyen d'un côté, moyenne du parc de l'autre ; la note de méthode d'Impact CO2 n'a pas pu être lue.
- **Impact :** `config/sources.json` et son schéma, `00` § 2, `01` § 3, `02`, `05` § 3.12, `06` § 5, `equipe/pitch.md`, fiche E13, `A-FAIRE`, `LECONS`.

---

## D076 — L'infrastructure passe à Hardy, sur un VPS géré par Coolify ; mise en ligne anticipée
- **Date :** 06/11/2026
- **En clair :** Hardy porte seul l'application et l'infrastructure. Le site part sur un petit serveur géré par Coolify, à l'adresse `wagoo.hardylino.com`, avant la fin du P0. La démo locale reste le filet de sécurité de la soutenance.
- **Décision :**
  1. **Rôles :** l'infrastructure passe des SR à Hardy. `07` écrit des rôles (« responsable infrastructure : Hardy ») et non des noms, pour qu'un coéquipier puisse reprendre le rôle. Le contrat est gardé.
  2. **Hébergement :** un VPS séparé du serveur Coolify des clients, en Docker Compose (`infra/compose.prod.yml`) : 2 cœurs, 4 Go, 40 Go. Mesures : fiche E17.
  3. **Domaine :** `wagoo.hardylino.com`, sous-domaine du portfolio, enregistrement A chez Vercel. Il ne dépend que d'`URL_APP` et du réglage Coolify, pour en changer quand la marque sera validée à l'INPI. L'application n'est pas hébergée sur Vercel.
  4. **Phase 1 anticipée, sans nouvelle étape :** E17 est découpée en phase 1 (en cours) et phase 2 (après le P0). **Pourquoi avancer :** une adresse HTTPS fixe pour tester sur téléphone et la PWA, sans réinstaller à chaque tunnel, et une adresse pour le jury.
  5. **Dockerfile web fait pendant E17 phase 1**, réutilisé par E16. La sortie `standalone` n'est activée que dans l'image (`SORTIE_NEXT`), et `outputFileTracingIncludes` y ajoute ce que lit `migrer.ts` : pas d'étape de copie à maintenir, et `next start` reste utilisable ailleurs.
  6. **Premier chargement depuis un export** plutôt qu'un ETL complet : procédure essayée, `infra/README.md`.
  7. **Ménage :** `guide-SR.md`, `demarrage-SR.md`, `infra/CLAUDE.md` et `infra/JOURNAL.md` supprimés (ils restent dans l'historique Git) ; `travail-en-equipe.md` réduit à GitHub ; tickets I01 à I22 fermés, remplacés par ceux des deux phases.
- **Raison :** l'équipe est réduite à une personne ; Coolify couvre HTTPS, secrets, déploiement automatique et tâches planifiées.
- **Écarté :** héberger l'application sur Vercel ; utiliser le serveur des clients ; un ETL complet pour le premier chargement ; une nouvelle étape dans le plan.
- **Trouvé par l'audit :** la position pouvait entrer dans les journaux quand une requête échouait (règle 5), corrigé en phase 1 ; construction impossible sans variables ; `pg_restore --clean` seul qui plante ; journal d'accès du proxy à laisser coupé. Détail : fiche E17.
- **Impact :** `CLAUDE.md` § 1, § 2, § 6, § 8, § 9, § 12, § 15 ; `01` ; `04` ; `05` ; `07` ; `08` ; `BACKLOG` § 3 et § 6 ; fiches E16, E17 ; `A-FAIRE` ; `infra/README.md` ; `.github/`.

---

## D077 — Chaque mise à jour suit une seule procédure de mise en ligne
- **Date :** 07/11/2026
- **En clair :** l'application est en ligne et le développement continue. Quand Hardy écrit « mets en ligne », Claude Code suit une procédure écrite : il vérifie, publie et contrôle ; Hardy fusionne, clique sur Redeploy et essaie sur l'iPhone.
- **Décision :**
  1. **Référence unique :** `infra/README.md`, section « Mettre en ligne une mise à jour » ; `CLAUDE.md` § 15 n'en garde que l'ordre.
  2. **Déploiement manuel :** une fusion ne change rien en ligne tant que Hardy n'a pas cliqué sur Redeploy (réglage confirmé le 07/11). Les documents seuls ne demandent aucun Redeploy.
  3. **Contrôle scripté :** `infra/scripts/controler-production.sh`, en lecture seule, depuis l'extérieur.
  4. **Retour en arrière :** Revert sur GitHub puis Redeploy ; sauvegarde sur le VPS avant toute migration ou tout chargement de données, car un Revert ne défait pas une migration.
- **Raison :** une personne seule, un site réel, et plusieurs oublis possibles entre GitHub, Coolify et le VPS (D076).
- **Écarté :** déploiement à chaque fusion (une construction sur le VPS même pour un document, et aucune pause avant la mise en ligne) ; bouton *Rollback* de Coolify, jamais essayé sur ce compose ; intégration continue, absente du dépôt, à revoir si le temps le permet.
- **Limites :** retours en arrière et mise à jour avec migration pas encore essayés en production.
- **Impact :** `CLAUDE.md` § 10, § 15, § 16 ; `infra/README.md` ; `07` ; `BACKLOG` ; fiches E13, E14, E17 ; `_MODELE` ; `A-FAIRE`.

---

## D078 — P0 et gel aux dates fixées par Hardy ; essai avant fusion pour tout changement visible
- **Date :** 07/11/2026
- **En clair :** le P0 est fini au plus tard le 22/11 et plus aucune nouvelle fonctionnalité n'entre après le 27/11. Les corrections, le design et les déploiements continuent jusqu'à la soutenance. De gros changements restent à venir, y compris de structure : Hardy les valide avant toute fusion.
- **Décision :**
  1. **Dates :** P0 au plus tard le 22/11, gel des nouvelles fonctionnalités au plus tard le 27/11. Une avance éventuelle va aux P1.
  2. **Après le gel :** corrections, retouches de design et déploiements jusqu'à la soutenance. La démo locale d'E16 doit suivre la dernière version retenue.
  3. **Changement de structure ou de présentation :** plan court validé d'abord, essai sur téléphone avant la fusion, renvoi depuis toute adresse de page changée.
  4. **Réglages Coolify :** déploiement manuel, mises à jour automatiques coupées (elles tournaient chaque nuit à 0 h 24 UTC) jusqu'à la soutenance.
  5. **97 Mt et 69 % affichés**, séparés des 11 %. Formulation : « en 2022 », pas « par an », car le bilan porte sur une seule année.
- **Raison :** le site est réel et Hardy veut garder la main sur chaque mise en ligne ; une mise à jour de Coolify la nuit pourrait casser une démonstration.
- **Source :** communiqué de l'ADEME, texte copié par Hardy (`equipe/pitch.md`) ; `ademe.fr` refuse la lecture automatique. La page du ministère n'est pas citée sur le site : elle rapproche à tort les 11 % des 97 Mt.
- **Remplace en partie :** la « décision de mise en ligne le 25/11 » de `CLAUDE.md` § 8, devenue sans objet (D076).
- **Impact :** `CLAUDE.md` § 8, § 9, § 15 ; `infra/README.md` ; `BACKLOG` § 8 ; fiches E13, E15, E16 ; `equipe/pitch.md` ; `LECONS` ; `A-FAIRE`.

---

## D079 — Finir les étapes prévues avant le design et la structure UI/UX
- **Date :** 07/11/2026
- **En clair :** on termine d'abord tout ce qui est déjà au plan. Hardy enverra ensuite ses changements de design et de structure, pour ne rien abîmer et ne pas refaire une fonctionnalité peut-être déjà prévue.
- **Décision :** ordre : partie fonctionnelle d'E11 et E12, E13, E14, puis E15, E16, E18. Les retouches de design et les changements de structure UI/UX viennent après, à la demande de Hardy. Aucune nouvelle liste ne lui est réclamée d'ici là.
- **Raison :** une nouveauté ajoutée trop tôt risque de casser l'existant ou de doubler ce qui est déjà prévu.
- **À surveiller :** les dates de D078 restent valables. Un gros changement de structure après E15 et E16 obligerait à refaire les contrôles de qualité, l'image et l'export de la démo. Hardy choisira le moment.
- **Impact :** `CLAUDE.md` § 9 ; `BACKLOG` § 8 ; `A-FAIRE` § 1.

---

## D080 — Travailler comme sur un produit : versions, CHANGELOG, intégration continue, test avant correction
- **Date :** 10/11/2026
- **En clair :** Wagoo pourrait être financé par la Région ou repris ; on garde donc la trace de chaque nouveauté, on numérote les mises en ligne, et les tests tourneront tout seuls sur GitHub avant chaque fusion.
- **Décision :**
  1. **Branches :** `main` + une branche par ticket + pull request. Pas de branche `production` : Coolify ne déploie que sur un clic de Hardy (D077, D078).
  2. **`CHANGELOG.md`** à la racine : chaque pull request visible y ajoute une ligne sous « Non publié ». Avant chaque mise en ligne, Hardy relit cette rubrique et décide.
  3. **Versions** MAJEUR.MINEUR.CORRECTIF. **0.1.0** = la mise en ligne du 07/11 (`d1f0206`), marquée après coup par l'étiquette Git `v0.1.0`. Chaque mise en ligne avec nouveautés : mineur suivant. **1.0.0 = le jour du premier client** (Région ou autre), pas la soutenance.
  4. **Avant le P0 du 22/11 :** intégration continue GitHub Actions sur chaque pull request (`pnpm verifier`, tests d'intégration avec un service PostgreSQL + PostGIS, parcours Playwright si possible), fusion bloquée si un test échoue ; règle ESLint qui interdit les imports entre couches. Choix des actions et de la règle : nouvelle décision avant l'installation.
  5. **Règle permanente :** tout bug commence par un test qui le reproduit (et échoue), puis la correction.
  6. **Retouches de design du 23 au 25/11**, après le P0 et avant E15 : l'accessibilité, la performance et les captures du pitch portent ainsi sur l'interface finale. Précise D079.
- **Raison :** Hardy maintient seul l'application ; les tests doivent tourner sans dépendre de Claude Code, et la liste des nouveautés doit pouvoir être montrée à un financeur.
- **Écarté :** branche `production` ou `develop` (une étape de plus à chaque mise en ligne pour une seule personne ; à revoir si une équipe arrive) ; pull requests laissées ouvertes jusqu'au déploiement (conflits entre elles, relecture difficile) ; 1.0.0 à la soutenance.
- **À surveiller :** Hardy fusionne aujourd'hui avec *bypass rules* ; une fois l'intégration continue en place, le contournement sauterait aussi le blocage. À régler avec elle.
- **Impact :** `CHANGELOG.md` ; `CLAUDE.md` § 11, § 15 ; `infra/README.md` § 2 ; `08` § 7 ; `BACKLOG` § 8 ; `A-FAIRE` § 3, § 4.

---

## D081 — Recherche de ville : communes seules
- **Date :** 10/11/2026
- **En clair :** taper « Beaune » ne propose plus que des communes, et plus des rues ou des hameaux du même nom à l'autre bout de la France.
- **Décision :** `/api/geocodage` interroge l'API Adresse avec `type=municipality`, et garde seulement les communes de la réponse. Les gares viennent toujours de la base, en tête. Aucun filtre par région : on peut partir de Paris. La recherche inverse reste sans filtre (D051).
- **Mesure (API réelle, 10/11) :** sur les 10 premiers résultats de « beaune », seuls 2 sont des communes : 6 sont des **rues** homonymes (« Beaune 19290 Sornac ») et 2 des lieux-dits. Retirer les lieux-dits seuls, comme prévu dans `A-FAIRE`, n'aurait donc presque rien changé. Avec le filtre : Beaune, Beaune-la-Rolande, Beaune-d'Allier, Beaune-sur-Arzon, Bligny-lès-Beaune.
- **Écarté :** lieux-dits seuls (rues homonymes conservées) ; communes d'abord, puis le reste (les rues homonymes restaient visibles).
- **Limite acceptée :** on ne peut plus chercher une adresse précise ; la position du téléphone reste précise, et la gare la plus proche de la commune est proposée.
- **Impact :** `lib/external/adresse.ts` et ses tests ; `02` § 3.1 ; `05` § 3.11 ; `A-FAIRE` ; `CHANGELOG.md`.

---

## D082 — « TER Mobigo » seulement si les deux terminus du train sont dans la région
- **Date :** 10/11/2026
- **En clair :** un TER s'appelle « TER Mobigo » quand il part et finit sa course en Bourgogne-Franche-Comté ; sinon on écrit « TER », qui n'est jamais faux.
- **Décision :** `/api/trains` renvoie `terminusEnRegion` : premier **et** dernier arrêt du train entier (pas du trajet demandé) dans la région, calculé en base à partir de `gare.dans_region` (lui-même issu de `region.departements`, contrôlé par l'ETL). Faux si un seul des trajets jumelés sort de la région. L'interface affiche alors `region.nomTer` (`config/parametres.json`, « TER Mobigo ») au lieu de « TER » ; TGV et Intercités ne changent pas.
- **Raison :** les visiteurs reconnaissent le nom affiché sur SNCF Connect (remarque de Hardy du 03/11). Afficher le nom d'une autre région sur son train serait faux ; « TER » ne l'est jamais.
- **Mesures (10/11, base locale, horaires chargés le 31/10) :** 2 553 TER en base : 1 104 « TER Mobigo », 1 449 « TER ». Les horaires SNCF ne donnent pas la région : 2 291 de ces trains sont sous l'exploitant générique « SNCF VOYAGEURS » (`1187`), 262 sous « SNCF Voyageurs BO » (`5733`, lignes de Bourgogne, dont 57 vers Lyon ou Moulins). Dijon → Beaune le 12/11 : K6 et C15 « TER Mobigo », K7 (Lyon – Dijon – Paris) « TER ». Requête : quelques millisecondes, sans écart mesurable sur un essai.
- **Écarté :** gares du trajet demandé (Dijon → Chalon sur un Dijon → Lyon serait devenu Mobigo) ; tout TER partant de la région (Belfort → Mulhouse, sans doute TER Grand Est) ; l'exploitant du fichier (trop peu de trains sous un exploitant régional).
- **Limite acceptée :** les trains Paris ↔ Bourgogne (P15, P31, P34…), très probablement Mobigo, restent « TER ». Pistes dans `A-FAIRE`.
- **Impact :** `config/parametres.json` et son schéma (`region.nomTer`) ; `features/trains` (requête, contrat, libellé) et leurs tests ; `05` § 3.8 ; `A-FAIRE` ; `CHANGELOG.md`.

---

## D083 — Guidage de la localisation refusée, selon l'appareil
- **Date :** 10/11/2026
- **En clair :** si la position est refusée, l'écran explique où l'autoriser, avec les vrais menus de l'iPhone, d'Android ou de l'ordinateur ; le guide s'ouvre tout seul si le second essai échoue aussi.
- **Décision :**
  1. Sous « Autoriser la localisation », un lien repliable « Comment autoriser la localisation ? » ; ouvert tout seul quand une nouvelle demande est encore refusée, avec « La localisation est toujours bloquée ».
  2. Huit cas : iPhone Safari (avec, en plus, le bouton aA), iPhone application installée, iPhone Chrome, Android Chrome, Android application installée (chemin officiel de Google : Chrome › ⋮ › Paramètres › Paramètres des sites › Position, `support.google.com/chrome/answer/142065`), autre navigateur de téléphone (Firefox, Samsung Internet, Edge…), ordinateur, appareil inconnu (texte générique, **jamais** celui de l'ordinateur).
  3. Appareil reconnu **dans le navigateur** (signature, mode installé, écran tactile pour l'iPad qui se dit Mac) par une fonction pure testée ; rien n'est envoyé au serveur ni enregistré.
  4. Tous les textes dans un seul fichier, `features/localisation/contenu-guidage.ts`, pour les corriger sans toucher la logique. « À gauche de l'adresse », jamais « en haut » : sur Android, la barre peut être en bas.
- **Raison :** le 05/11, sur l'iPhone de Hardy, « autorisez-la dans les réglages de votre navigateur » ne suffisait pas : il fallait aussi le service de localisation du téléphone.
- **Écarté :** un seul texte pour tous (le cas de l'iPhone ne passait pas) ; le texte « ordinateur » pour un appareil inconnu.
- **Limites :** noms des menus écrits pour iOS 18 et Android 14, sans Android pour essayer ; textes iPhone vérifiés par Hardy avant la fusion, textes Android pendant E14 (`A-FAIRE`).
- **Impact :** `features/localisation` (`appareil.ts`, `contenu-guidage.ts`, `ui/guidage-localisation.tsx`, `ui/ecran-sans-position.tsx`) et leurs tests ; parcours `explorer.e2e.ts` ; `06` § 3 ; `A-FAIRE` ; `CHANGELOG.md`.

---

## D084 — Barre du trajet et recherche de destination ; en-tête repliable à suivre
- **Date :** 11/11/2026
- **En clair :** en haut d'Explorer, une barre d'une ligne, « Autour de Dijon → Où aller ? », ouvre une feuille pour choisir d'où l'on part et chercher une destination. On ne voit alors que les destinations trouvées. Ensuite, l'en-tête se repliera pour laisser la place à la carte.
- **Décision :**
  1. **Barre du trajet** (variante C, après comparaison sur maquette des variantes A, en haut, et B, dans la liste) : un seul bouton, deux parties, **une seule ligne** (règle de Hardy). Le départ se coupe avec « … », la destination reste entière.
  2. **Deux feuilles, comme sur la maquette** (essai de Hardy sur téléphone le 11/11) : le départ ouvre « D'où partez-vous ? », celle d'avant ; la destination ouvre « Où allez-vous ? », à sa hauteur maximale dès l'ouverture, sans clavier tant que le champ n'est pas touché. Les destinations trouvées s'affichent sous le champ pendant la frappe, triées par temps de trajet, et « Afficher les x destinations » reste collé en bas. Ensuite, la feuille de résultats monte au plus haut, sous les catégories, et défile jusqu'à la première destination trouvée, centrée. Une feuille unique « Votre trajet » (De / À), essayée d'abord, a été écartée : clavier ouvert d'emblée, résultats à faire défiler, titre différent de la maquette.
  3. **Recherche** : sans accents ni majuscules, début de mot, sur la ville, la commune et toutes les gares ; parmi les résultats des filtres actuels ; jamais de nouvel appel à l'API ; jamais de changement de la gare de départ. **Texte tapé** (`?recherche=`) : tous les noms qui commencent par lui. **Destination touchée** (`?destination=<UIC>` en plus) : elle seule. Une règle « nom exact » a été essayée puis écartée : avec elle, « besancon » perdait Besançon Franche-Comté TGV, et « Afficher les 2 » n'en aurait montré qu'une.
  4. **En-tête repliable**, PR suivante : sur téléphone, seule la rangée des catégories reste ; un bouton sur la carte, au-dessus de « Recentrer », fait redescendre le reste, avec une pastille ; sur ordinateur, l'en-tête reste ouvert.
  5. **Fait maintenant**, et non du 23 au 25/11 (D080) : la recherche en dépend, et Hardy l'a choisi le 11/11.
- **Raison :** une sortie trouvée vite, sans prise de tête ; les réglages fins pour qui les veut. Pour une application de train, la recherche de destination est attendue en haut (SNCF Connect, Trainline).
- **Écarté :** variante A (départ et destination côte à côte, sur deux lignes en 390 px) ; variante B (champ dans la liste, découvert tard) ; une loupe dans le titre de section (trop discrète).
- **Impact :** `features/explorer` (`recherche-destination.ts`, `contenu-trajet.ts`, `liste-destinations.ts`, `filtres.ts`, `defilement-destination.ts`, `ui/barre-trajet.tsx`, `ui/feuille-destination.tsx`, `ui/trajet-explorer.tsx`, `ui/ecran-explorer.tsx`, `ui/resultats-explorer.tsx`) ; `features/destinations/ui/section-destinations.tsx` ; `features/localisation/ui/feuille-depart.tsx` (`ChoixDepart`) ; `components/ui/feuille.tsx` (`pleineHauteur`, `pied`) ; `features/destinations/ui/carte-destination.tsx` (`data-destination`) ; `06` § 3 ; `GLOSSAIRE` ; `A-FAIRE` ; `design/prompts-ecrans.md` (prompts 11 et 12) ; `CHANGELOG.md`.
