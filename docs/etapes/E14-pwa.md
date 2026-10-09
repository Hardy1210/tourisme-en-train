# E14 — PWA et hors ligne

> **Semaine :** S7 (16/11 → 22/11) · **Priorité :** P0 · **Branche :** `etape/E14-pwa`
> **Étapes préalables :** E11, E12 · **État :** ⬜ à faire
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
L'application doit pouvoir s'installer sur un téléphone comme une vraie app, et rester consultable sans réseau (dernières recherches). C'est aussi une sécurité pour la démo.

## Documents à lire
- `CLAUDE.md`
- `docs/06-interface.md` (§ 7)
- `docs/05-api.md` (§ 4)

## Objectif
PWA installable, fonctionnement hors ligne partiel, conforme aux stratégies de cache de `06` § 7.

## Actions de Hardy
- [ ] Fournir l'icône / le logo provisoire (ou valider une icône générée simple).
- [ ] Tester l'installation sur Android et, si possible, iPhone.

## Phase d'audit
1. Vérifier la compatibilité de Serwist avec la version de Next.js utilisée.
2. Proposer la configuration ; attendre la validation (nouvelle dépendance → `DECISIONS.md`).

## Tâches
- [ ] `app/manifest.ts` généré depuis `config/marque.ts` (nom, nom court, couleurs issues des tokens documentées, `lang: fr`, `display: standalone`).
- [ ] Icônes 192, 512, maskable, apple-touch-icon.
- [ ] `app/sw.ts` (Serwist) : précache ; stratégies par route (`06` § 7).
- [ ] Page / bandeau hors ligne ; dernières recherches lisibles.
- [ ] Invitation à l'installation discrète, après une première recherche réussie.

## Critères d'acceptation
- [ ] Lighthouse : critères PWA installable satisfaits.
- [ ] Mode avion après une recherche : la dernière liste de destinations et une fiche consultée restent lisibles **et** le bandeau hors ligne s'affiche.
- [ ] Nouvelle version déployée → le service worker se met à jour sans bloquer l'utilisateur.

## À ne pas toucher
- Logique métier, API.

## Fin d'étape
Voir `_MODELE.md`.

## Notes et modifications après coup
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
- 09/10/2026 : compatibilité Serwist / Next.js 16 vérifiée par un essai en E00 (D029) : `@serwist/turbopack` (route `app/serwist/[path]/route.ts`, `withSerwist()`, `SerwistProvider`) au lieu de `app/sw.ts` seul ; la phase d'audit n'a plus qu'à confirmer la version.
