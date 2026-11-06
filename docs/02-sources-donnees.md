# 02 — Sources de données

> **Version** 1.14 · **Date** 06/11/2026
> **Dépend de :** `00-vision.md`
> **Utilisé par :** `03-base-de-donnees.md`, `04-traitement-donnees.md`, écran Sources (`06-interface.md`), fiches E02 → E07, E09
> **Document de référence pour :** quelles sources, où les trouver, quels champs, quelle licence, quel usage.

⚠️ **Les noms de colonnes indiqués sont ceux attendus d'après la documentation publique. Ils doivent être vérifiés sur le fichier réel lors de l'étape concernée** (phase d'audit). Tout écart est corrigé ici en premier.

---

## 1. Vue d'ensemble

| Code source | Nom | Producteur | Nature | Mode | Prio | Étape |
|---|---|---|---|---|---|---|
| `gares` | Gares de voyageurs | SNCF | Fichier CSV / GeoJSON | Base | P0 | E02 |
| `communes` | Code officiel géographique — communes | INSEE | CSV | Base | P0 | E02 |
| `contours` | Contours des communes de la région | IGN (Admin Express) via geo.api.gouv.fr | GeoJSON | Base | P0 | E05 |
| `gtfs_sncf` | Horaires SNCF (TER, Intercités, TGV) | SNCF | GTFS (ZIP de CSV) | Base | P0 | E03 |
| `datatourisme` | DATAtourisme — POI par région | ADN Tourisme | CSV par région | Base | P0 | E05 |
| `osm` | OpenStreetMap (aires de jeux, parcs, points de vue…) | Contributeurs OSM | JSON Overpass | Base | P0 | E05 |
| `transport_local` | Offres de mobilité (bus, tram, vélos) | Autorités organisatrices via transport.data.gouv.fr | GTFS + GBFS | Base | P0 | E07 |
| `lieux_culturels` | Base des lieux et équipements culturels | Ministère de la Culture | CSV | Base | P1 | après le P0 (D041) |
| `festivals` | Liste des festivals en France | Ministère de la Culture | CSV | Base | P1 | après le P0 (D041) |
| `qualite_tourisme` | Établissements labellisés Qualité Tourisme | Ministères économiques et financiers | CSV | Base | P1 | E06 |
| `lignes` | Lignes par région administrative | SNCF | CSV / GeoJSON | Base | P1 | E07 |
| `cyclable` | Aménagements cyclables France métropolitaine | Geovelo | GeoJSON | Base | P1 | E07 |
| `api_adresse` | API Adresse / Géoplateforme | IGN | API | Direct | P0 | E09 |
| `api_sncf` | API SNCF (Navitia) | SNCF | API (clé gratuite) | Direct | P1 | E09 |
| `gbfs_direct` | Disponibilité des vélos (GBFS `station_status`) | Opérateurs de vélos | API JSON | Direct | P1 | E09 |
| `fond_carte` | OpenFreeMap | OpenFreeMap / OSM | Tuiles vectorielles | Direct | P0 | E11 |
| `facteurs_co2` | Facteurs d'émission Impact CO2 | ADEME | Réutilisation non commerciale, ADEME citée (D075) ; valeurs recopiées dans `parametres.json` | Local | P0 | E09 |

**Base** = téléchargé, traité et stocké par l'ETL. **Direct** = appelé par le serveur au moment de la demande, jamais stocké. **Local** = valeurs recopiées une fois, avec leur source et leur date.

**Les adresses exactes (téléchargement, flux) et les licences de toutes ces sources sont enregistrées dans `config/sources.json`** (`04` § 2 bis), jamais dans le code. Ce document décrit le contenu ; `sources.json` porte les adresses.

---

## 2. Sources stockées en base

### 2.1 `gares` — Gares de voyageurs (P0)
- **Où :** data.sncf.com, « Gares de voyageurs » (SNCF Gares & Connexions) ; la fiche data.gouv.fr renvoie vers le même fichier. Adresse dans `config/sources.json`.
- **Format (vérifié le 19/10/2026) :** CSV, séparateur `;`, UTF-8 **avec BOM** (à retirer à la lecture). 2 792 lignes, empreinte stable d'un téléchargement à l'autre.
- **Colonnes réelles :** `nom` (nom **de la gare**, pas de la commune), `libellecourt` (trigramme), `segment_drg` (parfois plusieurs : `A;B`), `position_geographique` (`"lat, lon"`), `codeinsee` (5 caractères), `codes_uic`, `id` (identifiant interne, non utilisé).
- **Utilisés :** nom, position, code INSEE de la commune, codes UIC (8 chiffres).
- **Absent :** le **nom de la commune** (« Besançon Franche-Comté TGV » est aux Auxons) → source `communes` (§ 2.1 bis).
- **Filtre région :** code INSEE de la commune → département → `parametres.region.departements`.
- **Constats du 19/10 :** aucune gare sans position, sans UIC ni sans code INSEE ; aucun doublon d'UIC ; 11 gares à plusieurs codes UIC (`;`), dont Paris Montparnasse où le code principal est le **dernier** ; toutes les gares en métropole, aucune en Corse ni outre-mer ; 196 dans la région.
- **Piège hors code :** ouvrir puis enregistrer le CSV dans Excel supprime le zéro initial des codes INSEE (`02761` → `2761`).
- **Licence :** ODbL (confirmée le 19/10/2026).
- **Table cible :** `gare`.

### 2.1 bis `communes` — Code officiel géographique, communes (P0)
- **Où :** INSEE, fichier `v_commune_<année>.csv` du COG (fiche data.gouv.fr « Code officiel géographique »). Adresse dans `config/sources.json` ; elle change chaque année (millésime).
- **Format :** CSV, séparateur `,`, UTF-8. ~37 500 lignes.
- **Colonnes utilisées :** `TYPECOM` (`COM` commune, `ARM` arrondissement municipal, `COMD` commune déléguée, `COMA` associée), `COM` (code INSEE), `LIBELLE` (nom), `DEP` (département ; vide pour `COMD` et `COMA`), `COMPARENT` (commune de rattachement d'un `ARM`/`COMD`/`COMA`).
- **Usage :** table `commune` (nom et département par code INSEE), reliée à `gare.code_insee` (D038). Paris 13ᵉ (`75113`, `ARM`) → nom et département de la commune parente. Code de gare absent (8 gares au 19/10, toutes hors région : communes fusionnées) → `gare.code_insee` vide, compté dans le rapport des gares.
- **Licence :** Licence Ouverte 2.0.
- **Table cible :** `commune` (36 912 codes au 23/10).

### 2.1 ter `contours` — Contours des communes de la région (P0)
- **Où :** API Découpage administratif (geo.api.gouv.fr), communes d'une région en GeoJSON (`codeRegion` dans l'adresse de `config/sources.json`). Données IGN Admin Express.
- **Format (vérifié le 01/11/2026) :** un seul fichier GeoJSON de 22,8 Mo, 3 685 communes ; chaque élément porte `code` (INSEE), `nom` et un contour `Polygon` ou `MultiPolygon`.
- **Usage :** commune d'un lieu = le contour qui contient son point, **quelle que soit la source** ; un point hors de tous les contours est hors région (D041). Le contour décrit la commune : il est rangé dans `commune.contour`, jamais dans `lieu`.
- **Licence :** Licence Ouverte 2.0.
- **Table cible :** `commune` (colonne `contour`).

### 2.2 `gtfs_sncf` — Horaires SNCF (P0)
- **Où :** transport.data.gouv.fr, « Réseau SNCF TGV, Intercités et TER » (SNCF). Adresse dans `config/sources.json`.
- **Format (vérifié le 22/10/2026) :** ZIP GTFS de 5,5 Mo (98 Mo décompressé) : `agency.txt`, `routes.txt`, `trips.txt`, `stop_times.txt`, `stops.txt`, `calendar_dates.txt`, `feed_info.txt`, `transfers.txt` (vide). **Pas de `calendar.txt`** : chaque jour de circulation est une ligne de `calendar_dates.txt` (`exception_type` = 1). Période couverte : du 21/10/2026 au 31/03/2027 (`feed_info.txt`). Fuseau `Europe/Paris` pour toutes les agences.
- **Volumes au 22/10 :** 59 861 trajets, 517 723 passages, 8 854 arrêts, 209 624 jours de circulation. Trajets en train touchant la région sur 60 jours : 3 516 (34 207 passages).
- **Colonnes utilisées** (le détail par colonne, gardée ou jetée, est dans `04` § 4.2) :
  - `trips.txt` : `trip_id`, `service_id`, `route_id` (jointure), `trip_headsign` (**numéro du train**, et non la destination)
  - `stop_times.txt` : `trip_id`, `stop_sequence`, `stop_id`, `arrival_time`, `departure_time`, `pickup_type`, `drop_off_type`
  - `calendar_dates.txt` : `service_id`, `date`, `exception_type` ; `calendar.txt` pris en charge s'il réapparaît
  - `routes.txt` : `route_id`, `route_short_name`
  - `stops.txt` : `stop_id`, `stop_name` (rapport seulement) ; `agency.txt` : `agency_timezone` (contrôle) ; `feed_info.txt` : `feed_end_date` (contrôle)
- **`stop_id` :** toujours un quai, de la forme `StopPoint:OCE<mode>-<UIC 8 chiffres>` (ex. `StopPoint:OCETGV INOUI-87713040`). Il porte **le code UIC** (rapproché de `gare.codes_uic`) **et le mode** (type de train). Un seul mode par trajet (vérifié).
- **Rapprochement avec `gare` :** par l'UIC seul, sans rattrapage par distance (D036). 98,1 % des passages des trajets de la région sont rapprochés ; les autres sont des gares étrangères (Bâle, Lausanne, Genève, Luxembourg, Karlsruhe…), absentes de `gare`.
- **Type de train :** lu dans le mode du `stop_id` ; `route_type` et l'agence ne sont **pas fiables** (des cars y sont déclarés comme des trains). Règle : `04` § 4.2.
- **Cars et navettes :** modes `Car TER`, `Car à réservation`, `Navette` (6 822 trajets : 6 390 `Car TER`, 324 `Car à réservation`, 108 `Navette` ; dont 375 touchant la région) : **exclus** et comptés (D036).
- **Montée et descente :** `pickup_type` / `drop_off_type` = 1 interdit la montée / la descente. En plus du premier et du dernier arrêt, ~3 100 arrêts intermédiaires sont « montée seule » ou « descente seule » → colonnes `passage.montee_interdite`, `passage.descente_interdite` (D036).
- **Constats du 22/10 :** 196 gares de la région desservies par un train sur la période du fichier, 194 sur les 60 jours chargés : Corbigny et Flez-Cuzy - Tannay n'ont que des cars jusqu'au 26/12 (signalées dans le rapport). 89 passages après minuit (jusqu'à `25:18:00`). Aucune séquence en double.
- **Pièges :** heures > 24:00:00 ; un trajet peut sortir de la région (on garde **tous les arrêts** d'un trajet qui touche la région) ; destinations étrangères perdues (hors périmètre France métropolitaine).
- **Licence :** ODbL (confirmée le 22/10/2026).
- **Tables cibles :** `trajet`, `passage`, `service_jour`, puis calcul de `liaison_directe`.

### 2.3 `datatourisme` — Points d'intérêt (P0)
- **Où :** data.gouv.fr « DATAtourisme, la base nationale des données publiques d'information touristique » (ADN Tourisme), fichier régional `datatourisme-reg-bfc.csv`, mis à jour chaque jour. Adresse stable dans `config/sources.json`.
- **Format (vérifié le 01/11/2026) :** CSV, séparateur `,`, UTF-8, 26 Mo, 34 033 lignes, aucune sans position.
- **Colonnes réelles :** `Nom_du_POI`, `Categories_de_POI`, `Latitude`, `Longitude`, `Adresse_postale`, `Code_postal_et_commune` (`58150#Pouilly-sur-Loire`), `Periodes_regroupees` (`2026-11-11<->2026-11-11|…`), `Covid19_mesures_specifiques`, `Createur_de_la_donnee`, `SIT_diffuseur`, `Date_de_mise_a_jour`, `Contacts_du_POI` (`téléphone#site<>autre site|…`), `Classements_du_POI` (`Qualité Tourisme#Qualité Tourisme|…`), `Description` (déjà sans HTML, 500 caractères au plus), `URI_ID_du_POI`.
- **Absent :** **ni photo, ni horaires détaillés, ni code INSEE** (commune par le contour, § 2.1 ter).
- **Catégories :** 3 à 27 classes par lieu, adresses de l'ontologie (`https://www.datatourisme.fr/ontology/core#Museum`, `http://schema.org/Product`) séparées par `|`, 269 valeurs distinctes. On garde la fin de l'adresse (`Museum`) et on classe avec `categorie_regle` (`04` § 4.5). Beaucoup sont génériques (`PointOfInterest`, `PlaceOfInterest`).
- **Contenu :** surtout des hébergements (24 154), restaurants (7 224), commerces (2 679), événements datés (3 826) et circuits (3 362), tous écartés ; **4 256 lieux** gardés au 01/11.
- **Pièges :** le même lieu peut être publié deux fois par deux diffuseurs (même `URI_ID_du_POI`, 16 cas au 01/11 : le premier est gardé) ; 16 lignes de l'Ain voisin (écartées par les contours).
- **Utilisés :** nom, classes, position, adresse, site web (premier site qui n'est pas un réseau social), description, « Qualité Tourisme » dans les classements (`lieu.qualite_tourisme`).
- **Licence :** Licence Ouverte 2.0.
- **Table cible :** `lieu` (source `datatourisme`).

### 2.4 `osm` — OpenStreetMap (P0)
- **Où :** **Overpass API**, une requête par région (aire administrative `ref:INSEE` = `parametres.region.codeInsee`). Adresse du serveur dans `config/sources.json`.
- **GéoDataMine écarté (D041) :** testé le 01/11, il ne propose que 2 de nos 5 familles (aires de jeux, patrimoine), rien pour les parcs, la nature, les musées, les zoos ni les théâtres.
- **Requêtes :** **construites à partir des règles OSM de `regles/categories.csv`**, une petite requête par règle qui classe (nom exigé sauf condition `sans_nom`), réunies sans doublon dans `data/brut/osm/overpass.json` : ajouter un tag = ajouter une règle, sans toucher au code. Sortie `out center tags` (centre des surfaces). Une seule grosse requête dépassait le délai du serveur le 01/11.
- **Éléments ciblés :** voir `categories.csv`. Au 01/11 : aires de jeux, zoos, parcs d'attractions, parcs aquatiques ; parcs et jardins ; réserves naturelles, points de vue, plages, cascades, plans d'eau ; châteaux, ruines, sites archéologiques, manoirs, forts, abbayes, monuments, Monuments historiques (`ref:mhs`), musées ; théâtres, centres d'art.
- **Règles particulières :** un élément **sans nom** n'est gardé que pour `leisure=playground` (nom « Aire de jeux ») ; une aire **privée** (`access=private`, `no`, `customers`) est écartée ; un **plan d'eau** ou un autre élément `historic` n'est gardé qu'avec un **signe de sortie** : `wikipedia`, `wikidata`, `ref:mhs`, `tourism`, `leisure` ou `sport=swimming` (le lac des Settons oui, un étang quelconque non).
- **Champs utilisés :** `type/id`, `name`, tags classés, position, `website` (ou `contact:website`, `url`), `opening_hours`, `description`, adresse `addr:*`, photo `image` ou `wikimedia_commons`.
- **Service partagé, parfois saturé :** réponse 502 « file d'attente pleine » ou réponse interrompue (`remark`) → nouvelles tentatives de la requête concernée, en doublant l'attente (`04` § 4.4) ; jamais de chargement partiel. Les miroirs essayés le 01/11 (private.coffee, kumi.systems) n'ont pas fait mieux.
- **Au 01/11 :** 16 requêtes (≈ 17 min, serveur saturé), 14 014 éléments → **8 310 lieux** ; 106 plans d'eau gardés sur 3 035, dont le lac des Settons ; 135 photos.
- **Licence :** **ODbL** — attribution « © les contributeurs d'OpenStreetMap » obligatoire.
- **Table cible :** `lieu` (source `osm`).

### 2.5 `transport_local` — Mobilités locales (P0)
- **Où :** transport.data.gouv.fr — jeux GTFS des réseaux urbains de la région et flux GBFS des services de vélos / trottinettes.
- **Utilisés :**
  - GTFS : `stops.txt` (arrêts), `routes.txt` (numéros et types de lignes : `route_type` 0 = tram, 3 = bus), `trips.txt` + `stop_times.txt` pour savoir quelles lignes desservent quel arrêt.
  - GBFS : `station_information.json` (nom, position des stations).
- **Rayon :** arrêts et stations à moins de `rayons.mobiliteM` **à pied** d'une gare de la région (D046).
- **v1 :** emplacement et lignes stockés en base. **Disponibilité des vélos en direct (P1)** : lue au moment de la demande dans `station_status.json` (voir § 3.3), jamais stockée.
- **À relever à l'E07 :** pour chaque réseau vélo, l'URL `station_status.json` si elle existe.
- **Licence :** relevée réseau par réseau (champ `licence` de chaque entrée, D046).
- **Table cible :** `mobilite_locale`.
- **Réseaux retenus (D046, audit du 02/11)** : une entrée par réseau dans `config/sources.json` (champ `reseau` : format, fichiers, `station_status`), licence vérifiée réseau par réseau ; **un réseau sans licence reconnue n'est pas chargé**.
  - 13 réseaux urbains GTFS : DiviaMobilités (Dijon, tram), Ginko (Besançon, tram), Optymo (Belfort, ODbL), évolitY (Montbéliard, ODbL), Zoom (Chalon), TréMA (Mâcon, ODbL), Léo (Auxerre), Tanéo (Nevers), Grandole (Dole), Côte&Bus (Beaune), ECLA (Lons-le-Saunier), MonRéZO (Le Creusot – Montceau), moova (Vesoul) — Licence Ouverte 2.0 sauf mention.
  - **Mobigo** (cars régionaux, 7 fichiers départementaux UT21 → UT89, Licence Ouverte 2.0) : type `CAR`, souvent le seul transport autour d'une petite gare.
  - Vélos en libre-service GBFS : VéloCité (Besançon, Licence Ouverte 1.0), Optymo (Belfort, ODbL), avec `station_status`.
  - Non retenus : « ça roule » (Autun, aucun arrêt près d'une gare) ; pas de réseau urbain publié pour Sens et Pontarlier (Mobigo les dessert), pas de flux vélos pour Dijon.

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
- **Non utilisé (D043)** : le label est déjà lu dans le champ `Classements_du_POI` de DATAtourisme (60 lieux au 02/11), plus récent ; le fichier de 2024 n'apporterait qu'un rapprochement par nom incertain. Entrée gardée dans `sources.json` (non chargée) ; à retirer de l'écran Sources (E13) si elle reste inutilisée.

### 2.9 `lignes` — Lignes par région administrative (P1, reporté après le P0, D046)
- **Où :** data.gouv.fr (SNCF). Données de 2022 (les tracés changent peu).
- **Usage :** tracé des lignes sur la carte.
- **Table cible :** `ligne_ferroviaire`.

### 2.10 `cyclable` — Aménagements cyclables (P1, reporté après le P0, D046 — première piste après le P0)
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
- **Adresse :** API de la Géoplateforme `https://data.geopf.fr/geocodage` (`/search`, `/reverse`), dans `config/sources.json` (champ `api`) ; l'ancien domaine `api-adresse.data.gouv.fr` est obsolète (D051). Recherche inverse **sans** filtre `type=municipality` (qui ne renvoie rien).
- **Clé :** aucune (vérifié le 03/11/2026).
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
- **Attribution :** `OpenFreeMap © OpenMapTiles © OpenStreetMap`, chaque morceau étant un lien (`attributionLiens` de `config/sources.json`, D073).

---

## 4. Valeurs locales

### 4.1 `facteurs_co2` — Facteurs d'émission (P0)
Recopiés dans `config/parametres.json` (clé `impact.facteursCo2GParKm`), avec **source et date** :

| Mode | g CO₂e / km / personne | Source |
|---|---|---|
| TGV | 2,93 | ADEME — Impact CO2 |
| TER | 27,7 | ADEME — Impact CO2 |
| Intercités | 8,98 | ADEME — Impact CO2 (relevé le 03/11/2026, D048) |
| Voiture thermique moyenne, diesel (1 personne) | 142 | ADEME — Impact CO2 (valeur par défaut, usage et fabrication, modèle 2025) |
| Avion court-courrier (300–1 000 km, traînées comprises) | 225 | ADEME — Impact CO2 (relevé le 03/11/2026, D048) |

La voiture partagée divise l'émission de la voiture par le nombre d'occupants (paramètre). *Pourquoi en local :* la démo doit fonctionner sans réseau, et ces valeurs changent rarement. **Une seule source pour tous les types** (ImpactCO2), pour une comparaison juste (D048).

### 4.2 `tarifs_tgv` — Calibrage du prix au km (P0)
- **Source :** « Tarifs TGV INOUI et OUIGO » (SNCF, data.gouv.fr), **ODbL** ; tarifs INOUI en vigueur au 01/04/2026. Adresse dans `config/sources.json`.
- **Usage :** **pas chargé en base.** Calibrage fait une fois (03/11/2026), recopié dans `parametres.json` (`prix.parKm`, `prix.source`, `prix.dateCalibrage`) : TGV 0,17 €/km (« Tarif Normal », milieu de fourchette) ; TER et Intercités 0,22 €/km (« Tarif Réglementé », barème national). Méthode et chiffres : D048.
- **Écarté :** « Tarifs TER Bourgogne-Franche-Comté » (licence non spécifiée, jeu archivé).
- **Plus tard (P1) :** prix par trajet tiré des grilles plutôt qu'au km.

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
| 19/10/2026 | 1.4 | Audit E02 : colonnes réelles des gares, licence ODbL confirmée ; nouvelle source `communes` (COG INSEE) — D034 |
| 22/10/2026 | 1.5 | § 2.2 réécrit après l'audit E03 : pas de `calendar.txt`, type de train lu dans le `stop_id`, cars exclus, montée et descente interdites, licence ODbL confirmée — D036 |
| 23/10/2026 | 1.6 | § 2.1 bis : `communes` remplit la table `commune` (colonne `DEP` lue) — D038 |
| 01/11/2026 | 1.7 | Audit E05 : § 2.1 ter `contours` (nouvelle source) ; § 2.3 colonnes réelles DATAtourisme ; § 2.4 Overpass seul, requête tirée des règles, GéoDataMine écarté ; lieux culturels et festivals après le P0 — D041 |
| 02/11/2026 | 1.8 | § 2.8 : fichier Qualité Tourisme non utilisé, label lu dans DATAtourisme — D043 |
| 02/11/2026 | 1.9 | § 2.5 : réseaux retenus, licences, Mobigo, vélos ; § 2.9 et § 2.10 reportés après le P0 — D046 |
| 03/11/2026 | 1.10 | § 4.1 : facteurs Intercités et avion relevés ; § 4.2 : calibrage du prix sur les tarifs TGV — D048 |
| 03/11/2026 | 1.11 | § 3.1 : API Adresse de la Géoplateforme, sans clé, recherche inverse sans filtre de type — D051 |
| 05/11/2026 | 1.12 | § 3.4 : mention du fond de carte raccourcie, avec liens — D073 |
| 06/11/2026 | 1.13 | `facteurs_co2` : licence relue, réutilisation non commerciale — D075 |
| 06/11/2026 | 1.14 | § 4.1 : ce que recouvre le facteur voiture — D075 |
