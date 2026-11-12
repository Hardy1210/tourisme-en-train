# Backlog produit

> **Version** 1.5 · **Date** 10/11/2026
> **Dépend de :** `00-vision.md` § 6 (liste et priorités des fonctionnalités, qui fait foi) · `CLAUDE.md` § 8 (étapes et semaines) · fiche E17 (mise en ligne)
> **Utilisé par :** point d'équipe du lundi · tableau GitHub Projects · présentation au tuteur et soutenance
> **Document de référence pour :** les *user stories*, l'estimation, les critères d'acceptation par fonctionnalité, le lien fonctionnalités ↔ tâches, la planification par sprint.

---

## 1. Organisation

Le backlog décrit **ce que le produit doit faire, du point de vue de l'utilisateur**, classé par priorité. Chaque fonctionnalité est reliée aux **tâches** qui la réalisent : étapes de développement **E00 → E18** et tâches d'infrastructure de la fiche E17. Ces tâches sont des tickets GitHub suivis sur le tableau `tourisme-en-train`.

| Niveau | Contenu |
|---|---|
| 1. Fonctionnalités | 27 fonctionnalités produit (F01 → F27, § 2) et 7 fonctionnalités d'infrastructure (INF1 → INF10, § 3) |
| 2. Éléments techniques | Le socle sans lequel aucune fonctionnalité n'existe (T1 → T9, § 4) |
| 3. Tâches | Les tickets GitHub E00 → E18 et ceux des deux phases d'E17 ; une tâche = une branche = une pull request |

| Élément | Choix |
|---|---|
| Méthode | Scrum allégé : sprints d'une semaine (S1 = 05/10 … S8 = 29/11, puis « Fin » jusqu'au 02/12) ; point d'équipe chaque lundi (30 min : fait · prévu · bloqué), qui sert de revue et de planification |
| Rôles | Product Owner et développeur : Hardy · Responsable infrastructure : Hardy (D076) · Parties prenantes : tuteur, jury du défi |
| Priorité | MoSCoW : **Must** = P0 (indispensable pour la soutenance) · **Should** = P1 · **Could** = P2 (après la v1) |
| Estimation | Points relatifs 1, 2, 3, 5, 8 ; 1 point ≈ une demi-journée. Estimation initiale, revue chaque lundi |
| Définition de « terminé » | `08-conventions-qualite.md` § 10 |
| État | ⬜ à faire · 🟡 en cours · ✅ terminé — mis à jour quand la dernière tâche liée est fusionnée |

---

## 2. Fonctionnalités utilisateur

