# Journal des sessions

> **Rôle :** une entrée par session de travail, ajoutée par le protocole « garde le contexte ».
> **Règle :** les entrées ne sont jamais modifiées après coup ; la plus récente est **en haut**.

---

## Modèle d'entrée

```
## JJ/MM/AAAA — Étape Exx — titre court
**Fait :**
-
**Décisions :** Dxxx, Dyyy (voir DECISIONS.md)
**Problèmes rencontrés :**
-
**À valider par Hardy :**
-
**Prochaine action :**
-
**Vérifications :** typecheck ✅/❌ · lint ✅/❌ · tests ✅/❌
**Commit :** <hash court>
```

---

## 23/10/2026 — Correctifs avant E04 — table `commune`, codes UIC des gares
**Fait :**
- Essais de Hardy dans Docker et Adminer (connexion, requêtes de contrôle des horaires, Dijon → Beaune) ; explications sur les tables d'horaires (`trajet`, `passage`, `service_jour`) et la lecture du GTFS (ZIP lu en flux, tables brutes temporaires).
- **Remarque du professeur (normalisation)** : nom et département de la commune recopiés dans `gare`. Table `commune` (code INSEE clé, nom, département) remplie par `pnpm etl communes` (36 912 codes), `gare.code_insee` en clé étrangère indexée, migration `0005_table_commune` complétée à la main (données gardées) ; `dans_region` reste dans `gare` ; `lieu` décidé en E05. PR #47.
- **Doublon de Paris Gare de Lyon** : le fichier SNCF du 23/10 a inversé ses codes UIC, la gare a été recréée (id 27041) à côté de l'ancienne (id 1913, 530 passages). Gares désormais reconnues par un code UIC commun, deux contrôles bloquants ; le contrôle a bien échoué sur la base avant nettoyage ; doublon sans référence supprimé, gare 1913 passée au code `87686030`. PR #48.
- Rechargement complet : 2 792 gares, 3 467 trajets, 33 275 passages, 11 231 jours (fenêtre commençant le 23/10) ; 499 passages sur l'unique Paris Gare de Lyon. Commandes testées aussi dans Docker.
- Alerte Dependabot n° 2 (esbuild ≤ 0.24.2 via drizzle-kit) fermée « code non utilisé » ; rappel dans `A-FAIRE` § 3.
- Prompt fourni à Hardy pour mettre à jour sa page « Audit des gares Wagoo » (table `commune`, codes UIC, schéma des tables).

**Décisions :** D038 (table `commune`), D039 (gare reconnue par un code UIC commun) ; proposition « cartes de destination » en attente (future D040).

