# E01 — Docker local, base PostGIS et schéma initial

> **Semaine :** S1 (05/10 → 11/10) · **Priorité :** P0 · **Branche :** `etape/E01-docker-base`
> **Étapes préalables :** E00 · **État :** ⬜ à faire
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
Le dépôt et les outils existent (E00). Il faut maintenant une base PostgreSQL + PostGIS identique sur toutes les machines, avec le schéma P0 et les trois rôles, pour que l'ETL (E02 → E07) et l'API (E08) aient où lire et écrire.

## Documents à lire
- `CLAUDE.md`
- `docs/03-base-de-donnees.md` (en entier)
- `docs/07-contrat-infra.md` (§ 3, § 4, § 5)
- `docs/08-conventions-qualite.md` (§ 3)

## Objectif
`docker compose up -d` lance une base prête, migrée, avec ses rôles, sur n'importe quel poste.

## Résultat attendu
- Service `db` (et `adminer` en profil `outils`) opérationnels.
- Toutes les tables **P0** de `03` créées par migration, avec index et contraintes, **sauf `liaison_directe`** (créée en E04, voir la note du 09/10).
- Rôles `proprietaire`, `etl_ecriture`, `app_lecture` avec les bons droits.
- Base de test séparée pour les tests d'intégration.
- Jeu d'échantillon chargeable.

## Actions de Hardy
- [ ] Vérifier que Docker Desktop fonctionne (`docker run hello-world`).
- [ ] Créer son `.env` local à partir de `.env.example` (mots de passe locaux).
- [ ] Valider le plan après l'audit.

## Phase d'audit
1. Relire `03` et lister les tables P0, index et contraintes à créer.
2. Vérifier la prise en charge de `geography` par Drizzle et proposer le `customType`.
3. Identifier ce qui doit aller en **migration personnalisée** (extensions, rôles, index particuliers).
4. Proposer le plan ; attendre la validation.

## Tâches
- [ ] `docker-compose.yml` : services `db`, `adminer` (profil `outils`), `etl` et `web` déclarés mais construits plus tard (profils `etl`, `demo`) ; volume `donnees_db` ; ports sur `127.0.0.1` uniquement, port de `db` côté hôte `${BDD_PORT_HOTE:-5432}` (D030) ; `healthcheck` `pg_isready`.
- [ ] `apps/web/drizzle.config.ts` : schéma `src/lib/db/schema.ts`, sortie `../../db/migrations`, URL `BDD_URL_MIGRATIONS`.
- [ ] `src/lib/db/types-postgis.ts` : `customType` `geographyPoint` (et plus tard ligne/multiligne).
- [ ] `src/lib/db/schema.ts` : tables P0 de `03` § 3.1 → 3.12 **sauf § 3.5 `liaison_directe`**, avec contraintes et index. `schema.ts` et `types-postgis.ts` **sans** `import 'server-only'` (lus par drizzle-kit, D031).
- [ ] Migration personnalisée n° 0 : `CREATE EXTENSION postgis`, `pg_trgm`.
- [ ] Script de création des rôles `etl_ecriture`, `app_lecture` avec leur mot de passe (`MDP_APP_LECTURE`, `MDP_ETL_ECRITURE`), idempotent, lancé par `pnpm db:migrer` **avant** les migrations ; migration personnalisée « droits » : `GRANT`, `ALTER DEFAULT PRIVILEGES`, **aucun mot de passe** (D031).
- [ ] Index particuliers si non générés : GIST sur `geom`, GIN trigram sur `lieu.nom`.
- [ ] `src/lib/db/client.ts` : client Drizzle + `postgres`/`pg` avec `BDD_URL_APP` (import `server-only`).
- [ ] Scripts : `pnpm db:generer`, `pnpm db:migrer`, `pnpm db:reinitialiser` (local uniquement, demande confirmation).
- [ ] Base de test `tourisme_test` : créée par script ; migrations appliquées ; utilisée par `pnpm test:integration`.
- [ ] `db/echantillon/` : script SQL ou TS qui charge ~10 gares (dont Dijon-Ville, Beaune, Dole, Besançon-Viotte, une hors région), quelques trajets et une trentaine de lieux **marqués comme exemple** — uniquement dans la base de test.
- [ ] `etl/src/db.ts` : connexion `pg` avec `BDD_URL_ETL` ; utilitaires `COPY` en flux et transaction.
- [ ] Mettre à jour `README.md` et `CLAUDE.md` § 16.

## Critères d'acceptation
- [ ] Sur une base vide : `docker compose up -d` puis `pnpm db:migrer` → toutes les tables P0 existent (vérifié dans Adminer ou `\dt`).
- [ ] Relancer `pnpm db:migrer` ne fait rien et ne casse rien.
- [ ] **Paire de tests de droits :** `app_lecture` peut `SELECT` **et** ne peut pas `INSERT` ; `etl_ecriture` peut `INSERT` **et** ne peut pas `DROP TABLE`.
- [ ] Une requête de proximité sur l'échantillon (gare la plus proche d'un point de Dijon) renvoie Dijon-Ville.
- [ ] Aucun port exposé ailleurs que sur `127.0.0.1`.

## Vérifications manuelles
- Adminer (`docker compose --profile outils up -d`) : tables, index, rôles visibles.
- Arrêter/relancer `db` : les données persistent (volume).

## À ne pas toucher
- `infra/` (SR).
- Tables P1 (`ligne_ferroviaire`, `amenagement_cyclable`) : créées en E07.

## Fin d'étape
Voir `_MODELE.md` § Fin d'étape. Mettre à jour `03` si le schéma réel diffère.

## Notes et modifications après coup
- 05/10/2026 : traitement des données en TypeScript + SQL au lieu de Python (D024).
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
- 09/10/2026 : port de `db` côté hôte réglable (D030) ; rôles créés par script, `server-only` absent de `schema.ts` (D031) ; **`liaison_directe` retirée du schéma initial** : sa structure dépend du point « données des cartes de destination » à décider avant E04 (`A-FAIRE`), elle sera créée par une migration au début de E04.
