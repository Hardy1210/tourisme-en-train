# 05 — API de l'application

> **Version** 1.10 · **Date** 03/11/2026
> **Dépend de :** `00-vision.md`, `03-base-de-donnees.md`, `04-traitement-donnees.md`, `GLOSSAIRE.md`
> **Utilisé par :** `06-interface.md`, `07-contrat-infra.md` (route de santé), fiches E08, E09, E11, E12
> **Document de référence pour :** le contrat de chaque route (paramètres, réponse, erreurs, cache).

---

## 1. Règles communes

1. **Routes Next.js** dans `apps/web/src/app/api/**/route.ts`. Chaque route est **fine** : valider → appeler un service → répondre.
2. **Lecture seule** : uniquement `GET`. *Aucune route n'écrit en base en v1.*
3. **Validation Zod** de tous les paramètres (schémas dans `features/*/schemas.ts`). Paramètre invalide → `400`.
4. **Types de réponse dérivés des schémas Zod** (`z.infer`), jamais recopiés à la main.
5. **Format d'erreur unique :**
   ```json
   { "erreur": { "code": "PARAMETRE_INVALIDE", "message": "La date doit être au format AAAA-MM-JJ." } }
   ```
   Codes : `PARAMETRE_INVALIDE` (400) · `INTROUVABLE` (404) · `SERVICE_EXTERNE_INDISPONIBLE` (503, avec `"reessayable": true`) · `ERREUR_INTERNE` (500). Le message est en français, compréhensible, **sans détail technique**. Le détail va dans les journaux serveur.
6. **Positions :** `lat` et `lon` en degrés décimaux, validés (France métropolitaine : `parametres.empriseFrance`, lat 41–51,5, lon −5,5–10). **Jamais journalisés** : le journal des requêtes de Next.js est désactivé (`logging.incomingRequests: false`), l'URL contenant la position.
7. **Dates :** `date` au format `AAAA-MM-JJ`. Absente → **date du jour à Paris** calculée par `dateDuJour()` (`@tourisme/commun`). Doit être dans la fenêtre des horaires chargés, sinon `400` avec un message clair.
8. **Heures en réponse :** `{ s, texte, lendemain }` — secondes depuis minuit de la date de service **et** texte prêt à afficher (`"10:12"`, `lendemain: false`).
8 bis. **Identifiants publics stables** (D052) : une gare est désignée par son **code UIC** (`uic`, résolu parmi tous ses codes `codes_uic`), un lieu par sa **clé de source** (`cle`, ex. `osm-way-123456`). L'`id` interne de la base n'apparaît jamais dans une URL ni une réponse : il change quand la base est recréée (production, données figées de la soutenance).
9. **Catégories :** paramètre `categories=enfants,parcs` ; absent = toutes.
10. **Limites** issues de `parametres.limites`, jamais en dur.
11. **Cache HTTP** indiqué par route (`Cache-Control`). Les réponses dépendant de la position ne sont jamais mises en cache partagé.
12. **Attributions :** les réponses contenant des lieux incluent le code de leur `source` ; l'interface affiche l'attribution correspondante.

---

## 2. Liste des routes

