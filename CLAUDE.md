# CLAUDE.md — tourisme-en-train

> Fichier maître. Claude Code le lit au début de chaque session.
> **Il dit ce qui est vrai AUJOURD'HUI.** Le pourquoi et l'historique vivent dans `docs/DECISIONS.md` et `docs/JOURNAL.md` : on n'y recopie rien ici, et on ne ramène jamais leur contenu ici.
> Il reste **court** (400 lignes maximum) : cap, règles, état actuel, puis renvoi vers `docs/`.
> Tout le projet est **en français** : documents, interface, commentaires, messages de commit.
> **Travail d'infrastructure (membres SR, dossier `infra/`) : lire `infra/CLAUDE.md`, qui prime pour ce dossier.** Les sections 8, 9, 10 et 14 ci-dessous concernent uniquement le travail de Hardy.

---

## 1. Le projet en bref

Application web installable (PWA), gratuite, sans inscription. Dès l'ouverture, elle localise l'utilisateur et lui montre **ce qu'il peut faire autour de lui et comment y aller en train** : lieux (enfants, nature, parcs, patrimoine, culture), trains directs aller et retour, lieux à pied depuis la gare d'arrivée, transports en ville (bus, tram, vélos), prix estimé, CO₂ économisé.

- **Promesse :** trouver une sortie en 30 secondes, y aller en train.
- **Cadre :** défi data.gouv.fr « Tourisme en train » (Fondation SNCF / Open Data University).
- **Rendu :** jeudi 3 décembre 2026. Soutenance en local sous Docker (obligatoire) ; mise en ligne v1 si le temps le permet.
- **Équipe :** Hardy (seul développeur, full-stack + design) · 2 Systèmes & Réseaux (dossier `infra/` uniquement).
- **Région pilote :** Bourgogne-Franche-Comté (code région INSEE 27). L'extension nationale n'est qu'un paramètre.
- **Pays :** France métropolitaine, fuseau `Europe/Paris`.

### Nom
| | Valeur | Où | Change ? |
|---|---|---|---|
| **Nom de code technique** | `tourisme-en-train` | dépôt, dossiers, base, conteneurs, paquets | **jamais** |
| **Nom de marque** | **Wagoo** (provisoire) | tout ce que voit l'utilisateur | quand Hardy décide |

**Source unique de la marque : `apps/web/src/config/marque.ts`** (nom, slogan, description). Le manifest PWA et les métadonnées en sont générés ; l'URL de l'application, elle, est une variable d'environnement lue côté serveur (`URL_APP`, D031). Changer de nom = ce fichier + cette ligne + le logo.

Détail du produit : `docs/00-vision.md`.

---

## 2. Règles absolues

Chaque règle dit **pourquoi** : elles sont écrites pour celui qui serait tenté de les « simplifier ».

1. **Aucune couleur, police, ombre, rayon ou durée d'animation en dur.** Tout passe par `apps/web/src/styles/globals.css`. *Sinon le design n'est plus modifiable d'une ligne.*
2. **Le nom de marque n'est jamais écrit en dur.** Toujours importé de `config/marque.ts`. *Le nom est provisoire.*
3. **Aucun seuil ou paramètre métier en dur** (rayon de 1,5 km, 3 h de visite, vitesse de marche…). Ils vivent dans `config/parametres.json`, lu par l'app **et** par le traitement des données, à travers **un seul schéma Zod** (`packages/commun`). De même, **aucune adresse de source de données en dur** : elles vivent dans `config/sources.json`. *Deux copies d'un seuil finissent toujours par diverger sans erreur visible ; et une région de plus doit se configurer, pas se programmer.*
4. **Aucun secret dans le dépôt.** Seul `.env.example` est versionné.
5. **La position de l'utilisateur n'est jamais enregistrée** (ni base, ni journaux). *Engagement RGPD, et argument de confiance devant le jury.*
6. **Trains directs uniquement, aucun calcul d'itinéraire avec correspondances.** *Exigence explicite du défi : trop complexe pour être fiable.*
7. **Le prix est toujours une estimation**, affichée comme telle, avec lien vers la billetterie. *Aucune source ouverte ne donne les prix réels.*
8. **Chaque source de données est citée** dans l'écran « Sources ». *Obligation des licences Licence Ouverte et ODbL.*
9. **L'interface n'appelle jamais la base ni une API externe.** Toujours : route → service → requête ou adaptateur. *Sinon une API qui change casse dix fichiers au lieu d'un.*
10. **Le schéma n'évolue que par migration** dans `db/migrations/`. *Une base modifiée à la main n'est plus reproductible pour la soutenance.*
11. **Le travail de Hardy ne dépend jamais des SR.** L'application complète tourne avec `docker compose up`.
12. **Pas de mention de co-auteur IA** (`Co-Authored-By`) dans les commits.

