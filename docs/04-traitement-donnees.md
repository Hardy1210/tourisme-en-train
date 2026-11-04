# 04 — Traitement des données (ETL) et calculs métier

> **Version** 1.19 · **Date** 04/11/2026
> **Dépend de :** `02-sources-donnees.md`, `03-base-de-donnees.md`, `GLOSSAIRE.md`
> **Utilisé par :** fiches E02 → E07, E09 (calculs d'impact), `05-api.md`
> **Document de référence pour :** le pipeline ETL, ses algorithmes, le fichier `config/parametres.json`, les formules de distance, durée, CO₂ et prix.

---

## 1. Principes

1. **L'ETL prépare tout ; l'application ne fait que lire.**
2. **Chaque source est indépendante** : `pnpm etl <source>` la traite seule. `pnpm etl all` enchaîne dans l'ordre (§ 3). Dans Docker : `docker compose run --rm etl <source|all>`.
3. **Idempotent :** relancer deux fois donne le même résultat.
4. **Empreinte :** si le fichier téléchargé n'a pas changé (SHA-256 identique à `source_donnees.empreinte`), la source est marquée `IGNORE` sauf avec `--force`. Exception : `gtfs_sncf` n'est `IGNORE` que si le fichier est inchangé **et** a déjà été chargé le jour même à Paris, car sa fenêtre avance chaque jour (D037).
5. **Chargement transactionnel :** données lues → tables temporaires → contrôles → **dans une seule transaction** : suppression des lignes de la source + insertion. En cas d'échec, rien n'est modifié.
6. **Calculs géographiques et transformations lourdes en SQL (PostgreSQL + PostGIS).** Le code TypeScript télécharge, lit en flux, valide et charge (`COPY`) ; il ne fait pas de calcul ligne à ligne sur les gros volumes.
7. **Chaque exécution est journalisée** dans `execution_etl` et produit un **rapport** dans `data/traite/rapports/AAAA-MM-JJ_<source>.md`.
8. **Code retour :** 0 = succès ou ignoré ; différent de 0 = échec (utilisé par la planification des SR).
9. **Validation de chaque ligne lue** : avec Zod pour les fichiers de taille modeste (gares, lieux) ; pour les horaires GTFS (plusieurs millions de lignes), chargement brut en table temporaire puis contrôles en SQL. Dans les deux cas, les lignes invalides sont comptées et listées dans le rapport, jamais chargées silencieusement.

---

## 2. Paramètres partagés : `config/parametres.json`

Validé par **un seul schéma Zod**, dans `packages/commun/src/parametres.ts`, importé par l'application **et** par le traitement des données. **Seul endroit** où vivent ces valeurs.

```json
{
  "version": 1,
  "fuseau": "Europe/Paris",
  "region": {
    "codeInsee": "27",
    "nom": "Bourgogne-Franche-Comté",
    "departements": ["21", "25", "39", "58", "70", "71", "89", "90"],
    "emprise": { "latMin": 46.1, "latMax": 48.45, "lonMin": 2.8, "lonMax": 7.2 }
  },
  "empriseFrance": { "latMin": 41, "latMax": 51.5, "lonMin": -5.5, "lonMax": 10 },
  "destinations": { "lieuxMinEnTete": 3, "motGareHorsVille": "TGV" },
  "controles": {
    "communesFranceMin": 34000, "garesFranceMin": 2500, "garesRegionMin": 100, "rapprochementGtfsMinPct": 90,
    "contoursRegionMin": 3000, "lieuxSourceMin": 1000
  },
  "fenetreJoursHoraires": 60,
  "fenetreJoursLiaisons": 60,
  "marche":  { "vitesseKmH": 4.5, "coefDetour": 1.3 },
  "velo":    { "vitesseKmH": 15,  "coefDetour": 1.3 },
  "voiture": { "vitesseKmH": 50,  "coefDetour": 1.3 },
  "rail":    { "coefDetour": 1.2 },
  "rayons": {
    "lieuxGareM": 1500,
    "autourDeMoiDefautM": 2000,
    "autourDeMoiOptionsM": [1000, 2000, 5000, 10000],
    "mobiliteM": 800,
    "cyclableM": 3000
  },
  "durees": {
    "trainMaxOptionsMin": [30, 60, 120, 180],
    "tranchesTempsMin": [30, 60, 90]
  },
  "journee": { "arriveeMaxAller": "12:00", "dureeVisiteMin": 180 },
  "lieux": { "descriptionMaxCaracteres": 500, "enLongueurOsm": ["waterway=canal"], "raccordTronconsM": 1000, "fichesVille": { "…": "D057" }, "ongletLieux": { "…": "D057" } },
  "dedoublonnage": {
    "distanceM": 75,
    "similariteNom": 0.6,
    "distanceLargeM": 300,
    "similariteNomLarge": 0.8,
    "similariteARelire": 0.5,
    "prioriteSources": ["datatourisme", "lieux_culturels", "festivals", "osm"]
  },
  "regroupementSites": [
    { "sousCategorie": "grotte", "distanceM": 500 },
    { "sousCategorie": "site archéologique", "distanceM": 300 },
    { "sousCategorie": "aire de jeux", "distanceM": 50 }
  ],
  "regroupementParcChateau": { "distanceM": 500 },
  "mobilite": { "regroupementQuaisM": 100 },
  "limites": { "gares": 3, "lieux": 50, "lieuxParPage": 30, "destinations": 150, "trains": 20, "mobilites": 20, "geocodage": 6 },
  "impact": {
    "source": "ADEME — Impact CO2",
    "dateReleve": "2026-11-03",
    "facteursCo2GParKm": { "TGV": 2.93, "TER": 27.7, "INTERCITES": 8.98, "VOITURE": 142, "AVION": 225 },
    "occupantsVoiturePartagee": 3,
    "distanceMinAvionKm": 300
  },
  "prix": {
    "aCalibrer": false,
    "source": "SNCF — Tarifs TGV INOUI et OUIGO (ODbL), …",
    "dateCalibrage": "2026-11-03",
    "parKm": { "TER": 0.22, "INTERCITES": 0.22, "TGV": 0.17 },
    "margeFourchette": 0.25
  }
}
```

- Les valeurs `null` (D031) — toutes renseignées le 03/11/2026 (D048) ; la règle reste pour une région ou une source future :
  - **facteur CO₂ à `null`** (valeur pas encore relevée) : toujours accepté par le schéma ; `/api/impact` renvoie alors `co2Kg.train: null` pour ce type de train ;
  - **prix au kilomètre à `null`** : accepté **seulement** tant que `prix.aCalibrer` est vrai ; le schéma le refuse une fois `aCalibrer` passé à `false`, de même qu'une `source` ou une `dateCalibrage` absentes.
- Modifier une valeur = modifier ce fichier + une ligne dans `DECISIONS.md` si la valeur change le comportement visible.
- Ajouter une clé = la déclarer dans le schéma de `packages/commun` dans le même commit. *Un test vérifie que le fichier est accepté par le schéma.*

### 2 bis. Adresses des sources : `config/sources.json`

**Aucune adresse de source n'est écrite dans le code.** Chaque source de `02` y a une entrée : code, nom, producteur, page de la source, adresse de téléchargement, licence, attribution. Les réseaux locaux (GTFS bus/tram, GBFS vélos, dont l'adresse `station_status` pour les vélos disponibles) y sont listés aussi.
- Schéma Zod dans `packages/commun/src/sources.ts` ; lu par le traitement des données (toutes les entrées) et par l'application (uniquement les flux `station_status`, P1).
- Rempli au fil des étapes : E02 (gares, registre), E03 (horaires), E05 (DATAtourisme, OSM, P1 culture), E06 (Qualité Tourisme), E07 (réseaux locaux, P1 lignes et cyclable).
- *Pourquoi :* changer de région (ou en ajouter une, plus tard) doit se faire en modifiant `parametres.json` et `sources.json`, sans toucher au code (D027).

