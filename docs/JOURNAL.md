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