**Problèmes rencontrés :**
- La migration de `0005` aurait laissé `communes` en `IGNORE` (même empreinte) avec une table partielle : empreinte remise à zéro dans la migration.
- Message de commentaire Dependabot limité à 280 caractères (refus de l'API, raccourci).

**À valider par Hardy :**
- Proposition « cartes de destination » (`A-FAIRE` § 1) ; trains en jumelage (E04) ; copie de la page d'audit dans le dépôt.

**Prochaine action :**
- Trancher les cartes de destination, puis audit E04 sur `etape/E04-trains-directs`.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (149) · intégration ✅ (35)
**Commit :** #47 `505d155`, #48 `55759f7` sur `main` ; sauvegarde sur `etape/E04-trains-directs`

---

## 22/10/2026 — Étape E03 — horaires GTFS SNCF
**Fait :**
- Audit du GTFS SNCF (transport.data.gouv.fr, ODbL) : pas de `calendar.txt`, type de train dans le `stop_id`, cars dans le fichier, gares étrangères, montée et descente interdites ; tableaux colonne par colonne validés par Hardy.
- Migration `0004_passage_montee_descente` ; `regles/types-train.ts`, `sources/zip.ts`, `chargement/gtfs-brut.ts`, `transformations/gtfs.sql` + `sql.ts`, `chargement/gtfs.ts` + `gtfs-controles.ts`, `sources/gtfs-sncf.ts` ; `pnpm etl gtfs_sncf`.
- GTFS miniature (`etl/tests/donnees/gtfs_mini/`) : calendrier, exceptions, changement d'heure, après minuit, montée interdite, cars, AUTRE.
- Premier chargement : 3 516 trajets (TER 2 669, TGV 613, Intercités 234), 33 650 passages, 11 100 jours de circulation ; 98,4 % rapprochés ; 6 contrôles ✅ ; ~26 s ; `SUCCES` puis `IGNORE`, aussi dans Docker.
- **Requête de référence « trains A → B »** : ~5 ms ; Dijon → Beaune le lundi 26/10 : 46 trains.
- Hardy : 3 horaires Dijon → Beaune vérifiés sur SNCF Connect (conformes).

**Décisions :** D036 (source, type de train, cars exclus, `calendar.txt`, sans rattrapage par distance, montée et descente), D037 (IGNORE du jour, règle en un fichier, GTFS miniature, sections SQL, seuil de rapprochement).

**Problèmes rencontrés :**
- Nombre de trajets en car mal recopié dans `02` (2 789 au lieu de 6 822) : corrigé.
- Un BOM invisible inséré dans le code par une édition : remplacé par `\uFEFF`.
- Une requête d'audit sans index a dépassé 5 min : arrêtée et réécrite.
- Corbigny et Flez-Cuzy - Tannay : cars seulement jusqu'au 26/12 (signalées dans le rapport).
- **Trains en jumelage** (ex. TGV 12177 et 5537) : deux trajets aux mêmes horaires, 139 départs en double le 26/10 ; à traiter en E04.

**À valider par Hardy :**
- Données des cartes de destination et traitement des trains en jumelage (audit E04) ; légende de la carte (avant E11).

**Prochaine action :**
- Fusionner la PR de E03, puis lire `docs/etapes/E04-trains-directs.md`.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (149) · intégration ✅ (28)
**Commit :** `aa863a9` → `52822f8` ; sauvegarde sur `etape/E03-horaires`

---

## 22/10/2026 — Étape E02 — socle de l'ETL, gares en base, image Docker
**Fait :**
- Socle ETL : `sources/base.ts` (téléchargement, empreinte, `--hors-ligne`), `chargement/base.ts` (CSV validé, `COPY`, transaction), `controles/base.ts`, `chargement/execution.ts` (`execution_etl`) et `chargement/rapport.ts` (rapport Markdown).
- Gares : migration `0003_gare_codes_uic` (remplie avant de devenir obligatoire, contrainte `uic = ANY(codes_uic)`), `transformations/gares.ts`, `sources/communes.ts`, `sources/gares.ts`, `chargement/gares.ts` ; `pnpm etl gares`.
- `etl/Dockerfile` et `.dockerignore` ; `docker compose run --rm etl gares` vérifié (aide, SUCCES, IGNORE, hors ligne, erreur → code 1).
- Résultats : 2 792 gares, 196 dans la région, 0 écartée, 11 à plusieurs codes UIC, 8 sans nom de commune (communes fusionnées, hors région) ; 4 contrôles ✅.
- **Requête de référence « gares les plus proches »** sur les vraies données : ~12 ms à chaud (17 ms à froid), index GIST utilisé.
- Hardy : rapport relu, 5 gares au hasard vérifiées sur une carte, démonstration Docker + Adminer rejouée.

**Décisions :** D035 (socle ETL, fusion par source, durée mesurée par la base, `.dockerignore`, `DOSSIER_DONNEES` relatif).

**Problèmes rencontrés :**
- `DOSSIER_DONNEES=./data` était lu depuis `etl/` : résolu depuis la racine du dépôt.
- drizzle-kit générait `ADD COLUMN … NOT NULL` direct (échec sur une table remplie) : migration complétée à la main, testée sur 10 gares.
- 584 communes déléguées partagent le code de leur commune dans le COG 2026 : la commune l'emporte (testé).
- Docker non joignable depuis WSL en début de session : Docker Desktop relancé par Hardy.
- La SNCF a republié le fichier des gares le 22/10 à 12:43 UTC : empreinte changée, rechargement détecté automatiquement (comportement attendu).

**À valider par Hardy :**
- Données des cartes de destination (avant E04) ; légende de la carte (avant E11).

**Prochaine action :**
- Fusionner la PR de E02, puis lire `docs/etapes/E03-horaires.md`, audit du GTFS SNCF.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (112) · intégration ✅ (17)
**Commit :** `2ca2c51` → `860c077` ; sauvegarde sur `etape/E02-gares`

---

## 19/10/2026 — Étape E02 — audit des gares, configuration des sources
**Fait :**
- E01 fusionnée dans `main` le 11/10 (PR #44) ; branche `etape/E02-gares` créée.
- Audit du fichier réel des gares (data.sncf.com, ODbL) : 2 792 gares, 196 dans la région, aucune sans position ni sans UIC ; BOM, position `"lat, lon"`, 11 gares à plusieurs codes UIC, nom de commune absent. `02`, `03`, `04` corrigés.
- Fichier des communes du COG INSEE 2026 testé : nom de commune trouvé pour 2 784 gares sur 2 792 (8 codes de communes fusionnées, toutes hors région).
- `config/sources.json` (16 sources, champ `verifie`) et son schéma `packages/commun/src/sources.ts` (7 tests) ; `parametres.json` : `region.emprise`, `controles`.
- `pnpm etl sources` remplit `source_donnees` (16 lignes vérifiées en base).

**Décisions :** D034 (codes UIC multiples, source `communes`, mise à jour par `uic`, toute la France, seuils dans `parametres.json`).

**Problèmes rencontrés :**
- La section 9 de `CLAUDE.md` annonçait encore la PR de E01 à fusionner : corrigée.
- E02 démarre avec une semaine de retard sur le calendrier (prévue en S2).

**À valider par Hardy :**
- Données des cartes de destination (avant E04) ; légende de la carte (avant E11).

**Prochaine action :**
- Socle de l'ETL : `etl/src/sources/base.ts` (téléchargement, SHA-256, `--hors-ligne`), puis chargement, contrôles, journal `execution_etl` et rapport.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (49)
**Commit :** `0301632` (sources) ; sauvegarde sur `etape/E02-gares`

---

## 11/10/2026 — Backlog et étape E01 — base PostGIS, schéma, migrations
**Fait :**
- Backlog produit intégré (`docs/BACKLOG.md`) : CLAUDE.md § 6, § 7, § 14 ; colonne « Étape » de `00` § 6 alignée ; critère « requête de référence mesurée » dans E02 → E04 ; `Closes #` dans le modèle de PR et `demarrage-SR` ; ligne « Fonctionnalités » ajoutée aux 41 tickets (seul ajout, vérifié par comparaison).
- E01 : `docker-compose.yml` (db, adminer, etl et web déclarés ; ports réglables `BDD_PORT_HOTE`, `ADMINER_PORT_HOTE`) ; schéma Drizzle des 11 tables P0 ; migrations 0000 extensions, 0001 schéma, 0002 droits ; scripts `db:generer`, `db:migrer`, `db:reinitialiser`, `db:test:preparer`, `test:integration` ; clients `pg` (web, ETL avec `COPY` et transaction) ; échantillon ; diagramme Mermaid dans `03` § 2.
- Élément « Créer les 41 tickets » retiré de `A-FAIRE` (réalisé avant cette session).

**Décisions :** D032 (backlog, lien fonctionnalités ↔ tickets), D033 (geography, scripts lancés par Node, `@tourisme/commun` lisible par Node, pilote `pg`, base de test, contrôle des mots de passe).

**Problèmes rencontrés :**
- drizzle-kit 0.31 met `"geography(Point, 4326)"` entre guillemets (refusé par PostgreSQL) : corrigé automatiquement par `pnpm db:generer`.
- drizzle-kit charge `drizzle.config.ts` en CommonJS (pas d'`import.meta`) ; nom de contrainte unique en camelCase (`idSource`) : nommée explicitement.
- L'image PostGIS crée déjà `postgis` (et topology, tiger) dans la base principale : migration 0000 en `IF NOT EXISTS`.
- Docker non joignable depuis WSL en début de session (intégration WSL de Docker Desktop) ; réglé par Hardy.
- `.env` de Hardy : mot de passe de `BDD_URL_MIGRATIONS` différent de `POSTGRES_PASSWORD` ; corrigé par Hardy, et contrôle ajouté aux scripts.
- Port 8080 occupé par un autre projet : `ADMINER_PORT_HOTE=8081` dans le `.env` de Hardy.

**À valider par Hardy :**
- Données des cartes de destination (avant E04) ; légende de la carte (avant E11).

**Prochaine action :**
- Fusionner la PR de E01, l'annoncer aux SR (I01), puis audit de E02.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (42) · intégration ✅ (11) · `next build` ✅
**Commit :** `cb804ac` (backlog) · `b7b81ac` → `89a71b9` (E01) ; sauvegarde sur `etape/E01-docker-base`

---

## 09/10/2026 — Étape E00 — audit de la documentation, initialisation du code
**Fait :**
- Audit complet de la documentation (44 fichiers `.md`) : contradictions corrigées (versions de Node, navigation basse, historiques, date de I01, dépôt déjà public dans E18, message « hors région » écrit en dur), écarts reportés dans `A-FAIRE` (données des cartes de destination, seuils écrits en dur, légende de la carte, licence, lien de billetterie).
- Essai Serwist + Next.js 16 réussi (construction Turbopack, service worker actif et page hors ligne vérifiés par Hardy) : Next.js 16 retenu.
- E00 : espace de travail pnpm 11 ; `@tourisme/commun` (schéma unique et strict de `parametres.json`, `dateDuJour()`, `maintenantParis()`, journal JSON, catégories) ; `apps/web` (Next.js 16, `marque.ts`, variables validées au démarrage, `secondesVersHeure`) ; `etl` (`pnpm etl` avec arguments et variables validés). PR #43 fusionnée, ticket #2 fermé.
- Commits dans `main` : documentation et code de E00 regroupés par la fusion « squash » de la PR #43 (`49cb17b`).

**Décisions :** D029 (versions : Next.js 16, Zod 4, TypeScript 5.9.3, pnpm 11.24), D030 (port de la base côté poste, `BDD_PORT_HOTE`), D031 (exceptions `server-only` et `export default`, `maintenantParis()`, rôles créés par script, journal commun, `marque.ts` sans URL, règle des `null`).

**Problèmes rencontrés :**
- `@next/env` gardait en cache le premier chargement : le `.env` de la racine est chargé par `process.loadEnvFile` (Node 24) dans `next.config.ts`.
- Une page statique calcule ses métadonnées à la construction : `URL_APP` retirée du layout (elle serait figée dans l'image) ; à lire à l'exécution en E14.
- `next dev` crée un `AGENTS.md` en anglais : désactivé (`agentRules: false`), `CLAUDE.md` reste le seul fichier maître.
- pnpm 11 bloque les scripts d'installation : `allowBuilds` dans `pnpm-workspace.yaml` (esbuild autorisé, unrs-resolver refusé).
- Le Chromium de Playwright ne démarre pas dans WSL (`libnspr4` manquant) : vérification du navigateur faite par Hardy sous Windows. À régler avant les tests Playwright (E11) : `sudo npx playwright install-deps`.
- Le port 5432 du poste est occupé par un autre projet : `BDD_PORT_HOTE=5433` dans le `.env` de Hardy.

**À valider par Hardy :**
- Données des cartes de destination (avant E04) ; légende de la carte (avant E11).

**Prochaine action :**
- Lire `docs/etapes/E01-docker-base.md`, phase d'audit, plan.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (31)
**Commit :** `49cb17b` (fusion de E00) ; sauvegarde sur `etape/E01-docker-base`

---

## 30/09/2026 — Préparation — documentation d'architecture
**Fait :**
- Analyse du défi, choix des sources, pitch, répartition DEV / SR.
- Rédaction de `CLAUDE.md`, du glossaire, des documents 00 → 08, de `DECISIONS.md`, `A-FAIRE.md`, des fiches E00 → E18 et du guide SR.
- Design system `globals.css` et prompt Claude Design préparés (hors dépôt pour l'instant).

**Décisions :** D001 → D016.
**À valider par Hardy :** relecture de la documentation.
**Prochaine action :** créer le dépôt et lancer E00.
