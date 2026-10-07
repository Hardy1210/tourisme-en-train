# 04 — Traitement des données (ETL) et calculs métier

> **Version** 1.2 · **Date** 05/10/2026
> **Dépend de :** `02-sources-donnees.md`, `03-base-de-donnees.md`, `GLOSSAIRE.md`
> **Utilisé par :** fiches E02 → E07, E09 (calculs d'impact), `05-api.md`
> **Document de référence pour :** le pipeline ETL, ses algorithmes, le fichier `config/parametres.json`, les formules de distance, durée, CO₂ et prix.

---

## 1. Principes

1. **L'ETL prépare tout ; l'application ne fait que lire.**
2. **Chaque source est indépendante** : `pnpm etl <source>` la traite seule. `pnpm etl all` enchaîne dans l'ordre (§ 3). Dans Docker : `docker compose run --rm etl <source|all>`.
3. **Idempotent :** relancer deux fois donne le même résultat.
4. **Empreinte :** si le fichier téléchargé n'a pas changé (SHA-256 identique à `source_donnees.empreinte`), la source est marquée `IGNORE` sauf avec `--force`.
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
    "departements": ["21", "25", "39", "58", "70", "71", "89", "90"]
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
    "tranchesTempsMin": [30, 60, 120]
  },
  "journee": { "arriveeMaxAller": "12:00", "dureeVisiteMin": 180 },
  "dedoublonnage": {
    "distanceM": 75,
    "similariteNom": 0.6,
    "prioriteSources": ["datatourisme", "lieux_culturels", "festivals", "osm"]
  },
  "limites": { "gares": 3, "lieux": 50, "destinations": 60, "trains": 20, "mobilites": 20 },
  "impact": {
    "source": "ADEME — Impact CO2",
    "dateReleve": "2026-09-30",
    "facteursCo2GParKm": { "TGV": 2.93, "TER": 27.7, "INTERCITES": null, "VOITURE": 142, "AVION": null },
    "occupantsVoiturePartagee": 3,
    "distanceMinAvionKm": 300
  },
  "prix": {
    "aCalibrer": true,
    "source": null,
    "parKm": { "TER": null, "INTERCITES": null, "TGV": null },
    "margeFourchette": 0.25
  }
}
```

- Les valeurs `null` sont **à renseigner à l'E09** (relevé des facteurs manquants, calibrage du prix) : les schémas de validation refusent `null` une fois `prix.aCalibrer` passé à `false`.
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
| 2 | `gares` | Charge toutes les gares de France, marque `dans_region` | 1 | E02 |
| 3 | `gtfs_sncf` | Charge `trajet`, `passage`, `service_jour` | 2 | E03 |
| 4 | `liaisons` | Calcule `liaison_directe` | 3 | E04 |
| 5 | `regles` | Charge `categorie_regle` depuis `regles/categories.csv` | — | E05 |
| 6 | `datatourisme` | Charge les lieux DATAtourisme | 5 | E05 |
| 7 | `osm` | Charge les lieux OSM | 5 | E05 |
| 8 | `lieux_culturels` | Charge les lieux culturels (P1) | 5 | E05 |
| 9 | `festivals` | Charge les festivals (P1) | 5 | E05 |
| 10 | `rattachements` | Doublons, Qualité Tourisme, `lieu_gare`, `gare_stats` | 2, 6–9 | E06 |
| 11 | `transport_local` | Charge `mobilite_locale` | 2 | E07 |
| 12 | `lignes` | Charge `ligne_ferroviaire` (P1) | — | E07 |
| 13 | `cyclable` | Charge `amenagement_cyclable` (P1) | — | E07 |

Option `--hors-ligne` : n'essaie pas de télécharger, utilise les fichiers de `data/brut/` (démo, E16).

---

## 4. Algorithmes par source

### 4.1 Gares (E02)
1. Télécharger → `data/brut/gares/`.
2. Lire (CSV en flux), valider (Zod) : nom, position, code INSEE, code(s) UIC.
3. Normaliser l'UIC sur **8 chiffres** ; si plusieurs codes, garder le premier de 8 chiffres commençant par `87` et journaliser les autres.
4. Écarter les gares sans position ou sans UIC (comptées dans le rapport).
5. `departement` = 2 premiers caractères du code INSEE (3 pour l'outre-mer, `2A`/`2B` pour la Corse).
6. `dans_region` = `departement` ∈ `parametres.region.departements`.
7. Charger dans `gare` (clé de rapprochement : `uic`).

**Contrôles :** nombre de gares > 2 500 en France ; > 100 dans la région ; aucune gare de la région hors de son emprise.

### 4.2 Horaires GTFS (E03)
1. Télécharger le ZIP → `data/brut/gtfs_sncf/`.
2. **Chargement brut :** les fichiers utiles (`agency`, `routes`, `trips`, `stop_times`, `stops`, `calendar`, `calendar_dates`) sont lus en flux depuis le ZIP et copiés **tels quels** (texte) dans des tables temporaires avec `COPY`. Tout le reste se fait en SQL.
3. **UIC d'un arrêt (SQL) :** `substring(stop_id from '(\d{8})')`. Rapprocher de `gare.uic`. Si l'UIC est absent de `gare` : rapprochement par distance < 300 m (`ST_DWithin`), sinon arrêt ignoré (compté).
4. **Trajets retenus :** ceux dont au moins un arrêt est une gare `dans_region`. On garde **tous leurs arrêts**.
5. **Type de train :** règle à établir à l'audit de l'E03 à partir de `agency`/`routes`/`stop_id` ; résultat ∈ {`TER`, `INTERCITES`, `TGV`, `AUTRE`} ; règle documentée ici après l'E03.
6. **Heures (SQL) :** `"HH:MM:SS"` → secondes (`split_part(h, ':', 1)::int * 3600 + split_part(h, ':', 2)::int * 60 + split_part(h, ':', 3)::int`), sans limite à 24 h.
7. **Calendrier (SQL) :** déplier `calendar` jour par jour avec `generate_series` (dates de début et de fin, filtrées sur les jours de semaine actifs), appliquer `calendar_dates` (1 = ajout, 2 = suppression), limiter à `[date du jour, date du jour + fenetreJoursHoraires]`. La date du jour est calculée **à Paris** par `dateDuJour()` (`packages/commun`) et passée en paramètre de la requête.
8. Remplir `trajet`, `passage`, `service_jour` par `INSERT … SELECT` depuis les tables temporaires, dans la transaction de chargement.

**Contrôles :** > 90 % des arrêts des trajets retenus rapprochés d'une gare ; aucune séquence dupliquée ; aucun `depart_s` négatif ; au moins un trajet par jour de la fenêtre.

### 4.3 Liaisons directes (E04)
```sql
-- 1) Paires par trajet (indépendantes de la date)
CREATE TEMP TABLE paire AS
SELECT a.trajet_id, a.gare_id AS dep, b.gare_id AS arr,
       a.depart_s, b.arrivee_s, (b.arrivee_s - a.depart_s) / 60 AS duree_min