| Méthode | Route | Fonction | Prio | Étape |
|---|---|---|---|---|
| GET | `/api/sante` | État de l'application et des données | P0 | E08 |
| GET | `/api/gares/proches` | Gares les plus proches d'une position | P0 | E08 |
| GET | `/api/autour` | Lieux autour d'une position | P0 | E08 |
| GET | `/api/destinations` | Destinations en train direct depuis une gare | P0 | E08 |
| GET | `/api/destinations/[uic]` | Résumé d'une destination (gare, lieux par catégorie, liaison) | P0 | E09 |
| GET | `/api/destinations/[uic]/lieux` | Lieux à pied depuis une gare | P0 | E09 |
| GET | `/api/lieux/[cle]` | Détail d'un lieu | P0 | E09 |
| GET | `/api/trains` | Trains directs aller et retour | P0 | E09 |
| GET | `/api/mobilites/[uic]` | Transports sur place | P0 | E09 |
| GET | `/api/impact` | CO₂ et prix estimé d'une liaison | P0 | E09 |
| GET | `/api/geocodage` | Recherche de ville / adresse | P0 | E09 |
| GET | `/api/geocodage/inverse` | Nom de la commune d'une position | P0 | E09 |
| GET | `/api/sources` | Sources, licences, dates | P0 | E09 |
| GET | `/api/lignes` | Tracés des lignes dans une emprise | P1 | E09 |
| GET | `/api/cyclable/[uic]` | Aménagements cyclables près d'une gare | P1 | E09 |
| GET | `/api/trains/temps-reel` | Statut temps réel des prochains trains | P1 | E09 |
| GET | `/api/mobilites/[uic]/velos` | Vélos disponibles en direct dans les stations proches | P1 | E09 |

---

## 3. Détail des routes

### 3.1 `GET /api/sante`
Utilisée par la supervision (SR) et le déploiement.
```ts
// 200 si tout va bien, 503 si la base est inaccessible
{ statut: "ok" | "degrade", base: "ok" | "erreur", dateDonnees: "2026-10-12" | null, version: "0.1.0" }
```
`dateDonnees` = date de la dernière exécution ETL réussie de `gtfs_sncf`. Pas de cache.

### 3.2 `GET /api/gares/proches?lat&lon&limite`
| Paramètre | Type | Défaut |
|---|---|---|
| `lat`, `lon` | nombre | obligatoire |
| `limite` | entier 1–10 | `parametres.limites.gares` |
```ts
{ gares: Array<{ uic: string; nom: string; commune: string | null; distanceM: number;
                 dureeVeloMin: number; dureeVoitureMin: number; dansRegion: boolean }> }
```
Cache : aucun (position).

### 3.3 `GET /api/autour?lat&lon&rayon&categories`
| Paramètre | Type | Défaut |
|---|---|---|
| `lat`, `lon` | nombre | obligatoire |
| `rayon` | une valeur de `rayons.autourDeMoiOptionsM` | `rayons.autourDeMoiDefautM` |
| `categories` | liste | toutes |
```ts
{ lieux: Array<LieuResume>, total: number }
type LieuResume = { cle: string; nom: string; categorie: Categorie; sousCategorie: string | null;
                    distanceM: number; dureeMarcheMin: number; imageUrl: string | null;
                    qualiteTourisme: boolean; source: string; lat: number; lon: number }
```
Cache : aucun (position).

### 3.4 `GET /api/destinations?gare&date&categories&dureeMax`
| Paramètre | Type | Défaut |
|---|---|---|
| `gare` | code UIC de la gare | obligatoire |
| `date` | `AAAA-MM-JJ` | date du jour (Paris) |
| `categories` | liste | toutes |
| `dureeMax` | une valeur de `durees.trainMaxOptionsMin` | la plus grande |

