# CLAUDE.md — tourisme-en-train

> Fichier maître. Claude Code le lit au début de chaque session.
> **Il dit ce qui est vrai AUJOURD'HUI.** Le pourquoi et l'historique vivent dans `docs/DECISIONS.md` et `docs/JOURNAL.md` : on n'y recopie rien ici, et on ne ramène jamais leur contenu ici.
> Il reste **court** (400 lignes maximum) : cap, règles, état actuel, puis renvoi vers `docs/`.
> Tout le projet est **en français** : documents, interface, commentaires, messages de commit.
> **Travail d'infrastructure : section 15, `docs/07-contrat-infra.md` et `infra/README.md`.**

---

## 1. Le projet en bref

Application web installable (PWA), gratuite, sans inscription. Dès l'ouverture, elle localise l'utilisateur et lui montre **ce qu'il peut faire autour de lui et comment y aller en train** : lieux (enfants, nature, parcs, patrimoine, culture), trains directs aller et retour, lieux à pied depuis la gare d'arrivée, transports en ville (bus, tram, vélos), prix estimé, CO₂ économisé.

- **Promesse :** trouver une sortie en 30 secondes, y aller en train.
- **Cadre :** défi data.gouv.fr « Tourisme en train » (Fondation SNCF / Open Data University).
- **Rendu :** jeudi 3 décembre 2026. Soutenance en local sous Docker (filet de sécurité obligatoire) ; mise en ligne sur `wagoo.hardylino.com`, phase 1 anticipée (D076).
- **Équipe :** Hardy (seul développeur, full-stack + design, responsable infrastructure, D076).
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
11. **L'application tourne en local sans le serveur.** L'application complète démarre avec `docker compose`. *La soutenance ne dépend pas du VPS.*
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
| Style | Tailwind CSS 4 + composants façon shadcn/ui sur Radix, sans son installateur (D053) | Classes utilitaires, composants accessibles, tokens dans `globals.css` |
| Validation | Zod 4 | Paramètres des routes, réponses externes, variables d'environnement |
| Données client | TanStack Query | Cache et rechargement des réponses |
| Carte | MapLibre GL + react-map-gl + OpenFreeMap | Carte vectorielle gratuite, sans clé, stylable |
| PWA | Serwist | Installation, hors ligne |
| Base | PostgreSQL 16 + PostGIS 3 | Stockage + requêtes géographiques (« proche de quoi ? ») |
| Accès base (app) | Drizzle ORM + drizzle-kit, pilote `pg` | Requêtes typées, génération des migrations SQL (`pnpm db:generer`, D033) |
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

Détail complet, fichier par fichier : `docs/01-architecture.md` § 3 bis.

```
tourisme-en-train/
├─ config/           ← parametres.json (seuils) · sources.json (adresses et licences)
├─ docs/             ← voir § 7 · etapes/ · equipe/
├─ design/           ← globals.css source, maquettes (référence, hors code)
├─ .github/          ← CODEOWNERS · modèle de pull request · dependabot.yml (D065)
├─ apps/web/src/     ← app/ · features/ · components/ui/ · config/ · lib/ · styles/globals.css
├─ apps/web/scripts/ ← scripts de base (generer · migrer · reinitialiser · preparer-base-test)
├─ packages/commun/  ← @tourisme/commun : schémas Zod, dates à Paris, journal
├─ etl/              ← @tourisme/etl : traitement des données (TypeScript + SQL)
├─ db/               ← migrations/ · echantillon/ (données d'exemple, base de test uniquement)
├─ data/             ← brut/ · traite/ (ignorés par Git)
└─ infra/            ← production : README.md (exploitation) · compose.prod.yml
```

Toute nouvelle arborescence respecte cette structure. La modifier = mettre à jour `01` § 3 bis, ce résumé et `DECISIONS.md`.

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
| Relier une fonctionnalité à ses tâches, estimer, planifier un sprint | `BACKLOG.md` |
| Savoir pourquoi un choix a été fait | `DECISIONS.md` (sommaire par thème en tête) |
| Réviser, préparer la soutenance, réutiliser une leçon ailleurs | `DECISIONS.md` + `LECONS.md` |
| Reprendre une session | section 9 + dernière entrée de `JOURNAL.md` |

**Ne lire que ce que l'étape en cours demande.** Chaque fiche d'étape liste ses documents.

