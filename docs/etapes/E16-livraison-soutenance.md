# E16 — Livraison pour la soutenance (local, Docker)

> **Semaine :** S8 (23/11 → 29/11) · **Priorité :** P0 · **Branche :** `etape/E16-livraison`
> **Étapes préalables :** E15 · **État :** ⏸ audit fait ; profil « démo » reporté par Hardy le 27/11 (D126)
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
- [ ] Faire le test sur **un autre ordinateur** à partir du dépôt seul.
- [ ] Écrire le **scénario de démo** avec Claude (`docs/equipe/scenario-demo.md`) : 3 parcours (famille, touriste, week-end), 3 minutes. *Modifié le 27/11 :* 5 minutes, trois personnes (mère de famille, touriste, train en retard) ; brouillon écrit, à valider après le parcours complet sur l'iPhone.
- [ ] Répétition générale avec l'équipe.

## Phase d'audit
1. ✅ (27/11) Vérifier que l'image `web` de production démarre et que `/api/sante` répond : 2 min 43 s, 19 migrations, `web` healthy.
2. ✅ (27/11) Mesurer la taille d'un export de la base : 19,9 Mo.
3. ✅ (27/11) Proposer le plan ; attendre la validation : ordre validé (D126), détail du profil `demo` à présenter avant le code.

## Tâches
- [x] `apps/web/Dockerfile` de production (standalone, non-root, migrations par un service dédié) : fait pendant E17 lot 1.
- [ ] Service `migrer` à ajouter au profil `demo` : le `web` du compose local n'en a pas encore.
- [ ] Profil `demo` du compose : `db` + `web` (+ service de restauration des données).
- [ ] **Données figées** : réutiliser `infra/scripts/exporter-base.sh` et `restaurer-base.sh` (E17 lot 1) → `data/export/tourisme-AAAA-MM-JJ.dump`. L'export n'est **pas** dans Git : le README indique où le récupérer (ex. lien partagé de l'équipe) ; option `--hors-ligne` de l'ETL pour régénérer depuis `data/brut/`.
- [x] Choisir une **date de démo** couverte par les horaires chargés : le jour même (fenêtre du 27/11 au 26/01/2027, D126).
- [ ] (Option, écartée le 27/11, D126) Fond de carte hors ligne : fichier PMTiles régional servi localement.
- [ ] `README.md` : section « Lancer la démo » en 3 commandes maximum.
- [ ] `docs/equipe/scenario-demo.md` : brouillon 0.1 (27/11).

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
- 11/10/2026 : `node scripts/migrer.ts` doit tourner dans l'image web : la sortie `standalone` ne contient pas `apps/web/scripts/`, `db/migrations/`, `packages/commun/src/` ni `config/parametres.json`, à copier explicitement avec `drizzle-orm`, `pg` et `zod` (D033).
- 07/11/2026 : corrections et design continuent après le gel : refaire l'image et l'export de la démo sur la dernière version retenue avant la soutenance — D078.
- 06/11/2026 : `apps/web/Dockerfile` est fait en avance, pendant E17 phase 1 ; E16 le réutilise pour la démo locale, qui reste le filet de sécurité (D076).
- 27/11/2026 : audit ; photos (Wikimedia et DATAtourisme) et fond de carte viennent d'Internet : partage de connexion du téléphone en secours, rien à coder ; le tunnel n'est pas un secours — D126.
- 27/11/2026 (après-midi) : **profil « démo » reporté** (Hardy) : coupure d'Internet très rare le jour J ; secours = partage de connexion 4G et vidéo de la démo ; si on le fait plus tard, données par clé USB — D126, `A-FAIRE` § 3.
- 27/11/2026 : démo mobile de 5 minutes (soutenance de 12 min + 8 min de questions) ; personnes : mère de famille, touriste venu d'ailleurs, voyageur dont le train a du retard ; points à vérifier sur l'iPhone dans `docs/equipe/scenario-demo.md`.
