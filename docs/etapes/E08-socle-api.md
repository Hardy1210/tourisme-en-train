# E08 — Socle de l'API + routes gares, autour, destinations

> **Semaine :** S5 (02/11 → 08/11) · **Priorité :** P0 · **Branche :** `etape/E08-socle-api`
> **Étapes préalables :** E04, E06 · **État :** ⬜ à faire
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
Les données sont prêtes (E02–E06). On construit le socle de l'API (validation, erreurs, cache, journal) et les trois routes qui alimentent l'écran Explorer : gares proches, autour de moi, destinations en train direct. Plus la route de santé, attendue par les SR.

## Documents à lire
- `CLAUDE.md`
- `docs/01-architecture.md` (§ 3, § 4, § 5)
- `docs/05-api.md` (§ 1, § 3.1 → 3.4)
- `docs/03-base-de-donnees.md` (§ 5)
- `docs/08-conventions-qualite.md` (§ 1, § 5, § 7)

## Objectif
Les routes `/api/sante`, `/api/gares/proches`, `/api/autour`, `/api/destinations` répondent selon leur contrat.

## Résultat attendu
Socle `lib/http` réutilisable ; 4 routes testées en intégration sur l'échantillon et vérifiées à la main sur les vraies données.

## Actions de Hardy
- [ ] Valider le plan.
- [ ] Appeler les routes à la main (navigateur ou outil HTTP) avec les exemples fournis.

## Phase d'audit
1. Vérifier que les requêtes de référence de `03` § 5 fonctionnent sur les vraies données (temps de réponse).
2. Vérifier que `parametres.ts` et `env.ts` (E00) sont prêts.
3. Proposer le plan de fichiers par fonctionnalité ; attendre la validation.

## Tâches
**Socle**
- [ ] `lib/http/erreurs.ts` : classes `ParametreInvalide`, `Introuvable`, `ServiceExterneIndisponible` + traduction en réponse (`05` § 1.5).
- [ ] `lib/http/valider.ts` : lecture et validation Zod des paramètres de requête.
- [ ] `lib/http/reponse.ts` : réponse JSON + `Cache-Control` selon la route.
- [ ] `lib/db/requetes-partagees.ts` si une requête sert à plusieurs fonctionnalités.
- [ ] `lib/geo/` : `distanceMarche`, `dureeMarche`, `dureeVelo`, `dureeVoiture` (purs, testés en paires).
- [ ] `lib/dates/` : `trancheTemps(dureeMin)` (pur, testé aux bornes 29/30/59/60/119/120).

**Routes**
- [ ] `/api/sante` (`05` § 3.1).
- [ ] `features/gares/` : schémas, service, requêtes → `/api/gares/proches`.
- [ ] `features/lieux/` (partie « autour ») → `/api/autour`.
- [ ] `features/destinations/` → `/api/destinations` (liaison + `gare_stats` + tranche + `lieuxCharges`).
- [ ] Tests d'intégration sur la base de test (échantillon) pour chaque route : cas valide, paramètre invalide, cas limite.

## Critères d'acceptation
- [ ] Contrats de `05` respectés à la lettre (noms des champs, types, codes d'erreur).
- [ ] Position hors France → `400` **et** position à Dijon → `200`.
- [ ] Date hors fenêtre → `400` avec message clair **et** date absente → date du jour à Paris.
- [ ] `/api/destinations` depuis Dijon-Ville : Beaune dans la tranche `<30`.
- [ ] Temps de réponse < 300 ms en local sur les vraies données.
- [ ] Aucune position dans les journaux (vérifié).

## Vérifications manuelles
- Appeler chaque route avec les coordonnées de la place Darcy (Dijon) et comparer à la réalité.

## À ne pas toucher
- Interface (E10+).
- Schéma (sauf écart constaté).

## Fin d'étape
Voir `_MODELE.md`. Mettre à jour `05` si un contrat a dû évoluer (avec décision).

## Notes et modifications après coup
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
