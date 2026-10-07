# 05 — API de l'application

> **Version** 1.4 · **Date** 05/10/2026
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
6. **Positions :** `lat` et `lon` en degrés décimaux, validés (France métropolitaine : lat 41–51,5, lon −5,5–10). **Jamais journalisés.**
7. **Dates :** `date` au format `AAAA-MM-JJ`. Absente → **date du jour à Paris** calculée par `dateDuJour()` (`@tourisme/commun`). Doit être dans la fenêtre des horaires chargés, sinon `400` avec un message clair.
8. **Heures en réponse :** secondes (`departS`) **et** texte prêt à afficher (`depart: "10:12"`, `lendemain: false`).
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
| GET | `/api/destinations/[gareId]` | Résumé d'une destination (gare, lieux par catégorie, liaison) | P0 | E09 |
| GET | `/api/destinations/[gareId]/lieux` | Lieux à pied depuis une gare | P0 | E09 |
| GET | `/api/lieux/[id]` | Détail d'un lieu | P0 | E09 |
| GET | `/api/trains` | Trains directs aller et retour | P0 | E09 |
| GET | `/api/mobilites/[gareId]` | Transports sur place | P0 | E09 |
| GET | `/api/impact` | CO₂ et prix estimé d'une liaison | P0 | E09 |
| GET | `/api/geocodage` | Recherche de ville / adresse | P0 | E09 |
| GET | `/api/geocodage/inverse` | Nom de la commune d'une position | P0 | E09 |
| GET | `/api/sources` | Sources, licences, dates | P0 | E09 |
| GET | `/api/lignes` | Tracés des lignes dans une emprise | P1 | E09 |
| GET | `/api/cyclable/[gareId]` | Aménagements cyclables près d'une gare | P1 | E09 |
| GET | `/api/trains/temps-reel` | Statut temps réel des prochains trains | P1 | E09 |
| GET | `/api/mobilites/[gareId]/velos` | Vélos disponibles en direct dans les stations proches | P1 | E09 |

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
{ gares: Array<{ id: number; nom: string; commune: string | null; distanceM: number;
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
type LieuResume = { id: number; nom: string; categorie: Categorie; sousCategorie: string | null;
                    distanceM: number; dureeMarcheMin: number; imageUrl: string | null;
                    qualiteTourisme: boolean; source: string; lat: number; lon: number }
```
Cache : aucun (position).

### 3.4 `GET /api/destinations?gare&date&categories&dureeMax`
| Paramètre | Type | Défaut |
|---|---|---|
| `gare` | id de gare | obligatoire |
| `date` | `AAAA-MM-JJ` | date du jour (Paris) |
| `categories` | liste | toutes |
| `dureeMax` | une valeur de `durees.trainMaxOptionsMin` | la plus grande |
```ts
{ gareDepart: { id: number; nom: string },
  date: string,
  destinations: Array<{
    gare: { id: number; nom: string; lat: number; lon: number; dansRegion: boolean };
    dureeMin: number; trancheTemps: "<30" | "<60" | "<120" | ">=120";
    nbTrains: number; premierDepart: string; dernierDepart: string;
    typesTrain: TypeTrain[];
    lieuxParCategorie: Partial<Record<Categorie, number>>;  // seulement les catégories demandées
    faisableJournee: boolean | null;                        // null si non calculable (P1)
    lieuxCharges: boolean                                    // false hors région pilote
  }> }
```
Tri : durée croissante. Les destinations sans aucun lieu des catégories demandées restent listées si `lieuxCharges = false` (hors région), sinon elles sont exclues.
Cache : `public, max-age=3600`.

### 3.5 `GET /api/destinations/[gareId]?depuis&date`
Résumé pour l'en-tête de la fiche : gare, `lieuxParCategorie`, et si `depuis` (gare de départ) est fourni, la liaison (durée, nombre de trains, tranche). Cache : `public, max-age=3600`.

### 3.6 `GET /api/destinations/[gareId]/lieux?categories&rayon`
| Paramètre | Défaut |
|---|---|
| `categories` | toutes |
| `rayon` | `rayons.lieuxGareM` (maximum) |
```ts
{ lieux: Array<LieuResume>, total: number }   // distance et durée depuis la gare
```
Cache : `public, max-age=86400`.

### 3.7 `GET /api/lieux/[id]`
```ts
{ id, nom, categorie, sousCategorie, description, adresse, commune, url, imageUrl,
  horaires, periode, qualiteTourisme, source, attribution, lat, lon,
  garesProches: Array<{ id: number; nom: string; distanceM: number; dureeMarcheMin: number }> }
```
404 si inexistant ou marqué doublon. Cache : `public, max-age=86400`.

### 3.8 `GET /api/trains?depart&arrivee&date&depuis`
| Paramètre | Défaut |
|---|---|
| `depart`, `arrivee` | obligatoires |
| `date` | date du jour (Paris) |
| `depuis` | `HH:MM` ; défaut : maintenant si `date` = aujourd'hui, sinon `00:00` |
```ts
{ date: string,
  aller:  Array<Train>, retour: Array<Train>,
  dernierRetour: Train | null }
type Train = { trajetId: string; depart: string; arrivee: string; departS: number; arriveeS: number;
               dureeMin: number; typeTrain: TypeTrain; numero: string | null; lendemain: boolean }
```
`retour` = trains `arrivee → depart` le même jour, sans filtre `depuis`. Limite : `parametres.limites.trains`. Cache : `public, max-age=900`.

### 3.9 `GET /api/mobilites/[gareId]`
```ts
{ mobilites: Array<{ type: TypeMobilite; nom: string; lignes: string[]; operateur: string | null;
                     distanceM: number; dureeMarcheMin: number; source: string }> }
```
Tri par type puis distance. Cache : `public, max-age=86400`.

### 3.10 `GET /api/impact?depart&arrivee&type`
| Paramètre | Défaut |
|---|---|
| `depart`, `arrivee` | obligatoires |
| `type` | type de train le plus fréquent de la liaison |
```ts
{ distanceKm: number,
  co2Kg: { train: number; voitureSeule: number; voiturePartagee: number; avion: number | null },
  co2EconomiseKg: number,
  prixEstime: { min: number; max: number; devise: "EUR" } | null,   // null tant que non calibré
  source: string, dateReleve: string }
```
Calcul 100 % local (`lib/impact`), aucun appel externe. Cache : `public, max-age=86400`.

### 3.11 `GET /api/geocodage?q`
`q` : 3 à 80 caractères.
```ts
{ resultats: Array<{ libelle: string; commune: string; lat: number; lon: number;
                     type: "commune" | "adresse" | "gare" }>,
  horsLigne: boolean }
```
Passe par `lib/external/adresse.ts` (API Adresse). En cas d'échec ou sans réseau : recherche dans les communes des gares en base, `horsLigne: true`. Cache : `public, max-age=86400`.

### 3.11 bis `GET /api/geocodage/inverse?lat&lon`
Donne le nom de la commune où se trouve l'utilisateur, pour la puce « Autour de <commune> ».
| Paramètre | Type | Défaut |
|---|---|---|
| `lat`, `lon` | nombre | obligatoire |
```ts
{ commune: string; codeInsee: string | null; horsLigne: boolean }
```
Passe par `lib/external/adresse.ts` (recherche inverse de l'API Adresse, type commune). En cas d'échec ou sans réseau : commune de la gare la plus proche en base, `horsLigne: true`. Position **jamais journalisée**. Cache : aucun cache partagé (position) ; cache serveur 24 h par position arrondie à ~100 m. Voir D022.

### 3.12 `GET /api/sources`
Contenu de `source_donnees` pour l'écran Sources. Cache : `public, max-age=86400`.

### 3.13 `GET /api/lignes?bbox` (P1)
`bbox=ouest,sud,est,nord`. Retourne du **GeoJSON** simplifié (`ST_Simplify`). Cache : `public, max-age=604800`.

### 3.14 `GET /api/cyclable/[gareId]` (P1)
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

### A.1 `GET /api/mobilites/[gareId]/velos` (P1)
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