---

## 3. Ordre du pipeline (`pnpm etl all`)

| Ordre | Commande | Fait | Dépend de | Étape |
|---|---|---|---|---|
| 1 | `sources` | Enregistre/à jour `source_donnees` (métadonnées, licences) | — | E02 |
| 1 bis | `communes` | Charge `commune` (COG INSEE) | 1 | D038 |
| 1 ter | `contours` | Contour des communes de la région (`commune.contour`) | 1 bis | E05 |
| 2 | `gares` | Charge toutes les gares de France, marque `dans_region`, les relie à `commune` | 1, 1 bis | E02 |
| 3 | `gtfs_sncf` | Charge `trajet`, `passage`, `service_jour` | 2 | E03 |
| 4 | `liaisons` | Calcule `liaison_directe` | 3 | E04 |
| 5 | `regles` | Charge `categorie_regle` depuis `regles/categories.csv` | — | E05 |
| 6 | `datatourisme` | Charge les lieux DATAtourisme | 1 ter, 5 | E05 |
| 7 | `osm` | Charge les lieux OSM (Overpass) | 1 ter, 5 | E05 |
| 8 | `lieux_culturels` | Charge les lieux culturels (P1) | 1 ter, 5 | après le P0 |
| 9 | `festivals` | Charge les festivals (P1) | 1 ter, 5 | après le P0 |
| 10 | `rattachements` | Doublons, sites, `lieu_gare`, `gare_stats` (Qualité Tourisme déjà lu dans DATAtourisme) | 2, 6–9 | E06 |
| 11 | `transport_local` | Charge `mobilite_locale` | 2 | E07 |
| 12 | `lignes` | Charge `ligne_ferroviaire` (P1) | — | E07 |
| 13 | `cyclable` | Charge `amenagement_cyclable` (P1) | — | E07 |

Option `--hors-ligne` : n'essaie pas de télécharger, utilise les fichiers de `data/brut/` (démo, E16).

**Fréquence :** `osm` **une fois par semaine au plus** (service public Overpass, pas fait pour un usage automatique fréquent) ; entre deux extractions, `pnpm etl osm --hors-ligne` relit `data/brut/osm/overpass.json`. Les autres sources peuvent être rechargées chaque nuit (`07` § 5, D041).

---

## 4. Algorithmes par source

### 4.0 Communes (D038)
1. Télécharger → `data/brut/communes/v_commune.csv` (`02` § 2.1 bis).
2. Lire et valider (Zod) : code INSEE (5 caractères), nom, département (obligatoire pour une `COM`).
3. Indexer : une `COM` prend son nom et son `DEP` ; un `ARM`, une `COMD` ou une `COMA` prend ceux de sa commune de rattachement, sauf si son code est déjà celui d'une `COM` (la `COM` l'emporte). Le fichier est lu en entier avant l'indexation (une commune déléguée peut précéder sa parente).
4. Charger dans `commune` **par `code_insee`** (insertion ou mise à jour) ; un code absent du fichier est supprimé si rien ne le référence, sinon gardé et signalé.

**Contrôles (bloquants) :** codes ≥ `controles.communesFranceMin` ; aucun département de la région sans commune.

**Nouveau millésime du COG :** lancer ensuite `pnpm etl gares --force`, pour qu'une gare dont le code vient d'apparaître soit reliée à sa commune.

### 4.0 bis Contours des communes (E05, D041)
1. Télécharger → `data/brut/contours/communes.geojson` (`02` § 2.1 ter) ; lu d'un bloc (≈ 23 Mo) et validé (Zod : code INSEE, contour `Polygon` ou `MultiPolygon`).
2. Copier dans une table temporaire (code, nom, contour en GeoJSON).
3. Mettre à jour `commune.contour` par code INSEE (`ST_MakeValid`, surfaces seules, `MultiPolygon`) ; une commune absente du fichier perd son contour.