FROM passage a
JOIN passage b ON b.trajet_id = a.trajet_id AND b.sequence > a.sequence
JOIN gare g ON g.id = a.gare_id AND g.dans_region
WHERE a.depart_s IS NOT NULL AND b.arrivee_s IS NOT NULL AND a.gare_id <> b.gare_id;

-- 2) Agrégation par date de service
INSERT INTO liaison_directe (gare_depart_id, gare_arrivee_id, date_service, duree_min,
                             nb_trains, premier_depart_s, dernier_depart_s, types_train, distance_km)
SELECT p.dep, p.arr, s.date_service, MIN(p.duree_min), COUNT(DISTINCT p.trajet_id),
       MIN(p.depart_s), MAX(p.depart_s), ARRAY_AGG(DISTINCT t.type_train), <distance>
FROM paire p
JOIN trajet t ON t.id = p.trajet_id
JOIN service_jour s ON s.service_id = t.service_id
WHERE s.date_service BETWEEN :date_du_jour AND :date_du_jour + :fenetre
GROUP BY p.dep, p.arr, s.date_service;
```
**Distance :** distance à vol d'oiseau entre les deux gares × `rail.coefDetour` (estimation assumée, suffisante pour le CO₂ et le prix).
**Mesurer la durée d'exécution** à l'E04 ; si > 5 min, en parler avant d'optimiser.

**Contrôles (en paires) :** Dijon-Ville → Beaune existe un jour de semaine **et** Beaune → Dijon-Ville aussi ; aucune liaison avec `duree_min ≤ 0` ; une paire sans train direct connu n'existe pas.

### 4.4 Lieux : DATAtourisme, OSM, lieux culturels, festivals (E05)
Commun aux quatre sources :
1. Télécharger (ou extraire) la région → `data/brut/<source>/`.
2. Lire, valider, **normaliser** vers le format commun : `id_source`, `nom`, `categorie`, `sous_categorie`, `description`, `adresse`, `commune`, `code_insee`, `url`, `image_url`, `horaires`, `periode`, position.
3. **Classer** (§ 4.5). Lieu sans catégorie → exclu et compté.
4. **Nettoyer** : description sans HTML, tronquée à 500 caractères au mot près ; URL validée ; nom en casse normale si tout en majuscules.
5. Garder uniquement les lieux dont la position est dans la région (département du code INSEE ou emprise régionale).

Spécifique :
- **DATAtourisme :** séparer `Categories_de_POI` sur `|` ; appliquer toutes les règles ; garder la meilleure priorité.
- **OSM :** centroïde pour les surfaces ; élément sans nom gardé uniquement pour `leisure=playground` → nom « Aire de jeux » ; `id_source` = `type/id` (ex. `way/123456`).
- **Festivals :** `periode` = mois de début–fin en texte (« juin–juillet »).

### 4.5 Catégorisation
- **Source de vérité :** `etl/src/regles/categories.csv` (colonnes `source;cle;valeur;categorie;sous_categorie;priorite`), versionné, **modifiable sans code**.
- `categorie` vide = **à exclure** (hébergement, restauration, commerce…).
- Toute valeur rencontrée **sans règle** est écrite dans `data/traite/rapports/categories_non_classees_<source>.csv` avec son nombre d'occurrences. **Hardy relit ce fichier** et complète le CSV de règles (action humaine, E05–E06).
- Catégories autorisées : `enfants`, `nature`, `parcs`, `patrimoine`, `culture` (voir `GLOSSAIRE.md`). En ajouter une = décision + mise à jour de `03`, `06`, `globals.css`.

### 4.6 Rattachements (E06)
Dans l'ordre :
1. **Doublons (P1)** : deux lieux actifs à moins de `dedoublonnage.distanceM` avec `similarity(nom) ≥ dedoublonnage.similariteNom` → on garde celui de la source la plus prioritaire, l'autre reçoit `doublon_de`. Les champs vides du lieu gardé sont complétés depuis le doublon (image, URL, horaires).
2. **Qualité Tourisme (P1)** : même commune + `similarity(nom) ≥ 0.6` → `qualite_tourisme = true`. Rapport des correspondances incertaines (similarité entre 0,5 et 0,6) à relire.
3. **`lieu_gare`** :
   ```sql
   INSERT INTO lieu_gare (lieu_id, gare_id, distance_m, duree_marche_min)
   SELECT l.id, g.id,
          ROUND(ST_Distance(l.geom, g.geom) * :coef_detour_marche)::int,
          CEIL(ST_Distance(l.geom, g.geom) * :coef_detour_marche / (:vitesse_marche_kmh * 1000 / 60))::smallint
   FROM lieu l JOIN gare g ON ST_DWithin(l.geom, g.geom, :rayon_lieux_gare_m)
   WHERE l.doublon_de IS NULL;
   ```
4. **`gare_stats`** : `COUNT(*)` par gare et catégorie depuis `lieu_gare`.

**Contrôles (en paires) :** le Jardin de l'Arquebuse est rattaché à Dijon-Ville **et** un lieu situé à 1,6 km d'une gare ne lui est pas rattaché ; aucune gare de la région avec 0 lieu n'est signalée comme anomalie (c'est possible), mais le nombre est dans le rapport.

### 4.7 Transports locaux (E07)
1. Pour chaque réseau GTFS urbain retenu : arrêts à moins de `rayons.mobiliteM` d'une gare `dans_region` ; lignes desservant chaque arrêt (via `stop_times` → `trips` → `routes`) ; type par `route_type` (0 → `TRAM`, 3 → `BUS`, autre → `AUTRE`).
2. Regrouper les arrêts de même nom à moins de 100 m (quais opposés) en une seule entrée.
3. GBFS : stations à moins de `rayons.mobiliteM` ; type `VELO` (ou `TROTTINETTE` si le flux l'indique).
4. `gare_id` = gare la plus proche ; `distance_m` = distance à pied estimée.

### 4.8 Lignes et aménagements cyclables (E07, P1)
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
| Tranche de temps | `<30`, `<60`, `<120`, `≥120` selon `durees.tranchesTempsMin` | |
| Faisable dans la journée | un aller arrive avant `journee.arriveeMaxAller` **et** un retour part après cette arrivée + `journee.dureeVisiteMin` | |
| CO₂ train (kg, aller-retour) | 2 × distance_km × facteur du type de train / 1000 | `impact.facteursCo2GParKm` |
| CO₂ voiture seule | 2 × distance_km × `VOITURE` / 1000 | |
| CO₂ voiture partagée (par personne) | CO₂ voiture seule / `occupantsVoiturePartagee` | |
| CO₂ avion | affiché seulement si distance ≥ `distanceMinAvionKm` | |
| CO₂ économisé | CO₂ voiture seule − CO₂ train | |
| Prix estimé | distance_km × `prix.parKm[type]` ± `margeFourchette` → fourchette arrondie à l'euro | tant que `aCalibrer = true`, **le prix n'est pas affiché** |
| Heure affichée | secondes → « HH:MM » ; si ≥ 86 400 → heure du lendemain + mention « +1 » | |
| Date du jour | date courante **dans le fuseau `Europe/Paris`**, au format `AAAA-MM-JJ` | `fuseau` |

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 30/09/2026 | 1.0 | Création |
| 05/10/2026 | 1.2 | § 2 bis : adresses des sources dans `config/sources.json` — D027 |
| 05/10/2026 | 1.1 | Traitement en TypeScript + SQL : commandes `pnpm etl`, validation Zod, schéma unique de `parametres.json`, horaires GTFS chargés bruts puis transformés en SQL — D024 |
