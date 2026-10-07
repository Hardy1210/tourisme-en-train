# E06 — Doublons, Qualité Tourisme, lieux → gares, statistiques

> **Semaine :** S4 (26/10 → 01/11) · **Priorité :** P0 (rattachement, statistiques) · P1 (doublons, Qualité Tourisme) · **Branche :** `etape/E06-rattachements`
> **Étapes préalables :** E05 · **État :** ⬜ à faire
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
Les lieux sont en base (E05). Il faut les relier aux gares (lieux à distance de marche), compter les lieux par catégorie autour de chaque gare, et nettoyer les doublons entre sources. Après cette étape, les données sont complètes pour l'API.

## Documents à lire
- `CLAUDE.md`
- `docs/03-base-de-donnees.md` (§ 3.6, 3.8, 3.9)
- `docs/04-traitement-donnees.md` (§ 4.6, § 2 : `dedoublonnage`, `rayons.lieuxGareM`, `marche`)
- `docs/02-sources-donnees.md` (§ 2.8)

## Objectif
`pnpm etl rattachements` produit `lieu_gare`, `gare_stats`, marque les doublons et le label Qualité Tourisme.

## Résultat attendu
Chaque gare de la région connaît ses lieux à pied et leur nombre par catégorie.

## Actions de Hardy
- [ ] (P1) URL du fichier Qualité Tourisme (à ajouter dans `config/sources.json`).
- [ ] Relire le rapport des doublons et des correspondances incertaines.

## Phase d'audit
1. Mesurer combien de paires de lieux proches (< 75 m) existent entre sources ; examiner 20 cas.
2. Vérifier la cohérence des seuils ; proposer des ajustements **dans `parametres.json`** si besoin.
3. Proposer le plan ; attendre la validation.

## Tâches
- [ ] `transformations/rattachements.ts` + fichiers `.sql` : exécute dans l'ordre (`04` § 4.6) doublons (P1) → Qualité Tourisme (P1) → `lieu_gare` → `gare_stats`.
- [ ] Doublons : SQL avec `ST_DWithin` + `similarity()` ; priorité des sources depuis `parametres.json` ; complétion des champs vides du lieu gardé.
- [ ] Qualité Tourisme : `sources/qualite-tourisme.ts` + rapprochement (commune + similarité) ; rapport des cas incertains.
- [ ] `lieu_gare` : requête de `04` § 4.6 avec les paramètres.
- [ ] `gare_stats` : agrégation.
- [ ] Contrôles (en paires) et rapport.

## Critères d'acceptation
- [ ] Le Jardin de l'Arquebuse est rattaché à Dijon-Ville **et** un lieu à 1,6 km d'une gare ne l'est pas.
- [ ] (P1) Deux lieux identiques DATAtourisme / OSM à 20 m sont fusionnés **et** deux lieux différents à 20 m (noms différents) ne le sont pas.
- [ ] `gare_stats` : somme par gare = nombre de lignes de `lieu_gare` pour cette gare.
- [ ] Aucun lieu marqué doublon n'apparaît dans `lieu_gare`.

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