---

## 8. Ordre de construction

⬜ à faire · 🟡 en cours · ✅ terminé · ⏸ en attente d'un retour

| Étape | Contenu | Sem. | État |
|---|---|---|---|
| E00 | Initialisation : dépôt, outils, conventions, squelette, `marque.ts`, `parametres.json` | S1 | ✅ |
| E01 | Docker local, PostGIS, schéma initial, migrations | S1 | ✅ |
| E02 | Gares | S2 | ✅ |
| E03 | Horaires GTFS SNCF | S2 | ✅ |
| E04 | Trains directs (liaisons entre gares) | S3 | ✅ |
| E05 | Lieux : DATAtourisme (CSV région) + OpenStreetMap | S3 | ✅ |
| E06 | Catégories, doublons, lieux → gares, statistiques | S4 | ✅ |
| E07 | Transports sur place, tracés des lignes, aménagements cyclables | S4 | ✅ |
| E08 | Socle API + routes gares, autour, destinations | S5 | ✅ |
| E09 | Routes lieux, trains, mobilités, impact (CO₂ et prix calculés localement), recherche de ville, sources | S5 | ✅ |
| E10 | Socle interface : design system, mise en page, composants | S6 | ✅ |
| E11 | Écran Explorer (vérifications de design et téléphone : `A-FAIRE` § 1) | S6 | ⏸ |
| E12 | Fiche destination et fiche lieu (vérifications de design et téléphone : `A-FAIRE` § 1) | S7 | ⏸ |
| E13 | Page « L'âme du produit », écran Sources, mentions légales (textes du pitch à finir à la fin du projet) | S7 | 🟡 |
| E14 | PWA, hors ligne | S7 | 🟡 |
| E15 | Qualité : tests, accessibilité, performance, P1 restants | S8 | ⬜ |
| E16 | Livraison soutenance : images de prod, lancement en une commande, données figées | S8 | ⬜ |
| E17 | Mise en ligne : phase 1 ✅ le 07/11, phase 2 après le P0 | S5, puis fin | 🟡 |
| E18 | Publication de la réutilisation sur data.gouv.fr | Fin | ⬜ |

Semaines : S1 = 05/10 → 11/10 · S2 = 12 → 18/10 · S3 = 19 → 25/10 · S4 = 26/10 → 01/11 · S5 = 02 → 08/11 · S6 = 09 → 15/11 · S7 = 16 → 22/11 · S8 = 23 → 29/11 · Fin = 30/11 → 02/12.
Fiches : `docs/etapes/Exx-*.md`. Jalons : **données en base le 01/11** · **API complète le 08/11** · **P0 terminé au plus tard le 22/11** · **gel des nouvelles fonctionnalités au plus tard le 27/11** · **livraison le 30/11** · **soutenance le 03/12**. Retouches de design du 23 au 25/11, avant E15 (D080). Après le gel : corrections et déploiements jusqu'à la soutenance. De l'avance ? Elle va aux P1 (D078).

---

## 9. État actuel

> Mis à jour à chaque « garde le contexte ». **On supprime ce qui est résolu** : ce qui mérite d'être gardé part dans `JOURNAL.md` ou `DECISIONS.md`.