| ID | User story | Priorité | Pts | Critère d'acceptation | Tâches | Livrée en | État |
|---|---|---|---|---|---|---|---|
| F01 | En tant que voyageur, je veux être localisé dès l'ouverture (ou saisir une ville si je refuse) afin d'avoir des résultats sans rien taper. | Must (P0) | 3 | Position demandée à l'ouverture ; refus → recherche de ville ; position jamais enregistrée. | E09 · E11 | S6 | ✅ |
| F02 | En tant que voyageur, je veux voir tout de suite les lieux à pied et les gares proches afin de savoir ce qu'il y a autour de moi. | Must (P0) | 3 | Lieux dans le rayon défini par les paramètres ; gares proches avec distance. | E08 · E11 | S6 | ✅ |
| F03 | En tant que voyageur, je veux connaître mes gares de départ les plus proches et pouvoir en changer. | Must (P0) | 2 | Par défaut, la plus proche, sauf si une gare à 3 km au plus a au moins 1,5 fois plus de trains et dessert toutes ses destinations (D064) ; changement de gare possible. | E08 · E11 | S6 | ✅ |
| F04 | En tant que voyageur, je veux voir les destinations atteignables en train direct à la date choisie afin de choisir une sortie. | Must (P0) | 8 | Aucune correspondance ; durée, trains par jour, premier départ, dernier retour. | E02 · E03 · E04 · E08 · E11 | S6 | ✅ |
| F05 | En tant que voyageur, je veux filtrer (rayon, durée de train, ville, catégories, date) afin d'affiner mes idées. | Must (P0) | 3 | Chaque filtre modifie la liste et la carte ; filtres conservés dans l'adresse de la page. | E11 | S6 | 🟡 |
| F06 | En tant que voyageur, je veux une fiche destination avec les lieux à pied depuis la gare afin de préparer ma visite. | Must (P0) | 5 | Lieux à pied depuis la gare, description, image et horaires si disponibles, lien officiel. | E05 · E06 · E09 · E12 | S7 | 🟡 |
| F07 | En tant que voyageur, je veux les trains aller et retour de la journée afin de savoir quand partir et rentrer. | Must (P0) | 3 | Horaires théoriques de la date ; dernier retour mis en évidence. | E03 · E09 · E12 | S7 | ✅ |
| F08 | En tant que voyageur, je veux une carte avec les gares colorées selon le temps de trajet afin de visualiser les distances. | Must (P0) | 5 | Position, gares, lieux par catégorie ; couleurs par tranche de temps ; bascule liste / carte. | E11 | S6 | 🟡 |
| F09 | En tant que voyageur, je veux connaître les transports sur place (bus, tram, vélos) afin de me déplacer à l'arrivée. | Must (P0) | 5 | Arrêts et stations proches de la gare d'arrivée. | E07 · E09 · E12 | S7 | 🟡 |
| F10 | En tant que voyageur, je veux voir le CO₂ économisé par rapport à la voiture afin de mesurer l'intérêt du train. | Must (P0) | 2 | Train / voiture seule / voiture partagée ; source ADEME affichée. | E09 · E12 | S7 | ✅ |
| F11 | En tant que voyageur, je veux un prix estimé afin d'avoir un ordre d'idée du budget. | Must (P0) | 2 | Toujours libellé « estimation » ; lien vers la billetterie ; masqué s'il n'est pas calibré. | E09 · E12 | S7 | ✅ |
| F12 | En tant que voyageur, je veux installer l'application sur mon téléphone et revoir mes dernières recherches hors ligne. | Must (P0) | 3 | Installable ; dernières recherches consultables sans connexion. | E14 | S7 | 🟡 |
| F13 | En tant que jury ou réutilisateur, je veux voir les sources et licences des données utilisées. | Must (P0) | 1 | Chaque source citée avec sa licence et son attribution. | E13 | S7 | ✅ |
| F14 | En tant que jury, je veux une page qui présente le sens du projet. | Must (P0) | 2 | Page narrative accessible depuis le menu. | E13 | S7 | 🟡 |
| F15 | En tant que voyageur, je veux savoir si l'aller-retour est faisable dans la journée. | Should (P1) | 3 | Badge « Faisable dans la journée » ou mention « Retour tôt, plutôt sur 2 jours ». | E12 | S7 | ✅ |
| F16 | En tant que voyageur, je veux voir les lignes ferroviaires sur la carte. | Should (P1) | 2 | Tracés affichés sans ralentir la carte. | E07 · E11 | S6 | ⬜ |
| F17 | En tant que cycliste, je veux voir les voies vertes et pistes près de la gare d'arrivée. | Should (P1) | 2 | Aménagements affichés autour de la gare. | E07 · E12 | S7 | ⬜ |
| F18 | En tant que voyageur, je veux connaître les retards des prochains trains d'aujourd'hui. | Should (P1) | 3 | Statut pour les trains des 3 prochaines heures uniquement ; sinon horaires théoriques. | E09 · E12 | S7 | ⬜ |
| F19 | En tant que personne en situation de handicap, je veux une application accessible. | Should (P1) | 3 | WCAG 2.1 AA : contrastes, clavier, liste équivalente à la carte. | E15 | S8 | ⬜ |
| F20 | En tant que voyageur, je veux un mode sombre. | Should (P1) | 1 | Bascule clair / sombre via le design system. | E10 | S6 | 🟡 |
| F21 | En tant que voyageur, je veux partager une sortie. | Should (P1) | 1 | Copie du lien (filtres inclus) ou partage natif du téléphone. | E11 · E12 | S7 | ⬜ |
| F25 | En tant que voyageur, je veux trouver une sortie pour ce week-end en un clic. | Should (P1) | 1 | L'option « Ce week-end » ouvre le samedi ; passage au dimanche possible. | E11 · E12 | S7 | ✅ |
| F26 | En tant que cycliste, je veux voir les vélos disponibles en direct près de la gare. | Should (P1) | 2 | Nombre de vélos par station (villes publiant un flux GBFS). | E07 · E09 · E12 | S7 | ⬜ |
| F27 | En tant que voyageur, je veux garder mes destinations favorites. | Could (P2) | 2 | Favoris enregistrés dans le navigateur. | — | après v1 | ⬜ |
| F22 | En tant que voyageur, je veux découvrir des pépites peu fréquentées. | Could (P2) | 3 | Badge calculé à partir des données Insee. | — | après v1 | ⬜ |
| F23 | En tant que jeune ou senior, je veux savoir s'il reste des places MAX JEUNE / SENIOR. | Could (P2) | 3 | Badge de disponibilité. | — | après v1 | ⬜ |
| F24 | En tant que voyageur, je veux retrouver mes favoris sur tous mes appareils. | Could (P2) | 5 | Connexion Google, favoris synchronisés. | — | après v1 | ⬜ |