---

## 3. Dates et heures (France)

Un seul fuseau, mais trois pièges réels :

1. **« Aujourd'hui » se calcule explicitement en `Europe/Paris`, puis voyage en paramètre** (`dateDuJour: string` au format `AAAA-MM-JJ`). Jamais lu de l'horloge à l'intérieur d'une fonction : seules `dateDuJour()` et `maintenantParis()` (heure actuelle, D031) de `@tourisme/commun` la lisent. *Le serveur et Docker sont en UTC : entre minuit et 1 h–2 h, « aujourd'hui » en UTC est la veille → mauvais trains affichés. Et une fonction qui lit l'horloge n'est pas testable.*
2. **Les horaires GTFS restent des secondes depuis minuit + une date de service.** Jamais convertis en `Date` UTC. *Un train peut partir à « 25:10 » (1 h 10 le lendemain).*
3. **Tester une date d'été ET une date d'hiver.** *Le changement d'heure du 25/10/2026 tombe en plein développement ; un test qui passe en septembre peut échouer en novembre.*
4. **Ne jamais fixer `TZ=Europe/Paris` dans les conteneurs pour « corriger » un décalage.** Le fuseau se déclare dans le calcul. *Fixer TZ masque le défaut en local et le laisse actif ailleurs.*

---

## 4. Stack et rôle de chaque outil

| Couche | Outil | Rôle |
|---|---|---|
| Langage app | TypeScript strict | Typage de bout en bout |
| Framework | Next.js 16 (App Router, D029) + React 19 | Pages **et** routes API dans un seul projet |
| Style | Tailwind CSS 4 + shadcn/ui | Classes utilitaires, composants accessibles, tokens dans `globals.css` |
| Validation | Zod 4 | Paramètres des routes, réponses externes, variables d'environnement |
| Données client | TanStack Query | Cache et rechargement des réponses |
| Carte | MapLibre GL + react-map-gl + OpenFreeMap | Carte vectorielle gratuite, sans clé, stylable |
| PWA | Serwist | Installation, hors ligne |
| Base | PostgreSQL 16 + PostGIS 3 | Stockage + requêtes géographiques (« proche de quoi ? ») |
| Accès base (app) | Drizzle ORM + drizzle-kit | Requêtes typées, génération des migrations SQL |
| Traitement des données | TypeScript (Node 24, `tsx`) + SQL ; csv-parse, pg, pg-copy-streams | Télécharger, lire, valider (Zod), charger (`COPY`) ; transformations lourdes en SQL (PostGIS) |
| Paquets | pnpm, en espace de travail (`apps/web` · `etl` · `packages/commun`) | Installations reproductibles ; code partagé entre l'app et le traitement |
| Conteneurs | Docker + Docker Compose | Même environnement partout, démo en une commande |
| Tests | Vitest, Playwright | Unitaires (app et traitement des données), parcours complet |
| Qualité | ESLint, Prettier | Style homogène (configurés dès E00) |
| Plus tard | Auth.js (Google) | Connexion optionnelle — **non activée en v1** |

Justifications et alternatives écartées : `docs/01-architecture.md`, `docs/DECISIONS.md`.
**Ajouter ou changer une dépendance majeure = une entrée dans `DECISIONS.md` avant de l'installer.**

---

## 5. Architecture en une image