- **Étape en cours :** E11 et E12, carte : bulles, tri, piscines masquées, nombres sans fondu ✅ (D092, D093, #117) ; carte par zone (autour de soi + gares de destination), bulles décalées ✅ (D094, #118) ; bulles à la couleur de la marque : #120 ouverte. Ensuite : **PR des parcours instables (priorité)**, puis PR vélo prouvé (`A-FAIRE` § 1). Puis intégration continue + règle ESLint des couches avant le 22/11, E13 (3 textes du pitch), E14 (Android), E15, E16, E18
- **Dernière session :** 14/11/2026 — #116 → #119 fusionnées ; #120 ouverte (bulles inversées) ; leçons L56 → L62 pour la soutenance ; cadrage instable plus fréquent depuis #118 (`JOURNAL.md`)
- **Fait :** données et API P0 ; Explorer (recherche de destination, date dans « Filtres », cadrage, « Près de vous », mode destination, carte en bulles), Lieux, fiches, Sources, À propos, Mentions légales ; production en 0.1.0 (`d1f0206`), inchangée depuis le 07/11 : les nouveautés attendent sous « Non publié » dans `CHANGELOG.md`
- **À valider par Hardy :** fusion de #120 ; mise en ligne (2 migrations, puis données) ; « Voir les sorties » ou « Afficher N sorties » ; l'ordinateur sans bouton date ; textes Android du guidage pendant E14 ; À propos sur l'iPhone ; 3 textes du pitch au plus tard le 22/11 ; `A-FAIRE` § 1
- **Bloquant :** rien. Règle de Hardy : on ne supprime jamais un lieu de la base, on choisit ce qu'on montre (D093). Parcours instables sous la charge sur `main` (`A-FAIRE` § 1 : touchers de la carte et « Voir la sortie » sans effet, mobile ; seuls, ils passent). Un serveur de Hardy tourne souvent sur le `.next` du dépôt : jamais de build dans le dépôt. **Deux copies détachées (`git worktree`), chacune son build :** `../tourisme-recherche` = serveur d'essai sur iPhone (port 3200), jamais de parcours dedans ; `../tourisme-parcours` = parcours Playwright (port 3100), builds et `verifier`. Aucun commit dans les copies : elles sont posées sur le commit à tester (`git switch --detach <branche>`), et ce commit est donné à Hardy avec l'adresse d'essai. À effacer après la soutenance (`A-FAIRE`). Mise en ligne : `infra/README.md`, relire « Non publié » avant le Redeploy ; Coolify ne déploie que sur un clic de Hardy
- **Prochaine action précise :** PR des parcours instables, sur une nouvelle branche depuis `main` : `apps/web/tests/e2e/carte-cadrage.e2e.ts:25` (3 sur 6 sur `main`, téléphone) et `explorer.e2e.ts:121` (mini-fiche), puis « Voir la sortie » (`explorer.e2e.ts:45`). Méthode : reproduire avec `--repeat-each`, lire la trace (ordre de chargement carte / destinations / lieux), écrire le test qui montre la cause, corriger ; plan court à Hardy d'abord
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
10. **Mettre en ligne** quand Hardy le demande : § 15.

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
- **Un bug commence par un test** qui le reproduit, puis la correction (D080). *Sinon rien n'empêche le bug de revenir.*
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
❌ Modification de infra/ sans pull request
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
5. **`docs/BACKLOG.md`** : passer à ✅ les fonctionnalités dont toutes les tâches sont fusionnées.
6. **`docs/JOURNAL.md`** : nouvelle entrée (date, étape, fait, décisions, problèmes, à valider).
7. **`docs/DECISIONS.md`** : décisions de la session (avec la ligne « En clair ») ; **`docs/LECONS.md`** seulement si la session apporte une leçon réutilisable.
8. **`docs/A-FAIRE.md`** : à valider par Hardy, actions humaines, reporté, idées.
9. **Historique** de chaque document d'architecture modifié.
10. **Commit** `docs(contexte): sauvegarde de session du JJ/MM` puis **push**.
11. **Résumé à Hardy :** ✅ fait · ⏸ à valider · ⬜ reste à faire · ▶ première action de la prochaine session.

**Reprise :** lire la section 9, la dernière entrée de `JOURNAL.md` et la fiche en cours, puis **résumer la situation en 5 lignes à Hardy avant toute action**.

---

## 15. Infrastructure

- **Responsable infrastructure : Hardy** (D076). Le rôle peut être repris par un coéquipier.
- **Production :** un VPS séparé géré par Coolify, en Docker Compose, sur `wagoo.hardylino.com`. Le domaine ne dépend que d'`URL_APP` et du réglage Coolify.
- **Le lien app ↔ infrastructure est fixé par `docs/07-contrat-infra.md`** (variables, `/api/sante`, Dockerfiles, migrations, journaux). Exploitation : `infra/README.md`. Plan et mesures : `docs/etapes/E17-mise-en-ligne-v1.md`.
- **La démo locale d'E16 reste le filet de sécurité de la soutenance.**

### Protocole « mets en ligne »
Quand Hardy écrit **« mets en ligne »**, suivre **`infra/README.md`, section « Mettre en ligne une mise à jour »**, dans l'ordre, une étape à la fois. Cette phrase vaut accord pour la branche, le commit, le push et la pull request. Claude Code ne fusionne pas et ne clique pas dans Coolify : il donne à Hardy le geste exact.

1. **Classer** le changement : le tableau dit quoi vérifier et s'il faut un Redeploy (documents seuls : non). **Changement de structure ou de présentation : plan court validé par Hardy d'abord, et essai sur téléphone avant la fusion.**
2. **Vérifier dans une copie** : `pnpm verifier`, `pnpm test:integration`, `pnpm test:e2e` ; essai de l'image si le tableau le demande.
3. **Publier** : commit, push, pull request qui dit ce que Hardy devra faire. Chaque PR visible ajoute sa ligne à `CHANGELOG.md` ; avant le Redeploy, Hardy relit « Non publié » et choisit le numéro de version (D080).
4. **Hardy** saisit les variables éventuelles dans Coolify, fusionne (bypass, *Squash and merge*, *Confirm*), sauvegarde la base si migration, clique sur **Redeploy**.
5. **Contrôler** : `infra/scripts/controler-production.sh https://wagoo.hardylino.com` (code retour 0), puis la nouveauté dans un navigateur.
6. **Hardy** essaie sur l'iPhone. **Noter** dans les documents touchés.

Données, panne, retour en arrière : mêmes sections d'`infra/README.md`. **Jamais de mot de passe dans une conversation.**
- `main` est protégée : tout passe par une pull request. Organisation GitHub : `docs/equipe/travail-en-equipe.md`.

---

## 16. Commandes utiles

> Complétées en E00–E02, quand elles existent réellement.

| Action | Commande |
|---|---|
| Installer les dépendances | `pnpm install` (Node 24, pnpm 11.24 fixé) |
| Démarrer la base locale | `docker compose up -d` (Adminer : `docker compose --profile outils up -d`, http://localhost:<ADMINER_PORT_HOTE>, 8080 par défaut) |
| Appliquer les migrations (crée aussi les rôles) | `pnpm db:migrer` |
| Générer une migration | `pnpm db:generer` (personnalisée : `pnpm db:generer --custom --name=<nom>`) |
| Repartir d'une base vide (local) | `pnpm db:reinitialiser` |
| Tests d'intégration (base de test recréée) | `pnpm test:integration` |
| Lancer l'app en développement | `pnpm dev` (lit le `.env` de la racine ; http://localhost:3000) |
| Tests de parcours (Playwright, base de test, version de production) | `pnpm test:e2e` (une seule fois avant : `pnpm --filter @tourisme/web exec playwright install chromium`) |
| Tout vérifier (types, lint, format, tests) | `pnpm verifier` |
| Lancer les tests | `pnpm test` (tous les paquets) |
| Formater | `pnpm format` |
| Lancer le traitement des données | `pnpm etl <source\|all> [--force] [--hors-ligne]` · `pnpm etl --help` · disponibles : `sources`, `communes`, `contours`, `gares`, `gtfs_sncf`, `liaisons`, `regles`, `datatourisme`, `osm`, `rattachements`, `transport_local` (dans cet ordre) |
| Essayer sur le téléphone (tunnel Cloudflare) | **Dans la copie `../tourisme-recherche`, `pnpm dev` peut continuer dans le dépôt** : elle a son propre `.next`. Les parcours tournent dans `../tourisme-parcours`, jamais dans cette copie : sinon ils refont son build sous le serveur. **Dans le dépôt lui-même, arrêter `pnpm dev` d'abord.** Puis `pnpm --filter @tourisme/web build` et `pnpm --filter @tourisme/web exec next start -p 3200` ; dans un autre terminal : `~/cloudflared tunnel --url http://localhost:3200`, dont l'adresse change à chaque lancement. `pnpm dev` peut être relancé une fois le build terminé |
| Essayer la production en local (depuis la racine) | `docker compose -p essai-prod --project-directory . --env-file <fichier> -f infra/compose.prod.yml up -d --build` ; export et restauration : `infra/README.md` |
| Contrôler la production depuis l'extérieur | `infra/scripts/controler-production.sh https://wagoo.hardylino.com` (lecture seule, code retour 0 si tout est bon) |
| Lancer le traitement dans Docker | `docker compose run --rm etl <source\|all> [--force] [--hors-ligne]` (image reconstruite : `docker compose build etl`) |

---

## Historique des modifications

Dans `docs/HISTORIQUE-CLAUDE.md` : toute modification de ce fichier s'y note, pas ici (D066).
