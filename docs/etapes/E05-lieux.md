# E05 — Lieux : DATAtourisme, OpenStreetMap (+ lieux culturels, festivals)

> **Semaine :** S3 (19/10 → 25/10) · **Priorité :** P0 (DATAtourisme, OSM) · P1 (lieux culturels, festivals) · **Branche :** `etape/E05-lieux`
> **Étapes préalables :** E02 · **État :** ⬜ à faire
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
Gares et trains directs sont prêts (E02–E04). Il faut maintenant **ce qu'on vient voir** : musées, châteaux, parcs, aires de jeux, sites naturels, festivals. Chaque source est normalisée vers un format commun et classée dans l'une des 5 catégories.

## Documents à lire
- `CLAUDE.md`
- `docs/GLOSSAIRE.md` (catégories)
- `docs/02-sources-donnees.md` (§ 2.3, 2.4, 2.6, 2.7)
- `docs/03-base-de-donnees.md` (§ 3.6, 3.7)
- `docs/04-traitement-donnees.md` (§ 4.4, 4.5)

## Objectif
`pnpm etl regles`, `datatourisme`, `osm` (puis `lieux_culturels`, `festivals`) remplissent `lieu` avec des lieux correctement classés.

## Résultat attendu
- Table `lieu` remplie pour la région ; chaque lieu a une catégorie.
- `regles/categories.csv` versionné et complété.
- Rapports de valeurs non classées relus.

## Actions de Hardy
- [ ] Trouver l'URL du **CSV DATAtourisme Bourgogne-Franche-Comté** sur data.gouv.fr (elle ira dans `config/sources.json` : c'est la principale adresse propre à la région).
- [ ] Tester une extraction **GéoDataMine** (aires de jeux, parcs, points de vue…) ; à défaut, valider la requête Overpass proposée.
- [ ] (P1) URL de la Base des lieux culturels et de la liste des festivals.
- [ ] **Relire `categories_non_classees_<source>.csv`** après chaque chargement et compléter `categories.csv` (c'est un travail de tableau, pas de code).

## Phase d'audit
1. Lire les vraies colonnes de chaque fichier ; corriger `02` si besoin.
2. Lister les 50 valeurs de `Categories_de_POI` les plus fréquentes ; proposer une première version de `categories.csv`.
3. Estimer le nombre de lieux attendus par catégorie.
4. Proposer le plan ; attendre la validation.

## Tâches
- [ ] `etl/src/regles/categories.csv` (colonnes `source;cle;valeur;categorie;sous_categorie;priorite`) : première version couvrant DATAtourisme et les tags OSM de `02` § 2.4 ; lignes d'exclusion (hébergement, restauration, commerces).
- [ ] `pnpm etl regles` : charge le CSV dans `categorie_regle` (validation : catégories autorisées uniquement).
- [ ] `transformations/lieux.ts` (pur, testé) : normalisation commune, nettoyage de description (HTML retiré, 500 caractères au mot près), casse du nom, validation d'URL.
- [ ] `transformations/categories.ts` (pur, testé) : application des règles, meilleure priorité, rapport des valeurs non classées.
- [ ] `sources/datatourisme.ts` : lecture CSV en flux, séparation `|`, position, filtre région.
- [ ] `sources/osm.ts` : lecture de l'extraction (GéoDataMine ou Overpass), centroïdes, règle « sans nom » (aires de jeux uniquement).
- [ ] (P1) `sources/lieux-culturels.ts`, `sources/festivals.ts` (`periode`).
- [ ] Chargement transactionnel par source (`DELETE … WHERE source = :source` puis insertion).

## Critères d'acceptation
- [ ] Chaque source → `SUCCES` ; rapport avec lignes lues / valides / chargées / écartées.
- [ ] Tests en paires : `leisure=playground` → `enfants` **et** `amenity=restaurant` → exclu ; une catégorie DATAtourisme « musée » → `patrimoine` **et** « hôtel » → exclu.
- [ ] Aucun lieu hors région ; aucun lieu sans catégorie.
- [ ] Le Jardin de l'Arquebuse (Dijon) et les Hospices de Beaune sont présents (vérification d'échantillon).
- [ ] Rapport des valeurs non classées relu par Hardy ; règles complétées.

## Vérifications manuelles
- 10 lieux au hasard : nom, catégorie et position cohérents.
- Compter les lieux par catégorie ; signaler une catégorie anormalement vide.

## À ne pas toucher
- Doublons, rattachements aux gares (E06).
- Application web.

## Fin d'étape
Voir `_MODELE.md`. Mettre à jour `02` et `04` avec les colonnes et règles réelles.

## Notes et modifications après coup
- 05/10/2026 : traitement des données en TypeScript + SQL au lieu de Python (D024).
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
- 05/10/2026 : adresses des sources dans `config/sources.json` au lieu du code (D027).
