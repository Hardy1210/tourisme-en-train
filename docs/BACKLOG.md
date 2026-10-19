# Backlog produit

> **Version** 1.2 · **Date** 19/10/2026
> **Dépend de :** `00-vision.md` § 6 (liste et priorités des fonctionnalités, qui fait foi) · `CLAUDE.md` § 8 (étapes et semaines) · `equipe/guide-SR.md` § 4 (tâches I01 → I22)
> **Utilisé par :** point d'équipe du lundi · tableau GitHub Projects · présentation au tuteur et soutenance
> **Document de référence pour :** les *user stories*, l'estimation, les critères d'acceptation par fonctionnalité, le lien fonctionnalités ↔ tâches, la planification par sprint.

---

## 1. Organisation

Le backlog décrit **ce que le produit doit faire, du point de vue de l'utilisateur**, classé par priorité. Chaque fonctionnalité est reliée aux **tâches** qui la réalisent : étapes de développement **E00 → E18** (Hardy) et tâches d'infrastructure **I01 → I22** (SR). Ces 41 tâches sont des tickets GitHub suivis sur le tableau `tourisme-en-train`.

| Niveau | Contenu |
|---|---|
| 1. Fonctionnalités | 27 fonctionnalités produit (F01 → F27, § 2) et 10 fonctionnalités d'infrastructure (INF0 → INF9, § 3) |
| 2. Éléments techniques | Le socle sans lequel aucune fonctionnalité n'existe (T1 → T9, § 4) |
| 3. Tâches | Les tickets GitHub E00 → E18 et I01 → I22 ; une tâche = une branche = une pull request |

| Élément | Choix |
|---|---|
| Méthode | Scrum allégé : sprints d'une semaine (S1 = 05/10 … S8 = 29/11, puis « Fin » jusqu'au 02/12) ; point d'équipe chaque lundi (30 min : fait · prévu · bloqué), qui sert de revue et de planification |
| Rôles | Product Owner et développeur : Hardy · Infrastructure : SR1 (ethan21000), SR2 à confirmer (sinon ses tâches reviennent à SR1) · Parties prenantes : tuteur, jury du défi |
| Priorité | MoSCoW : **Must** = P0 (indispensable pour la soutenance) · **Should** = P1 · **Could** = P2 (après la v1) |
| Estimation | Points relatifs 1, 2, 3, 5, 8 ; 1 point ≈ une demi-journée. Estimation initiale, revue chaque lundi |
| Définition de « terminé » | `08-conventions-qualite.md` § 10 |
| État | ⬜ à faire · 🟡 en cours · ✅ terminé — mis à jour quand la dernière tâche liée est fusionnée |

---

## 2. Fonctionnalités utilisateur

