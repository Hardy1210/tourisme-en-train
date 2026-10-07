# E16 — Livraison pour la soutenance (local, Docker)

> **Semaine :** S8 (23/11 → 29/11) · **Priorité :** P0 · **Branche :** `etape/E16-livraison`
> **Étapes préalables :** E15 · **État :** ⬜ à faire
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
La soutenance a lieu en local. L'application complète doit démarrer **en une seule commande** sur n'importe quel ordinateur avec Docker, avec des données figées, et fonctionner même si le réseau est mauvais le jour J.

## Documents à lire
- `CLAUDE.md`
- `docs/07-contrat-infra.md` (en entier)
- `docs/01-architecture.md` (§ 7)

## Objectif
`docker compose --profile demo up -d` → application prête, données incluses, en moins de 5 minutes sur une machine propre.

## Actions de Hardy
- [ ] Faire le test sur **un autre ordinateur** (celui d'un SR, idéalement) à partir du dépôt seul.
- [ ] Écrire le **scénario de démo** avec Claude (`docs/equipe/scenario-demo.md`) : 3 parcours (famille, touriste, week-end), 3 minutes.
- [ ] Répétition générale avec l'équipe.

## Phase d'audit
1. Vérifier que l'image `web` de production démarre et que `/api/sante` répond.
2. Mesurer la taille d'un export de la base.
3. Proposer le plan ; attendre la validation.

## Tâches
- [ ] `apps/web/Dockerfile` de production (standalone, non-root, migrations au démarrage ou service dédié).
- [ ] Profil `demo` du compose : `db` + `web` (+ service de restauration des données).
- [ ] **Données figées** : script `scripts/exporter-donnees` (pg_dump) → `data/export/tourisme-AAAA-MM-JJ.dump` ; script `scripts/restaurer-donnees`. L'export n'est **pas** dans Git : le README indique où le récupérer (ex. lien partagé de l'équipe) ; option `--hors-ligne` de l'ETL pour régénérer depuis `data/brut/`.
- [ ] Choisir une **date de démo** couverte par les horaires chargés ; la documenter.
- [ ] (Option) Fond de carte hors ligne : fichier PMTiles régional servi localement.
- [ ] `README.md` : section « Lancer la démo » en 3 commandes maximum.
- [ ] `docs/equipe/scenario-demo.md`.

## Critères d'acceptation
- [ ] Sur une machine propre : clonage → récupération de l'export → une commande → app fonctionnelle.
- [ ] Réseau coupé : Explorer, fiche destination, impact et recherche de ville (repli) fonctionnent ; seule la carte de fond peut manquer (sauf option PMTiles).
- [ ] Répétition réalisée ; problèmes consignés dans `JOURNAL.md`.

## À ne pas toucher
- Fonctionnalités (gel depuis le 27/11).

## Fin d'étape
Voir `_MODELE.md`.

## Notes et modifications après coup
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
