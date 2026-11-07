# Historique de CLAUDE.md

> **Version** 1.0 · **Date** 05/11/2026
> **Dépend de :** `CLAUDE.md`
> **Utilisé par :** personne en lecture courante : à consulter pour savoir quand une section de `CLAUDE.md` a changé.
> **Rôle :** garder `CLAUDE.md` court (D066). Chaque modification de `CLAUDE.md` ajoute une ligne ici.

---

| Date | Version | Modification |
|---|---|---|
| 30/09/2026 | 1.0 | Création |
| 30/09/2026 | 1.1 | Nom de code `tourisme-en-train`, marque Wagoo centralisée, règles de fuseau horaire, liste des interdits, protocole Git, règles de design, paramètres métier partagés, leçons reprises de Lexio |
| 30/09/2026 | 1.2 | Glossaire, fonctionnalités complètes dans la structure, CO₂ calculé localement, route `/api/sante`, règle de découpage des documents |
| 30/09/2026 | 1.3 | Dossier `design/`, adaptateur `gbfs.ts` (vélos disponibles) |
| 02/10/2026 | 1.4 | Dossier `.github/` (CODEOWNERS, modèle de PR), guides d'équipe — D023 |
| 05/10/2026 | 1.5 | Traitement des données en TypeScript + SQL au lieu de Python ; espace de travail pnpm avec `packages/commun` — D024 |
| 05/10/2026 | 1.6 | Calendrier recalé sur la feuille de route (démarrage le 05/10, P0 le 22/11) — D025 |
| 05/10/2026 | 1.7 | `infra/CLAUDE.md` pour les SR, exception `.github/workflows/deploiement*.yml` — D026 |
| 05/10/2026 | 1.8 | Adresses des sources dans `config/sources.json` (préparation multi-région) — D027 |
| 09/10/2026 | 1.9 | Next.js 16 et Zod 4 (D029) ; `marque.ts` sans URL, `maintenantParis()`, journal dans le code commun (D031) |
| 09/10/2026 | 1.10 | E00 : § 8, § 9 et commandes réelles du § 16 |
| 11/10/2026 | 1.11 | `BACKLOG.md` (§ 6, § 7) ; étape « backlog » dans le protocole « garde le contexte » (§ 14) — D032 |
| 11/10/2026 | 1.12 | E01 : `apps/web/scripts/`, tests d'intégration, pilote `pg`, commandes de base (§ 4, § 6, § 16) — D033 |
| 19/10/2026 | 1.13 | § 8 et § 9 : E01 terminée, E02 en cours |
| 22/10/2026 | 1.14 | § 16 : commandes `pnpm etl gares` et `docker compose run --rm etl` ; § 8 et § 9 : E02 terminée |
| 22/10/2026 | 1.15 | § 8, § 9 et § 16 : E03 terminée, `pnpm etl gtfs_sncf` |
| 23/10/2026 | 1.16 | § 16 : `pnpm etl communes` — D038 |
| 23/10/2026 | 1.17 | § 9 : sauvegarde de session (table `commune`, D039, E04 à lancer) |
| 30/10/2026 | 1.18 | § 9 : sauvegarde de session (cartes de destination et jumelage en attente) |
| 01/11/2026 | 1.19 | § 16 : `pnpm etl liaisons` ; § 8 : E04 terminée — D040 |
| 01/11/2026 | 1.20 | § 9 : sauvegarde de session (E04 fusionnée, E05 à lancer) |
| 01/11/2026 | 1.21 | § 6, § 7, § 14 : `LECONS.md`, sommaire et ligne « En clair » de `DECISIONS.md` |
| 01/11/2026 | 1.22 | § 16 : `pnpm etl contours`, `regles`, `datatourisme`, `osm` — D041 |
| 01/11/2026 | 1.23 | § 8 et § 9 : sauvegarde de session (E05 fusionnée, E06 à lancer) |
| 02/11/2026 | 1.24 → 1.31 | § 16 : `pnpm etl rattachements`, `pnpm etl transport_local` ; § 8 : E06 et E07 terminées (PR #52, #53) ; § 9 : quatre sauvegardes de session — D042 → D046 (entrées regroupées le 03/11 : limite de 400 lignes) |
| 03–04/11/2026 | 1.32 → 1.41 | § 4 : composants sur Radix (D053) ; § 6 : fonctionnalité `sante/` (D047) ; § 8 : E08, E09, E10 terminées, E11 en cours ; § 9 : sauvegardes de session (entrées regroupées : limite de 400 lignes) |
| 04–05/11/2026 | 1.42 | § 16 : `pnpm test:e2e` ; § 8 et § 9 : E11 et E12 ⏸ — D063, D064 |
| 05/11/2026 | 1.43 | § 6 : `.github/dependabot.yml` — D065 |
| 05/11/2026 | 1.43 → 1.44 | § 6 : arborescence détaillée déplacée vers `01` § 3 bis ; historique déplacé ici ; aucune règle retirée — D066 |
| 05/11/2026 | 1.45 | § 9 : sauvegarde de session (PR #66 et #67 à fusionner, retour sur Explorer à décider) |
| 05/11/2026 | 1.46 | § 8 : E14 en cours — D071 |
| 05/11/2026 | 1.47 | § 9 : sauvegarde de session (PR #70 et #71 en attente de l'essai sur iPhone) |
| 05/11/2026 | 1.48 | § 9 : sauvegarde de session (gel validé, marges à revérifier sur iPhone) |
| 05/11/2026 | 1.49 | § 9 : sauvegarde de session (PR #70 fusionnée, #71 recalée) |
| 06/11/2026 | 1.50 | § 9 : sauvegarde de session ; § 16 : commandes du téléphone (tunnel Cloudflare) |
| 06/11/2026 | 1.51 | § 1, § 2 règle 11, § 6, § 8, § 9, § 12, § 15 : infrastructure confiée à Hardy, E13 et E17 en cours — D076 |
| 06/11/2026 | 1.52 | § 9 : E17 lot 1 ; § 16 : essayer la production en local — D076 |
| 06/11/2026 | 1.53 | § 9 : sauvegarde de session (E17 lot 1 fait, lots 2 à 5 à la main) |
| 07/11/2026 | 1.54 | § 8, § 9 : sauvegarde de session, phase 1 d'E17 terminée ; § 10, § 15, § 16 : protocole « mets en ligne » — D077 |
| 07/11/2026 | 1.55 | § 8 : dates de Hardy ; § 9 : réglages Coolify confirmés ; § 15 : changements de structure — D078 |
| 07/11/2026 | 1.56 | § 9 : sauvegarde de session, tâches à reprendre dans l'ordre |
| 07/11/2026 | 1.57 | § 9 : sauvegarde de session, étapes prévues d'abord — D079 |