| ID | User story | Priorité | Pts | Critère d'acceptation | Tâches | Livrée en | État |
|---|---|---|---|---|---|---|---|
| F01 | En tant que voyageur, je veux être localisé dès l'ouverture (ou saisir une ville si je refuse) afin d'avoir des résultats sans rien taper. | Must (P0) | 3 | Position demandée à l'ouverture ; refus → recherche de ville ; position jamais enregistrée. | E09 · E11 | S6 | ⬜ |
| F02 | En tant que voyageur, je veux voir tout de suite les lieux à pied et les gares proches afin de savoir ce qu'il y a autour de moi. | Must (P0) | 3 | Lieux dans le rayon défini par les paramètres ; gares proches avec distance. | E08 · E11 | S6 | ⬜ |
| F03 | En tant que voyageur, je veux connaître mes gares de départ les plus proches et pouvoir en changer. | Must (P0) | 2 | Gares triées par distance ; changement de gare possible. | E08 · E11 | S6 | ⬜ |
| F04 | En tant que voyageur, je veux voir les destinations atteignables en train direct à la date choisie afin de choisir une sortie. | Must (P0) | 8 | Aucune correspondance ; durée, trains par jour, premier départ, dernier retour. | E02 · E03 · E04 · E08 · E11 | S6 | ⬜ |
| F05 | En tant que voyageur, je veux filtrer (rayon, durée de train, ville, catégories, date) afin d'affiner mes idées. | Must (P0) | 3 | Chaque filtre modifie la liste et la carte ; filtres conservés dans l'adresse de la page. | E11 | S6 | ⬜ |
| F06 | En tant que voyageur, je veux une fiche destination avec les lieux à pied depuis la gare afin de préparer ma visite. | Must (P0) | 5 | Lieux à pied depuis la gare, description, image et horaires si disponibles, lien officiel. | E05 · E06 · E09 · E12 | S7 | ⬜ |
| F07 | En tant que voyageur, je veux les trains aller et retour de la journée afin de savoir quand partir et rentrer. | Must (P0) | 3 | Horaires théoriques de la date ; dernier retour mis en évidence. | E03 · E09 · E12 | S7 | ⬜ |
| F08 | En tant que voyageur, je veux une carte avec les gares colorées selon le temps de trajet afin de visualiser les distances. | Must (P0) | 5 | Position, gares, lieux par catégorie ; couleurs par tranche de temps ; bascule liste / carte. | E11 | S6 | ⬜ |
| F09 | En tant que voyageur, je veux connaître les transports sur place (bus, tram, vélos) afin de me déplacer à l'arrivée. | Must (P0) | 5 | Arrêts et stations proches de la gare d'arrivée. | E07 · E09 · E12 | S7 | ⬜ |
| F10 | En tant que voyageur, je veux voir le CO₂ économisé par rapport à la voiture afin de mesurer l'intérêt du train. | Must (P0) | 2 | Train / voiture seule / voiture partagée ; source ADEME affichée. | E09 · E12 | S7 | ⬜ |
| F11 | En tant que voyageur, je veux un prix estimé afin d'avoir un ordre d'idée du budget. | Must (P0) | 2 | Toujours libellé « estimation » ; lien vers la billetterie ; masqué s'il n'est pas calibré. | E09 · E12 | S7 | ⬜ |
| F12 | En tant que voyageur, je veux installer l'application sur mon téléphone et revoir mes dernières recherches hors ligne. | Must (P0) | 3 | Installable ; dernières recherches consultables sans connexion. | E14 | S7 | ⬜ |
| F13 | En tant que jury ou réutilisateur, je veux voir les sources et licences des données utilisées. | Must (P0) | 1 | Chaque source citée avec sa licence et son attribution. | E13 | S7 | ⬜ |
| F14 | En tant que jury, je veux une page qui présente le sens du projet. | Must (P0) | 2 | Page narrative accessible depuis le menu. | E13 | S7 | ⬜ |
| F15 | En tant que voyageur, je veux savoir si l'aller-retour est faisable dans la journée. | Should (P1) | 3 | Badge « Faisable dans la journée » ou mention « Retour tôt, plutôt sur 2 jours ». | E12 | S7 | ⬜ |
| F16 | En tant que voyageur, je veux voir les lignes ferroviaires sur la carte. | Should (P1) | 2 | Tracés affichés sans ralentir la carte. | E07 · E11 | S6 | ⬜ |
| F17 | En tant que cycliste, je veux voir les voies vertes et pistes près de la gare d'arrivée. | Should (P1) | 2 | Aménagements affichés autour de la gare. | E07 · E12 | S7 | ⬜ |
| F18 | En tant que voyageur, je veux connaître les retards des prochains trains d'aujourd'hui. | Should (P1) | 3 | Statut pour les trains des 3 prochaines heures uniquement ; sinon horaires théoriques. | E09 · E12 | S7 | ⬜ |
| F19 | En tant que personne en situation de handicap, je veux une application accessible. | Should (P1) | 3 | WCAG 2.1 AA : contrastes, clavier, liste équivalente à la carte. | E15 | S8 | ⬜ |
| F20 | En tant que voyageur, je veux un mode sombre. | Should (P1) | 1 | Bascule clair / sombre via le design system. | E10 | S6 | ⬜ |
| F21 | En tant que voyageur, je veux partager une sortie. | Should (P1) | 1 | Copie du lien (filtres inclus) ou partage natif du téléphone. | E11 · E12 | S7 | ⬜ |
| F25 | En tant que voyageur, je veux trouver une sortie pour ce week-end en un clic. | Should (P1) | 1 | L'option « Ce week-end » ouvre le samedi ; passage au dimanche possible. | E11 · E12 | S7 | ⬜ |
| F26 | En tant que cycliste, je veux voir les vélos disponibles en direct près de la gare. | Should (P1) | 2 | Nombre de vélos par station (villes publiant un flux GBFS). | E07 · E09 · E12 | S7 | ⬜ |
| F27 | En tant que voyageur, je veux garder mes destinations favorites. | Could (P2) | 2 | Favoris enregistrés dans le navigateur. | — | après v1 | ⬜ |
| F22 | En tant que voyageur, je veux découvrir des pépites peu fréquentées. | Could (P2) | 3 | Badge calculé à partir des données Insee. | — | après v1 | ⬜ |
| F23 | En tant que jeune ou senior, je veux savoir s'il reste des places MAX JEUNE / SENIOR. | Could (P2) | 3 | Badge de disponibilité. | — | après v1 | ⬜ |
| F24 | En tant que voyageur, je veux retrouver mes favoris sur tous mes appareils. | Could (P2) | 5 | Connexion Google, favoris synchronisés. | — | après v1 | ⬜ |

