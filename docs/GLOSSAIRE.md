# Glossaire

> **Version** 1.3 · **Date** 09/10/2026
> **Dépend de :** —
> **Utilisé par :** tous les documents et tout le code
> **Rôle :** un terme = un sens = un nom dans le code. Avant de nommer une variable, une table ou un composant, vérifier ici. Un terme absent ? L'ajouter ici **avant** de l'utiliser.

---

## Règles de nommage rappelées

- Code TypeScript : `camelCase` (variables, fonctions), `PascalCase` (types, composants).
- SQL : `snake_case`.
- Pas d'accents dans les identifiants. Accents dans les textes affichés.
- Un terme anglais n'est utilisé que s'il est imposé par un outil (`page.tsx`, `route.ts`, `useQuery`).

---

## Termes métier

| Terme (interface) | Définition | TypeScript | SQL | À ne pas confondre avec |
|---|---|---|---|---|
| **Gare** | Gare de voyageurs SNCF, identifiée par son code UIC | `Gare`, `gareId` | table `gare`, `gare_id` | Arrêt de bus (→ mobilité locale) |
| **Code UIC** | Identifiant international d'une gare, 8 chiffres (ex. `87713040`) | `uic` | `uic` | Code INSEE (commune) |
| **Gare de départ** | Gare d'où part l'utilisateur (la plus proche ou choisie) | `gareDepart` | `gare_depart_id` | — |
| **Gare d'arrivée** | Gare de la destination | `gareArrivee` | `gare_arrivee_id` | — |
| **Destination** | Une gare d'arrivée atteignable en train direct, avec ses lieux | `Destination` | *(vue calculée, pas de table)* | Lieu |
| **Lieu** | Point d'intérêt : musée, château, parc, aire de jeux, festival… | `Lieu`, `lieuId` | table `lieu`, `lieu_id` | « POI » (terme interdit dans le code) |
| **Catégorie** | Famille de lieux : `enfants`, `nature`, `parcs`, `patrimoine`, `culture` | `Categorie` | `categorie` | Sous-catégorie |
| **Sous-catégorie** | Précision libre dans une catégorie (ex. « aire de jeux », « château ») | `sousCategorie` | `sous_categorie` | — |
| **Règle de catégorie** | Correspondance « valeur d'une source → catégorie » | `RegleCategorie` | table `categorie_regle` | — |
| **Autour de moi** | Lieux et gares à distance de marche de la position de l'utilisateur | `autour` | — | Destination |
| **Rayon** | Distance maximale de recherche, en mètres | `rayonM` | `rayon_m` | — |
| **Distance à pied** | Distance estimée de marche : distance à vol d'oiseau × coefficient de détour | `distanceMarcheM` | `distance_m` | Distance à vol d'oiseau |
| **Durée à pied** | Distance à pied ÷ vitesse de marche | `dureeMarcheMin` | `duree_marche_min` | — |
| **Liaison directe** | Deux gares reliées par au moins un train sans correspondance à une date donnée | `LiaisonDirecte` | table `liaison_directe` | Itinéraire (hors périmètre) |
| **Trajet** | Un train précis (un « trip » GTFS) | `Trajet`, `trajetId` | table `trajet`, `trajet_id` | Liaison directe |
| **Passage** | L'arrêt d'un trajet dans une gare, avec ses heures | `Passage` | table `passage` | — |
| **Type de train** | `TER`, `INTERCITES`, `TGV`, `AUTRE` | `TypeTrain` | `type_train` | — |
| **Date de service** | Jour d'exploitation d'un train, au format `AAAA-MM-JJ`, en heure de Paris | `dateService` | `date_service` | Date UTC |
| **Date du jour** | La date d'aujourd'hui **à Paris**, calculée une fois puis passée en paramètre | `dateDuJour` | `date_du_jour` | `new Date()` |
| **Heure actuelle** | L'heure qu'il est **à Paris**, en secondes depuis minuit, avec la date du jour ; obtenue une fois par `maintenantParis()`, puis passée en paramètre | `maintenantParis()`, `heureActuelleS` | `heure_actuelle_s` | `new Date()` |
| **Heure en secondes** | Heure GTFS en secondes depuis minuit ; peut dépasser 86 400 (train après minuit) | `departS`, `arriveeS` | `depart_s`, `arrivee_s` | Horodatage |
| **Aller / Retour** | Trains gare de départ → gare d'arrivée, et l'inverse, à la même date | `aller`, `retour` | — | — |
| **Dernier retour** | Dernier train direct du retour ce jour-là | `dernierRetour` | — | — |
| **Faisable dans la journée** | Aller arrivant avant l'heure limite ET retour possible après la durée de visite | `faisableJournee` | — | — |
| **Durée de trajet** | Durée minimale d'un train direct entre deux gares, en minutes | `dureeTrajetMin` | `duree_min` | — |
| **Fréquence** | Nombre de trains directs dans la journée | `nbTrains` | `nb_trains` | — |
| **Mobilité locale** | Moyen de transport à l'arrivée : arrêt de bus, arrêt de tram, station de vélos ou de trottinettes | `MobiliteLocale` | table `mobilite_locale` | Train |
| **Type de mobilité** | `BUS`, `TRAM`, `VELO`, `TROTTINETTE`, `AUTRE` | `TypeMobilite` | `type` | — |
| **Vélos disponibles** | Nombre de vélos libres en direct dans une station (GBFS), jamais stocké | `velosDisponibles` | — | Station (emplacement, stocké) |
| **Début du week-end** | Samedi à venir, ou aujourd'hui si on est samedi ou dimanche | `debutDuWeekEnd` | — | — |
| **Partage** | Copie ou envoi du lien de la page (filtres et destination inclus dans l'URL) | `partager` | — | Favori |
| **Ligne ferroviaire** | Tracé géographique d'une ligne de train (affichage carte) | `LigneFerroviaire` | table `ligne_ferroviaire` | Trajet |
| **Aménagement cyclable** | Piste ou voie verte (affichage carte, P1) | `AmenagementCyclable` | table `amenagement_cyclable` | — |
| **Impact** | Regroupe le CO₂ et le prix estimé d'un trajet | `Impact` | — | — |
| **CO₂ économisé** | Émissions voiture − émissions train pour le même trajet | `co2EconomiseKg` | — | — |
| **Prix estimé** | Fourchette de prix calculée au kilomètre, jamais un prix réel | `prixEstime` | — | Prix |
| **Tranche de temps** | Classe de durée pour colorer la carte : `<30`, `<60`, `<120`, `≥120` min | `trancheTemps` | — | — |
| **Source de données** | Un jeu de données ouvert utilisé (gares, GTFS, DATAtourisme…) | `SourceDonnees` | table `source_donnees` | — |
| **Exécution ETL** | Un lancement du traitement pour une source, avec son résultat | `ExecutionEtl` | table `execution_etl` | — |
| **Qualité Tourisme** | Label d'État attribué à certains lieux | `qualiteTourisme` | `qualite_tourisme` | — |
| **Région pilote** | Région couverte par les données de la v1 : Bourgogne-Franche-Comté (27) | `region` | `region` | — |
| **Marque** | Nom commercial affiché (provisoire : Wagoo), défini dans `config/marque.ts` | `marque` | — | Nom de code `tourisme-en-train` |
| **Paramètres** | Seuils métier partagés, définis dans `config/parametres.json` | `parametres` | `parametres` | Variables d'environnement |

---

## Termes techniques

| Terme | Sens dans ce projet |
|---|---|
| **ETL** | Le traitement des données (`etl/`, TypeScript + SQL) : télécharger (Extract), transformer (Transform), charger (Load) |
| **Code commun** | Paquet `packages/commun` (`@tourisme/commun`), importé par l'app et par le traitement : schéma de `parametres.json`, `dateDuJour()`, types partagés |
| **Espace de travail (pnpm)** | Un seul dépôt contenant plusieurs paquets (`apps/web`, `etl`, `packages/commun`) installés ensemble |
| **GTFS** | Format standard des horaires de transport (fichiers CSV dans un ZIP) |
| **GBFS** | Format standard des vélos et trottinettes en libre-service |
| **PostGIS** | Extension de PostgreSQL pour les données géographiques |
| **Service** | Fonction de `features/*/server/` qui orchestre une réponse métier |
| **Requête** | Fonction qui interroge la base (`features/*/server/requetes.ts` ou `lib/db/`) |
| **Adaptateur** | Module de `lib/external/` qui parle à une API extérieure |
| **Contrat infra** | Accord entre l'app et l'infrastructure (`07-contrat-infra.md`) |
| **Tables temporaires de chargement** | Tables temporaires remplies par l'ETL, contrôlées, puis copiées dans les tables finales en une transaction |

---

## Termes interdits dans le code

| Interdit | Utiliser |
|---|---|
| `poi`, `POI`, `pointOfInterest` | `lieu` |
| `station` (pour une gare) | `gare` |
| `trip`, `stopTime` (hors lecture brute du GTFS) | `trajet`, `passage` |
| `today`, `now` pour la date métier | `dateDuJour` |
| `price` | `prixEstime` |
| `user` en v1 | — (pas de compte) |

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 30/09/2026 | 1.0 | Création |
| 30/09/2026 | 1.1 | Vélos disponibles, début du week-end, partage |
| 05/10/2026 | 1.2 | ETL en TypeScript + SQL (plus de Python) — D024 |
| 09/10/2026 | 1.3 | Heure actuelle (`maintenantParis`) — D031 |