**Une destination = une ville** (D047) : les gares d'arrivée sont regroupées par commune de rattachement (`gare.code_insee` → `commune` : nom + département ; arrondissements = « Paris »). **Exception : une gare hors de la ville** (nom contenant le mot `destinations.motGareHorsVille`, « TGV ») forme **toujours sa propre carte**, au nom de la gare, même dans la commune d'une gare de ville (Mâcon Loché TGV, « à Mâcon ») — D049. Les valeurs de la carte sont celles de la **gare en tête** (le plus de trains ; à égalité, la plus rapide) ; la fiche (§ 3.5) reste celle d'une gare.
```ts
type Heure = { s: number; texte: string; lendemain: boolean };   // règle 8 (§ 1)
{ gareDepart: { uic: string; nom: string },
  date: string,
  destinations: Array<{
    titre: string;                     // nom de la carte : la commune ; le nom de la gare si horsVille ou commune inconnue
    commune: { nom: string | null; codeInsee: string | null };
    horsVille: boolean;                // gare TGV : afficher « à <commune> » sous le titre (D049)
    gare: { uic: string; nom: string; lat: number; lon: number; dansRegion: boolean };  // gare en tête
    autresGares: Array<{ uic: string; nom: string; dureeMin: number; nbTrains: number }>;
    dureeMin: number; trancheTemps: "<30" | "<60" | "<120" | ">=120";
    nbTrains: number;
    premierDepart: Heure;
    dernierRetour: Heure | null;       // dernier départ de la liaison inverse ; null si aucun retour direct
    prochainDepart: Heure | null;      // à partir de l'heure actuelle si date = aujourd'hui ; null s'il n'y en a plus
    prochaineArrivee: Heure | null;    // arrivée réelle du train de prochainDepart à la gare en tête
    typesTrain: TypeTrain[];
    distanceKm: number;
    lieuxParCategorie: Partial<Record<Categorie, number>>;  // gare en tête, seulement les catégories demandées
    peuDeLieux: boolean;                                     // région et moins de destinations.lieuxMinEnTete (3) lieux des catégories demandées (D050)
    faisableJournee: boolean;                                // liaison_directe.faisable_journee (D040)
    lieuxCharges: boolean;                                   // false hors région pilote
    co2EconomiseKg: number | null;     // aller-retour, voiture seule − train ; facteur le moins favorable de typesTrain ; null si inconnu
    prixEstime: { min: number; max: number; devise: "EUR" } | null;  // aller simple, type le plus cher ; null si prix.aCalibrer
  }> }
```
**Règles (D047, D049, D050) :**
- **Exclues :** les gares de la même commune que la gare de départ, gare TGV comprise. **Aucune durée minimale.**
- **Tri :** durée de la gare en tête croissante ; les destinations `peuDeLieux` (région, moins de `destinations.lieuxMinEnTete` lieux à pied des catégories demandées) passent **en fin de liste** (même tri entre elles), sans être cachées. Critère : « vaut un trajet en train », pas seulement « est rapide ».
- **Filtre des envies** (`categories` fourni) : une destination de la région avec **0** lieu des catégories choisies est **retirée** ; de 1 à N−1, elle passe en fin de liste ; les destinations hors région (`lieuxCharges = false`) **restent** à leur place.
- **Limite :** `parametres.limites.destinations` (150, garde-fou) ; `dureeMax` réduit la liste. Le filtre « faisable dans la journée » est appliqué par l'interface.
- **Calcul (D040) :** `dernierRetour` par jointure sur la liaison inverse (`03` § 3.5) ; `prochainDepart` et `prochaineArrivee` par **une seule requête groupée** sur `passage` pour toutes les gares en tête (jamais une requête par destination) ; `date` autre qu'aujourd'hui → `prochainDepart` = `premierDepart` et `prochaineArrivee` = arrivée de ce train. CO₂ et prix : fonctions pures de `lib/impact`, les mêmes que `/api/impact` (`04` § 6, D048).

