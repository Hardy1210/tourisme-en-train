# E11 — Écran Explorer

> **Semaine :** S6 (09/11 → 15/11) · **Priorité :** P0 (tracés des lignes P1) · **Branche :** `etape/E11-explorer`
> **Étapes préalables :** E08, E10 · **État :** ⏸ fonctionnelle ; vérifications de design et téléphone reportées après E12 (`A-FAIRE` § 1)
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
- [x] `features/localisation/` : hook de position du navigateur (permission, erreurs, délai), repli vers la recherche de ville (`/api/geocodage`), hors région pilote.
- [x] **État des filtres dans l'URL** (`?gare&date&categories&rayon&dureeMax`, jamais de position, D058) : partageable, retour arrière fonctionnel.
- [x] En-tête : puce de localisation « Autour de <commune> » (nom via `/api/geocodage/inverse`, « Autour de vous » en attendant), puce de date (Aujourd'hui · Demain · **Ce week-end** via `debutDuWeekEnd` · Choisir).
- [x] Rangée de catégories + feuille « Filtres » (rayon, durée max ; « faisable dans la journée » P1).
- [x] `features/carte/` : carte MapLibre + OpenFreeMap, style lu depuis les tokens ; point utilisateur pulsant ; épingles de lieux par catégorie ; gares de destination colorées par tranche de temps + légende ; **segments droits** gare de départ → destinations ; **étiquettes** pour les 5 destinations avec le plus de trains (D062), au survol et à la sélection ; mini-fiche au toucher ; recentrer ; attribution. (P1) vrais tracés via `/api/lignes`.
- [x] Desktop : **survol croisé** carte de destination ↔ gare sur la carte.
- [ ] (P1) Bouton **Partager** (partage natif, sinon copie du lien + « Lien copié »).
- [x] Feuille de résultats : « Votre gare », « À deux pas de vous », « En train direct depuis… » (cartes de destination : « Faisable dans la journée » **ou** « Retour tôt, plutôt sur 2 jours » ; prix **seulement s'il est calibré**, sans espace vide sinon).
- [x] Desktop : panneau gauche 440 px + carte.
- [x] États : chargement, localisation refusée, hors région, aucun résultat, hors ligne (bandeau commun, E14), erreur.
- [x] Test Playwright : ouverture avec position simulée (Dijon) → résultats → clic sur une destination.
- [x] *Ajouté le 11–12/11 :* recherche de destination, barre du trajet (D084) ; sur téléphone, page « Trajet » plein écran (D085), essayée par Hardy sur iPhone (#94). Puis la même page sur Lieux (#100), et l'en-tête allégé, date dans « Filtres » (D086), à la place de l'en-tête repliable.

## Critères d'acceptation
- [ ] **Chronomètre :** de l'ouverture à la liste des destinations en < 3 s en local.
- [x] Localisation refusée → recherche de ville utilisable **et** acceptée → résultats sans action.
- [x] Changer une catégorie met à jour carte **et** liste.
- [ ] Toute information de la carte existe aussi dans la liste.
- [ ] Avec ~20 destinations, la carte reste lisible (étiquettes limitées) **et** la destination sélectionnée a toujours son étiquette.
- [x] Prix non calibré → aucune ligne de prix dans les cartes (parcours en paire, 10/11).
- [x] Vérifié dans le navigateur en 390 px et 1440 px.

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
- 04/11/2026 : route de l'onglet Lieux faite avant l'écran, `GET /api/lieux` (D056) ; légende 30, 60, 90 (D055) ; maquettes de référence `Explorer Mobile v3` et `Explorer Desktop v3`.
- 04/11/2026 : découpage validé par Hardy en 6 lots : (1) position et gare, (2) filtres, (3) résultats, (4) carte, (5) assemblage, (6) contrôle. « Bienvenue » et bannière d'installation : E14.
- 04/11/2026 : lot 1 fait : position, refus, recherche de ville, hors région, choix et changement de gare, `?gare=<uic>` écrit seulement sur un choix (D058). À savoir pour l'essai sur téléphone (lot 6) : le navigateur ne donne la position qu'en HTTPS, le serveur de développement devra donc tourner en HTTPS sur le réseau local.
- 04/11/2026 : à revérifier au lot 6 **sur une version de production** (`pnpm build`, puis `pnpm start`), pas sur le serveur de développement : l'écran « On cherche… » encore affiché 0,9 s après le choix de Dijon Porte Neuve.
- 04/11/2026 : lot 2 fait : date (aujourd'hui, demain, ce week-end, calendrier borné par les horaires chargés : `horaires` dans `/api/sources`), catégories, feuille Filtres, état dans l'URL. Les filtres ne changent encore aucun résultat : ceux-ci arrivent au lot 3. « Faisable dans la journée » (P1 dans la fiche) est dans la feuille comme sur la maquette ; le filtre s'appliquera au lot 3.
- 04/11/2026 : lot 3 fait : « Votre gare » et prochain départ direct, « À deux pas », « En train direct » et leurs états ; tous les filtres s'appliquent ; page provisoire `(app)/destinations/[uic]` jusqu'à E12. Les cartes de lieux ne s'ouvrent pas encore (fiche lieu : E12). Disposition définitive (feuille sur la carte, panneau desktop) : lot 5.
- 04/11/2026 : lot 4 fait : fond OpenFreeMap aux couleurs des tokens, segments droits, destinations colorées par tranche, étiquettes, épingles de lieux au zoom, point utilisateur, mini-fiches, recentrer, attribution. Disposition provisoire au-dessus de la liste jusqu'au lot 5 ; survol croisé desktop : lot 5.
- 04/11/2026 : lot 5 fait : carte en grand, feuille à 3 positions écrite pour le projet (poignée, glissement, flèches du clavier) au lieu de `vaul` : elle reste ouverte sans voile par-dessus la carte ; panneau de 440 px et survol croisé sur grand écran.
- 04/11/2026 : reste pour le lot 6 : avis de Hardy, comparaison avec les maquettes, découpage de `carte-explorer.tsx`, test Playwright, chronomètre sur version de production, essai au doigt sur téléphone (la feuille n'a été essayée qu'à la souris).
- 04/11/2026 : lot 6, partie sans design (Hardy préfère avancer sur les fonctionnalités et affiner le design ensuite) : `carte-explorer.tsx` découpé (184 lignes + `couches-carte`, `marqueurs-carte`, `commandes-carte`) ; `pnpm test:e2e` : parcours en 390 et 1440 px, sur l'échantillon, sans réseau, cassé une fois pour vérifier qu'il échoue. Mesures sur version de production, vraies données, Chromium sans accélération graphique : ouverture → liste 0,8 à 1,5 s sur 8 essais, mais 1,9 à 3,4 s sur les 4 essais d'une première série (un au-dessus de 3 s) : chronomètre à refaire sur téléphone. « On cherche… » après le choix de Dijon Porte Neuve : 0,14 à 0,25 s (au lieu de 0,9 s). Le titre de la nouvelle gare met 1,1 à 3,6 s à s'afficher : à mesurer sur téléphone avant de corriger.
- 04/11/2026 : reste pour E11 : comparaison avec les maquettes et retouches (dont les étiquettes de carte coupées par les épingles, ex. « Beaune » en 390 px), essai au doigt sur téléphone en HTTPS, contrôle du critère « prix non calibré » et des étiquettes. Bandeau hors ligne : E14 (fiche E14). Bouton Partager (P1) : après le P0.
- 04/11/2026 : décision de Hardy : fusionner E11 telle quelle et passer à E12 ; la liste des vérifications restantes est dans `A-FAIRE` § 1, à reprendre point par point une fois la fiche en place.
- 05/11/2026 : gare de départ par défaut : la plus proche, sauf si une gare à 3 km au plus a au moins 1,5 fois plus de trains et dessert toutes ses destinations (D064).
- 05/11/2026 : écran Lieux en mobile et sur grand écran, d'après les maquettes `Explorer Mobile v3` et `Explorer Desktop v3` (D067).
- 05/11/2026 : changer d'onglet ne recharge plus la position ni les appels récents ; un train parti disparaît de l'écran (D068).
- 05/11/2026 : « Votre gare » montre le temps à pied et la gare la plus proche quand une autre est proposée (D064).
- 05/11/2026 : Explorer gardé en vie entre les écrans, sans appel quand il est caché (D069).
- 05/11/2026 : chaque écran retrouve ses filtres au retour sur son onglet (D070).
- 05/11/2026 : carte sous les filtres sur mobile, marges iPhone, poignée posée sur le menu (D072, PR #71) ; carte validée par Hardy sur iPhone, marges à revérifier.
- 06/11/2026 : mini-fiche calée sur la feuille, cachée feuille en haut, refermée par une carte de la liste ; mention de la carte sur une ligne (D073) ; ligne du train à la sélection (D074) ; retouches de Hardy (PR #71).
- 10/11/2026 : recherche de ville limitée aux communes (D081) : la plupart des homonymes étaient des rues, pas des lieux-dits. Les états d'Explorer (chargement, position refusée, hors région, aucun résultat, erreur, hors ligne) sont tous dans le code, relus le 10/11.
- 10/11/2026 : « TER Mobigo » selon les deux terminus du train, nom dans `region.nomTer` (D082).
- 10/11/2026 : guidage de la localisation refusée selon l'appareil, textes dans `contenu-guidage.ts` (D083).
- 11/11/2026 : barre du trajet et recherche de destination (D084), après comparaison de trois variantes sur maquette ; en-tête repliable à suivre.
- 12/11/2026 : page de départ plein écran sur Lieux (#100), fond de la page fixe sous le clavier (#99), en-tête allégé et date dans « Filtres » (D086), Lieux compris.
- 13/11/2026 : bulle du nombre de lieux sur chaque gare (D088, #110) ; « Près de vous » et mode destination (D089, #111) ; suite de la carte décidée après l'audit des lieux hors périmètre (D090).
- 13/11/2026 (soir) : section `acces` (D091, #113) ; carte de tous les lieux en bulles, tri, Wikipédia (D092, #114 ouverte) ; suite : piscines, cercles, vélo prouvé (`A-FAIRE`).
