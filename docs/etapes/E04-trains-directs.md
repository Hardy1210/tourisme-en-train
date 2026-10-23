# E04 — Trains directs (liaisons entre gares)

> **Semaine :** S3 (19/10 → 25/10) · **Priorité :** P0 · **Branche :** `etape/E04-trains-directs`
> **Étapes préalables :** E03 · **État :** ⬜ à faire
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
Les horaires sont chargés (E03). On précalcule, pour chaque gare de la région et chaque jour de la fenêtre, toutes les gares atteignables **sans correspondance**, avec la durée la plus courte, la fréquence et les heures extrêmes. C'est ce qui rend l'écran Explorer instantané.

## Documents à lire
- `CLAUDE.md`
- `docs/03-base-de-donnees.md` (§ 3.5)
- `docs/04-traitement-donnees.md` (§ 4.3, § 2 : `fenetreJoursLiaisons`, `rail.coefDetour`)

## Objectif
`pnpm etl liaisons` remplit `liaison_directe`.

## Résultat attendu
Table `liaison_directe` complète sur la fenêtre, avec distance estimée ; durée d'exécution mesurée.

## Actions de Hardy
- [ ] Valider le plan ; vérifier 3 liaisons à la main contre SNCF Connect.

## Phase d'audit
1. Mesurer le nombre de paires par trajet et le volume attendu.
2. Tester la requête de `04` § 4.3 sur une journée ; mesurer le temps.
3. Proposer le plan ; attendre la validation.

## Tâches
- [ ] **Migration de la table `liaison_directe`** (retirée du schéma initial de E01), selon la décision prise sur les données des cartes de destination (`A-FAIRE` § 1) ; mise à jour de `03` § 3.5.
- [ ] `transformations/liaisons.sql` + `liaisons.ts` : exécution des deux requêtes SQL de `04` § 4.3 (paramètres depuis `parametres.json`, date du jour à Paris en paramètre).
- [ ] Distance : `ST_Distance(gare_dep.geom, gare_arr.geom) / 1000 × rail.coefDetour`, arrondie à 0,1 km.
- [ ] Chargement transactionnel (suppression totale puis insertion).
- [ ] Contrôles (en paires) de `04` § 4.3.
- [ ] Mesure et affichage de la durée dans le rapport.
- [ ] Tests Vitest (base de test) sur le GTFS miniature : une liaison A → C existe quand un trajet passe par A, B, C **et** C → A n'existe pas si aucun trajet ne va dans ce sens.

## Critères d'acceptation
- [ ] Dijon-Ville → Beaune existe un jour de semaine, avec `nb_trains` > 5 **et** Beaune → Dijon-Ville aussi.
- [ ] Aucune `duree_min ≤ 0` ; aucune liaison d'une gare vers elle-même.
- [ ] Des destinations hors région apparaissent (ex. Lyon, Paris) si des trains directs existent.
- [ ] Durée d'exécution notée dans le rapport ; si > 5 min, signalée à Hardy avant toute optimisation.
- [ ] La requête de référence *destinations depuis une gare à une date* (`03-base-de-donnees.md` § 5) tourne sur les vraies données ; elle répond en **moins de 300 ms** ; temps mesuré et noté dans `JOURNAL.md`.

## Vérifications manuelles
- 3 liaisons comparées à SNCF Connect (durée, premier et dernier train).

## À ne pas toucher
- Tables d'horaires (E03).
- Application web.

## Fin d'étape
Voir `_MODELE.md`.

## Notes et modifications après coup
- 05/10/2026 : traitement des données en TypeScript + SQL au lieu de Python (D024).
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
- 09/10/2026 : la table `liaison_directe` n'est plus créée en E01 : sa migration ouvre cette étape, après la décision sur les données des cartes de destination (dernier retour, prochain train, faisable dans la journée).
- 11/10/2026 : critère ajouté : requête de référence exécutée sur les vraies données, temps mesuré (D032).
- 22/10/2026 : une paire A → B n'est retenue que si la montée est possible en A et la descente en B (`passage.montee_interdite`, `passage.descente_interdite`, `04` § 4.3) — D036.
- 22/10/2026 : **trains en jumelage** constatés au chargement E03 : deux trajets (deux numéros, ex. TGV 12177 et 5537) avec les mêmes horaires sur une partie du parcours (rames attelées). 139 départs en double le 26/10. À traiter dans le calcul des liaisons (`nb_trains`) et l'affichage : compter une seule fois une même paire (gare, heure de départ, gare, heure d'arrivée). À décider à l'audit de E04.
- 23/10/2026 : décision « cartes de destination » proposée (`A-FAIRE` § 1 : `dernier_retour_s`, `faisable_journee`, départ **ou** arrivée dans la région, prochain train à la demande), à valider avant la migration. Gares désormais reconnues par un code UIC commun (D039) : aucune gare en double, sinon le chargement des gares échoue.