```
Téléphone ──HTTPS──▶ [ web : Next.js ]   pages PWA + routes API
                          │  route → service → requête (PostGIS) | adaptateur externe
                          │                                        ├─ API Adresse (IGN)
                          ▼ lecture seule                          └─ API SNCF (retards, P1)
                    [ db : PostgreSQL + PostGIS ]      CO₂ et prix : calcul local (facteurs ADEME)
                          ▲ écriture
                    [ etl : TypeScript + SQL ]  télécharge → valide → charge → transforme en SQL
                          ▲
                    données ouvertes (gares, GTFS, DATAtourisme, OSM, transports…)
```

Monorepo pnpm (app · traitement des données · code commun), un seul langage : TypeScript (+ SQL) · application monolithique découpée par fonctionnalité · base et API externes isolées derrière des modules dédiés. Détail : `docs/01-architecture.md`.

---

## 6. Structure des dossiers

```
tourisme-en-train/
├─ CLAUDE.md · README.md · .env.example · docker-compose.yml · package.json · pnpm-workspace.yaml
├─ .github/                     ← CODEOWNERS (Hardy relit tout) · modèle de pull request
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
│  ├─ 07-contrat-infra.md        ← interface avec les SR
│  ├─ 08-conventions-qualite.md  ← règles de code détaillées, tests, définition de « terminé »
│  ├─ GLOSSAIRE.md               ← un terme = un sens = un nom dans le code
│  ├─ DECISIONS.md · A-FAIRE.md · JOURNAL.md
│  ├─ etapes/                    ← _MODELE.md + une fiche par étape (E00 → E18)
│  └─ equipe/                    ← travail-en-equipe.md · guide-SR.md · demarrage-SR.md · pitch.md (E13) · scenario-demo.md (E16)
├─ apps/web/src/
│  ├─ app/                       ← pages et routes API, fines
│  ├─ features/                  ← localisation/ gares/ lieux/ destinations/ trains/ mobilites/
│  │                                impact/ carte/ explorer/ presentation/
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
├─ db/migrations/ · db/echantillon/
├─ data/brut/ · data/traite/     ← ignorés par Git
└─ infra/                        ← production (SR) : CLAUDE.md propre · JOURNAL.md · compose prod, Caddy, sauvegardes
```

Toute nouvelle arborescence respecte cette structure. La modifier = mettre à jour cette section + `DECISIONS.md`.

---

## 7. Carte des documents

| Je dois… | Lire |
|---|---|
| Nommer quoi que ce soit (variable, table, composant) | `GLOSSAIRE.md` |
| Comprendre le produit, le périmètre | `00-vision.md` |
| Savoir où placer du code | `01-architecture.md` |
| Traiter une source de données | `02-sources-donnees.md` + `04-traitement-donnees.md` |
| Créer ou modifier une table | `03-base-de-donnees.md` |
| Créer ou modifier une route | `05-api.md` |
| Créer ou modifier un écran | `06-interface.md` + `globals.css` |
| Toucher Docker, variables, santé | `07-contrat-infra.md` |
| Écrire du code, des tests, un commit | `08-conventions-qualite.md` |
| Savoir pourquoi un choix a été fait | `DECISIONS.md` |
| Reprendre une session | section 9 + dernière entrée de `JOURNAL.md` |

**Ne lire que ce que l'étape en cours demande.** Chaque fiche d'étape liste ses documents.

---

## 8. Ordre de construction

⬜ à faire · 🟡 en cours · ✅ terminé · ⏸ en attente d'un retour

| Étape | Contenu | Sem. | État |
|---|---|---|---|
| E00 | Initialisation : dépôt, outils, conventions, squelette, `marque.ts`, `parametres.json` | S1 | 🟡 |
| E01 | Docker local, PostGIS, schéma initial, migrations | S1 | ⬜ |
| E02 | Gares | S2 | ⬜ |
| E03 | Horaires GTFS SNCF | S2 | ⬜ |
| E04 | Trains directs (liaisons entre gares) | S3 | ⬜ |
| E05 | Lieux : DATAtourisme (CSV région) + OpenStreetMap | S3 | ⬜ |
| E06 | Catégories, doublons, lieux → gares, statistiques | S4 | ⬜ |
| E07 | Transports sur place, tracés des lignes, aménagements cyclables | S4 | ⬜ |
| E08 | Socle API + routes gares, autour, destinations | S5 | ⬜ |
| E09 | Routes lieux, trains, mobilités, impact (CO₂ et prix calculés localement), recherche de ville, sources | S5 | ⬜ |
| E10 | Socle interface : design system, mise en page, composants | S6 | ⬜ |
| E11 | Écran Explorer | S6 | ⬜ |
| E12 | Fiche destination | S7 | ⬜ |
| E13 | Page « L'âme du produit » + écran Sources | S7 | ⬜ |
| E14 | PWA, hors ligne | S7 | ⬜ |
| E15 | Qualité : tests, accessibilité, performance, P1 restants | S8 | ⬜ |
| E16 | Livraison soutenance : images de prod, lancement en une commande, données figées | S8 | ⬜ |
| E17 | Mise en ligne v1 avec les SR (**optionnel**) | Fin | ⬜ |
| E18 | Publication de la réutilisation sur data.gouv.fr | Fin | ⬜ |