Cache : `public, max-age=300` (au lieu de 3600 : `prochainDepart` dépend de l'heure actuelle, D047).

### 3.5 `GET /api/destinations/[uic]?depuis&date`
En-tête de la fiche destination (D051). `depuis` : code UIC de la gare de départ (facultatif) ; `date` : comme § 3.4.
```ts
{ gare: { uic: string; nom: string; lat: number; lon: number; dansRegion: boolean;
          titre: string; commune: { nom: string | null; codeInsee: string | null }; horsVille: boolean },
  lieuxParCategorie: Partial<Record<Categorie, number>>,   // toutes catégories, > 0 seulement
  lieuxCharges: boolean,                                   // false hors région pilote
  liaison: null | {                                        // si `depuis` est fourni et qu'une liaison directe existe ce jour-là
    date: string; dureeMin: number; trancheTemps: string; nbTrains: number;
    premierDepart: Heure; dernierRetour: Heure | null; typesTrain: TypeTrain[]; distanceKm: number;
    faisableJournee: boolean; co2EconomiseKg: number | null;
    prixEstime: { min: number; max: number; devise: "EUR" } | null } }
```
Mêmes valeurs que la carte de destination (§ 3.4) : la fiche n'affiche jamais un autre chiffre. `404` si la gare est inconnue. Cache : `public, max-age=3600`.

### 3.6 `GET /api/destinations/[uic]/lieux?categories&rayon`
| Paramètre | Défaut |
|---|---|
| `categories` | toutes |
| `rayon` | `rayons.lieuxGareM` (maximum ; distance à pied) |
```ts
{ lieux: Array<LieuResume>, total: number }   // distance et durée à pied depuis la gare (lieu_gare)
```
Les plus proches d'abord ; limite `parametres.limites.lieux`. `404` si la gare est inconnue. Cache : `public, max-age=86400`.

### 3.7 `GET /api/lieux/[cle]`
```ts
{ cle, demande: string | null,   // `demande` : clé du lien suivi, si elle désignait un doublon ou un membre de site
  nom, categorie, sousCategorie, description, adresse, commune, url, imageUrl,
  horaires, periode, qualiteTourisme, source, attribution, lat, lon,
  garesProches: Array<{ uic: string; nom: string; distanceM: number; dureeMarcheMin: number }> }
```
Un lien vers un lieu devenu **doublon** ou **membre d'un site** renvoie le lieu gardé (ou le représentant du site), avec `demande` (D052) : un lien partagé ne casse pas. `404` seulement si la clé est inconnue. Cache : `public, max-age=86400`.

### 3.8 `GET /api/trains?depart&arrivee&date&depuis`
| Paramètre | Défaut |
|---|---|
| `depart`, `arrivee` | codes UIC, obligatoires |
| `date` | date du jour (Paris) |
| `depuis` | `HH:MM` ; défaut : heure actuelle à Paris (`maintenantParis()`, D031) si `date` = aujourd'hui, sinon `00:00` |
```ts
{ date: string,
  aller:  Array<Train>, retour: Array<Train>,
  dernierRetour: Train | null }
type Train = { trajetIds: string[]; depart: Heure; arrivee: Heure;   // Heure : { s, texte, lendemain } (§ 3.4, D051)
               dureeMin: number; typeTrain: TypeTrain; numeros: string[] }
```
**Trains en jumelage** (D040) : les trajets aux mêmes heures de départ et d'arrivée forment **un seul** `Train`, avec tous leurs identifiants et numéros (affichés « TGV 12177 / 5537 ») ; `numeros` est vide si aucun n'est connu. La limite compte les trains, pas les trajets.
`retour` = trains `arrivee → depart` le même jour, sans filtre `depuis`. Limite : `parametres.limites.trains` — les **premiers** allers à partir de `depuis`, les **derniers** retours du jour (ceux qui comptent pour revenir) ; `dernierRetour` est toujours le dernier du jour (D051). **Limite connue** (D051) : les trains du jour de service précédent qui roulent après minuit (« 24:52 ») ne sont pas proposés pour la date suivante. Cache : `public, max-age=900`.

### 3.9 `GET /api/mobilites/[uic]`
```ts
{ mobilites: Array<{ type: TypeMobilite; nom: string; lignes: string[]; operateur: string | null;
                     distanceM: number; dureeMarcheMin: number; source: string }> }
```
Tri par type puis distance (à pied, `mobilite_locale.distance_m`) ; limite `parametres.limites.mobilites`. `404` si la gare est inconnue. Cache : `public, max-age=86400`.

### 3.10 `GET /api/impact?depart&arrivee&type`
| Paramètre | Défaut |
|---|---|
| `depart`, `arrivee` | codes UIC, obligatoires |
| `type` | type **le moins favorable** des trains de la liaison (D047, D051) : mêmes chiffres que la carte |
```ts
{ distanceKm: number,
  co2Kg: { train: number | null; voitureSeule: number; voiturePartagee: number; avion: number | null },
  co2EconomiseKg: number | null,                                     // null si le facteur du type de train n'est pas relevé (D031)
  prixEstime: { min: number; max: number; devise: "EUR" } | null,   // null tant que non calibré
  trajet: { co2: "aller-retour"; prix: "aller-simple" },            // ce que couvre chaque chiffre (D051)
  source: string, dateReleve: string }
```
**CO₂ pour un aller-retour** (2 × distance × facteur : une sortie à la journée), **prix pour un aller simple** (comme la billetterie) ; mêmes conventions sur la carte (§ 3.4) et la fiche (§ 3.5). Calcul 100 % local (`lib/impact`), aucun appel externe. Distance et types lus dans `liaison_directe` (première date de la fenêtre où la liaison existe). `404` s'il n'existe aucune liaison directe entre les deux gares (règle 6). Cache : `public, max-age=86400`.

### 3.11 `GET /api/geocodage?q`
`q` : 3 à 80 caractères.
```ts
{ resultats: Array<{ libelle: string; commune: string; lat: number; lon: number;
                     type: "commune" | "adresse" | "gare" }>,
  horsLigne: boolean }
```
Passe par `lib/external/adresse.ts` (API Adresse de la Géoplateforme, adresse dans `config/sources.json`). **Gares de la base d'abord** (nom ou commune contenant le texte, sans accents ni majuscules, celles de la région en tête), puis communes et adresses de l'API ; `parametres.limites.geocodage` résultats au plus. En cas d'échec ou sans réseau : gares seules, `horsLigne: true` (réponse jamais mise en cache). Cache : `public, max-age=86400`.

### 3.11 bis `GET /api/geocodage/inverse?lat&lon`
Donne le nom de la commune où se trouve l'utilisateur, pour la puce « Autour de <commune> ».
| Paramètre | Type | Défaut |
|---|---|---|
| `lat`, `lon` | nombre | obligatoire |
```ts
{ commune: string; codeInsee: string | null; horsLigne: boolean }
```
Passe par `lib/external/adresse.ts` (recherche inverse **sans filtre de type** : le filtre `municipality` ne renvoie rien ; commune de l'adresse la plus proche). En cas d'échec ou sans réseau : commune de la gare la plus proche en base, `horsLigne: true`. Position **jamais journalisée**. **Aucun cache**, ni partagé ni serveur : aucune position gardée, même en mémoire (D051). Voir D022.

### 3.12 `GET /api/sources`
Sources affichées dans l'écran « Sources » (champ `affichee` de `config/sources.json`, D051) :
```ts
{ sources: Array<{ code: string; nom: string; producteur: string; page: string; licence: string;
                   attribution: string; dateDonnees: string | null }> }   // dateDonnees : dernier chargement réussi (Paris)
```
L'attribution exigée par chaque licence est toujours renvoyée (ODbL : « © les contributeurs d'OpenStreetMap »). Cache : `public, max-age=86400`.

### 3.13 `GET /api/lignes?bbox` (P1)
`bbox=ouest,sud,est,nord`. Retourne du **GeoJSON** simplifié (`ST_Simplify`). Cache : `public, max-age=604800`.

### 3.14 `GET /api/cyclable/[uic]` (P1)
Aménagements à moins de `rayons.cyclableM`, en GeoJSON. Cache : `public, max-age=604800`.

### 3.15 `GET /api/trains/temps-reel?depart&arrivee` (P1)
Via `lib/external/sncf.ts`. Cache serveur 30 s ; limitation d'appels par IP. Sans clé ou en échec : `503` avec `reessayable: true` ; **l'interface garde les horaires théoriques affichés** sans alarmer.
```ts
{ trains: Array<{ departPrevu: string; retardMin: number; statut: "A_L_HEURE" | "RETARD" | "SUPPRIME" }> }
```

---

## 4. Côté client

- Un **hook TanStack Query par route** dans `features/*/hooks.ts` ; clé de cache = route + paramètres.
- Les hooks lisent les **types** de `features/*/types.ts` : aucune redéfinition côté client.
- Les réponses des routes P0 sont mises en cache hors ligne par le service worker (voir `06-interface.md` § PWA).


---

## Annexe — ajouts du 30/09/2026 (maquette Explorer)

### A.1 `GET /api/mobilites/[uic]/velos` (P1)
Pour chaque station de type `VELO`/`TROTTINETTE` de `mobilite_locale` proche de la gare, lit `station_status.json` du réseau (adresse dans `config/sources.json`) via `lib/external/gbfs.ts`. Cache serveur 60 s.
```ts
{ stations: Array<{ nom: string; velosDisponibles: number | null; placesLibres: number | null;
                    ageSecondes: number | null }> }
```
Réseau sans flux ou en échec : `velosDisponibles: null` (l'interface n'affiche pas de nombre). Jamais d'erreur bloquante.

### A.2 Temps réel limité à aujourd'hui
`/api/trains/temps-reel` ne répond que pour **la date du jour à Paris** et pour les trains des **3 prochaines heures**. Pour toute autre date : pas d'appel, horaires théoriques seuls.

### A.3 « Ce week-end »
Aucune route nouvelle : l'interface envoie `date = debutDuWeekEnd(dateDuJour)` ; la fiche destination permet de repasser la même requête avec le dimanche. Fonction pure `lib/dates/debutDuWeekEnd(dateDuJour)`, testée en paires : lundi → samedi suivant · vendredi → lendemain · samedi → aujourd'hui · dimanche → aujourd'hui (il ne reste que le dimanche).

### A.4 Partage
Aucune route : le lien partagé est l'URL de la page, qui contient déjà les filtres et la destination ouverte (`06-interface.md` § 3).

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 30/09/2026 | 1.0 | Création |
| 30/09/2026 | 1.1 | Annexe : vélos disponibles (P1), temps réel limité à aujourd'hui, week-end, partage — D017 à D020 |
| 02/10/2026 | 1.2 | Route `/api/geocodage/inverse` (nom de la commune de l'utilisateur) — D022 |
| 05/10/2026 | 1.3 | `dateDuJour()` déplacée dans `@tourisme/commun` — D024 |
| 05/10/2026 | 1.4 | Adresse des flux `station_status` lue dans `config/sources.json` — D027 |
| 09/10/2026 | 1.5 | `/api/impact` : CO₂ du train `null` si le facteur n'est pas relevé ; `/api/trains` : heure actuelle par `maintenantParis()` — D031 |
| 01/11/2026 | 1.6 | § 3.4 : `prochainDepart`, `dernierRetour`, `distanceKm`, `faisableJournee` toujours rempli ; § 3.8 : trains en jumelage regroupés (`trajetIds`, `numeros`) — D040 |
| 03/11/2026 | 1.7 | § 3.4 réécrit : une destination par ville (gare en tête, `autresGares`), heures `{ s, texte, lendemain }`, `prochaineArrivee`, `sansLieu` en fin de liste, même commune exclue, CO₂ et prix inclus, cache 300 s — D047, D048 ; § 1.6 : `empriseFrance`, journal des requêtes désactivé |
| 03/11/2026 | 1.8 | § 3.4 : `titre`, `commune`, `horsVille` (gares TGV, D049) ; `peuDeLieux` remplace `sansLieu` (seuil de 3 lieux, D050) |
| 03/11/2026 | 1.10 | § 3.10 : champ `trajet` (CO₂ aller-retour, prix aller simple) — D051 |
| 03/11/2026 | 1.9 | § 1.8 bis : identifiants publics stables (`uic`, `cle`) ; § 3.5 → 3.12 précisés après l'audit E09 (fiche destination, heures `Heure`, type d'impact le moins favorable, recherche inverse sans filtre ni cache, sources affichées) — D051, D052 |
