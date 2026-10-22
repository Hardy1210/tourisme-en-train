# E03 — Horaires GTFS SNCF

> **Semaine :** S2 (12/10 → 18/10) · **Priorité :** P0 · **Branche :** `etape/E03-horaires`
> **Étapes préalables :** E02 · **État :** 🟡 en cours
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
Les gares sont en base (E02) avec un ETL réutilisable. On charge maintenant les horaires théoriques SNCF (GTFS) : trains, arrêts, jours de circulation. C'est la matière première des trains directs (E04) et des horaires aller/retour.

## Documents à lire
- `CLAUDE.md` (§ 3 : dates et heures — **essentiel ici**)
- `docs/02-sources-donnees.md` (§ 2.2)
- `docs/03-base-de-donnees.md` (§ 3.2 → 3.4)
- `docs/04-traitement-donnees.md` (§ 4.2)

## Objectif
`pnpm etl gtfs_sncf` remplit `trajet`, `passage` et `service_jour` pour les trains qui touchent la région.

## Résultat attendu
Horaires de la fenêtre (`fenetreJoursHoraires`) chargés, rapprochés des gares, avec le type de train.

## Actions de Hardy
- [x] Trouver l'URL du GTFS SNCF (data.gouv.fr « Horaires SNCF » ou transport.data.gouv.fr) et la licence ; les donner à Claude Code (elles iront dans `config/sources.json`).
- [x] Valider la règle de détection du type de train proposée à l'audit (22/10, D036).

## Phase d'audit
1. ✅ Télécharger le ZIP, lister les fichiers, lire 20 lignes de chaque fichier utilisé.
2. ✅ Vérifier le **format réel des `stop_id`** et l'extraction de l'UIC ; mesurer le taux de rapprochement avec `gare`.
3. ✅ Examiner `agency.txt`, `routes.txt` et proposer une **règle écrite** de type de train (TER / INTERCITES / TGV / AUTRE).
4. ✅ Mesurer le volume (trajets touchant la région, passages).
5. ✅ Mettre à jour `02` § 2.2 et `04` § 4.2 avec ce qui a été constaté. Attendre la validation.

## Tâches
- [x] `sources/gtfs-sncf.ts` : téléchargement du ZIP, lecture en flux des fichiers utiles (yauzl + csv-parse) et `COPY` **brut** (texte) dans des tables temporaires (`04` § 4.2).
- [x] `transformations/gtfs.sql` (testé sur le GTFS miniature) :
  - UIC depuis `stop_id` : `substring(stop_id from '(\d{8})')`
  - heure en secondes : `"25:10:00"` → 90 600
  - type de train selon la règle validée
  - dépliage du calendrier avec `generate_series` + exceptions de `calendar_dates` → paires (service_id, date)
- [x] Filtrer les trajets touchant au moins une gare `dans_region`, garder tous leurs arrêts.
- [x] Date de début de fenêtre = **date du jour à Paris** (`dateDuJour()` de `@tourisme/commun`), passée en **paramètre** de la requête (jamais `CURRENT_DATE`).
- [x] Chargement transactionnel `trajet`, `passage`, `service_jour`.
- [x] Contrôles de `04` § 4.2.
- [x] GTFS miniature dans `etl/tests/donnees/gtfs_mini/` : 3 trajets, dont un après minuit, un avec exception `calendar_dates`, une période qui traverse le changement d'heure du 25/10.

## Critères d'acceptation
- [x] `pnpm etl gtfs_sncf` → `SUCCES` ; relancé → `IGNORE`.
- [x] Taux de rapprochement arrêts → gares ≥ 90 % (sinon analyse dans le rapport). (22/10 : 98,4 % ; seuil `controles.rapprochementGtfsMinPct`.)
- [x] Tests en paires : un service actif le mardi est présent **et** absent le dimanche ; une exception de type 2 le retire **et** une de type 1 l'ajoute.
- [x] Un passage à `25:10:00` est stocké à 90 600 s.
- [x] Le calendrier déplié est correct le 24/10 **et** le 26/10 (changement d'heure).
- [x] La requête de référence *trains directs A → B à une date* (`03-base-de-donnees.md` § 5) tourne sur les vraies données ; temps mesuré et noté dans `JOURNAL.md`. (22/10 : ~5 ms, Dijon → Beaune le 26/10 : 46 trains.)

## Vérifications manuelles
- Requête SQL : trains Dijon-Ville → Beaune un jour de semaine ; comparer 3 horaires avec SNCF Connect.

## À ne pas toucher
- Calcul des liaisons (E04).
- Application web.

## Fin d'étape
Voir `_MODELE.md`. Documenter la règle de type de train dans `04` § 4.2.

## Notes et modifications après coup
- 05/10/2026 : traitement des données en TypeScript + SQL au lieu de Python (D024).
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
- 05/10/2026 : adresses des sources dans `config/sources.json` au lieu du code (D027).
- 11/10/2026 : critère ajouté : requête de référence exécutée sur les vraies données, temps mesuré (D032).
- 22/10/2026 : audit fait (URL trouvée par Claude Code, validée par Hardy) ; pas de `calendar.txt` ; type de train par le `stop_id` ; cars exclus ; aucun rattrapage par distance ; colonnes `montee_interdite` / `descente_interdite` (migration) ; Corbigny et Flez-Cuzy signalées — D036.
- 22/10/2026 : premier chargement réel : 3 516 trajets, 33 650 passages, 11 100 jours de circulation, ~26 s ; `IGNORE` seulement si même fichier **et** déjà chargé le jour même à Paris (la fenêtre avance chaque jour).