Total : **78 points** (Must 47 · Should 18 · Could 13). Responsable : Hardy. « Livrée en » = sprint de la dernière tâche liée.

---

## 3. Fonctionnalités d'infrastructure (SR)

| ID | User story | Priorité | Pts | Critère d'acceptation | Tâches | Resp. | Sprint | État |
|---|---|---|---|---|---|---|---|---|
| INF0 | En tant que membre de l'équipe, je veux lancer le projet sur mon ordinateur en une commande. | Must (P0) | 1 | docker compose up fonctionne ; retours signalés au développeur. | I01 | SR1 + SR2 | S2 | ⬜ |
| INF1 | En tant que voyageur, je veux accéder au site en ligne, en HTTPS, sur un nom de domaine. | Must (P0) | 8 | Serveur sécurisé, domaine, HTTPS automatique, redirection HTTP → HTTPS, proxy unique. | I02 · I03 · I04 · I05 · I06 | SR1 + SR2 | S3 | ⬜ |
| INF2 | En tant que responsable du service, je veux un serveur et une base protégés. | Must (P0) | 8 | Seuls les ports 22, 80, 443 ouverts ; base non exposée ; secrets hors dépôt ; en-têtes de sécurité ; limitation d'appels. | I08 · I09 · I10 · I11 · I12 | SR1 + SR2 | S6 | ⬜ |
| INF3 | En tant que responsable du service, je veux ne jamais perdre les données. | Must (P0) | 5 | Sauvegarde quotidienne copiée hors serveur ; restauration réelle chronométrée. | I13 · I14 | SR1 | S5 | ⬜ |
| INF4 | En tant que voyageur, je veux des données toujours à jour. | Should (P1) | 2 | Mise à jour hebdomadaire planifiée ; alerte en cas d'échec. | I15 | SR1 | S7 | ⬜ |
| INF5 | En tant que développeur, je veux que chaque fusion soit mise en ligne automatiquement. | Should (P1) | 3 | Déploiement sans intervention à chaque fusion sur main. | I16 | SR2 | S5 | ⬜ |
| INF6 | En tant que responsable du service, je veux être alerté en cas de panne. | Should (P1) | 3 | Supervision du site, de /api/sante, du certificat et du disque ; page de statut (P2). | I17 · I18 | SR1 | S6 | ⬜ |
| INF7 | En tant que voyageur, je veux un site rapide même avec du monde. | Could (P2) | 3 | Cache des fichiers statiques et des tuiles ; test de charge à 50 utilisateurs. | I07 · I19 | SR2 | Fin | ⬜ |
| INF8 | En tant que voyageur, je veux que ma vie privée soit respectée côté serveur. | Should (P1) | 2 | Journaux sans IP complète, aucune position stockée, conservation limitée. | I20 | SR2 | S7 | ⬜ |
| INF9 | En tant que futur exploitant, je veux une infrastructure documentée et transmissible. | Must (P0) | 3 | Schéma réseau ; dossier d'exploitation (déployer, restaurer, changer un secret, réagir à un incident). | I21 · I22 | SR1 + SR2 | S7 | ⬜ |

Total : **38 points**. Les SR travaillent uniquement dans `infra/` ; le lien avec l'application est fixé par `07-contrat-infra.md`.

---

## 4. Éléments techniques (socle)

