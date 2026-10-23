# E02 — Gares (et socle de l'ETL)

> **Semaine :** S2 (12/10 → 18/10) · **Priorité :** P0 · **Branche :** `etape/E02-gares`
> **Étapes préalables :** E01 · **État :** ✅ terminé (22/10/2026)
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
La base est prête (E01). Première source réelle : les gares, pivot de tout le projet. Cette étape pose aussi **le socle commun de l'ETL** (téléchargement avec empreinte, journal des exécutions, rapport, chargement transactionnel) réutilisé par toutes les sources suivantes.

## Documents à lire
- `CLAUDE.md`
- `docs/02-sources-donnees.md` (§ 1, § 2.1)
- `docs/03-base-de-donnees.md` (§ 3.1, § 3.11, § 3.12)
- `docs/04-traitement-donnees.md` (§ 1, § 3, § 4.1, § 5)

## Objectif
`pnpm etl gares` charge toutes les gares de France et marque celles de la région pilote.

## Résultat attendu
- Socle ETL réutilisable : `sources/`, `chargement/`, `controles/`, rapports.
- Table `source_donnees` remplie pour toutes les sources prévues.
- Table `gare` remplie ; rapport lisible.
- Image Docker `etl` fonctionnelle.

## Actions de Hardy
- [x] Trouver l'URL de téléchargement du fichier « Gares de voyageurs » (data.gouv.fr ou data.sncf.com) et la licence exacte ; les donner à Claude Code (elles iront dans `config/sources.json`).
- [x] Relire le premier rapport ETL.

## Phase d'audit
1. ✅ Télécharger le fichier une fois, **lire ses vraies colonnes**, comparer à `02` § 2.1 ; corriger `02` si besoin.
2. ✅ Compter les gares sans position ou sans UIC.
3. ✅ Proposer le plan ; attendre la validation (validé le 19/10).

## Tâches
**Socle ETL**
- [x] `etl/src/sources/base.ts` : téléchargement en flux (`fetch`) vers `data/brut/<source>/`, calcul SHA-256 (`node:crypto`), comparaison avec `source_donnees.empreinte`, mode `--hors-ligne`.
- [x] `etl/src/chargement/base.ts` : lecture CSV en flux (csv-parse) → `COPY` dans une table temporaire → contrôles → transaction (suppression des lignes de la source + insertion).
- [x] `etl/src/controles/base.ts` : contrôles déclaratifs (nom, bloquant oui/non, résultat).
- [x] Journal `execution_etl` (début, fin, statut, nb lignes, message) et rapport Markdown (`04` § 5).
- [x] `config/sources.json` (première version : entrées de **toutes** les sources de `02`, adresses connues, les autres à compléter aux étapes suivantes) + schéma Zod `packages/commun/src/sources.ts`.
- [x] `etl/src/sources/registre.ts` : lit `config/sources.json` (aucune adresse dans le code) et remplit `source_donnees` (code, nom, producteur, URL, licence, attribution) → commande `pnpm etl sources`.
- [x] `etl/Dockerfile` (Node 24 + pnpm, exécution avec `tsx`) ; service `etl` du compose avec `./data:/data`.

**Gares**
- [x] `sources/gares.ts` : `telecharger()`, `lire()` (validation Zod ligne à ligne).
- [x] Migration : colonne `gare.codes_uic` (`03` § 3.1, D034) — `0003_gare_codes_uic`, avec la contrainte `uic = ANY(codes_uic)`.
- [x] `sources/communes.ts` : lecture du COG, nom de commune par code INSEE (`02` § 2.1 bis).
- [x] `transformations/gares.ts` : normalisation UIC 8 chiffres, département, `dans_region` (fonctions pures, testées avec Vitest).
- [x] Chargement dans `gare` (rapprochement par `uic`).
- [x] Contrôles de `04` § 4.1.

**Tests**
- [x] Normalisation UIC : `"87713040"` ✓, `"0087713040"` → `87713040`, liste `"87713040;87713041"` → premier, `"12345"` → rejet.
- [x] Département : `21231` → `21`, `2A004` → `2A`, `97411` → `974`.
- [x] `dans_region` : Dijon (21) vrai **et** Lyon (69) faux.

## Critères d'acceptation
- [x] `docker compose run --rm etl gares` (ou `pnpm etl gares`) → statut `SUCCES`, code retour 0.
- [x] Relancé sans changement → statut `IGNORE`.
- [x] > 2 500 gares en France, > 100 dans la région ; Dijon-Ville présente avec `dans_region = true`. (22/10 : 2 792 / 196 ; la gare s'appelle « Dijon » dans le fichier, UIC 87713040 ; vérifié aussi avec `docker compose run --rm etl gares`.)
- [x] Rapport généré et relu par Hardy.
- [x] `source_donnees` contient toutes les sources de `02` (16, vérifié le 19/10).
- [x] La requête de référence *gares les plus proches d'une position* (`03-base-de-donnees.md` § 5) tourne sur les vraies données ; temps mesuré et noté dans `JOURNAL.md`. (22/10 : ~12 ms, index GIST utilisé.)

## Vérifications manuelles
- [x] 5 gares au hasard comparées à la réalité (position sur une carte) — Hardy, 22/10.

## À ne pas toucher
- Schéma (sauf écart constaté, alors migration + `03`).
- Application web.

## Fin d'étape
Voir `_MODELE.md`. Compléter `CLAUDE.md` § 16 (commande ETL).

## Notes et modifications après coup
- 05/10/2026 : traitement des données en TypeScript + SQL au lieu de Python (D024).
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
- 05/10/2026 : adresses des sources dans `config/sources.json` au lieu du code (D027).
- 07/10/2026 : `etl/Dockerfile` en Node 24 — D028 (note ajoutée après coup le 09/10).
- 11/10/2026 : critère ajouté : requête de référence exécutée sur les vraies données, temps mesuré (D032).
- 19/10/2026 : audit fait ; colonne `codes_uic`, source `communes` (COG INSEE), mise à jour par `uic`, seuils dans `parametres.json` (D034).
- 22/10/2026 : socle ETL, fusion propre à chaque source, contrôle « UIC en double », empreinte du COG, `.dockerignore` — D035. La gare de Dijon s'appelle « Dijon » dans le fichier (critère « Dijon-Ville »).
- 23/10/2026 : **modifié après coup** — table `commune` (nom et département par code INSEE), commande `pnpm etl communes` avant `gares` ; `gare.commune` et `gare.departement` retirés, `gare.code_insee` relié à `commune` (remarque du professeur, D038).
