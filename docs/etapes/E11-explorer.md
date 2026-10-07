# E11 — Écran Explorer

> **Semaine :** S6 (09/11 → 15/11) · **Priorité :** P0 (tracés des lignes P1) · **Branche :** `etape/E11-explorer`
> **Étapes préalables :** E08, E10 · **État :** ⬜ à faire
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
C'est **le cœur du produit** : à l'ouverture, l'utilisateur voit tout de suite ce qu'il y a autour de lui et où il peut aller en train direct. L'API (E08) et le socle visuel (E10) sont prêts.

## Documents à lire
- `CLAUDE.md`
- `docs/06-interface.md` (§ 1, § 3, § 6, § 8)
- `docs/05-api.md` (§ 3.2 → 3.4, § 3.11, § 4)
- Maquette Claude Design de l'écran Explorer (via le MCP ; captures dans `design/maquettes/`) — voir `06` § 4 bis

## Objectif
L'écran Explorer complet, en mobile et en desktop, avec tous ses états.

## Actions de Hardy
- [ ] Indiquer la maquette de référence et valider l'écran **en le testant sur son téléphone**.

## Phase d'audit
1. Relire la maquette : aspect à copier, comportements à vérifier.
2. Vérifier que les hooks API nécessaires existent ou lister ceux à créer.
3. Proposer le découpage en composants ; attendre la validation.

## Tâches
- [ ] `features/localisation/` : hook de position du navigateur (permission, erreurs, délai), repli vers la recherche de ville (`/api/geocodage`), hors région pilote.
- [ ] **État des filtres dans l'URL** (`?lat&lon&date&categories&rayon&dureeMax`) : partageable, retour arrière fonctionnel.
- [ ] En-tête : puce de localisation « Autour de <commune> » (nom via `/api/geocodage/inverse`, « Autour de vous » en attendant), puce de date (Aujourd'hui · Demain · **Ce week-end** via `debutDuWeekEnd` · Choisir).
- [ ] Rangée de catégories + feuille « Filtres » (rayon, durée max ; « faisable dans la journée » P1).
- [ ] `features/carte/` : carte MapLibre + OpenFreeMap, style lu depuis les tokens ; point utilisateur pulsant ; épingles de lieux par catégorie ; gares de destination colorées par tranche de temps + légende ; **segments droits** gare de départ → destinations ; **étiquettes** pour les 5 plus proches, au survol et à la sélection ; mini-fiche au toucher ; recentrer ; attribution. (P1) vrais tracés via `/api/lignes`.
- [ ] Desktop : **survol croisé** carte de destination ↔ gare sur la carte.
- [ ] (P1) Bouton **Partager** (partage natif, sinon copie du lien + « Lien copié »).
- [ ] Feuille de résultats : « Votre gare », « À deux pas de vous », « En train direct depuis… » (cartes de destination : « Faisable dans la journée » **ou** « Retour tôt, plutôt sur 2 jours » ; prix **seulement s'il est calibré**, sans espace vide sinon).
- [ ] Desktop : panneau gauche 440 px + carte.
- [ ] États : chargement, localisation refusée, hors région, aucun résultat, hors ligne, erreur.
- [ ] Test Playwright : ouverture avec position simulée (Dijon) → résultats → clic sur une destination.

## Critères d'acceptation
- [ ] **Chronomètre :** de l'ouverture à la liste des destinations en < 3 s en local.
- [ ] Localisation refusée → recherche de ville utilisable **et** acceptée → résultats sans action.
- [ ] Changer une catégorie met à jour carte **et** liste.
- [ ] Toute information de la carte existe aussi dans la liste.
- [ ] Avec ~20 destinations, la carte reste lisible (étiquettes limitées) **et** la destination sélectionnée a toujours son étiquette.
- [ ] Prix non calibré → aucune ligne de prix dans les cartes.
- [ ] Vérifié dans le navigateur en 390 px et 1440 px.

## Vérifications manuelles
- Sur téléphone réel, en Wi-Fi local : position réelle, filtres, défilement de la feuille.

## À ne pas toucher
- Fiche destination (E12) : le clic ouvre une page provisoire.
- API (sauf défaut constaté, avec correction documentée).

## Fin d'étape
Voir `_MODELE.md`.

## Notes et modifications après coup
- 30/09/2026 : alignement sur la maquette validée (D017, D018, D021).
- 02/10/2026 : nom de la commune dans la puce de localisation (D022).
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