Semaines : S1 = 05/10 → 11/10 · S2 = 12 → 18/10 · S3 = 19 → 25/10 · S4 = 26/10 → 01/11 · S5 = 02 → 08/11 · S6 = 09 → 15/11 · S7 = 16 → 22/11 · S8 = 23 → 29/11 · Fin = 30/11 → 02/12.
Fiches : `docs/etapes/Exx-*.md`. Jalons : **données en base le 01/11** · **API complète le 08/11** · **P0 terminé le 22/11** · **décision de mise en ligne le 25/11** · **gel des fonctionnalités le 27/11** · **livraison le 30/11** · **soutenance le 03/12**.

---

## 9. État actuel

> Mis à jour à chaque « garde le contexte ». **On supprime ce qui est résolu** : ce qui mérite d'être gardé part dans `JOURNAL.md` ou `DECISIONS.md`.

- **Étape en cours :** E00 — code terminé sur `etape/E00-initialisation`, pull request à ouvrir
- **Dernière session :** 09/10/2026
- **Fait :** audit de la documentation et corrections ; D029 (Next.js 16 après essai Serwist réussi, Zod 4, TypeScript 5.9.3, pnpm 11), D030 (port hôte de la base), D031 (ajustements des conventions) ; espace de travail pnpm, `@tourisme/commun`, `apps/web`, `etl` ; `pnpm verifier` passe (31 tests)
- **À valider par Hardy :** ouvrir l'app dans le navigateur (`pnpm dev`) ; points de `docs/A-FAIRE.md` § 1 (données des cartes de destination avant E04, légende de la carte avant E11)
- **Bloquant :** —
- **Prochaine action précise :** pousser la branche et ouvrir la PR de E00 (signaler aux SR le changement de port, `07` v1.4), puis lire `docs/etapes/E01-docker-base.md`

---

## 10. Réaliser une étape

1. **Lire** la fiche, puis uniquement les documents qu'elle cite.
2. **Auditer** l'existant et signaler tout écart avec la documentation.
3. **Proposer un plan court** (fichiers, ordre, risques). **Attendre la validation de Hardy.**
4. **Coder** par petits incréments.
5. **Tester** : types, lint, tests, contrôle manuel de la fiche.
6. **Regarder le résultat** : un écran n'est pas terminé tant qu'il n'a pas été ouvert dans le navigateur ; un traitement de données, tant que les lignes en base n'ont pas été comptées et échantillonnées.
7. **Vérifier les critères d'acceptation** un par un.
8. **Mettre à jour la documentation** touchée (section 13) et l'état de l'étape (section 8).
9. **Commit** en français, puis push.

Fiche incomplète ou contradictoire → **s'arrêter, signaler, proposer la correction**. Ne pas improviser.

---

## 11. Règles de développement (résumé)

Détail complet : `docs/08-conventions-qualite.md`.

