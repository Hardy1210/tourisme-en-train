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
| 10/11/2026 | 1.58 | § 11 : un bug commence par un test ; § 15 : CHANGELOG et numéro de version — D080 |
| 11/11/2026 | 1.59 | § 8 : design du 23 au 25/11 ; § 9 : sauvegarde de session, #94 ouverte — D080 → D084 |
| 11/11/2026 | 1.60 | § 16 : `pnpm dev` arrêté seulement pour un build dans le dépôt lui-même, pas dans une copie |
| 11/11/2026 | 1.61 | § 9 : sauvegarde de session de l'après-midi, #94 à essayer sur iPhone |
| 12/11/2026 | 1.62 | § 9 : sauvegarde de session, #94 fusionnée, page « Trajet » (D085), Lieux ensuite |
| 12/11/2026 | 1.63 | § 9 : sauvegarde de session du soir, #99 et #100 fusionnées, #101 ouverte (D086) |
| 12/11/2026 | 1.64 | § 9 : #101 fusionnée (D086) ; prochaine action : parcours des filtres F05 |
| 12/11/2026 | 1.65 | § 9 et § 16 : deux copies, `tourisme-recherche` pour le serveur d'essai, `tourisme-parcours` pour les parcours |
| 12/11/2026 | 1.66 | § 9 : sauvegarde de la nuit, #104 → #107 fusionnées, point (b) ensuite |
| 13/11/2026 | 1.67 | § 9 : sauvegarde, #109 → #111 fusionnées (D088, D089), c2 remplacée par un audit (D090) |
| 13/11/2026 | 1.68 | § 9 : sauvegarde du soir, #113 fusionnée, #114 ouverte (D091, D092), PR piscines ensuite |
| 13/11/2026 | 1.69 | § 9 : PR piscines (D093) ouverte, prochaine action : PR cercles |
| 14/11/2026 | 1.70 | § 9 : sauvegarde, #116 et #117 fusionnées, #118 ouverte (D094), leçons L56 → L62 |
| 14/11/2026 | 1.71 | § 9 : sauvegarde du soir, #118 et #119 fusionnées, #120 ouverte, parcours instables en priorité |
| 14/11/2026 | 1.72 | § 9 : #120 et #121 fusionnées ; priorité : performance de la carte |
| 16/11/2026 | 1.73 | § 9 : sauvegarde, 0.2.0 en ligne, #126 ouverte (D096), nouvelle adresse de tunnel après chaque build ; § 8 : E17 0.2.0 |
| 16/11/2026 | 1.74 | § 9 : sauvegarde du soir, feuille de #126 essayée sur l'iPhone, conseils sur le lien avec une gare choisie à la main et sur les logos |
| 16/11/2026 | 1.75 | § 9 : #126 fusionnée, lien d'itinéraire même sans position, PR 2 vélo par l'extraction OSM existante avec migration `PARKING_VELO` |
| 17/11/2026 | 1.76 | § 9 : sauvegarde de la nuit du 16 au 17/11 (#131 sur `main`, #132 et #133 ouvertes, audit des parcours, plan du 17/11) |
| 17/11/2026 | 1.77 | § 8 et § 9 : 0.3.0 et 0.3.1 en ligne, règle unique du trajet vers la gare, étude du coefficient de détour en prochaine action, format des commandes données à Hardy |
| 17/11/2026 | 1.78 | § 8 et § 9 : priorités jusqu'à la soutenance (D099), études photos et coefficient de détour le 18/11 |
| 17/11/2026 | 1.79 | § 9 : étude des photos faite (D100, #139), planche de contrôle, décisions en attente, service d'itinéraire proposé |
| 17/11/2026 | 1.80 | § 16 : étape `photos` du traitement des données (D100) |
| 18/11/2026 | 1.81 | § 9 : photos (PR 1 fusionnée, #145 ouverte), décisions de la fiche lieu (descriptions complètes, Wikipédia, horaires), 0.4.0 en prochaine action |
| 18/11/2026 | 1.82 | § 9 : #142, #144, #146 fusionnées ; #145 validée sur l'iPhone, à fusionner ; `URL_CONTACT` dans le `.env` de Hardy |
| 18/11/2026 | 1.83 | § 9 : descriptions complètes renvoyées à D105 (D104 = lieux avec photo d'abord) |
| 18/11/2026 | 1.84 | § 9 : photos d'abord (#148) et horloge des tests (#149) fusionnées ; 0.4.0 en prochaine action, avec `compter-lignes.sql` à compléter |
| 18/11/2026 | 1.85 | § 8 : 0.4.0 le 18/11 ; § 9 : production en 0.4.0, #154 et #155 sur `main`, #156 à fusionner, 0.5.0 à décider ; mesurer sur l'iPhone avant de corriger une lenteur (L81), image Docker et configurations des tests (L80), tunnel depuis la maison, recalage d'une PR empilée ; prochaine action du 19/11 |
| 19/11/2026 | 1.86 | § 16 : étape `descriptions` dans l'ordre du traitement — D105 |
| 19/11/2026 | 1.87 | § 9 : #156 et #157 fusionnées, #158 (D105) à essayer et fusionner, 0.5.0 avec données, intégration continue avant le 22/11, traitement lourd jamais en même temps que les parcours ; prochaine action du 20/11 |
| 19/11/2026 | 1.88 | § 9 : one-pager (texte et chiffres mesurés, `pitch.md`), essai de #158 en cours, fiche d'exemple ; prochaine action du vendredi 20/11 |
| 20/11/2026 | 1.89 | § 9 : #158 et #160 fusionnées (D105, D108), 0.5.0 avec #160, PR 2 du design de la fiche lieu (plan), ordre à confirmer par Hardy ; contrôle du tunnel par `--doh-url` |
| 20/11/2026 | 1.90 | § 8 et § 9 : 0.5.0 en ligne (code et données, tag `v0.5.0`), ménage du VPS à faire, prochaine action : PR 2 du design de la fiche lieu |
| 20/11/2026 | 1.91 | § 9 : branche du design de la fiche lieu (D109) à ouvrir en PR, questions à Hardy, prochaine action du 21/11 ; § 9 Bloquant : essai « app installée » par l'écran d'accueil |
| 21/11/2026 | 1.92 | § 9 : #162, #163, #164 sur `main`, remarques du professeur en cours de décision, durées mesurées des tests, prochaine action : comparer les deux avis |
| 21/11/2026 | 1.93 | § 15 étapes 2 et 4 : vérifications de GitHub avant la fusion ; § 9 : l'image est vérifiée par GitHub (L80) — D110 |
| 21/11/2026 | 1.94 | § 9 : #162 à #168 sur `main`, intégration continue en place, durées mesurées sur GitHub, prochaine action : étude d'impact après chaque maquette |
| 24/11/2026 | 1.95 | § 9 : #170, #171, #172 sur `main` (D112, D113), écran 2 à faire, barre blanche reportée, correction du logo mise de côté ; Bloquant : deux tunnels pour un défaut du téléphone, onglet privé pour le premier lancement, aucune fenêtre modale pendant une demande d'autorisation |
| 24/11/2026 | 1.96 | § 9 : #174, #175 sur `main`, #176 ouverte (D114, D115), ③ décidé, ⇅ dans la page « Trajet », ordinateur à la fin ; prochaine action : essai de #176, puis la date dans la page « Trajet » |
| 24/11/2026 | 1.97 | § 9 : #176, #178, #179, #180 sur `main` (D115 à D117), ① ② ③ ⑦ faites, code maintenable (demande de Hardy), prochaine action : ⑥ dès la maquette, sinon ④ |
| 24/11/2026 | 1.98 | § 9 : #182 sur `main` (D118), #183 ouverte (D119), décision des bulles en attente, prochaine action : reprise avec cette décision |
| 25/11/2026 | 1.99 | § 9 : #183 sur `main` (D119), #185 ouverte (④, D120), bulles après la soutenance, idée des icônes choisies, sursaut au lâcher et plantage de A à reprendre ; prochaine action : mesure du lâcher, puis A/B |
| 25/11/2026 | 2.00 | § 9 : départ brutal de la feuille sur l'iPhone, essais sans effet, version de diagnostic en ligne, branches d'essai ; prochaine action : résultat des trois variantes |
| 25/11/2026 | 2.01 | § 9 : ④ en attente (reprise à la maison), #187 ouverte (date de la fiche destination), ⑤ : #188 et #189 ouvertes (D121), ordre des rangées et point 1 à valider ; prochaine action : recaler #189, PR 3, puis ④ |
| 25/11/2026 | 2.02 | § 9 : #185 à #190 sur `main` (D120 à D122), ① à ⑦ faites, aucune PR ouverte ; longue liste et animation (Bloquant) ; prochaine action : PR B de ④, puis PR 3 de D121 |
| 25/11/2026 | 2.03 | § 9 : #191 à #196 sur `main`, #197 ouverte (pitch), après la soutenance (MapLibre 6, liste sans fin), prochaine action : validation de #197 puis évaluation après le gel |
| 26/11/2026 | 2.04 | § 16 : étape `descriptions_wikipedia` dans la liste du traitement des données, à relancer après `datatourisme`, `osm` ou `rattachements` — D123 |
| 26/11/2026 | 2.05 | § 8 : ligne E19 ; § 9 : #198 à #202 sur `main` (D123), #203 ouverte (D124), maquettes de Hardy, E16 en premier après le gel |
