# E06 — Doublons, Qualité Tourisme, lieux → gares, statistiques

> **Semaine :** S4 (26/10 → 01/11) · **Priorité :** P0 (rattachement, statistiques) · P1 (doublons, Qualité Tourisme) · **Branche :** `etape/E06-rattachements`
> **Étapes préalables :** E05 · **État :** ✅ terminée (PR #52 fusionnée le 02/11)
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
Les lieux sont en base (E05). Il faut les relier aux gares (lieux à distance de marche), compter les lieux par catégorie autour de chaque gare, et nettoyer les doublons entre sources. Après cette étape, les données sont complètes pour l'API.

## Documents à lire
- `CLAUDE.md`
- `docs/03-base-de-donnees.md` (§ 3.6, 3.8, 3.9)
- `docs/04-traitement-donnees.md` (§ 4.6, § 2 : `dedoublonnage`, `rayons.lieuxGareM`, `marche`) — *Modifié après coup :* devenus `acces.rayonPiedM` et `acces` (D091)
- `docs/02-sources-donnees.md` (§ 2.8)

## Objectif
`pnpm etl rattachements` produit `lieu_gare`, `gare_stats`, marque les doublons et le label Qualité Tourisme.

## Résultat attendu
Chaque gare de la région connaît ses lieux à pied et leur nombre par catégorie.

## Actions de Hardy
- [x] ~~(P1) URL du fichier Qualité Tourisme~~ : sans objet, label lu dans DATAtourisme (D043).
- [x] Relire le rapport des doublons et des correspondances incertaines (193 décisions le 02/11 ; 8 paires restantes).

## Phase d'audit
1. Mesurer combien de paires de lieux proches (< 75 m) existent entre sources ; examiner 20 cas.
2. Vérifier la cohérence des seuils ; proposer des ajustements **dans `parametres.json`** si besoin.
3. **Regroupement en site** (demande de Hardy, 02/11) : plusieurs lieux de la même catégorie très proches deviennent une seule destination (ex. 29 grottes à Arcy-sur-Cure). Proposer une règle et un seuil de distance (`parametres.json`), avec des exemples.
4. **Lieux en longueur** (canaux, voies vertes) : les rattacher aux gares proches de leur tracé, **une seule fois par gare**, au lieu d’un point (centre du tracé). Mesurer les canaux et proposer le traitement.
5. Proposer le plan ; attendre la validation.

## Tâches
- [x] `transformations/rattachements.ts` + fichiers `.sql` : exécute dans l'ordre (`04` § 4.6) doublons (P1) → Qualité Tourisme (P1) → `lieu_gare` → `gare_stats`.
- [x] Doublons : SQL avec `ST_DWithin` + `similarity()` ; priorité des sources depuis `parametres.json` ; complétion des champs vides du lieu gardé.
- [x] ~~Qualité Tourisme : `sources/qualite-tourisme.ts` + rapprochement (commune + similarité) ; rapport des cas incertains.~~ Sans objet (D043).
- [x] `lieu_gare` : requête de `04` § 4.6 avec les paramètres.
- [x] `gare_stats` : agrégation.
- [x] Contrôles (en paires) et rapport.
- [x] Sites (`lieu.site_de`) et lieux en longueur (`lieu.trace`, canaux) — D043.

## Critères d'acceptation
- [x] Le Jardin de l'Arquebuse est rattaché à Dijon-Ville **et** un lieu à 1,6 km d'une gare ne l'est pas.
- [x] (P1) Deux lieux identiques DATAtourisme / OSM à 20 m sont fusionnés **et** deux lieux différents à 20 m (noms différents) ne le sont pas.
- [x] `gare_stats` : somme par gare = nombre de lignes de `lieu_gare` pour cette gare.
- [x] Aucun lieu marqué doublon n'apparaît dans `lieu_gare`.

## Vérifications manuelles
- Pour Dijon-Ville, Beaune et une petite gare : liste des lieux rattachés, cohérente sur une carte.

## À ne pas toucher
- Sources de lieux (E05), sauf correction constatée.
- Application web.

## Fin d'étape
Voir `_MODELE.md`.

## Notes et modifications après coup
- 05/10/2026 : traitement des données en TypeScript + SQL au lieu de Python (D024).
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
- 05/10/2026 : adresses des sources dans `config/sources.json` au lieu du code (D027).
- 02/11/2026 : audit élargi au regroupement en site et aux lieux en longueur (demande de Hardy, après D042).
- 02/11/2026 : E06 réalisée : doublons en deux paliers, sites, lieux en longueur, rayon mesuré à pied, Qualité Tourisme lu dans DATAtourisme (D043).
- 02/11/2026 : décisions manuelles (`regles/doublons_manuels.csv`), doublons dans une même source (noms identiques), Monuments historiques fermés au public écartés (D044).
- 02/11/2026 : 193 décisions manuelles de Hardy appliquées (965 doublons, 2 114 lieux à pied) ; PR #52 ouverte ; quatre corrections proposées (noms « fermé », activités, objets, château et parc) en attente de validation (`A-FAIRE` § 1).
- 02/11/2026 : noms exclus (activités, objets, fermés) et parc d'un château dans le site du château (D045), ajoutés à la PR #52.