- **Langue du code :** vocabulaire métier en français sans accents (`gare`, `lieu`, `liaisonDirecte`, `dureeMarcheMin`) ; vocabulaire technique des outils inchangé (`page.tsx`, `route.ts`, `useQuery`).
- **Nommage :** fichiers `kebab-case`, composants `PascalCase`, fonctions et variables `camelCase`, SQL `snake_case`.
- **Couches :** `app/` → `features/*/server/` → `lib/db` | `lib/external`. Une fonctionnalité n'importe jamais le `server/` d'une autre.
- **Calculs = fonctions pures** (distance, durée, CO₂, prix, date du jour) : testables sans base ni réseau.
- **Validation** à chaque entrée : Zod, dans l'app comme dans le traitement des données.
- **Erreurs :** format unique `{ erreur: { code, message } }` ; aucun détail technique affiché à l'utilisateur.
- **Taille :** un fichier dépasse rarement 200 lignes.
- **Interdits :** `any`, code mort, `console.log` oublié.
- **Tests en paires :** le cas **et** sa limite (« un lieu à 1,4 km apparaît » **et** « un lieu à 1,6 km n'apparaît pas »). *Sans la limite, une fonction qui répond toujours « oui » passe.*
- **Données d'exemple** toujours signalées comme telles (commentaire + dossier `db/echantillon/`), jamais mélangées aux vraies.
- **Construire du nouveau = se demander quelles protections existantes deviennent insuffisantes** (validation, filtre, test). Chercher les « portes sœurs » avant d'en fermer une.
- **Bug étrange dans le navigateur pendant une session d'édition :** redémarrer `pnpm dev` et reproduire **avant** de diagnostiquer.
- **Un correctif ne doit pas défaire la demande précédente** : vérifier avant de corriger un effet secondaire.
- **Commits :** `type(portee): description` en français. Types : `feat` `fix` `refactor` `docs` `test` `chore` `data`.
- **Branches :** une par étape (`etape/E04-trains-directs`), fusion dans `main` par pull request en fin d'étape.

### Git : protocole de sécurité
**Jamais** `git checkout`, `git restore`, `git stash`, `git clean -fd` ou `git reset --hard` sur un fichier contenant du travail non commité. *Ces commandes restaurent le dernier commit, pas « l'état d'avant » : tout le travail en cours est perdu.* Pour tester en cassant du code : **copier le fichier ailleurs → modifier → tester → restaurer depuis la copie**. Toujours `git status` avant une commande qui jette des changements.

### Design
- La maquette Claude Design est un **conseil** : on copie son **aspect**, jamais son comportement sans le vérifier.
- On travaille **un écran à la fois**, celui que Hardy indique, et on le lui montre avant de passer au suivant.
- Hardy apporte l'**expérience d'usage** ; l'implémentation est proposée par Claude Code.
- Une demande de design qui obligerait à toucher la logique ou les données est **signalée avant** : Hardy décide.

---

## 12. ❌ Ce qui n'existe pas dans ce projet

```
❌ Pages Router, Prisma, Redux, CSS Modules, styled-components
❌ Python dans le projet (traitement des données en TypeScript + SQL, D024)
❌ Deuxième schéma de parametres.json — un seul, dans packages/commun
❌ Couleur, police, rayon, ombre en dur — tokens de globals.css uniquement
❌ Nom de marque en dur — config/marque.ts uniquement
❌ Seuil métier en dur — config/parametres.json uniquement
❌ Adresse de source de données en dur — config/sources.json uniquement
❌ Calcul d'itinéraire avec correspondances
❌ Prix présenté comme réel
❌ Compte utilisateur, connexion, table users en v1 (Auth.js prévu plus tard, non activé)
❌ Position de l'utilisateur en base ou dans les journaux
❌ Appel à la base ou à une API externe depuis un composant d'interface
❌ Import du dossier server/ d'une autre fonctionnalité
❌ Modification du schéma hors migration
❌ new Date().toISOString() pour obtenir la date du jour
❌ Horaire GTFS converti en Date UTC
❌ TZ fixé dans un conteneur pour masquer un décalage
❌ Secret dans le dépôt
❌ Donnée d'exemple mélangée aux vraies données
❌ git checkout/restore/stash/clean/reset --hard sur du travail non commité
❌ Co-Authored-By dans les commits
❌ Modification de infra/ sans pull request (dossier des SR)
```

---

## 13. Documents vivants : les faire évoluer sans conflit

1. **Un sujet = un document de référence.** Tables → `03`, routes → `05`, écrans → `06`, etc. Les autres **renvoient**, ils ne recopient pas.
2. **Ordre de mise à jour** quand on découvre un manque (ex. : une colonne) : document de référence → migration → documents listés dans « Utilisé par » → fiche d'étape si encore à faire → `DECISIONS.md`.
3. **En-tête obligatoire** de chaque document : version, date, « Dépend de », « Utilisé par ». **Historique** en fin de document.
4. **Une étape terminée n'est pas réécrite** : on ajoute « Modifié après coup » + lien vers la décision.
5. **Contradiction entre deux documents :** le document de référence du sujet l'emporte ; signaler et corriger l'autre.
6. **`A-FAIRE.md` :** chaque élément dit **quoi**, **pourquoi il est reporté** et **ce qui déclenchera sa réalisation**.
7. **Un document qui dépasse ~400 lignes** devient un dossier (ex. `06-interface/` avec un fichier par écran + un sommaire). Les liens sont mis à jour dans le même commit.
8. **Nouveau terme métier :** l'ajouter à `GLOSSAIRE.md` avant de l'utiliser.

---

## 14. Protocole « garde le contexte »

Quand Hardy écrit **« garde le contexte »**, exécuter dans l'ordre :

1. **Vérifier** : typecheck, lint, tests. En cas d'échec, ne rien masquer : le noter.
2. **Section 9 « État actuel »** : étape, fait, à valider, bloquant, **prochaine action précise** (fichier + tâche). Supprimer ce qui est résolu.
3. **Section 8** : état des étapes.
4. **Fiche d'étape** : cocher l'avancement.
5. **`docs/JOURNAL.md`** : nouvelle entrée (date, étape, fait, décisions, problèmes, à valider).
6. **`docs/DECISIONS.md`** : décisions de la session.
7. **`docs/A-FAIRE.md`** : à valider par Hardy, actions humaines, reporté, idées.
8. **Historique** de chaque document d'architecture modifié.
9. **Commit** `docs(contexte): sauvegarde de session du JJ/MM` puis **push**.
10. **Résumé à Hardy :** ✅ fait · ⏸ à valider · ⬜ reste à faire · ▶ première action de la prochaine session.

**Reprise :** lire la section 9, la dernière entrée de `JOURNAL.md` et la fiche en cours, puis **résumer la situation en 5 lignes à Hardy avant toute action**.

---

## 15. Travail avec les Systèmes & Réseaux

- Ils travaillent **uniquement dans `infra/`** (exception : `.github/workflows/deploiement*.yml` pour le déploiement automatique), par pull request relue par Hardy.
- **Leur fichier maître : `infra/CLAUDE.md`** (périmètre, règles, contrat résumé, état de leurs tâches I01 → I22, leur propre « garde le contexte » avec `infra/JOURNAL.md`). Hardy ne modifie pas ce fichier, sauf décision d'équipe.
- Le lien app ↔ infrastructure est fixé par **`docs/07-contrat-infra.md`** (variables, `/api/sante`, Dockerfiles, migrations, journaux). Tant qu'il est respecté, **personne n'attend personne**.
- Un retour des SR ne modifie que `07-contrat-infra.md` et les étapes E16–E17.
- Leurs tâches : `docs/equipe/guide-SR.md` ; leur premier jour : `docs/equipe/demarrage-SR.md`.
- Organisation de l'équipe (GitHub, protection de `main`, relecture, rythme) : `docs/equipe/travail-en-equipe.md`.
- `main` est protégée : tout passe par une pull request ; `.github/CODEOWNERS` rend la relecture de Hardy obligatoire pour les PR des SR.

---

## 16. Commandes utiles

> Complétées en E00–E02, quand elles existent réellement.

| Action | Commande |
|---|---|
| Installer les dépendances | `pnpm install` (Node 24, pnpm 11.24 fixé) |
| Démarrer l'environnement local | *(E01)* |
| Appliquer les migrations | *(E01)* |
| Lancer l'app en développement | `pnpm dev` (lit le `.env` de la racine ; http://localhost:3000) |
| Tout vérifier (types, lint, format, tests) | `pnpm verifier` |
| Lancer les tests | `pnpm test` (tous les paquets) |
| Formater | `pnpm format` |
| Lancer le traitement des données | `pnpm etl <source\|all> [--force] [--hors-ligne]` · `pnpm etl --help` (sources disponibles à partir de E02) |

---

## Historique des modifications

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