Total : **78 points** (Must 47 · Should 18 · Could 13). Responsable : Hardy. « Livrée en » = sprint de la dernière tâche liée.

---

## 3. Fonctionnalités d'infrastructure

Responsable : responsable infrastructure (Hardy, D076). Détail et ordre : fiche E17.

| ID | User story | Priorité | Pts | Critère d'acceptation | Tâches | Phase | État |
|---|---|---|---|---|---|---|---|
| INF1 | En tant que voyageur, je veux accéder au site en ligne, en HTTPS, sur un nom de domaine. | Must (P0) | 5 | Serveur sécurisé, `wagoo.hardylino.com`, HTTPS automatique, redirection HTTP → HTTPS. | E17 lots 1 à 5 | 1 | ✅ |
| INF2 | En tant que responsable du service, je veux un serveur et une base protégés. | Must (P0) | 3 | Seuls les ports 22, 80, 443 ouverts ; base non exposée ; secrets hors dépôt. | E17 lots 1 à 5 | 1 | ✅ |
| INF8 | En tant que voyageur, je veux que ma vie privée soit respectée côté serveur. | Must (P0) | 2 | Aucune position enregistrée ; journal d'accès du proxy coupé ; mentions légales. | E17 lot 1, E13 | 1 | ✅ |
| INF9 | En tant que futur exploitant, je veux une infrastructure documentée et transmissible. | Must (P0) | 1 | `infra/README.md` : déployer, restaurer, changer un secret. | E17 | 1 | ✅ |
| INF10 | En tant que responsable du service, je veux une application protégée sans changer d'outil. | Should (P1) | 2 | En-têtes de sécurité ; limitation d'appels. | E17 phase 2 | 2 | ⬜ |
| INF3 | En tant que responsable du service, je veux ne jamais perdre les données. | Should (P1) | 2 | Sauvegarde quotidienne ; restauration réelle chronométrée. | E17 phase 2 | 2 | ⬜ |
| INF4 | En tant que voyageur, je veux des données toujours à jour. | Should (P1) | 2 | Mise à jour planifiée ; alerte en cas d'échec. | E17 phase 2 | 2 | ⬜ |

Total : **17 points**. Reportés sans date (`A-FAIRE`) : supervision et page de statut, test de charge.

---

## 4. Éléments techniques (socle)

