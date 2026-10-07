# E12 — Fiche destination

> **Semaine :** S7 (16/11 → 22/11) · **Priorité :** P0 (badge journée, temps réel, cyclable : P1) · **Branche :** `etape/E12-fiche-destination`
> **Étapes préalables :** E09, E11 · **État :** ⬜ à faire
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
Depuis l'écran Explorer, l'utilisateur choisit une destination. La fiche doit tout donner pour partir : ce qu'il y a à voir à pied, les trains aller et retour, comment se déplacer sur place, le CO₂ économisé, le prix estimé et le lien vers le billet.

## Documents à lire
- `CLAUDE.md`
- `docs/06-interface.md` (§ 4, § 9)
- `docs/05-api.md` (§ 3.5 → 3.10, § 3.14, § 3.15)
- Maquette Claude Design Explorer (fiche destination intégrée) + variantes de `06` § 4 bis

## Objectif
Fiche destination complète, mobile (feuille plein écran) et desktop (panneau latéral).

## Actions de Hardy
- [ ] Choisir le lien de billetterie à utiliser (page officielle générique SNCF Connect ou TER Bourgogne-Franche-Comté) ; il sera mis dans `config/marque.ts` ou `parametres.json` (décision).
- [ ] Valider l'écran sur téléphone.

## Phase d'audit
1. Relire la maquette ; lister les composants réutilisés depuis E10–E11.
2. Vérifier les réponses des routes pour 3 destinations (dont une hors région).
3. Proposer le plan ; attendre la validation.

## Tâches
- [ ] Route `(app)/destinations/[gareId]` (paramètres `depuis`, `date` dans l'URL), ouverte en feuille (mobile) ou panneau (desktop).
- [ ] En-tête : nom, durée, trains/jour, sélecteur de date ; **bascule Samedi / Dimanche** si « Ce week-end » ; (P1) bouton **Partager**.
- [ ] Onglet **Lieux** : mini-carte, liste groupée par catégorie, badge Qualité Tourisme ; **lieu sans description ni horaires** affiché proprement (nom, catégorie, durée, « Voir sur la carte ») ; message honnête hors région.
- [ ] Onglet **Trains** : aller / retour, dernier retour mis en évidence, `(+1)` après minuit ; **par défaut sans statut** ; (P1) statut temps réel **seulement aujourd'hui, 3 prochaines heures**, un train supprimé reste visible et barré.
- [ ] Onglet **Sur place** : bus/tram (lignes), stations vélos/trottinettes, distance à pied ; (P1) **nombre de vélos disponibles** via `/api/mobilites/[gareId]/velos` (sans nombre si pas de flux) ; (P1) aménagements cyclables sur la mini-carte. **Pas de transport à la demande.**
- [ ] Pied collant : bloc CO₂ (train vs voiture seule) + « Comparer » (voiture partagée, avion) ; prix estimé si calibré ; bouton `action` « Acheter mon billet » (lien externe, `rel="noopener"`).
- [ ] (P1) « Faisable dans la journée » **ou** « Retour tôt, plutôt sur 2 jours ».
- [ ] Test Playwright : Explorer → destination → onglet Trains → dernier retour visible.

## Critères d'acceptation
- [ ] Beaune depuis Dijon : lieux, trains aller/retour, transports sur place et CO₂ affichés.
- [ ] Destination hors région : trains affichés **et** message « lieux pas encore disponibles ».
- [ ] Prix non calibré → aucun prix affiché (pas de valeur inventée).
- [ ] Le mot « estimation » accompagne toujours le prix.
- [ ] Une date autre qu'aujourd'hui → aucun statut temps réel **et** aujourd'hui avec clé → statuts sur les prochains trains seulement.
- [ ] Station sans flux GBFS → pas de nombre **et** station avec flux → nombre affiché.
- [ ] Vérifié dans le navigateur en 390 px et 1440 px.

## À ne pas toucher
- Écran Explorer, sauf l'ouverture de la fiche.

## Fin d'étape
Voir `_MODELE.md`.

## Notes et modifications après coup
- 30/09/2026 : alignement sur la maquette validée (D017 → D021).
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
