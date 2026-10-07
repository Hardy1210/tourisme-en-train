# 02 — Sources de données

> **Version** 1.3 · **Date** 05/10/2026
> **Dépend de :** `00-vision.md`
> **Utilisé par :** `03-base-de-donnees.md`, `04-traitement-donnees.md`, écran Sources (`06-interface.md`), fiches E02 → E07, E09
> **Document de référence pour :** quelles sources, où les trouver, quels champs, quelle licence, quel usage.

⚠️ **Les noms de colonnes indiqués sont ceux attendus d'après la documentation publique. Ils doivent être vérifiés sur le fichier réel lors de l'étape concernée** (phase d'audit). Tout écart est corrigé ici en premier.

---

## 1. Vue d'ensemble

| Code source | Nom | Producteur | Nature | Mode | Prio | Étape |
|---|---|---|---|---|---|---|
| `gares` | Gares de voyageurs | SNCF | Fichier CSV / GeoJSON | Base | P0 | E02 |
| `gtfs_sncf` | Horaires SNCF (TER, Intercités, TGV) | SNCF | GTFS (ZIP de CSV) | Base | P0 | E03 |
| `datatourisme` | DATAtourisme — POI par région | ADN Tourisme | CSV par région | Base | P0 | E05 |
| `osm` | OpenStreetMap (aires de jeux, parcs, points de vue…) | Contributeurs OSM | Extraction GéoDataMine ou Overpass | Base | P0 | E05 |
| `transport_local` | Offres de mobilité (bus, tram, vélos) | Autorités organisatrices via transport.data.gouv.fr | GTFS + GBFS | Base | P0 | E07 |
| `lieux_culturels` | Base des lieux et équipements culturels | Ministère de la Culture | CSV | Base | P1 | E05 |
| `festivals` | Liste des festivals en France | Ministère de la Culture | CSV | Base | P1 | E05 |
| `qualite_tourisme` | Établissements labellisés Qualité Tourisme | Ministères économiques et financiers | CSV | Base | P1 | E06 |
| `lignes` | Lignes par région administrative | SNCF | CSV / GeoJSON | Base | P1 | E07 |
| `cyclable` | Aménagements cyclables France métropolitaine | Geovelo | GeoJSON | Base | P1 | E07 |
| `api_adresse` | API Adresse / Géoplateforme | IGN | API | Direct | P0 | E09 |
| `api_sncf` | API SNCF (Navitia) | SNCF | API (clé gratuite) | Direct | P1 | E09 |
| `gbfs_direct` | Disponibilité des vélos (GBFS `station_status`) | Opérateurs de vélos | API JSON | Direct | P1 | E09 |
| `fond_carte` | OpenFreeMap | OpenFreeMap / OSM | Tuiles vectorielles | Direct | P0 | E11 |
| `facteurs_co2` | Facteurs d'émission Impact CO2 | ADEME | Valeurs publiées, recopiées dans `parametres.json` | Local | P0 | E09 |

**Base** = téléchargé, traité et stocké par l'ETL. **Direct** = appelé par le serveur au moment de la demande, jamais stocké. **Local** = valeurs recopiées une fois, avec leur source et leur date.

**Les adresses exactes (téléchargement, flux) et les licences de toutes ces sources sont enregistrées dans `config/sources.json`** (`04` § 2 bis), jamais dans le code. Ce document décrit le contenu ; `sources.json` porte les adresses.

---

## 2. Sources stockées en base

### 2.1 `gares` — Gares de voyageurs (P0)
- **Où :** data.gouv.fr, « Gares de voyageurs » (SNCF) · miroir data.sncf.com.
- **Format :** CSV (séparateur `;`) ou GeoJSON.
- **Champs attendus :** `nom`, `libellecourt`, `segment_drg`, `position_geographique` (lat, lon), `codeinsee`, `codes_uic`.
- **Utilisés :** nom, position, code INSEE de la commune, code UIC (8 chiffres).
- **Filtre région :** code INSEE de la commune → département → région (table de passage départements ↔ région dans `parametres.json` ou dérivée du code INSEE).
- **Pièges :** `codes_uic` peut contenir plusieurs codes (séparés par `;`) ; position parfois vide.
- **Licence :** Licence Ouverte / ODbL selon la fiche — **à confirmer à l'E02**.
- **Table cible :** `gare`.

### 2.2 `gtfs_sncf` — Horaires SNCF (P0)
- **Où :** data.gouv.fr « Horaires SNCF » / transport.data.gouv.fr (SNCF Voyageurs). Horaires théoriques TER, Intercités, TGV pour environ 150 jours.
- **Format :** ZIP GTFS : `agency.txt`, `routes.txt`, `trips.txt`, `stop_times.txt`, `stops.txt`, `calendar.txt`, `calendar_dates.txt`.
- **Champs utilisés :**
  - `stops.txt` : `stop_id`, `stop_name`, `stop_lat`, `stop_lon`, `parent_station`
  - `routes.txt` : `route_id`, `route_short_name`, `route_long_name`, `route_type`, `agency_id`
  - `trips.txt` : `trip_id`, `route_id`, `service_id`
  - `stop_times.txt` : `trip_id`, `stop_sequence`, `stop_id`, `arrival_time`, `departure_time`
  - `calendar.txt` / `calendar_dates.txt` : jours de circulation
- **Rapprochement avec `gare` :** le `stop_id` contient le code UIC (forme attendue `StopArea:OCE87713040` ou `StopPoint:OCE…-87713040`). On extrait **les 8 chiffres UIC**. Contrôle : distance gare GTFS ↔ gare du référentiel < 300 m.
- **Type de train :** déduit de `agency`, `route` ou du préfixe du `stop_id` (`OCETrain TER`, `OCETGV INOUI`, `OCEINTERCITES`…) — **règle exacte à établir à l'E03** et documentée dans `04`.
- **Pièges :** heures > 24:00:00 ; un trajet peut sortir de la région (on garde **tous les arrêts** d'un trajet qui touche la région, pour connaître les destinations hors région).
- **Licence :** ODbL — **à confirmer à l'E03**.
- **Tables cibles :** `trajet`, `passage`, `service_jour`, puis calcul de `liaison_directe`.

### 2.3 `datatourisme` — Points d'intérêt (P0)
- **Où :** data.gouv.fr « DATAtourisme : la plateforme nationale des données touristiques » — fichiers **CSV par région** (ou par grande catégorie). Exploration possible sur le site DATAtourisme.
- **Format :** CSV.
- **Champs attendus :** `Nom_du_POI`, `Categories_de_POI` (valeurs séparées par `|`), `Latitude`, `Longitude`, `Adresse_postale`, `Code_postal_et_commune`, `Description`, `Contacts_du_POI`, `Classements_du_POI`, `URI_ID_du_POI`, `Date_de_mise_a_jour`, `Createur_de_la_donnee`.
- **Catégories :** la colonne `Categories_de_POI` contient des URI ou libellés de l'ontologie DATAtourisme, séparés par `|`. Leur liste en français est fournie par DATAtourisme. On les **sépare**, puis on les classe avec `categorie_regle` (voir `04`).
- **À exclure :** hébergements, restaurants, commerces, services (hors périmètre « sortie ») — liste exacte dans `categorie_regle`.
- **Licence :** Licence Ouverte 2.0.
- **Table cible :** `lieu` (source `datatourisme`).

### 2.4 `osm` — OpenStreetMap (P0)
- **Où :** **GéoDataMine** (extractions thématiques prêtes, recommandé par le défi) ; à défaut **Overpass API** (requête par région).
- **Éléments ciblés (tags) :**

| Catégorie | Tags OSM |
|---|---|
| enfants | `leisure=playground`, `tourism=zoo`, `tourism=theme_park`, `leisure=water_park` |
| parcs | `leisure=park`, `leisure=garden` |
| nature | `leisure=nature_reserve`, `tourism=viewpoint`, `natural=beach`, `natural=water` (plans d'eau nommés uniquement) |
| patrimoine | `historic=castle`, `historic=monument`, `historic=ruins`, `tourism=museum` |
| culture | `amenity=theatre`, `amenity=arts_centre` |

- **Champs utilisés :** identifiant OSM (`type/id`), `name`, tags ci-dessus, position (centroïde pour les surfaces), `website`, `opening_hours`.
- **Règle :** un élément **sans nom** n'est gardé que pour `leisure=playground` (nom généré : « Aire de jeux »).
- **Licence :** **ODbL** — attribution « © les contributeurs d'OpenStreetMap » obligatoire.
- **Table cible :** `lieu` (source `osm`).

### 2.5 `transport_local` — Mobilités locales (P0)
- **Où :** transport.data.gouv.fr — jeux GTFS des réseaux urbains de la région et flux GBFS des services de vélos / trottinettes.
- **Utilisés :**
  - GTFS : `stops.txt` (arrêts), `routes.txt` (numéros et types de lignes : `route_type` 0 = tram, 3 = bus), `trips.txt` + `stop_times.txt` pour savoir quelles lignes desservent quel arrêt.
  - GBFS : `station_information.json` (nom, position des stations).
- **Rayon :** arrêts et stations à moins de `rayonMobiliteM` d'une gare.
- **v1 :** emplacement et lignes stockés en base. **Disponibilité des vélos en direct (P1)** : lue au moment de la demande dans `station_status.json` (voir § 3.3), jamais stockée.
- **À relever à l'E07 :** pour chaque réseau vélo, l'URL `station_status.json` si elle existe.
- **Licence :** variable selon le jeu (souvent ODbL ou Licence Ouverte) — **relevée jeu par jeu à l'E07**.
- **Table cible :** `mobilite_locale`.
- **Liste des réseaux retenus :** à établir à l'E07 (au minimum Dijon, Besançon, Chalon-sur-Saône, Belfort–Montbéliard si disponibles).

### 2.6 `lieux_culturels` — Base des lieux et équipements culturels (P1)
- **Où :** data.gouv.fr (Ministère de la Culture).
- **Utilisés :** nom, type d'équipement, position, commune, site web.
- **Catégories :** musées, monuments → `patrimoine` ; salles, centres d'art → `culture`.
- **Licence :** Licence Ouverte.
- **Table cible :** `lieu` (source `lieux_culturels`).

### 2.7 `festivals` — Festivals en France (P1)
- **Où :** data.gouv.fr (Ministère de la Culture).
- **Utilisés :** nom, discipline, période (mois de début/fin), commune, position, site web.
- **Catégorie :** `culture`, avec période affichée.
- **Licence :** Licence Ouverte.
- **Table cible :** `lieu` (source `festivals`, champ `periode`).

### 2.8 `qualite_tourisme` — Label Qualité Tourisme (P1)
- **Où :** data.gouv.fr. Données de 2024.
- **Usage :** **enrichissement** : met `qualite_tourisme = true` sur les lieux correspondants (rapprochement nom + commune). Ne crée pas de lieu.
- **Licence :** Licence Ouverte.

### 2.9 `lignes` — Lignes par région administrative (P1)
- **Où :** data.gouv.fr (SNCF). Données de 2022 (les tracés changent peu).
- **Usage :** tracé des lignes sur la carte.
- **Table cible :** `ligne_ferroviaire`.

### 2.10 `cyclable` — Aménagements cyclables (P1)
- **Où :** data.gouv.fr (Geovelo), GeoJSON France métropolitaine, filtré sur la région.
- **Usage :** voies vertes et pistes proches de la gare d'arrivée (premier exemple de livrable cité par le défi).
- **Licence :** ODbL.
- **Table cible :** `amenagement_cyclable`.

---

## 3. Sources appelées en direct

### 3.1 `api_adresse` — Recherche de ville (P0)
- **Usage :** « autre ville » et repli si la localisation est refusée ; **nom de la commune de l'utilisateur** (puce « Autour de <commune> »).
- **Appels :** recherche par texte, résultats limités aux communes et adresses ; **recherche inverse** (position → commune).
- **Repli sans Internet :** recherche parmi les communes des gares en base (utile pour la démo hors ligne) ; pour la recherche inverse, commune de la gare la plus proche.
- **Écarté : Nominatim** (serveur public OpenStreetMap) : limité à 1 requête par seconde et saisie semi-automatique interdite ; l'API Adresse couvre la France avec les adresses officielles (D022).
- **Clé :** aucune (à confirmer à l'E09).
- **Adaptateur :** `lib/external/adresse.ts`.

### 3.2 `api_sncf` — Temps réel (P1)
- **Usage :** retards et suppressions des prochains trains d'une fiche destination.
- **Clé :** gratuite, à demander (action de Hardy, E09). Quota limité → cache 30 s et limitation d'appels.
- **Adaptateur :** `lib/external/sncf.ts`.
- **Sans clé ou en échec :** l'app affiche les horaires théoriques, sans message d'erreur alarmant.

### 3.3 `gbfs_direct` — Vélos disponibles (P1)
- **Usage :** nombre de vélos (et places) disponibles dans les stations proches d'une gare, à l'ouverture de la fiche destination.
- **Appel :** `station_status.json` du flux GBFS du réseau (adresse dans `config/sources.json`) ; aucune clé en général.
- **Cache :** 60 s côté serveur.
- **Adaptateur :** `lib/external/gbfs.ts`.
- **Sans flux ou en échec :** la station est affichée sans nombre, sans message d'erreur.

### 3.4 `fond_carte` — OpenFreeMap (P0)
- **Usage :** fond de carte vectoriel, style personnalisable.
- **Hors ligne (option E16) :** fichier PMTiles de la région servi localement.
- **Attribution :** © OpenStreetMap, OpenFreeMap.

---

## 4. Valeurs locales

### 4.1 `facteurs_co2` — Facteurs d'émission (P0)
Recopiés dans `config/parametres.json` (clé `impact.facteursCo2GParKm`), avec **source et date** :

| Mode | g CO₂e / km / personne | Source |
|---|---|---|
| TGV | 2,93 | ADEME — Impact CO2 |
| TER | 27,7 | ADEME — Impact CO2 |
| Intercités | **à relever à l'E09** | ADEME — Impact CO2 |
| Voiture thermique (1 personne) | 142 | ADEME — Impact CO2 |
| Avion court-courrier | **à relever à l'E09** | ADEME — Impact CO2 |

La voiture partagée divise l'émission de la voiture par le nombre d'occupants (paramètre). *Pourquoi en local :* la démo doit fonctionner sans réseau, et ces valeurs changent rarement.

---

## 5. Sources du défi écartées (et pourquoi)

| Source | Raison |
|---|---|
| Cartographie des données touristiques | Inventaire d'autres bases, pas une donnée utilisable |
| Horaires des gares | Horaires d'ouverture des guichets, données de 2024, aucune valeur pour l'utilisateur |
| Entreprises du patrimoine vivant | Artisans ; impossible de savoir lesquels sont visitables (P2 possible) |
| Places MAX JEUNE / SENIOR | Public très ciblé (P2 : badge) |
| Fréquentation touristique (Insee) | Réservé au badge « pépite méconnue » (P2) |
| Communes touristiques / stations classées | Peu de valeur ajoutée par rapport au reste |

Ces choix sont à présenter au jury : ils montrent une sélection réfléchie.

---

## 6. Écran « Sources » (obligation de licence)

Chaque source de la table `source_donnees` est affichée avec : nom, producteur, licence, lien, date de téléchargement. Attribution OSM et OpenFreeMap visible **aussi sur la carte**.

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 30/09/2026 | 1.0 | Création |
| 30/09/2026 | 1.1 | Vélos disponibles en direct (GBFS `station_status`, P1) — D019 |
| 02/10/2026 | 1.2 | API Adresse : recherche inverse (commune de l'utilisateur), Nominatim écarté — D022 |
| 05/10/2026 | 1.3 | Adresses et licences des sources enregistrées dans `config/sources.json` — D027 |