| ID | Élément | Tâches | Sprint | Remarque | État |
|---|---|---|---|---|---|
| T1 | Initialisation du dépôt, des outils et des conventions | E00 | S1 | terminé le 09/10 | ✅ |
| T2 | Base de données locale (PostgreSQL + PostGIS), schéma et migrations | E01 | S1 | fusionnée le 11/10 (#44) | ✅ |
| T3 | Chaîne de données : gares, horaires, trains directs, lieux, rattachements, transports | E02 → E07 | S2 → S4 | Jalon : données en base le 01/11 | ✅ |
| T4 | API de l'application | E08 · E09 | S5 | Jalon : API complète le 08/11 | ✅ |
| T5 | Socle de l'interface et design system | E10 | S6 | — | ✅ |
| T6 | Qualité : tests, accessibilité, performance | E15 | S8 | Gel des fonctionnalités le 27/11 | ⬜ |
| T7 | Livraison pour la soutenance (Docker, données figées) | E16 | S8 | Livraison le 30/11 | ⬜ |
| T8 | Mise en ligne : phase 1 anticipée, phase 2 après le P0 | E17 | S5, puis fin | — | 🟡 |
| T9 | Publication de la réutilisation sur data.gouv.fr | E18 | Fin | — | ⬜ |

---

## 5. Correspondance tâches → fonctionnalités

Sert à relier chaque ticket GitHub à ce qu'il apporte. Chaque ticket porte une ligne « Fonctionnalités : … » reprise de ce tableau.

| Tâche | Fonctionnalités et éléments servis |
|---|---|
| E00 | T1 |
| E01 | T2 |
| E02 | F04, T3 |
| E03 | F04, F07, T3 |
| E04 | F04, T3 |
| E05 | F06, T3 |
| E06 | F06, T3 |
| E07 | F09, F16, F17, F26, T3 |
| E08 | F02, F03, F04, T4 |
| E09 | F01, F06, F07, F09, F10, F11, F18, F26, T4 |
| E10 | F20, T5 |
| E11 | F01, F02, F03, F04, F05, F08, F16, F21, F25 |
| E12 | F06, F07, F09, F10, F11, F15, F17, F18, F21, F25, F26 |
| E13 | F13, F14 |
| E14 | F12 |
| E15 | F19, T6 |
| E16 | T7 |
| E17 | T8, INF1 → INF4, INF8 → INF10 |
| E18 | T9 |

---

## 6. Planification par sprint

| Sprint | Dates | Application | Infrastructure | Résultat visible / jalon |
|---|---|---|---|---|
| S1 | 05 → 11/10 | E00 ✅ · E01 ✅ | — | Dépôt, outils, base locale |
| S2 | 12 → 18/10 | E02 · E03 | — | Gares et horaires en base |
| S3 | 19 → 25/10 | E04 · E05 | — | Trains directs, lieux |
| S4 | 26/10 → 01/11 | E06 · E07 | — | **Jalon : données complètes (01/11)** |
| S5 | 02 → 08/11 | E08 · E09 | E17 phase 1 (anticipée) | **Jalon : API complète (08/11)** |
| S6 | 09 → 15/11 | E10 · E11 | E17 phase 1, si elle n'est pas finie | Écran Explorer (F01 → F05, F08) |
| S7 | 16 → 22/11 | E12 · E13 · E14 | — | **Jalon : P0 terminé (22/11)** |
| S8 | 23 → 29/11 | E15 · E16 | E17 phase 2, si le temps le permet | Gel (27/11) |
| Fin | 30/11 → 02/12 | E17 · E18 | E17 phase 2, si le temps le permet | Livraison (30/11) ; **soutenance (03/12)** |

**Requêtes testées au plus tôt** (réponse au risque « interroger la base ») : chaque requête de référence de `03-base-de-donnees.md` § 5 est exécutée sur les vraies données dès la fin de l'étape qui les charge, avec son temps mesuré : gares proches (E02), trains A → B (E03), destinations depuis une gare (E04, < 300 ms). La forme des données des cartes de destination est décidée avant E04 (`A-FAIRE.md`).

---

## 7. Faire vivre ce document

- **Au point du lundi :** revoir les priorités et les estimations ; noter les changements ici.
- **Au « garde le contexte » qui termine une étape :** passer à ✅ les fonctionnalités dont toutes les tâches sont fusionnées.
- **Nouvelle fonctionnalité ou changement de priorité :** d'abord `00-vision.md` § 6 (référence), puis ce document.
- **Le PDF remis au tuteur** est une copie de ce document à une date donnée.

---

## Vérification de l'état (05/11/2026)

Lignes relues une à une dans le code et les tests. ✅ = le critère est dans le code ; l'essai sur téléphone reste à faire par Hardy.

| Ligne | État | Ce qui manque |
|---|---|---|
| F05 | 🟡 | Seules les catégories ont un parcours ; rien de tel pour le rayon, la durée et la ville. Le rayon ne change la carte qu'à partir du zoom `carte.zoomMinLieux` |
| F06 | 🟡 | L'image du lieu n'est affichée nulle part (photos reportées, `A-FAIRE` § 1) |
| F08 | 🟡 | Éléments présents ; lisibilité avec 101 destinations non validée (`A-FAIRE` § 1) |
| F09 | 🟡 | Parcours présents ; comparaison au plan du réseau Divia à faire par Hardy (`A-FAIRE` § 2) |
| F12 | 🟡 | iPhone validé en production le 07/11 ; un vrai Android à trouver |
| F14 | 🟡 | Page en ligne ; 97 Mt, 69 %, 3 étapes, « pour qui », « ce que ça change » restent à écrire ou confirmer (E13) |
| F20 | 🟡 | Couleurs sombres présentes ; bascule seulement sur la planche `/design`, pas dans l'application |
| F15, F25 | ✅ | Dans le code et, pour F25, dans les tests unitaires ; aucun parcours dédié |
| INF1, INF2, INF8, INF9 | ✅ | Phase 1 d'E17 terminée le 07/11 ; pare-feu de l'hébergeur en plus, en phase 2 |

---

## 8. Reste à faire et estimation (relevé du 07/11/2026)

**Estimations de Claude Code, pas des mesures,** pour Hardy accompagné de Claude Code. À revoir chaque lundi. 1 jour = 2 points. Hors P1, qui passent après le P0 (D051). Dates de Hardy (D078) : P0 au plus tard le 22/11, gel des nouvelles fonctionnalités au plus tard le 27/11, puis corrections, design et déploiements jusqu'à la soutenance ; l'avance va aux P1. **Ordre (D079, D080) : les étapes ci-dessous d'abord ; les retouches de design du 23 au 25/11, avant E15.**

| Étape | Pour quand | Fait | Reste | Estimation |
|---|---|---|---|---|
| E11, E12 | P0, 22/11 | Écrans, API, parcours | **Fonctionnel d'abord, une PR par point, dans cet ordre (D080) :** (1) recherche de ville, communes seules ✅ D081 ; (2) nom « TER Mobigo » ; (3) test « prix non calibré » ; (4) guidage si la position est refusée ; (5) recherche de destination ✅ D084 (barre du trajet) et D085 (page « Trajet » sur téléphone, #94), puis page « Trajet » sur Lieux ✅ (#100) et en-tête allégé, date dans « Filtres » (D086, remplace l'en-tête repliable) ; (6) parcours des filtres rayon, durée, ville (F05). Puis chronomètre et essais sur téléphone, plan Divia (F09) | 3 j |
| Intégration continue | P0, 22/11 | Rien | GitHub Actions sur chaque PR : `pnpm verifier`, intégration (PostgreSQL + PostGIS), parcours Playwright si possible ; fusion bloquée si un test échoue ; règle ESLint des couches (D080) | 1 j |
| Design | 23 → 25/11 | Maquettes v3 | Retouches de Hardy, après le P0 et avant E15, pour que l'accessibilité, la performance et les captures du pitch portent sur l'interface finale (D080) | 3 j |
| E13 | P0, 22/11 | Sources, À propos, Mentions, en ligne | 3 étapes avec captures, « pour qui », « ce que ça change » : textes de Hardy | 1 j |
| E14 | P0, 22/11 | Installation, hors ligne, iPhone en production | Un vrai Android (30 min, personne à trouver). Invitation à installer : facultative, 0,5 j | 0,5 j |
| E15 | S8, après le P0 | 482 tests unitaires, 167 d'intégration, 133 de parcours (06/11) ; aucun `TODO` | Pas d'outil de couverture, ni axe, ni Lighthouse dans le dépôt (nouvelle dépendance : `DECISIONS`) ; accessibilité, performance, 2 ou 3 testeurs extérieurs | 3 j |
| E16 | S8, après le P0 | Image web, compose de production, scripts d'export et de restauration | Profil `demo` sans `migrer` ni restauration ; export figé et date de démo ; `README.md` ; scénario de démo ; essai sur un autre ordinateur et réseau coupé ; répétition | 3 j |
| E18 | Fin | Rien | Marque, `README.md` public, captures, publication | 1 j |

**Avant le P0 : environ 4,5 jours de travail, pour 15 jours de calendrier. Jusqu'au 30/11 : environ 11,5 jours, pour 23 jours de calendrier.** Hors P1 et hors phase 2 d'E17.

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 09/10/2026 | 1.0 | Création à partir de `00-vision.md` § 6, des étapes E00 → E18 et des tâches I01 → I22 ; requêtes testées au plus tôt |
| 11/10/2026 | 1.1 | Intégré au dépôt (D032) ; T2 en cours (E01 réalisée, PR à fusionner) |
| 19/10/2026 | 1.2 | T2 terminé (E01 fusionnée) |
| 05/11/2026 | 1.3 | États relus dans le code et les tests : F01, F02, F03, F04, F07, F10, F11, F15, F25, T3 terminés ; F05, F06, F08, F09, F20 en cours |
| 07/11/2026 | 1.4 | INF1, INF2, INF8, INF9 et F13 terminés ; F14 en cours ; § 8 : reste à faire et estimations — D077 |
| 10/11/2026 | 1.5 | § 8 : ordre des 6 points d'E11–E12, intégration continue, design du 23 au 25/11 — D080, D081 |
