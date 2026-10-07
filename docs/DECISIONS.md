# Journal des décisions

> **Rôle :** garder la trace de **pourquoi** chaque choix a été fait. `CLAUDE.md` dit ce qui est vrai aujourd'hui ; ce fichier dit comment on y est arrivé.
> **Règle :** on n'efface jamais une décision. Si elle change, on ajoute une nouvelle décision qui « remplace Dxxx », et on marque l'ancienne « Remplacée par Dyyy ».
> **Format :** numéro, date, décision, raison, alternatives écartées, impact (documents touchés).

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

---

## Modèle pour une nouvelle décision

```
## Dxxx — Titre court
- **Date :** JJ/MM/AAAA
- **Décision :**
- **Raison :**
- **Écarté :**
- **Impact :** documents et code touchés
- **Remplace :** Dyyy (si applicable)
```