| ID | Élément | Tâches | Sprint | Remarque | État |
|---|---|---|---|---|---|
| T1 | Initialisation du dépôt, des outils et des conventions | E00 | S1 | terminé le 09/10 | ✅ |
| T2 | Base de données locale (PostgreSQL + PostGIS), schéma et migrations | E01 | S1 | fusionnée le 11/10 (#44) | ✅ |
| T3 | Chaîne de données : gares, horaires, trains directs, lieux, rattachements, transports | E02 → E07 | S2 → S4 | Jalon : données en base le 01/11 | ⬜ |
| T4 | API de l'application | E08 · E09 | S5 | Jalon : API complète le 08/11 | ⬜ |
| T5 | Socle de l'interface et design system | E10 | S6 | — | ⬜ |
| T6 | Qualité : tests, accessibilité, performance | E15 | S8 | Gel des fonctionnalités le 27/11 | ⬜ |
| T7 | Livraison pour la soutenance (Docker, données figées) | E16 | S8 | Livraison le 30/11 | ⬜ |
| T8 | Mise en ligne v1 avec les SR (optionnelle) | E17 | Fin | Décision le 25/11 | ⬜ |
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
| E17 | T8 |
| E18 | T9 |
| I01 | INF0 |
| I02 | INF1 |
| I03 | INF1 |
| I04 | INF1 |
| I05 | INF1 |
| I06 | INF1 |
| I07 | INF7 |
| I08 | INF2 |
| I09 | INF2 |
| I10 | INF2 |
| I11 | INF2 |
| I12 | INF2 |
| I13 | INF3 |
| I14 | INF3 |
| I15 | INF4 |
| I16 | INF5 |
| I17 | INF6 |
| I18 | INF6 |
| I19 | INF7 |
| I20 | INF8 |
| I21 | INF9 |
| I22 | INF9 |

---

## 6. Planification par sprint

| Sprint | Dates | Hardy | SR | Résultat visible / jalon |
|---|---|---|---|---|
| S1 | 05 → 11/10 | E00 ✅ · E01 ✅ | I02 · I03 · I04 | Dépôt, outils, base locale |
| S2 | 12 → 18/10 | E02 · E03 | I01 · I08 · I09 | Gares et horaires en base |
| S3 | 19 → 25/10 | E04 · E05 | I05 · I06 · I10 | Trains directs, lieux ; site en HTTPS (INF1) |
| S4 | 26/10 → 01/11 | E06 · E07 | I13 · I21 | **Jalon : données complètes (01/11)** |
| S5 | 02 → 08/11 | E08 · E09 | I14 · I16 | **Jalon : API complète (08/11)** ; restauration testée |
| S6 | 09 → 15/11 | E10 · E11 | I11 · I12 · I17 | Écran Explorer (F01 → F05, F08) |
| S7 | 16 → 22/11 | E12 · E13 · E14 | I15 · I20 · I22 | **Jalon : P0 terminé (22/11)** |
| S8 | 23 → 29/11 | E15 · E16 | Intégration, démonstration de restauration | Décision de mise en ligne (25/11) ; gel (27/11) |
| Fin | 30/11 → 02/12 | E17 · E18 | I07 · I18 · I19 | Livraison (30/11) ; **soutenance (03/12)** |

**Requêtes testées au plus tôt** (réponse au risque « interroger la base ») : chaque requête de référence de `03-base-de-donnees.md` § 5 est exécutée sur les vraies données dès la fin de l'étape qui les charge, avec son temps mesuré : gares proches (E02), trains A → B (E03), destinations depuis une gare (E04, < 300 ms). La forme des données des cartes de destination est décidée avant E04 (`A-FAIRE.md`).

---

## 7. Faire vivre ce document

- **Au point du lundi :** revoir les priorités et les estimations ; noter les changements ici.
- **Au « garde le contexte » qui termine une étape :** passer à ✅ les fonctionnalités dont toutes les tâches sont fusionnées.
- **Nouvelle fonctionnalité ou changement de priorité :** d'abord `00-vision.md` § 6 (référence), puis ce document.
- **Le PDF remis au tuteur** est une copie de ce document à une date donnée.

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 09/10/2026 | 1.0 | Création à partir de `00-vision.md` § 6, des étapes E00 → E18 et des tâches I01 → I22 ; requêtes testées au plus tôt |
| 11/10/2026 | 1.1 | Intégré au dépôt (D032) ; T2 en cours (E01 réalisée, PR à fusionner) |
| 19/10/2026 | 1.2 | T2 terminé (E01 fusionnée) |
