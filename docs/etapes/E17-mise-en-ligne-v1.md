# E17 — Mise en ligne v1 avec les SR (optionnel)

> **Semaine :** Fin (30/11 → 02/12) · **Priorité :** optionnelle · **Branche :** `etape/E17-mise-en-ligne`
> **Étapes préalables :** E16 · **État :** ⬜ à faire
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
Si le temps le permet, l'application est mise en ligne sur le serveur préparé par les SR, pour que le jury puisse la tester sur son propre téléphone et pour recueillir des retours (valorisation du défi). **La soutenance ne dépend pas de cette étape.**

## Documents à lire
- `CLAUDE.md` (§ 15)
- `docs/07-contrat-infra.md` (en entier, notamment § 6)
- `docs/equipe/guide-SR.md`

## Objectif
Application accessible en HTTPS, surveillée, sauvegardée, déployée automatiquement.

## Actions de Hardy
- [ ] Décider **le 25/11 au plus tard** si l'étape est lancée (sinon : reportée, notée dans `A-FAIRE.md`).
- [ ] Relire les pull requests des SR dans `infra/`.
- [ ] Fournir aux SR les secrets nécessaires par un canal sûr (jamais dans Git).

## Phase d'audit
1. Vérifier avec les SR que le contrat (`07`) est respecté des deux côtés.
2. Lister ce qui manque côté serveur.
3. Plan commun ; validation de Hardy.

## Tâches (côté Hardy, avec Claude Code)
- [ ] Vérifier que les images `web` et `etl` se construisent en intégration continue.
- [ ] Adapter la configuration si les SR le demandent **via une modification de `07`**.
- [ ] Vérifier en ligne : `/api/sante`, parcours complet, en-têtes de sécurité, installation PWA.

## Tâches (côté SR, voir `guide-SR.md`)
- Serveur, pare-feu, HTTPS, proxy, compose de production, secrets, sauvegardes + restauration testée, planification ETL, supervision, déploiement automatique, retour arrière.

## Critères d'acceptation
- [ ] HTTPS valide ; `/api/sante` → 200.
- [ ] Base non accessible depuis Internet.
- [ ] Une restauration de sauvegarde a été testée.
- [ ] Aucune position dans les journaux du proxy ni de l'app.

## Fin d'étape
Voir `_MODELE.md`.

## Notes et modifications après coup
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
