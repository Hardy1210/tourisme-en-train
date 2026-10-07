# E13 — Page « L'âme du produit » et écran Sources

> **Semaine :** S7 (16/11 → 22/11) · **Priorité :** P0 · **Branche :** `etape/E13-ame-sources`
> **Étapes préalables :** E10 (E09 pour `/api/sources`) · **État :** ⬜ à faire
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
Le jury doit comprendre en une page pourquoi le projet existe (le pitch) et d'où viennent les données (obligation de licence). Ces deux écrans sont accessibles depuis « À propos ».

## Documents à lire
- `CLAUDE.md`
- `docs/06-interface.md` (§ 5, § 9)
- `docs/00-vision.md` (§ 1 → 3)
- `docs/05-api.md` (§ 3.12)

## Objectif
Page de présentation narrative + écran Sources complet.

## Actions de Hardy
- [ ] Fournir le texte **final** du pitch → `docs/equipe/pitch.md` (source unique des textes de la page).
- [ ] Fournir ou valider les captures d'écran de l'app pour la section « 3 étapes ».

## Phase d'audit
1. Vérifier que `docs/equipe/pitch.md` existe et que ses chiffres correspondent à `00` § 2 (sources citées).
2. Proposer la structure de la page ; attendre la validation.

## Tâches
- [ ] `features/presentation/` : textes issus de `pitch.md` (copiés dans un fichier de contenu typé, pas dispersés dans le JSX).
- [ ] Sections : accroche, constat, 3 chiffres sourcés, solution en 3 étapes (captures), pour qui, ce que ça change, conclusion + « Ouvrir l'application ».
- [ ] Écran Sources : `/api/sources` + attributions carte + mention du défi data.gouv.fr.
- [ ] Le nom de la marque vient de `marque.ts` partout.

## Critères d'acceptation
- [ ] Chaque chiffre affiché a sa source visible.
- [ ] Toutes les sources de `source_donnees` apparaissent avec leur licence.
- [ ] Lisible en 390 px et 1440 px ; aucun texte en dur hors du fichier de contenu.

## À ne pas toucher
- Écrans Explorer et fiche destination.

## Fin d'étape
Voir `_MODELE.md`.

## Notes et modifications après coup
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
