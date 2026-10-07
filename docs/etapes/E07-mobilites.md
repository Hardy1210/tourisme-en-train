# E07 — Transports sur place, tracés des lignes, aménagements cyclables

> **Semaine :** S4 (26/10 → 01/11) · **Priorité :** P0 (transports sur place) · P1 (lignes, cyclable) · **Branche :** `etape/E07-mobilites`
> **Étapes préalables :** E02 · **État :** ⬜ à faire
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
Le troisième frein du défi est « se déplacer sans voiture une fois sur place ». On charge les arrêts de bus et de tram et les stations de vélos proches des gares de la région. En P1, les tracés des lignes de train (pour la carte) et les aménagements cyclables (premier exemple de livrable cité par le défi).

## Documents à lire
- `CLAUDE.md`
- `docs/02-sources-donnees.md` (§ 2.5, 2.9, 2.10)
- `docs/03-base-de-donnees.md` (§ 3.10, 3.13, 3.14)
- `docs/04-traitement-donnees.md` (§ 4.7, 4.8)

## Objectif
`pnpm etl transport_local` (puis `lignes`, `cyclable`) remplissent les tables correspondantes.

## Résultat attendu
Pour chaque grande gare de la région, la liste des arrêts et stations proches, avec leurs lignes.

## Actions de Hardy
- [ ] Sur transport.data.gouv.fr, choisir les réseaux urbains à charger (au minimum Dijon, Besançon ; puis Chalon-sur-Saône, Belfort–Montbéliard, Mâcon, Auxerre selon disponibilité) : URL GTFS et GBFS, licences.
- [ ] (P1) URL des fichiers « Lignes par région » et « Aménagements cyclables ».

## Phase d'audit
1. Pour chaque réseau retenu : lire `stops`, `routes`, vérifier `route_type` ; pour GBFS : `station_information.json`.
2. Relever les licences jeu par jeu ; les ajouter au registre des sources.
3. Proposer le plan ; attendre la validation.

## Tâches
- [ ] Liste des réseaux dans **`config/sources.json`** (section des réseaux locaux : code, nom, URL GTFS, URL GBFS `station_information`, **URL GBFS `station_status`** pour les vélos disponibles en P1, licence) ; `etl/src/sources/reseaux-urbains.ts` ne fait que la lire.
- [ ] Remplir `mobilite_locale.id_source` avec l'identifiant GBFS (`station_id`) de chaque station, pour pouvoir lire sa disponibilité en direct (P1).
- [ ] `sources/transport-local.ts` (+ SQL pour la proximité et le regroupement) : pour chaque réseau, arrêts dans `rayons.mobiliteM` d'une gare de la région, lignes par arrêt, type (`TRAM`/`BUS`/`AUTRE`), regroupement des quais de même nom < 100 m ; stations GBFS (`VELO`/`TROTTINETTE`).
- [ ] Chargement dans `mobilite_locale` avec `gare_id` (gare la plus proche) et distance à pied.
- [ ] (P1) Migration : tables `ligne_ferroviaire`, `amenagement_cyclable` ; mise à jour de `03`.
- [ ] (P1) `sources/lignes.ts`, `sources/cyclable.ts` : géométries filtrées sur l'emprise régionale.
- [ ] Tests : regroupement de quais (deux arrêts « République » à 30 m → un seul **et** deux arrêts de noms différents → deux).

## Critères d'acceptation
- [ ] Dijon-Ville : au moins une ligne de tram et plusieurs lignes de bus listées.
- [ ] Aucun arrêt au-delà de `rayons.mobiliteM`.
- [ ] Chaque réseau a sa licence dans `source_donnees`.
- [ ] (P1) Les tracés s'affichent dans Adminer / une requête GeoJSON.

## Vérifications manuelles
- Comparer les arrêts listés autour de Dijon-Ville avec le plan du réseau Divia.

## À ne pas toucher
- Lieux, liaisons.
- Application web.

## Fin d'étape
Voir `_MODELE.md`.

## Notes et modifications après coup
- 30/09/2026 : ajout du relevé des URL `station_status` et de l'identifiant de station, pour les vélos disponibles (D019).
- 05/10/2026 : traitement des données en TypeScript + SQL au lieu de Python (D024).
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
- 05/10/2026 : adresses des sources dans `config/sources.json` au lieu du code (D027).
