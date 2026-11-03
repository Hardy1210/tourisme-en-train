# E08 — Socle de l'API + routes gares, autour, destinations

> **Semaine :** S5 (02/11 → 08/11) · **Priorité :** P0 · **Branche :** `etape/E08-socle-api`
> **Étapes préalables :** E04, E06 · **État :** 🟡 en cours
> **Version de la fiche** 1.1 · **Date** 03/11/2026

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
- [x] Valider le plan (03/11).
- [ ] Appeler les routes à la main (navigateur ou outil HTTP) avec les exemples fournis.

## Phase d'audit
1. Vérifier que les requêtes de référence de `03` § 5 fonctionnent sur les vraies données (temps de réponse).
2. Vérifier que `parametres.ts` et `env.ts` (E00) sont prêts.
3. Proposer le plan de fichiers par fonctionnalité ; attendre la validation.

## Tâches
**Socle**
- [x] `lib/http/erreurs.ts` : classes `ParametreInvalide`, `Introuvable`, `ServiceExterneIndisponible` + traduction en réponse (`05` § 1.5).
- [x] `lib/http/valider.ts` : lecture et validation Zod des paramètres de requête.
- [x] `lib/http/reponse.ts` : réponse JSON + `Cache-Control` selon la route.
- [x] `lib/db/requetes-partagees.ts` si une requête sert à plusieurs fonctionnalités.
- [x] `lib/geo/` : `distanceMarche`, `dureeMarche`, `dureeVelo`, `dureeVoiture` (purs, testés en paires).
- [x] `lib/dates/` : `trancheTemps(dureeMin)` (pur, testé aux bornes 29/30/59/60/119/120).

**Routes**
- [x] `/api/sante` (`05` § 3.1).
- [x] `features/gares/` : schémas, service, requêtes → `/api/gares/proches`.
- [x] `features/lieux/` (partie « autour ») → `/api/autour`.
- [x] `features/destinations/` → `/api/destinations` (liaison + `gare_stats` + tranche + `lieuxCharges`).
- [x] Tests d'intégration sur la base de test (échantillon) pour chaque route : cas valide, paramètre invalide, cas limite.

## Critères d'acceptation
- [x] Contrats de `05` respectés à la lettre (noms des champs, types, codes d'erreur).
- [x] Position hors France → `400` **et** position à Dijon → `200`.
- [x] Date hors fenêtre → `400` avec message clair **et** date absente → date du jour à Paris.
- [x] `/api/destinations` depuis Dijon-Ville : Beaune dans la tranche `<30`.
- [x] Depuis Dijon : une seule carte « Paris » (Gare de Lyon en tête, Bercy dans `autresGares`) et une seule « Lyon » ; Dijon Porte Neuve absente ; Paris et Lyon présentes (limite 150).
- [x] Destination de la région sans lieu en fin de liste **et** retirée par un filtre d'envies ; destination hors région gardée par ce filtre.
- [x] Gare TGV : sa propre carte au nom de la gare (D049) ; moins de 3 lieux → fin de liste (D050).
- [x] Temps de réponse < 300 ms en local sur les vraies données.
- [x] Aucune position dans les journaux (vérifié).

## Vérifications manuelles
- Appeler chaque route avec les coordonnées de la place Darcy (Dijon) et comparer à la réalité.

## À ne pas toucher
- Interface (E10+).
- Schéma (sauf écart constaté).

## Fin d'étape
Voir `_MODELE.md`. Mettre à jour `05` si un contrat a dû évoluer (avec décision).

## Notes et modifications après coup
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
- 03/11/2026 : audit et décisions de Hardy avant le code — D047 (une destination par ville, gare en tête, aucune durée minimale, sans lieu en fin de liste, limite 150, CO₂ et prix dans `/api/destinations`, `features/sante`), D048 (CO₂ Intercités et avion, prix calibré sur les tarifs TGV). `lib/impact` avancé d'E09 à E08. L'échantillon reçoit liaisons et `gare_stats` (`lieu_gare` attendra E09, qui en a besoin).
- 03/11/2026 : vérifié sur les vraies données (Dijon, 03/11) : 101 destinations (durée max 180 min), Paris (+ Bercy) et Lyon (+ Perrache) une fois, Dijon absente, 8 sans lieu en fin de liste ; temps de réponse 13 → 80 ms ; aucune position dans les journaux après désactivation du journal des requêtes de Next.js. Relevé : les gares TGV hors de leur ville donnaient leur commune comme nom de carte (« Meroux-Moval » pour Belfort - Montbéliard TGV).
- 03/11/2026 : décisions de Hardy — D049 (gare TGV : sa propre carte, au nom de la gare, « à <commune> » dessous) et D050 (moins de 3 lieux à pied → fin de liste ; `peuDeLieux` remplace `sansLieu`).