**Contrôles :** au moins `controles.contoursRegionMin` contours ; aucun contour dont la commune est absente de `commune` (bloquant : ses lieux disparaîtraient en silence) ; aucun doublon ; contours hors des départements de la région (non bloquant). Au 01/11 : 3 685 contours, ≈ 7 s.

### 4.1 Gares (E02)
1. Télécharger → `data/brut/gares/`.
2. Lire (CSV en flux, BOM retiré), valider (Zod) : nom, position `"lat, lon"`, code INSEE, code(s) UIC.
3. Normaliser chaque UIC sur **8 chiffres** ; `uic` = le premier code de 8 chiffres commençant par `87`, `codes_uic` = tous les codes valides (D034).
4. Écarter les gares sans position ou sans UIC (comptées dans le rapport).
5. Département = 2 premiers caractères du code INSEE du fichier (3 pour l'outre-mer, `2A`/`2B` pour la Corse) ; il n'est pas stocké dans `gare`.
6. `dans_region` = département ∈ `parametres.region.departements`.
7. `code_insee` gardé seulement s'il existe dans `commune` ; sinon vide, et la gare est listée dans le rapport (D038).
8. Charger dans `gare` : mettre à jour la gare qui partage **au moins un code UIC** avec la ligne (l'ordre des codes, donc `uic`, peut changer d'un fichier à l'autre : Paris Gare de Lyon le 23/10), insérer les autres ; une gare sans aucun code dans le fichier est supprimée si rien ne la référence, sinon gardée et signalée dans le rapport (exception au § 1.5, D034, D039).

**Contrôles (bloquants) :** nombre de gares ≥ `controles.garesFranceMin` ; gares de la région ≥ `controles.garesRegionMin` ; aucune gare de la région hors de `region.emprise` ; **aucune gare de la région sans commune** (attrape aussi une table `commune` vide : `pnpm etl communes` d'abord) ; aucun code UIC présent dans plusieurs lignes du fichier ; aucune ligne du fichier correspondant à plusieurs gares en base (doublon à fusionner à la main, D039) ; **`dans_region` conforme au département de la commune** (`commune.departement` ∈ `region.departements`, faux pour une gare sans commune) : la valeur calculée ne diverge jamais de la table `commune` (D040).

**Modifié après coup (D038) :** le COG n'est plus lu ici ; l'empreinte des gares seule décide de `IGNORE`.

### 4.2 Horaires GTFS (E03)
1. Télécharger le ZIP → `data/brut/gtfs_sncf/`.
2. **Chargement brut :** les fichiers utiles sont lus en flux depuis le ZIP et copiés **tels quels** (texte) dans des tables temporaires avec `COPY`. Tout le reste se fait en SQL.
3. **UIC et mode d'un arrêt (SQL) :** le `stop_id` a la forme `StopPoint:OCE<mode>-<UIC>` ; UIC = `substring(stop_id from '(\d{8})$')`, mode = `substring(stop_id from '^StopPoint:OCE(.*)-\d{8}$')`. UIC rapproché de `gare.codes_uic` (tous les codes d'une gare, D034). **Aucun rattrapage par distance** (D036) : un arrêt sans gare est ignoré et compté (gares étrangères).
4. **Type de train** (règle validée le 22/10, D036), d'après le mode du trajet :

   | Mode dans le `stop_id` | `type_train` |
   |---|---|
   | `Train TER`, `TramTrain` | `TER` |
   | `TGV INOUI`, `OUIGO`, `Lyria`, `ICE` | `TGV` |
   | `INTERCITES`, `INTERCITES de nuit` | `INTERCITES` |
   | `Car TER`, `Car à réservation`, `Navette` | **exclu** (pas un train), compté dans le rapport |
   | tout autre mode (ex. `Train` Paris–Bruxelles) | `AUTRE`, compté dans le rapport |

5. **Trajets retenus :** trajets en train (pas exclus au point 4) dont au moins un arrêt est une gare `dans_region` **et** qui circulent au moins un jour de la fenêtre. On garde **tous leurs arrêts** rapprochés.
6. **Heures (SQL) :** `"HH:MM:SS"` → secondes (`split_part(h, ':', 1)::int * 3600 + split_part(h, ':', 2)::int * 60 + split_part(h, ':', 3)::int`), sans limite à 24 h (`"25:10:00"` → 90 600).
7. **Calendrier (SQL) :** si `calendar.txt` est présent, le déplier jour par jour avec `generate_series` (jours de semaine actifs) ; appliquer `calendar_dates` (1 = ajout, 2 = suppression) ; limiter à `[date du jour, date du jour + fenetreJoursHoraires]`. Au 22/10, `calendar.txt` est absent : seules les lignes `exception_type` = 1 comptent. La date du jour est calculée **à Paris** par `dateDuJour()` (`packages/commun`) et passée en paramètre de la requête.
8. Remplir `trajet`, `passage`, `service_jour` par `INSERT … SELECT` depuis les tables temporaires, dans la transaction de chargement (suppression puis insertion : aucune table ne pointe vers `trajet`, sauf `passage` en cascade).

**Correspondance des colonnes (audit du 22/10) :**

| Fichier | Colonne | Devient | Transformation |
|---|---|---|---|
| `trips` | `trip_id` | `trajet.id` | telle quelle |
| `trips` | `service_id` | `trajet.service_id` | telle quelle |
| `trips` | `trip_headsign` | `trajet.numero` | telle quelle (numéro du train) |
| `trips` | `route_id` | — | jointure avec `routes` |
| `routes` | `route_short_name` | `trajet.nom_ligne` | telle quelle (`K7`, `C30`…) |
| `stop_times` | `trip_id` | `passage.trajet_id` | telle quelle |
| `stop_times` | `stop_sequence` | `passage.sequence` | texte → nombre |
| `stop_times` | `stop_id` | `passage.gare_id`, `trajet.type_train` | UIC → `gare.codes_uic` ; mode → règle du point 4 |
| `stop_times` | `arrival_time`, `departure_time` | `passage.arrivee_s`, `passage.depart_s` | point 6 |
| `stop_times` | `pickup_type`, `drop_off_type` | `passage.montee_interdite`, `passage.descente_interdite` | `= '1'` |
| `calendar_dates` | `service_id`, `date`, `exception_type` | `service_jour` | point 7 (`AAAAMMJJ` → date) |
| `stops` | `stop_id`, `stop_name` | — | noms des arrêts non rapprochés, dans le rapport |
| `agency` | `agency_timezone` | — | contrôle |
| `feed_info` | `feed_end_date` | — | contrôle |

**Jetées :** `trips.direction_id` (l'ordre des arrêts suffit), `block_id` (enchaînement du matériel : correspondances, règle 6), `shape_id` (vide) ; `stop_times.stop_headsign`, `shape_dist_traveled` (vides) ; `routes.route_long_name` (abréviations peu lisibles), `route_type` (pas fiable), `agency_id`, `route_desc`, `route_url` (vides), couleurs (charte graphique, règle 1) ; `stops` : positions (celles de `gare` font foi), `location_type`, `parent_station`, colonnes vides ; `agency` : nom, adresse, langue ; `transfers.txt` (correspondances, règle 6).

**Contrôles bloquants :** toutes les agences dans le fuseau `fuseau` ; au moins `controles.rapprochementGtfsMinPct` % des passages des trajets retenus rapprochés d'une gare ; aucune séquence dupliquée ; aucun `depart_s` négatif ; au moins un trajet par jour de la fenêtre.
**Avertissements (rapport) :** fenêtre dépassant `feed_end_date` ; nombre de trajets `AUTRE` ; trajets en car exclus ; gares de la région sans aucun train dans la fenêtre (nommées) ; arrêts non rapprochés les plus fréquents (nommés).

### 4.3 Liaisons directes (E04)
Commande `pnpm etl liaisons`, après `gtfs_sncf`. Requêtes complètes : `etl/src/transformations/liaisons.sql`. Toujours recalculé (≈ 2 s au 01/11), sans `IGNORE` : la fenêtre avance chaque jour.

```sql
-- 1) Paires par trajet (indépendantes de la date) : départ OU arrivée dans la région (D040)
CREATE TEMP TABLE tmp_paire AS
SELECT a.trajet_id, a.gare_id AS dep, b.gare_id AS arr, a.depart_s, b.arrivee_s
FROM passage a
JOIN passage b ON b.trajet_id = a.trajet_id AND b.sequence > a.sequence
JOIN gare gd ON gd.id = a.gare_id
JOIN gare ga ON ga.id = b.gare_id
WHERE a.depart_s IS NOT NULL AND b.arrivee_s IS NOT NULL AND a.gare_id <> b.gare_id
  AND NOT a.montee_interdite AND NOT b.descente_interdite      -- D036
  AND (gd.dans_region OR ga.dans_region);

-- 2) Agrégation par date de service ; trains en jumelage comptés une fois (D040)
CREATE TEMP TABLE tmp_liaison AS
SELECT p.dep, p.arr, s.date_service,
       MIN((p.arrivee_s - p.depart_s) / 60) AS duree_min,
       COUNT(DISTINCT (p.depart_s, p.arrivee_s)) AS nb_trains,
       MIN(p.depart_s) AS premier_depart_s, MAX(p.depart_s) AS dernier_depart_s,
       MIN(p.arrivee_s) AS premiere_arrivee_s, ARRAY_AGG(DISTINCT t.type_train) AS types_train
FROM tmp_paire p
JOIN trajet t ON t.id = p.trajet_id
JOIN service_jour s ON s.service_id = t.service_id
WHERE s.date_service BETWEEN :debut AND :debut + :jours
GROUP BY p.dep, p.arr, s.date_service;

-- 3) Insertion avec la distance et « faisable dans la journée » (liaison inverse r = retour)
INSERT INTO liaison_directe (...)
SELECT l.*, <distance>,
       coalesce(l.premiere_arrivee_s <= :arrivee_max_s
                AND r.dernier_depart_s >= l.premiere_arrivee_s + :visite_s, false)
FROM tmp_liaison l
LEFT JOIN tmp_liaison r ON r.dep = l.arr AND r.arr = l.dep AND r.date_service = l.date_service;
```
**Paramètres :** `:debut` = date du jour à Paris (`dateDuJour()`), `:jours` = `fenetreJoursLiaisons`, `:arrivee_max_s` = `journee.arriveeMaxAller` en secondes, `:visite_s` = `journee.dureeVisiteMin` × 60, `:coef_detour` = `rail.coefDetour`.
**Distance :** `ST_Distance(gare de départ, gare d'arrivée) / 1000 × rail.coefDetour`, arrondie à 0,1 km (estimation assumée, suffisante pour le CO₂ et le prix).
**Faisable dans la journée :** première arrivée ≤ `journee.arriveeMaxAller` **et** dernier retour (dernier départ de la liaison inverse, même date) ≥ première arrivée + `journee.dureeVisiteMin` ; aucun retour → faux.
**Chargement :** dans une transaction, suppression totale puis insertion (aucune table ne pointe vers `liaison_directe`).

**Contrôles bloquants** (sur `tmp_liaison`, avant le remplacement) : aucune liaison avec `duree_min ≤ 0` ; aucune liaison d'une gare vers elle-même ; aucun jour de la fenêtre sans liaison (attrape des horaires trop anciens : relancer `pnpm etl gtfs_sncf`).
**Avertissement :** liaisons sans liaison inverse le même jour (aller sans retour direct possible).
**Constats (rapport) :** liaisons, paires de gares, destinations hors région, liaisons faisables dans la journée, trains en jumelage regroupés.
*Une paire sans train direct connu ne peut pas exister* : chaque liaison vient d'un passage (construction). *Dijon ↔ Beaune* reste un critère d'acceptation vérifié à la main (fiche E04) : un nom de gare écrit dans le code ne vaudrait que pour la région pilote.

### 4.4 Lieux : DATAtourisme, OSM, lieux culturels, festivals (E05, D041)
Commun aux sources (`sources/lieux.ts`, `chargement/lieux.ts`) :
1. Lire les règles de la source dans `categorie_regle` (aucune → « lancez `pnpm etl regles` »).
2. Télécharger → `data/brut/<source>/`. **Empreinte = fichier + règles** : des règles modifiées reclassent la source même si son fichier n'a pas changé.
3. Lire, valider (Zod), **classer** (§ 4.5) et **normaliser** chaque ligne : `id_source`, `nom`, `categorie`, `sous_categorie`, `description`, `adresse`, `url`, `image_url`, `horaires`, `qualite_tourisme`, position. Ligne écartée → comptée par raison (exclue par une règle, sans règle, condition non remplie, sans position, identifiant déjà lu).
4. **Nettoyer** (`transformations/lieux.ts`) : description sans HTML, entités décodées, coupée au mot près au-delà de `lieux.descriptionMaxCaracteres` ; adresse web http(s) validée ; nom en casse normale s'il est tout en majuscules (« CHÂTEAU DE BUSSY-RABUTIN » → « Château de Bussy-Rabutin »).
5. Copier dans `tmp_lieu`, puis **commune par contour** : `code_insee` = commune dont `contour` couvre le point (`ST_Covers`, plus petit code en cas de limite). Aucun contour → **hors région, écarté**.
6. **Contrôles :** communes de la région avec contour ≥ `controles.contoursRegionMin` ; lieux dans la région ≥ `controles.lieuxSourceMin` ; aucun identifiant en double (bloquants) ; lieux hors contours (non bloquant).
7. Mettre à jour `lieu` **par (`source`, `id_source`)**, puis supprimer les lieux de la source qui n'y sont plus : l'`id` d'un lieu reste stable.
8. Écrire `data/traite/rapports/categories_non_classees_<source>.csv` (§ 4.5) et le rapport (écarts par raison, nombre par catégorie).

Spécifique :
- **DATAtourisme (`sources/datatourisme.ts`) :** CSV lu en flux ; classes de `Categories_de_POI` séparées sur `|`, fin de l'adresse gardée (`…core#Museum` → `Museum`) ; site web = première adresse de `Contacts_du_POI` qui n'est pas un réseau social ; `qualite_tourisme` si « Qualité Tourisme » figure dans `Classements_du_POI` ; un `URI_ID_du_POI` déjà lu (même lieu publié par deux diffuseurs) est ignoré. Au 01/11 : 34 033 lignes → 4 256 lieux, ≈ 10 s.
- **OSM (`sources/osm.ts`) :** requêtes Overpass **construites à partir des règles OSM** (`transformations/osm.ts`) : **une requête `nwr[clé=valeur]["name"](area.region)` par règle qui classe**, sans `["name"]` pour la condition `sans_nom`, `[clé]` pour la valeur `*` (une règle `clé=valeur` couverte par `clé=*` est sautée) ; aire de la région par `ref:INSEE` ; délai serveur 180 s par requête (sous les 300 s d'attente de Node) ; éléments réunis sans doublon dans `overpass.json`. Toutes les étiquettes de l'élément sont confrontées aux règles (une exclusion comme `access=private` l'emporte). Position = point, ou centre (`out center`) d'une surface ; `id_source` = `type/id` (ex. `way/123456`) ; élément sans nom → nom = sous-catégorie (« Aire de jeux ») ; photo = `image`, sinon fichier `wikimedia_commons`. **Serveur saturé (429, 502, 503, 504) ou réponse interrompue (`remark`)** : jusqu'à 6 tentatives de la requête concernée, attente de 30 s doublée à chaque fois ; puis échec, jamais un chargement partiel. `--hors-ligne` relit `overpass.json`.
- **Festivals (P1, après le P0) :** `periode` = mois de début–fin en texte (« juin–juillet »).

### 4.5 Catégorisation
- **Source de vérité :** `etl/src/regles/categories.csv` (colonnes `source;cle;valeur;categorie;sous_categorie;priorite;condition`, lignes `#` = commentaires), versionné, **modifiable sans code**, chargé par `pnpm etl regles` dans `categorie_regle` (remplacée en entier ; une ligne illisible ou une règle en double bloque le chargement).
- **Clés :** DATAtourisme `categorie` + nom de classe (`Museum`) ; OSM nom du tag + valeur, `*` = toute valeur.
- **Une règle par étiquette ; la plus petite priorité gagne** parmi les règles des étiquettes du lieu dont la condition est remplie. À égalité, l'exclusion l'emporte, puis l'ordre alphabétique (résultat stable).
  - `10` **exclusion forte** (hébergement, restauration, commerce, événement) : écarte le lieu même s'il est aussi un château ;
  - `15` lieu phare (lac, cascade, château, abbaye, zoo…) ; `20` classement précis ; `40` **complément de destination écarté** (cinéma, bibliothèque DATAtourisme : l’emporte sur « site culturel », cède à « théâtre » ou « musée », D042) ; `45`–`50` classement large (« site culturel », « site naturel ») ; `140` **fermé au public même Monument historique** (école, hôpital, établissement social, administration, D044) ; `150`–`200` règles OSM larges (`ref:mhs=*`, `historic=*`) ;
  - `900` **exclusion faible** (étiquette générique, circuit, sport) : une vraie catégorie l'emporte (la Roche de Solutré, aussi circuit, reste en `nature`).
- `categorie` vide = **à exclure**.
- **Noms exclus** (D045) : `etl/src/regles/noms_exclus.csv` (`motif;raison`), modifiable sans code, appliqué à toutes les sources après le classement. Motif comparé sans majuscules, accents ni ponctuation, par mots entiers ; partout dans le nom par défaut, **en début de nom** s'il commence par `^` (après un article) : `^trésor de` écarte « Le trésor de la Cathédrale Saint-Lazare » mais garde « Musée du Pays Châtillonnais – Trésor de Vix ». Raisons : activité (visite guidée, escape game, offre groupe, application…), objet (retable, orgue, vitrail…), fermé. Les statues sont gardées (D045). Lieux écartés listés dans `traite/rapports/lieux_exclus_par_nom_<source>.csv` (à relire) ; le fichier entre dans l'empreinte de la source. Ligne illisible : échec du chargement.
- **Conditions (OSM) :** aucune = nom obligatoire ; `sans_nom` = gardé même sans nom ; `notable` = nommé **et** avec un signe de sortie (`wikipedia`, `wikidata`, `ref:mhs`, `tourism`, `leisure`, `sport=swimming`). Lieu dont aucune règle de catégorie n'a sa condition remplie → écarté.
- Toute étiquette d'une clé qui classe **sans règle** est écrite dans `data/traite/rapports/categories_non_classees_<source>.csv` (`source;cle;valeur;occurrences`), réécrit à chaque chargement (vide = tout est classé). **Hardy relit ce fichier** et complète le CSV de règles (action humaine, E05–E06).
- Catégories autorisées : `enfants`, `nature`, `parcs`, `patrimoine`, `culture` (voir `GLOSSAIRE.md`). En ajouter une = décision + mise à jour de `03`, `06`, `globals.css`.

### 4.6 Rattachements (E06)
Commande `pnpm etl rattachements` : `transformations/rattachements.sql` exécuté **dans une transaction** par `chargement/rattachements.ts`, tout recalculé à chaque fois (≈ 2 s). Dans l'ordre (D043) :
1. **Doublons entre sources (P1)** : noms comparés **sans accents ni ponctuation** (`unaccent`), similarité trigramme. Une paire (source prioritaire `dedoublonnage.prioriteSources`, autre source) est fusionnée :
   - **palier proche** : à moins de `dedoublonnage.distanceM` et similarité ≥ `dedoublonnage.similariteNom` ;
   - **palier large** (grands lieux dont le point diffère selon la source : château, parc) : à moins de `dedoublonnage.distanceLargeM`, similarité ≥ `dedoublonnage.similariteNomLarge`, **même catégorie**, nom non générique (pas seulement la sous-catégorie, « Aire de jeux »).
   **Dans une même source** (D044) : fusion seulement si les noms comparables sont **identiques** (non génériques, à moins de `distanceM`) ; nom seulement semblable (≥ `similariteNom`) : à relire, jamais fusionné automatiquement (« Parc du château de X » est souvent une partie du « Château de X »).
   **Décisions manuelles** (D044) : `etl/src/regles/doublons_manuels.csv`, versionné, mêmes colonnes que les rapports (`source_garde;id_garde;nom_garde;source_doublon;id_doublon;nom_doublon;distance_m;similarite;decision`) ; lieux repérés par source + identifiant ; `decision` = `oui` (fusion, même loin ou peu semblable), `non` (jamais fusionnée, même si le calcul la fusionnerait), vide (ignorée). Ligne illisible : bloquant ; lieu disparu : avertissement.
   Le lieu de la source prioritaire (même source : le plus petit `id`) est gardé, l'autre reçoit `doublon_de` (décision « oui » d'abord, puis meilleure similarité, puis le plus proche). Les champs vides du lieu gardé sont complétés depuis le doublon (photo, site, horaires, Qualité Tourisme). Paires non fusionnées et non décidées : `traite/rapports/doublons_a_relire.csv` ; paire retenue pour chaque doublon : `doublons_fusionnes.csv` (une ligne s'y marque `non` pour annuler la fusion).
2. **Qualité Tourisme** : lu dans le champ `Classements_du_POI` de DATAtourisme (§ 4.4) ; le fichier séparé de 2024 n'est pas utilisé (D043).
3. **Sites** : pour chaque sous-catégorie de `regroupementSites` (grotte, site archéologique, aire de jeux), lieux non doublons à moins de sa distance l'un de l'autre (de proche en proche, `ST_ClusterDBSCAN`) → un **site**. Représentant : la source la plus prioritaire, puis le lieu le plus proche du centre du groupe ; les autres reçoivent `site_de`. **Jamais tout le patrimoine** : avec 150 m, les monuments du centre de Dijon formeraient un seul site de 92 lieux.
   **Parc d'un château** (D045) : un lieu dont le nom commence par parc, jardin(s), potager, verger, roseraie ou domaine et contient le **nom complet** d'un « Château de … » à moins de `regroupementParcChateau.distanceM` devient une partie du site du château (« Parc du château de Commarin »). Pas de règle large « un nom contenu dans un autre » (182 liens, trop de faux positifs).
4. **`lieu_gare`** : lieux ni doublons ni membres d'un site, dont la **distance à pied** (vol d'oiseau × `marche.coefDetour`) est ≤ `rayons.lieuxGareM` ; durée = ⌈ distance à pied / (`marche.vitesseKmH` × 1000 / 60) ⌉. **Lieu en longueur** (`lieu.trace`, canal) : distance au point de son tracé le plus proche de la gare, une ligne par gare.
5. **`gare_stats`** : `COUNT(*)` par gare et catégorie depuis `lieu_gare`.

**Lieux en longueur (OSM)** : les tags de `lieux.enLongueurOsm` (`waterway=canal`) sont demandés à Overpass en lignes avec leur tracé (`way…; out geom tags;`) ; au chargement, les tronçons de même nom à moins de `lieux.raccordTronconsM` sont réunis en un lieu (plus petit identifiant), dont le point est le point du tracé le plus proche de son centre.

**Contrôles** (bloquants sauf mention) : lignes illisibles dans `doublons_manuels.csv` ; décision dont un lieu n'existe plus (avertissement) ; lieu doublon de lui-même ; sources de lieux absentes de `prioriteSources` ; sous-catégorie de `regroupementSites` sans aucun lieu (avertissement) ; doublon d'un doublon ; lieu à la fois doublon et membre d'un site ; doublon ou membre de site dans `lieu_gare` ; rattachement au-delà du rayon à pied ; `gare_stats` qui ne totalise pas les lignes de `lieu_gare` d'une gare. **Tests en paires** (base de test) : lieu à 1 430 m à pied rattaché / à 1 625 m non ; même château à 20 m fusionné / noms différents à 20 m non ; même nom à 200 m fusionné / autre catégorie non ; grottes à moins de 500 m regroupées / monuments jamais / grotte à 600 m non ; canal rattaché aux gares de son tracé / sans tracé, à aucune.

Au 02/11 (après D044, D045 et la relecture de Hardy : 116 « oui », 77 « non ») : 72 lieux écartés par leur nom, 964 doublons (dont 133 dans une même source), 319 sites (525 lieux rattachés à un représentant, dont les 28 autres grottes d'Arcy-sur-Cure, 16 lieux de Bibracte et 26 parcs de château), **2 092 lieux à pied d'une gare** (2 210 liens), 175 gares de la région sur 196 avec au moins un lieu ; 8 paires à relire.

### 4.7 Transports locaux (E07)
Commande `pnpm etl transport_local [--hors-ligne]` (D046) : réseaux lus dans `config/sources.json` (entrées avec un champ `reseau`), fichiers gardés dans `data/brut/<code du réseau>/`, toujours recalculé (≈ 20 s).
1. **Licence** : un réseau dont la licence n'est pas dans `LICENCES_RESEAU` (`packages/commun`) n'est pas chargé (remarque dans le rapport).
2. **GTFS** (dans le ZIP) : arrêts (pas les stations parentes) desservis par au moins une ligne (`stop_times` → `trips` → `routes`) ; ligne de tram (`route_type` 0) → `TRAM`, sinon le type du réseau (`BUS`, ou `CAR` pour Mobigo) ; **transport à la demande exclu** (`route_type` 715, D020) ; numéros de ligne triés (2 avant 10) ; nom nettoyé (tiret final de Mobigo).
3. **GBFS** : stations de `station_information.json` (nom texte ou traduit), type `VELO`, `id_source` = `station_id`.
4. **Quais** (SQL) : arrêts d'un même réseau de même nom (sans accents ni majuscules), de proche en proche à moins de `mobilite.regroupementQuaisM` → un arrêt (plus petit identifiant, lignes réunies, centre des quais).
5. **Une ligne par couple (arrêt, gare de la région)** à moins de `rayons.mobiliteM` **à pied** (vol d'oiseau × `marche.coefDetour`) ; `mobilite_locale` remplacée en entier dans une transaction.

**Contrôles** : au moins un réseau chargé ; aucun arrêt au-delà du rayon à pied ; aucun arrêt de bus, tram ou car sans ligne ; réseau sans arrêt près d'une gare (avertissement). **Tests en paires** : deux quais « République » à 30 m → un arrêt / deux noms différents → deux ; 790 m à pied gardé / 810 m écarté ; tram → `TRAM` / bus seul → type du réseau ; transport à la demande écarté ; licence reconnue / non reconnue.

Au 02/11 : 16 réseaux, **553 couples arrêt-gare**, 122 gares de la région sur 196 avec au moins un transport (Mobigo : 84 gares) ; Dijon : tram T1, T2 et 13 arrêts de bus.

### 4.8 Lignes et aménagements cyclables (P1, reporté après le P0, D046)
Chargement direct des géométries filtrées sur l'emprise régionale. Pas de rattachement : l'application interroge par distance au moment de la demande.

---

## 5. Contrôles et rapport

Chaque source produit un rapport Markdown :
```
# Rapport ETL — <source> — AAAA-MM-JJ HH:MM (Paris)
- Statut : SUCCES | ECHEC | IGNORE
- Fichier : <nom>, empreinte <sha256 court>, <taille>
- Lignes lues / valides / chargées / écartées (avec raisons)
- Contrôles : ✅ / ❌ par contrôle
- Valeurs non classées : <n> (voir fichier)
- Durée : <s>
```
Un contrôle bloquant en échec → transaction annulée, code retour ≠ 0.

---

## 6. Calculs métier (fonctions pures, côté application)

Implémentés dans `apps/web/src/lib/geo`, `lib/dates`, `lib/impact`, testés en paires.

| Calcul | Formule | Paramètres |
|---|---|---|
| Distance à pied | distance vol d'oiseau × `marche.coefDetour` | |
| Durée à pied (min) | ⌈ distance à pied / (`marche.vitesseKmH` × 1000 / 60) ⌉ | |
| Durée vélo / voiture jusqu'à la gare | idem avec `velo` / `voiture` | |
| Tranche de temps | `<=30`, `<=60`, `<=90`, `>90` selon `durees.tranchesTempsMin` (D055) | |
| Faisable dans la journée | un aller arrive avant `journee.arriveeMaxAller` **et** un retour part après cette arrivée + `journee.dureeVisiteMin` | **calculé par l'ETL** (§ 4.3), lu dans `liaison_directe.faisable_journee` (D040) |
| CO₂ train (kg, aller-retour) | 2 × distance_km × facteur du type de train / 1000 | `impact.facteursCo2GParKm` |
| CO₂ voiture seule | 2 × distance_km × `VOITURE` / 1000 | |
| CO₂ voiture partagée (par personne) | CO₂ voiture seule / `occupantsVoiturePartagee` | |
| CO₂ avion | affiché seulement si distance ≥ `distanceMinAvionKm` | |
| CO₂ économisé | CO₂ voiture seule − CO₂ train ; pour une carte de destination, facteur **le moins favorable** des types de train de la liaison (D047) | |
| Prix estimé (aller simple) | distance_km × `prix.parKm[type]` ± `margeFourchette` → fourchette arrondie à l'euro ; pour une carte de destination, type le plus cher de la liaison | calibré sur les tarifs TGV de la SNCF (D048) ; si `aCalibrer = true`, **le prix n'est pas affiché** |
| Heure affichée | secondes → « HH:MM » ; si ≥ 86 400 → heure du lendemain + mention « +1 » | |
| Date du jour | date courante **dans le fuseau `Europe/Paris`**, au format `AAAA-MM-JJ` | `fuseau` |

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 30/09/2026 | 1.0 | Création |
| 05/10/2026 | 1.1 | Traitement en TypeScript + SQL : commandes `pnpm etl`, validation Zod, schéma unique de `parametres.json`, horaires GTFS chargés bruts puis transformés en SQL — D024 |
| 05/10/2026 | 1.2 | § 2 bis : adresses des sources dans `config/sources.json` — D027 |
| 09/10/2026 | 1.3 | § 2 : règle des valeurs `null` séparée entre facteurs CO₂ et prix — D031 ; historique remis dans l'ordre |
| 19/10/2026 | 1.4 | § 2 : `region.emprise` et `controles` ; § 4.1 réécrit après l'audit (BOM, `codes_uic`, communes COG, mise à jour par `uic`) — D034 |
| 22/10/2026 | 1.5 | § 4.1 : contrôle « UIC en double », empreinte du COG prise en compte pour `IGNORE` — D035 |
| 22/10/2026 | 1.6 | § 4.2 réécrit après l'audit E03 (type de train par le `stop_id`, cars exclus, sans rattrapage par distance, correspondance des colonnes, contrôles) ; § 4.3 : montée et descente interdites ; § 2 : `controles.rapprochementGtfsMinPct` — D036 |
| 22/10/2026 | 1.7 | § 1 : règle `IGNORE` propre au GTFS (fenêtre glissante) — D037 |
| 23/10/2026 | 1.8 | § 3 et § 4.0 : commande `communes` et table `commune` ; § 4.1 : `commune` et `departement` ne sont plus stockés dans `gare`, contrôle « gares de la région sans commune » ; § 2 : `controles.communesFranceMin` — D038 |
| 23/10/2026 | 1.9 | § 4.1 : gare reconnue par un code UIC commun ; contrôles « code UIC dans plusieurs lignes » et « ligne correspondant à plusieurs gares » — D039 |
| 01/11/2026 | 1.10 | § 4.3 réécrit : départ ou arrivée dans la région, `premiere_arrivee_s`, `faisable_journee`, trains en jumelage, contrôles ; § 4.1 : contrôle de `dans_region` ; § 6 : faisable dans la journée calculé par l'ETL — D040 |
| 01/11/2026 | 1.11 | § 2 : `controles.contoursRegionMin`, `controles.lieuxSourceMin`, `lieux.descriptionMaxCaracteres` ; § 3 : `contours` ; § 4.0 bis contours des communes ; § 4.4 et § 4.5 réécrits après E05 (empreinte fichier + règles, commune par contour, mise à jour par identifiant, requête Overpass tirée des règles, priorités et conditions) — D041 |
| 02/11/2026 | 1.12 | § 4.5 : priorité `40` (complément de destination écarté) — D042 |
| 02/11/2026 | 1.13 | § 2 : `dedoublonnage` en deux paliers, `regroupementSites`, `lieux.enLongueurOsm`, `lieux.raccordTronconsM`, `rayons.lieuxGareM` mesuré à pied ; § 4.6 réécrit (doublons, sites, lieux en longueur, contrôles, chiffres) — D043 |
| 02/11/2026 | 1.14 | § 4.5 : priorité `140` (fermé au public) ; § 4.6 : doublons dans une même source, décisions manuelles `doublons_manuels.csv`, rapports aux colonnes du fichier de décisions — D044 |
| 02/11/2026 | 1.15 | § 2 : `regroupementParcChateau` ; § 4.5 : noms exclus (`noms_exclus.csv`) ; § 4.6 : parc d'un château — D045 |
| 02/11/2026 | 1.16 | § 2 : `mobilite.regroupementQuaisM` ; § 4.7 réécrit (réseaux de `sources.json`, licence, CAR, couple arrêt-gare, rayon à pied, contrôles, chiffres) ; § 4.8 reporté — D046 |
| 03/11/2026 | 1.17 | § 2 : facteurs CO₂ et prix renseignés, `prix.dateCalibrage`, `empriseFrance` (positions acceptées par l'API), `destinations` (D049, D050) ; § 6 : CO₂ et prix d'une carte de destination, prix calibré — D047, D048 |
| 04/11/2026 | 1.18 | § 2 et § 6 : tranches de temps 30, 60, 90, limite comprise — D055 |
| 04/11/2026 | 1.19 | § 2 : `limites.lieuxParPage` — D056 ; `lieux.fichesVille`, `lieux.ongletLieux` — D057 |
