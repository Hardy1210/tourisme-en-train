# E15 — Qualité : tests, accessibilité, performance, P1 restants

> **Semaine :** S8 (23/11 → 27/11, gel) · **Priorité :** P0 (tests, a11y de base) · P1 (reste) · **Branche :** `etape/E15-qualite`
> **Étapes préalables :** E11 → E14 · **État :** ⬜ à faire
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
Les fonctionnalités P0 doivent être terminées le 22/11. Cette étape consolide : tests manquants, accessibilité, performance, mode sombre et fonctionnalités P1 restantes, jusqu'au **gel des fonctionnalités le 27/11**.

## Documents à lire
- `CLAUDE.md`
- `docs/08-conventions-qualite.md` (§ 7, § 10)
- `docs/06-interface.md` (§ 8)
- `docs/00-vision.md` (§ 6 : liste P1)
- `docs/A-FAIRE.md`

## Objectif
Une application fiable, accessible et rapide, prête pour la livraison.

## Actions de Hardy
- [ ] Décider quels P1 restants sont faits ou reportés (au point d'équipe du lundi 23/11 au plus tard).
- [ ] Faire tester l'app par 2–3 personnes extérieures (famille, amis) et noter leurs difficultés.

## Phase d'audit
1. Lister les tests existants et les manques (fonctions pures, routes, parcours).
2. Lancer Lighthouse et un audit d'accessibilité automatique (axe via Playwright) ; lister les problèmes.
3. Proposer une liste priorisée ; attendre la validation.

## Tâches
- [ ] Compléter les tests : fonctions pures ≥ 90 %, chaque route (valide/invalide/limite), parcours complet Playwright.
- [ ] Audit accessibilité automatique intégré aux tests e2e ; corriger contraste, libellés, navigation clavier.
- [ ] Lighthouse mobile ≥ 90 (performance, accessibilité, bonnes pratiques).
- [ ] (P1) Mode sombre vérifié sur tous les écrans.
- [ ] (P1) Fonctionnalités restantes décidées par Hardy.
- [ ] Nettoyage : code mort, `TODO` résolus ou transférés dans `A-FAIRE.md`.
- [ ] Retours des testeurs extérieurs traités ou consignés.

## Critères d'acceptation
- [ ] `pnpm verifier`, `pnpm test:integration`, `pnpm test:e2e` passent.
- [ ] Lighthouse mobile ≥ 90 sur Explorer et fiche destination.
- [ ] Aucun problème d'accessibilité « critique » ou « sérieux » restant.
- [ ] **Gel des fonctionnalités le 27/11** : après cette date, seulement des corrections.

## À ne pas toucher
- Aucune nouvelle fonctionnalité après le 27/11.

## Fin d'étape
Voir `_MODELE.md`.

## Notes et modifications après coup
- 05/10/2026 : traitement des données en TypeScript + SQL au lieu de Python (D024).
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
