# E09 — Routes lieux, trains, mobilités, impact, géocodage, sources

> **Semaine :** S5 (02/11 → 08/11) · **Priorité :** P0 (+ P1 : lignes, cyclable, temps réel) · **Branche :** `etape/E09-api-complete`
> **Étapes préalables :** E07, E08 · **État :** ✅ terminée (PR #55)
> **Version de la fiche** 1.1 · **Date** 03/11/2026

## Contexte minimal
Le socle de l'API existe (E08). On termine les routes nécessaires à la fiche destination : lieux, trains aller/retour, transports sur place, impact (CO₂ et prix), recherche de ville, sources. En P1 : tracés, cyclable, temps réel.

## Documents à lire
- `CLAUDE.md`
- `docs/05-api.md` (§ 3.5 → 3.15)
- `docs/04-traitement-donnees.md` (§ 2 `impact`, `prix` ; § 6 calculs)
- `docs/02-sources-donnees.md` (§ 3, § 4)

## Objectif
Toutes les routes P0 de `05` répondent selon leur contrat ; l'impact est calculé localement.

## Actions de Hardy
- [x] **Relever les facteurs CO₂ manquants** (Intercités, avion) sur Impact CO2 (ADEME) et les reporter dans `parametres.json` avec la date. *Fait en E08 le 03/11 (D048).*
- [x] **Trouver une base de prix au kilomètre** (tarifs TER publiés de la région ou autre source publique) ; si rien de fiable : laisser `prix.aCalibrer = true` (le prix ne s'affiche pas) et le noter dans `A-FAIRE.md`. *Fait en E08 le 03/11 : calibré sur les tarifs TGV de la SNCF (D048).*
- [ ] (P1) Demander une clé API SNCF ; la mettre dans `.env` (`SNCF_CLE_API`).
- [x] Vérifier si l'API Adresse demande une clé (a priori non). *Aucune clé (03/11) ; nouvelle adresse Géoplateforme (D051).*

## Phase d'audit
1. Vérifier les requêtes trains aller/retour sur 3 liaisons réelles (y compris un train après minuit).
2. Vérifier la disponibilité de l'API Adresse depuis le poste.
3. Proposer le plan ; attendre la validation.

## Tâches
- [x] `lib/impact/` : `co2(...)`, `prixEstime(...)` (purs, testés : TER vs voiture seule, voiture partagée, avion sous/au-dessus du seuil ; prix `null` si non calibré). *Fait en E08 (`impactLiaison`, `prixEstime`, D047, D048) : `/api/impact` les réutilise.*
- [x] `features/destinations/` : `/api/destinations/[uic]`, `/api/destinations/[uic]/lieux`.
- [x] `features/lieux/` : `/api/lieux/[cle]` (doublon et membre de site → lieu gardé ; 404 si inconnu, D052).
- [x] `features/trains/` : `/api/trains` (aller, retour, dernier retour, `lendemain`).
- [x] `features/mobilites/` : `/api/mobilites/[uic]`.
- [x] `features/impact/` : `/api/impact`.
- [x] `lib/external/adresse.ts` + `features/localisation/` : `/api/geocodage` avec **repli hors ligne** sur les communes des gares.
- [x] `/api/geocodage/inverse` (`05` § 3.11 bis) : recherche inverse de l'API Adresse ; repli sur la commune de la gare la plus proche ; position jamais journalisée.
- [x] `/api/sources` (`features/presentation`).
- [ ] (P1, **hors E09**, D051) `/api/lignes`, `/api/cyclable/[uic]` (GeoJSON simplifié).
- [ ] (P1, **hors E09**, D051) `lib/external/sncf.ts` + `/api/trains/temps-reel` : **uniquement aujourd'hui, trains des 3 prochaines heures** (`05` § A.2), cache 30 s, limitation d'appels, `503` sans clé.
- [ ] (P1, **hors E09**, D051) `lib/external/gbfs.ts` + `/api/mobilites/[uic]/velos` (`05` § A.1) : cache 60 s, `velosDisponibles: null` si pas de flux.
- [x] `lib/dates/debutDuWeekEnd(dateDuJour)` (pur, testé en paires : lundi, vendredi, samedi, dimanche) — `05` § A.3.
- [x] Tests d'intégration (cas valide, invalide, limite) pour chaque route.

## Critères d'acceptation
- [x] Trains Dijon-Ville ↔ Beaune : aller et retour listés, dernier retour correct.
- [x] Un train à 25:10 s'affiche « 01:10 » avec `lendemain: true` **et** un train à 23:50 avec `lendemain: false`.
- [x] `/api/impact` fonctionne **réseau coupé** (calcul local, aucun appel externe).
- [x] `/api/geocodage` réseau coupé → résultats depuis la base avec `horsLigne: true`.
- [x] `/api/geocodage/inverse` : position à Talant → « Talant » **et** réseau coupé → commune de la gare la plus proche avec `horsLigne: true`.
- [x] Aucune valeur de facteur ou de prix en dur dans le code.

## Vérifications manuelles
- Comparer 3 horaires et 1 fourchette de prix (si calibré) avec SNCF Connect. *Fait par Hardy le 03/11 : TGV 12177 Dijon 16:17 → Beaune 16:37 conforme (retard temps réel de 5 min affiché par SNCF Connect, hors périmètre P0), dernier retour 21:58 conforme, prix Dijon → Paris ≈ 40–66 € jugé correct ; règle des retours corrigée (D051).*

## À ne pas toucher
- Interface (E10+).

## Fin d'étape
Voir `_MODELE.md`. Consigner les facteurs relevés dans `DECISIONS.md` (source, date).

## Notes et modifications après coup
- 30/09/2026 : ajout vélos disponibles, temps réel limité à aujourd'hui, début du week-end (D018, D019, D021).
- 02/10/2026 : ajout de `/api/geocodage/inverse` (D022).
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
- 03/11/2026 : audit et décisions de Hardy — D051 (contrats, routes P1 hors E09, API Adresse Géoplateforme, recherche inverse sans cache, sources affichées), D052 (code UIC pour les gares, clé de source pour les lieux, migration `0011_lieu_cle`).
- 03/11/2026 : vérifié sur les vraies données — Dijon → Beaune 45 trains (TGV 12177 / 5537 en jumelage réuni), Joigny 24:06 → « 00:06 » lendemain, fiche Beaune = carte (18 min, 45 trains, ≈ 7–12 €), lien vers un doublon OSM → lieu DATAtourisme gardé, Talant trouvée, 26 sources dont l'attribution OpenStreetMap ; 13 → 110 ms (API Adresse jusqu'à 1 s).
