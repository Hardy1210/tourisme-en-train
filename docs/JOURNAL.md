# Journal des sessions

> **Rôle :** une entrée par session de travail, ajoutée par le protocole « garde le contexte ».
> **Règle :** les entrées ne sont jamais modifiées après coup ; la plus récente est **en haut**.

---

## Modèle d'entrée

```
## JJ/MM/AAAA — Étape Exx — titre court
**Fait :**
-
**Décisions :** Dxxx, Dyyy (voir DECISIONS.md)
**Problèmes rencontrés :**
-
**À valider par Hardy :**
-
**Prochaine action :**
-
**Vérifications :** typecheck ✅/❌ · lint ✅/❌ · tests ✅/❌
**Commit :** <hash court>
```

---

## 25/11/2026 (soir) — Étapes E11/E12 — Feuille : la cause trouvée, « Voir plus » ; onglet Lieux en rangées fusionné
**Fait :**
- ④ à la maison, essais de Hardy sur l'iPhone, un suspect retiré à la fois (L89) : avec 3 destinations sans « Près de vous », la feuille glisse parfaitement ; avec la liste complète (101 destinations au départ de Dijon, 7 894 éléments dans l'écran), départ brutal et plantages de Safari, avec ou sans « Près de vous » ; l'application installée ouvre toujours `/` sans la variante choisie (d'où le « sursaut » vu en PWA)
- Essai « cartes hors de l'écran sautées » (`content-visibility`, avec F) : recalcul du style ÷ 6 dans Chromium, mais Safari fermait la page dès qu'on bougeait la feuille : retiré, jamais dans #185
- **#190 (D122)** : 10 destinations, puis « Voir plus » (`destinationsMontrees`, fonction pure ; un seul état, le nombre de pages ; `limites.destinationsParPage`) ; 2 808 éléments ; validé sur l'iPhone ; « Voir plus » contourne le problème sans le résoudre (Hardy) : la liste sans fin par cartes fabriquées à la demande, après la soutenance (`A-FAIRE` § 3)
- **#185 (D120)** recalée par une fusion de `main` (une seule résolution des documents), validée sur l'iPhone, fusionnée ; puis #186, #187, **#188** (rangées « photos d'abord » : test d'abord, photo d'exemple ajoutée à Besançon pour que l'ordre se voie) et **#189** fusionnées, conflits des documents résolus à chaque fois
- « Voir tout » gardé sur chaque rangée (Hardy) ; l'icône des cartes sans photo est bien la nôtre (mesurée : 144 px, blanc à 13 %), alignement sur la maquette à décider
**Décisions :** D122 ; D121 complétée (ordre « photos d'abord », « Voir tout » partout)
**Problèmes rencontrés :**
- Le premier test de l'ordre « photos d'abord » échouait pour une mauvaise raison (L84) : Beaune était déjà la plus proche dans l'échantillon ; puis le lieu choisi pour la photo (Parc Micaud) était à 1 163 m de la gare, au-delà du rayon de l'échantillon (1 154 m) : photo mise sur la Promenade des bords du Doubs
- Parcours instables de la carte (`explorer.e2e.ts:121`, `:139`, `:178`, `:194`) : même erreur sur la branche et sur `main` (clic sur une épingle qui n'aboutit pas, cause A) ; sur 28 essais, 20 échecs contre 15, écart pas net
- Un rebase de #185 aurait demandé de résoudre les mêmes conflits à chaque commit : fusion de `main` dans la branche (L92)
**À valider par Hardy :**
- Icône des cartes sans photo ; point 1 ; suppression des branches d'essai ; alertes de dépendances (2 critiques)
**Prochaine action :**
- PR B de ④ (retrait du bouton de la carte), puis PR 3 de D121 (`CLAUDE.md` § 9)
**Vérifications :** `pnpm verifier` ✅ sur `main` (`4c6b7e3`, 827 tests) · intégration ✅ (225) · parcours de la feuille, de « Voir plus », d'Explorer et de Lieux ✅ hors les 4 parcours instables de la carte
**Commit :** `db23f96` (#190), `1e7c888` (#185), `d3a9612` (#188), `4c6b7e3` (#189)

## 25/11/2026 (fin d'après-midi) — Étapes E11/E12 — Feuille en attente, date de la fiche destination, onglet Lieux en rangées
**Fait :**
- ④ (#185) **mis en attente par Hardy** : comportement actuel du glissement gardé ; reprise à la maison, le réseau de l'école bloquant les tunnels (sur l'ordinateur, mode téléphone, la liste courte du diagnostic est « parfaite ») ; version de diagnostic arrêtée
- **#187 ouverte** (fiche destination, D108) : `en-tete-destination.tsx` lit `useDateDuJour()` ; une fiche ouverte pour « Demain » dit « Aujourd'hui » après minuit ; parcours d'abord (le cas et sa limite avant minuit, horloge fixée, retour sur l'onglet)
- **⑤ : étude d'impact de la maquette « Lieux-Rangees »**, choix de Hardy : une rangée par gare (par ville plus tard, quand la page montrera d'autres choses), 8 lieux, ordinateur au plus simple ; **D121**, trois PR :
  - **#188** (rien de visible) : `GET /api/lieux/rangees`, union discriminée `type: 'gare'` (une autre sorte de rangée s'ajoute sans toucher aux autres), filtres et exclusions écrits une fois (`lieuxDesGaresAtteintes`) pour les deux routes, un seul passage d'une ligne à un lieu (`lieuResumeDe`) ; requête en une fois (gares comptées, page de rangées, 8 premiers lieux par `row_number()`) ; `limites.lieuxParRangee` 8, `limites.rangeesParPage` 6 ; 16 tests d'intégration ; sur la base locale au départ de Dijon : 900 lieux, 65 rangées, 58 ms
  - **#189** : écran en rangées (`RangeesLieux`, `UneRangee` choisit le dessin selon la sorte, `RangeeGare`, `CarteLieuSurPhoto`), « Voir tout » vers la fiche destination (`lienDestination`), défilement de côté sans défilement de la page en largeur ; jetons `--sur-photo-*`, `--carte-rangee-*`, `--pastille-train-*` ; ancienne liste retirée ; parcours de Lieux adaptés et complétés
- Point 1 (« Les destinations arrivent… » sans gare de départ) réexpliqué simplement à Hardy
**Décisions :** D121 (dans #188)
**Problèmes rencontrés :**
- La pastille du temps de train n'avait pas de fond : `bg-accent` n'existe pas (seuls les jetons de rôle ont une classe), sans aucune erreur ; vu sur la capture, corrigé par `--pastille-train-*` (L90)
- `gh pr edit` échoue (« projects classic » abandonnés par GitHub) : description de la PR changée par `gh api -X PATCH`
**À valider par Hardy :**
- Ordre des rangées (petites gares proches en tête) ; essai de #189 ; fusions #186, #187, #188 puis #189 recalée ; point 1 ; ④ à la maison
**Prochaine action :**
- Recaler #189 après la fusion de #188, puis PR 3 (retrait de `/api/lieux`) si #189 est acceptée (`CLAUDE.md` § 9)
**Vérifications :** `pnpm verifier` ✅ sur `82f47b6` (810 tests) · intégration ✅ (223) · parcours ✅ (102 passant par Lieux, puis 38 après la correction de la pastille)
**Commit :** `d7ee107` (#188), `82f47b6` (#189), #187 ; sauvegarde sur `docs/sauvegarde-25-11` (#186)

## 25/11/2026 (après-midi) — Étape E11 — Départ brutal de la feuille sur l'iPhone : diagnostic
**Fait :**
- Essais A/B sur l'iPhone (deux tunnels à chaque fois) : `touch-action: pan-x` hors du haut (C), 800 ms (fin plus douce, départ inchangé), lâcher de `vaul` (D : transition et arrivée en pixels écrites ensemble), courbes `(0.2, 0, 0, 1)` puis `(0.4, 0, 0.2, 1)` (E, calculées : moitié du trajet à 20 % puis 35 % du temps) : **aucun ne rend le départ doux** ; observation de Hardy : le défaut touche aussi le bouton, et disparaît quand on enchaîne vite
- Mesures dans Chromium (sondes Playwright temporaires, jamais versionnées) : lâcher image par image propre sans ralentissement ; processeur ralenti ×4 : temps mort de 130 à 300 ms puis 27 à 66 % du trajet en une image ; recalcul du style après `data-feuille` sur la racine 60–78 ms (variable `--resultats-haut` héritée par les ≈ 970 éléments), contre 30–45 ms pour un style posé sur la feuille seule ; F (`@property` non héritée sur les seuls suiveurs) réduit le recalcul sans supprimer les sauts ; profil du processeur : code de l'application ≈ 10–15 ms par changement
- Version de diagnostic en ligne (`diagnostic/feuille`, jamais fusionnée) : `?diag=sanscarte`, `?diag=listecourte`, `?diag=aucun`
- WebKit de Playwright non installable sur le poste (bibliothèques système manquantes, `sudo` nécessaire)
**Décisions :** aucune ; #185 inchangée (`b66a077`)
**Problèmes rencontrés :**
- Un `git commit --amend` sans `-a` n'avait changé que le message : le build d'E portait l'ancienne courbe ; vu en lisant le CSS construit, corrigé
- Les mesures par image de Chromium (sans carte graphique, horloge des tests simulée) ne montrent pas ce que Safari affiche : seule la comparaison sur l'iPhone tranche (L89)
**À valider par Hardy :**
- Résultat des trois variantes de diagnostic ; description du plantage vu sur A
**Prochaine action :**
- Selon le résultat : carte, liste (F), ou panneau de mesure sur l'iPhone (`CLAUDE.md` § 9)
**Vérifications :** `pnpm verifier` ✅ sur `b66a077` (824 tests, inchangé depuis) · parcours de la feuille ✅ sur chaque essai (6 à 7)
**Commit :** `b66a077` (#185) ; essais sur branches locales

## 25/11/2026 — Étape E11 — Épingles fusionnées, feuille d'Explorer glissée au doigt (en cours)
**Fait :**
- #183 (épingles, D119) recalée sur `main` (conflit de `A-FAIRE.md` avec #184, code inchangé), fusionnée par Hardy ; échec de parcours `explorer.e2e.ts:139` : cause A connue (Chalon sur Beaune), marqueurs des gares inchangés par #183
- Bulles devant les gares : **après la soutenance** (Hardy) ; nouvelle idée de Hardy (icônes de lieux choisies par l'utilisateur) notée dans `A-FAIRE` § 3
- ④ : étude d'impact validée (geste comme Google Maps, ouverture à moitié inchangée, PR A le geste puis PR B le retrait du bouton de la carte) ; **#185 ouverte (D120)** : fonctions pures `preneurDuGeste`, `hautSousLeDoigt`, `vitesseAuLacher`, `positionAuLacher` (19 tests en paires), `use-glissement-feuille.ts` (événements tactiles seulement), 5 parcours tactiles et clavier (`feuille-glissement.e2e.ts`)
- Trois essais de Hardy sur l'iPhone : 1) contenu absent pendant la montée et sursaut → feuille à pleine hauteur, posée par un seul `transform` ; 2) passage d'un cran à l'autre trop brusque (mesuré : 60 % du trajet en une image avec `--ease-soft`) → jetons `--duree-feuille` (500 ms) et `--ease-feuille`, ceux de `vaul` ; 3) A/B : B (`flushSync` au lâcher) pareil que A ; il reste un sursaut au lâcher, et la version A a planté (cause inconnue)
**Décisions :** D120 (dans #185)
**Problèmes rencontrés :**
- Le fond prolongé sous la feuille (première version) rendait l'écran défilable (1 598 px de contenu pour 754) : corrigé par `overflow-clip`
- Parcours de la carte (cause A) : `:121`, `:178`, `:194` 9/18 échecs sur la branche contre 4/18 sur `main` (première version), puis `:121`, `:139`, `:178`, `:194` 10/16 contre 7/16 ; même cause des deux côtés, écart pas assez net
- L'étude d'impact disait « pas de bibliothèque » sans avoir vu `vaul`, déjà dans le projet (L88)
**À valider par Hardy :**
- Décrire le plantage de la version A ; essai de #185 après la correction du sursaut
**Prochaine action :**
- Mesurer un lâcher image par image, puis A/B des pistes a, b, c (`CLAUDE.md` § 9)
**Vérifications :** `pnpm verifier` ✅ (824 tests, sur `b66a077`) · parcours d'Explorer, de la carte et de la feuille : 87 réussis, 1 échec connu (`:139`, cause A)
**Commit :** `b66a077` (#185)

## 24/11/2026 (fin) — Étapes E11/E12 — Trains aux gares, épingles des lieux
**Fait :**
- **#182 (D118)** : gares en points de loin (inchangés, couleur du temps de train), en icônes de train inversées de près (seuil `carte.zoomIconesGares` = 9,75, mesuré sur le critère de Hardy : ≈ 15 gares visibles autour de Dijon) ; bord jaune de la destination du trajet ; bulles décalées en haut à droite (solution 1 de Hardy)
- **#183 ouverte (D119)** : épingles des lieux en goutte (lilas, contour violet, pointe sur le lieu), lieu touché plus grand et plein, sur les deux cartes ; `formeEpingle` (fonction pure) ; adresse d'essai donnée à Hardy
- Étude d'impact des bulles vraiment devant les gares (solution 3) : décision de Hardy en attente
**Décisions :** D118, D119
**Problèmes rencontrés :**
- Première proposition du seuil (12) au jugé et fausse : corrigée par la mesure avant le code (L87)
- Parcours instables de la carte (`explorer:139`, `carte-cadrage`) : inchangés, passent en les relançant
**À valider par Hardy :**
- Essai de #183 sur l'iPhone, puis fusion ; bulles devant les gares : avant le gel ou après la soutenance ; seuil 9,75 et décalage des bulles à juger sur l'iPhone
**Prochaine action :**
- Fusion de #183 ; décision sur les bulles ; puis ④ (feuille qui suit le doigt) ou ⑤ s'il reste du temps ; gel des nouveautés le 27/11
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (`pnpm verifier` sur `main` après #182 : 807 tests ; #183 : 810 tests, suite complète 323 réussis, 1 instable connu)
**Commit :** `274fb34` (#182) sur `main` ; #183 ouverte

---

## 24/11/2026 (nuit) — Étapes E11/E12 — Barre sur deux lignes, date et ⇅ dans la page « Trajet », remise en ordre
**Fait :**
- **#176 (D115)** : barre du trajet sur deux lignes quand une destination est cherchée ; essai de Hardy sur l'iPhone
- **#178 (D116)** : la date dans la page « Trajet » (ligne toujours, pastilles avec Destination, calendrier) ; défaut trouvé par la suite complète et corrigé avant la PR (page fermée qui contenait déjà les boutons de date, en double)
- **Relecture du code de la journée** (demande de Hardy : code maintenable, sans cascade d'états) : tout sous 200 lignes sauf `page-trajet.tsx` (212), où ⇅ devait aller
- **#179 (remise en ordre, aucun changement visible)** : un seul état (réducteur pur `saisie-trajet.ts`), vérification « reste-t-il un train direct ? » calculée, logique dans `use-saisie-trajet.ts`, page en mise en page seule (122 lignes) ; garde `enabled` de `useDestinations` sans gare ; deux parcours manquants écrits et passés sur `main` puis sur la branche (L86)
- **#180 (D117)** : ⇅ dans la page « Trajet » ; une action du réducteur, deux fonctions pures, la même réaction que la vérification (L85)
- Idée de Hardy notée (`A-FAIRE`) : ⇅ aussi dans la barre d'Explorer, une seule logique pour les deux vues
**Décisions :** D115, D116, D117
**Problèmes rencontrés :**
- Parcours instables de la carte : mesurés deux fois à conditions égales (7/16 sur `main`, 3/16 sur la branche de #178) ; aucune PR ne les aggrave
**À valider par Hardy :**
- Maquette de ⑥ (marqueurs de gare) ; mise en ligne 0.6.0
**Prochaine action :**
- ⑥ quand la maquette arrive, sinon ④ (la feuille qui suit le doigt, sans maquette)
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (`pnpm verifier` sur `main` après #180 : 803 tests)
**Commit :** `ad8fb82` (#180)

---

## 24/11/2026 (soir) — Étapes E11/E12 — Écran 2 de l'accueil, catégories dans « Filtres », barre sur deux lignes
**Fait :**
- **Écran 2 (#174, D113)** : « Dans quelle ville êtes-vous ? » sur le fond de la marque, dans le cadre de l'accueil (même photo pendant la visite) ; plein écran dans Explorer, dans la page avec le menu dans Lieux (solution A, à revoir à l'évaluation) ; sans fenêtre modale ; message « Aucune gare trouvée » dans l'écran ; suite complète verte (306/306)
- **Remarque ② (#175, D114)** : catégories en premier dans la feuille « Filtres », avec leurs icônes, mêmes puces que la carte (`puces-categories.tsx`) ; `basculerCategorie` et `filtresReinitialises` (fonctions pures) ; « Réinitialiser » remet à zéro ce que la feuille montre (avec une destination : la date et les catégories)
- **Remarque ⑦ (#176 ouverte, D115)** : barre du trajet sur deux lignes quand une destination est cherchée (« Départ  Dijon », « Arrivée  Beaune ») ; `nomDepartCourt` ; noms accessibles inchangés ; sans ⇅
- Étude d'impact des maquettes « Explorer » et « Trajet » ; décisions de Hardy : ⇅ dans la page « Trajet » seulement, date (ligne toujours, pastilles avec Destination), un seul état lu par `useFiltres()`, rien d'autre des maquettes, ordinateur à la fin
- Réponses à Hardy : photo derrière l'heure seulement dans l'app installée ; jetons vérifiés (une opacité en dur retirée) ; refus retenu par Safari, autorisation oubliée quand l'adresse ou l'onglet privé change
**Décisions :** D113 (écran 2), D114, D115
**Problèmes rencontrés :**
- `pres-de.e2e.ts:64` vérifiait l'ancienne règle de « Réinitialiser » (destination : la date seule) : mis à jour à D114 et renforcé
- Parcours instables de la carte (`explorer:121`, `:178`, `:194`) : passent au 2ᵉ essai, sans lien avec les PR du soir
**À valider par Hardy :**
- Essai sur l'iPhone de #176 (barre sur deux lignes), puis fusion
- Mise en ligne 0.6.0 quand Hardy le décide
**Prochaine action :**
- PR B : la date dans la page « Trajet » ; PR C : ⇅ dans la page « Trajet » ; puis ⑥ (trains aux gares, maquette de Hardy)
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (`pnpm verifier` sur #176 : 775 tests ; suite complète 309 réussis, 1 instable connu)
**Commit :** `c0fb0ac` (#175) sur `main` ; #176 ouverte

---

## 24/11/2026 — Étapes E11/E12 — Écran de lancement, premier lancement, accueil (remarque ① du professeur)
**Fait :**
- **Écran de lancement (#170, D112)** : maquette « Lancement » variante B ; logo, « Allez-y en train. » et la région sur le fond de la marque, fondu de sortie, en CSS seul, une fois par ouverture ; logo en texte partout (« Wago » + « o » en couleur, tiré de `marque.nom`, un seul fichier à changer) ; `background_color` du manifest à la couleur de la marque (Android sans saut)
- **Premier lancement (#171, D113)** : écran de bienvenue plein écran (maquette « Accueil », écran 1), position demandée **au toucher** de « Utiliser ma position », jamais par-dessus le logo ; repère « accueil vu » (un oui, jamais une position) ; un lien `?gare=` ouvre toujours Explorer ; six photos choisies par Hardy, toutes à pied d'une gare desservie (vérifié dans `lieu_gare`), crédit ⓘ
- **Écran 3a (#172, D113)** : « Votre gare de départ », trajet jusqu'à la gare (règle unique), sous-titre vrai (« la plus proche » ou « la mieux desservie », D064), « Changer » et « Destination » vers la page « Trajet » existante, « Voir les sorties »
- Études d'impact avant tout code pour chaque maquette ; parcours `lancement.e2e.ts` et `accueil.e2e.ts` (9 parcours × 2 écrans)
- Essais de Hardy sur l'iPhone par tunnel, dont une comparaison A/B (deux adresses) qui a localisé un défaut de #172
**Décisions :** D112, D113 (et sa correction du 24/11 : pas de fenêtre modale pendant la demande de position)
**Problèmes rencontrés :**
- #172 : l'iPhone ne montrait plus sa fenêtre de position (fenêtre modale de l'accueil ouverte pendant la demande) ; reproduit par un parcours, corrigé avant la fusion, confirmé par Hardy sur l'iPhone (L83) ; un premier test visait aussi la page « Trajet » cachée (L84)
- Barre blanche en bas pendant le logo, sur l'iPhone, déjà sur `main` : reportée après les maquettes (choix de Hardy) ; une correction « le logo attend l'application » est mise de côté (branche locale `fix/lancement-attend-application`, sans PR), à la demande de Hardy
- Parcours instables de la carte (`explorer.e2e.ts:121`, `:139`, `:194`, `carte-cadrage`) : même cause A ; mesurés en parallèle, 5 échecs sur 16 sur `main`, 9 sur 16 sur la branche de #172, écart pas assez net
- Wikimedia limite les téléchargements (429) : candidats en partie en 960 px
- Le moteur de Safari (WebKit) ne tourne pas sur le poste : bibliothèques système manquantes
**À valider par Hardy :**
- Écran 2 : le nouvel aspect s'applique-t-il aussi à l'onglet Lieux (menu du bas gardé) ? Recommandation : oui
- Mise en ligne 0.6.0 quand Hardy le décide (#162 à #164, #170 à #172)
**Prochaine action :**
- Écran 2 de la maquette « Accueil » (« Position refusée ou introuvable », plein écran), puis les autres maquettes de Hardy, puis la barre blanche
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (`pnpm verifier` sur `main` après #172 : 767 tests)
**Commit :** `1e680fd` (#172)

---

## 21/11/2026 (après-midi) — Intégration continue, règle des couches, remarques du professeur précisées
**Fait :**
- **Intégration continue (D110, #166)** : `.github/workflows/verifications.yml`, quatre vérifications ; premier passage vert. Mesuré sur GitHub : `verifier` 46–51 s, `integration` 49–56 s, `image` 50–59 s, `parcours` 4 min 21 – 5 min 27, ≈ 5 min 30 en tout
- **Ensemble de règles « Vérifications de main »** créé par Hardy, sans contournement ; vérifié par l'API (`verifier`, `integration`, `image`, branche par défaut, aucun contournement)
- **Procédure de mise en ligne (#167)** : `infra/README.md` (aide-mémoire A, § 1, § 2), `CLAUDE.md` § 15 et § 9 : fusion quand les trois vérifications sont vertes ; migrations, Coolify, Redeploy inchangés ; essai de l'image en local gardé quand elle doit démarrer
- **Règle ESLint des couches (D111, #168)** : lancée à blanc (0 erreur ; seule exception : le fond de carte dans `features/carte`), vérifiée en échec (8 imports interdits → 8 erreurs, 4 permis → 0, une page qui importe un service → 1)
- Remarques du professeur précisées par Hardy et une autre session : point 4 (feuille attrapée partout, qui suit le doigt, position au lâcher selon la vitesse, défilement puis redescente), point 6 (points de gare, icônes de train au zoom proche, bulles décalées de quelques pixels, autres gares en couleurs inversées, rien ne change dans le fonctionnement) ; Hardy fait des maquettes HTML statiques de certains éléments
**Décisions :** D110, D111
**Problèmes rencontrés :**
- `parcours` échoue plus souvent sur GitHub (1 à 2 instables par passage : `explorer.e2e.ts:121`, `:139`, `:178`) que sur le poste ; non bloquant, e-mail d'échec à chaque fois
- Avertissement de GitHub : les actions en `@v4` visent Node 20, déjà forcées sur Node 24 ; aucun effet aujourd'hui (`A-FAIRE`)
**À valider par Hardy :**
- Suppression des 24 vieilles branches locales des PR déjà fusionnées ; e-mails d'échec à couper ou non (réglage du compte)
**Prochaine action :**
- Après chaque maquette de Hardy : étude d'impact détaillée avant tout code (fichiers touchés, logique ou données, tests, risques)
**Vérifications :** typecheck ✅ · lint ✅ (avec la règle des couches) · tests ✅ (GitHub sur `main` `a6593e6` : `verifier`, `integration`, `image` verts ; `parcours` 273/274, `:121` instable)
**Commit :** `a6593e6` (#168), `45256ab` (#167), `17eb43c` (#166)

---

## 21/11/2026 — Étapes E12, E13 — fiche lieu fusionnée, bouton Retour des pages de lecture, licence de Sources, remarques du professeur
**Fait :**
- Serveur d'essai et tunnel relancés ; essai de la fiche lieu sur l'iPhone bon (haut sans photo confirmé, D109) → **#162 fusionnée** ; sauvegarde **#159 fusionnée**
- **#164 fusionnée** : Sources, À propos, Mentions légales au bouton Retour des fiches (`BarreRetour` dans `CadrePage`, `RetourPage` supprimé) ; Départ et Trajet d'Explorer gardent « ← Retour » en texte (Hardy) ; `barre-retour.e2e.ts` compare aussi les trois pages
- **#163 fusionnée** : sur Sources, deux licences (photos DATAtourisme, Wikimedia) en `whitespace-nowrap` rendaient la page large de 685 px pour 390 ; présent en production depuis la 0.4.0 (mesuré sur `wagoo.hardylino.com`). Test d'abord (`pages-lecture-largeur.e2e.ts` : 390 et 320 px, licence longue à la ligne, limite : la courte sur une ligne), puis `max-w-full whitespace-normal` sur la pastille de la carte seulement
- **Durées mesurées** (poste, copie `../tourisme-parcours`) : `pnpm verifier` 51 s, `pnpm test:integration` 27 s, `pnpm test:e2e` 6 min 35 s build compris (premier passage) puis 5,5 min de tests (second)
- **Remarques du professeur sur l'UI/UX** transcrites en 7 points avec l'avis de Claude et un plan (`A-FAIRE` § 1) ; Hardy demande aussi l'avis d'une autre session de Claude Code avant de décider
**Décisions :** D109 complétée (pages de lecture ; Départ et Trajet gardent le texte)
**Problèmes rencontrés :**
- Mentions légales signalée par Hardy comme débordante : rien mesuré à 390, 375, 360, 320 px ; Hardy confirme ensuite qu'elle est bonne
- Test de limite d'abord faux : la carte cherchée par sa licence (« CC0 ») trouvait celle de Wikimedia, qui contient « CC0 » ; corrigé en cherchant la carte par son titre. Puis `py-0.5` rendait la pastille courte haute de 23 px : retiré, les courtes restent identiques
**À valider par Hardy :**
- Ordre des remarques du professeur après l'avis de l'autre session ; intégration continue avant ou après elles
**Prochaine action :**
- Comparer l'avis de l'autre Claude Code point par point, puis plan validé par Hardy
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (`main` `aa69063` : 738 unitaires ; branches : intégration 207, parcours 274 sans échec pour #163, 256 + 2 instables connus pour #164)
**Commit :** `aa69063` (#164), `967dc52` (#163), `19739f8` (#162)

---

## 20/11/2026 (après-midi) — Étapes E17, E12 — 0.5.0 en ligne, design de la fiche lieu
**Fait :**
- **0.5.0 en ligne** : PR de version #161 (numéro, `CHANGELOG` daté, `compter-lignes.sql` compte les descriptions), Redeploy, contrôle 0 ; données : export du poste (empreinte `6599b386…94c28b`), sauvegarde `avant-donnees.dump` (18 Mo), restauration, **11 comptages identiques** (3 998 descriptions, 2 499 065 caractères), Redeploy, contrôle 0, essai iPhone bon ; tag `v0.5.0` sur `c7c57da` ; `~/tourisme.dump` supprimé du poste
- **Design de la fiche lieu** (branche `etape/E12-design-fiche-lieu`, poussée, PR à ouvrir ; D109) : fond de la marque, photo en arc (`clip-path: circle`, mesures en `cqw`) jusqu'en haut de l'écran derrière l'heure (`CadreFiche hautPlein`), haut sans photo ; `BarreRetour` (une seule position par `--retour-*`, un seul dessin) sur la destination et la fiche lieu ; `PiedFiche` (pied de la destination + haut arrondi) ; captures à 390 px vues avant de montrer
- Mesures du bouton Retour avant : 12, 14, 16 px du haut selon l'écran ; après : destination et lieu au pixel près (8 px, 12 px, 44 px)
**Décisions :** D109 (dans la branche) ; Hardy : photo derrière l'heure comme la maquette, un seul bouton Retour partout « sans bricolage », pied de la destination arrondi pour les deux fiches
**Problèmes rencontrés :**
- Bande violette au-dessus de la photo : marge `safe-top` du cadre de toutes les fiches ; test d'abord, puis `hautPlein`
- `horloge.integration.test.ts` a échoué une fois (PR #161), passé à la relance : noté dans `A-FAIRE`
- Dans Safari, la zone de l'heure reste à Safari : l'essai de la photo pleine hauteur se fait depuis l'écran d'accueil
**À valider par Hardy :**
- Barre et pied sur l'iPhone ; pastille de date à 8 ou 16 px du bord ; haut sans photo ; ménage du VPS
**Prochaine action :**
- Ouvrir la PR du design de la fiche lieu après l'essai ; puis Sources, À propos, Mentions au même bouton Retour
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (738 unitaires, parcours 255 + 3 instables connus)
**Commit :** `c7c57da` (0.5.0 en ligne) ; branche du design `bf671ae` et suivant

## 20/11/2026 — Étape E12 — horaires lisibles (#160), fusion de #158, maquette de la fiche lieu
**Fait :**
- Reprise : serveur d'essai (port 3200) et tunnel relancés ; essai de #158 par Hardy (texte complet ; les « … » du Consortium viennent de DATAtourisme, pas d'une coupe) ; **#158 fusionnée**, sauvegarde #159 recalée deux fois sur `main` (conflit `A-FAIRE` résolu en gardant les deux côtés)
- Mesures : descriptions — OSM 169 sur 8 273, DATAtourisme 3 829 sur 3 969, 171 coupées à 2 000 caractères ; horaires — 399 lieux, tous au format `opening_hours` (113 DATAtourisme), « Période » vide partout
- **#160 fusionnée (D108)** : `features/lieux/horaires/` (analyse, calendrier avec jours fériés, traduction), 385 horaires sur 399 compris ; résumé « Aujourd'hui, ven. 20 nov. » en haut du bloc, une plage par ligne alignée sur les lignes du dessous ; `useDateDuJour()` (minuit à Paris, retour au premier plan) ; parcours `horaires.e2e.ts`, deux horaires d'exemple dans l'échantillon
- Maquette `design/maquettes/Fiche-Lieu.dc.html` lue : photo découpée par un grand cercle (`clip-path: circle`), pas un polygone ; plan de la PR 2 donné à Hardy
**Décisions :** D108 (voir DECISIONS.md) ; Hardy : textes gardés tels quels (pas de retour à la ligne après chaque phrase) ; résumé en haut plutôt que le badge de la maquette (lu « aujourd'hui = 16 nov. »)
**Problèmes rencontrés :**
- Le DNS de WSL ne trouve pas une nouvelle adresse de tunnel pendant quelques minutes : contrôle avec `curl --doh-url https://1.1.1.1/dns-query`
- Parcours : un `has:` Playwright construit depuis la zone parente ne trouve rien ; corrigé par `filter({ hasText })`
- `explorer.e2e.ts:178` et `:194` toujours instables (aussi sur `main`)
**À valider par Hardy :**
- Ordre de la suite : mise en ligne 0.5.0 d'abord (recommandé) ou PR 2 du design de la fiche lieu ; lieu sans photo à montrer avant la suite de la PR 2
**Prochaine action :**
- « mets en ligne » 0.5.0 (#154, #155, #156, #158, #160 ; données, étape E), puis PR 2 du design de la fiche lieu
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (731 unitaires sur `main`, 207 intégration, parcours : 252 réussis, 2 instables connus)
**Commit :** `1fd48f7` (#160)

## 19/11/2026 (matin) — Étapes E12, E13 — essai de #158, one-pager
**Fait :**
- Reprise : base locale démarrée (Docker Desktop relancé par Hardy), 3 829 lieux DATAtourisme décrits (moyenne 649) ; serveur d'essai dans `../tourisme-recherche` (build de cette nuit, même code que #158 : seuls des documents ont changé depuis) ; tunnel ouvert et contrôlé de l'extérieur (`/api/sante` 200) ; essai de #158 sur l'iPhone confié à Hardy (étapes et fiche d'exemple données)
- **One-pager** : relecture avec Hardy, chaque chiffre mesuré dans la base locale et `config/` ; texte complet pour Claude Design noté dans `docs/equipe/pitch.md` § One-pager
**Décisions :** choix de textes de Hardy (région dans le titre, « Pour qui » sans cible principale, « Nos choix » au lieu de « Nos engagements », étrangers en perspective) : notés dans `pitch.md`, pas de nouvelle décision d'architecture
**Problèmes rencontrés :**
- **268 025 « liaisons en train direct »** sur le one-pager : une ligne par liaison et par jour (61 jours) ; vraies valeurs : 4 367 liaisons au départ de la région, vers 350 gares
- « 16 réseaux de bus et tram » : 13 réseaux urbains + Mobigo + 2 vélos ; « 30 secondes » et « 1 à 2 h » jamais mesurés
**À valider par Hardy :** #158 sur l'iPhone puis fusion ; one-pager après le design
**Prochaine action :** `CLAUDE.md` § 9 (vendredi 20/11)
**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (690)
**Commit :** voir #159

---

## 19/11/2026 (nuit) — Étape E12 — descriptions complètes de DATAtourisme (D105)
**Fait :**
- #156 (audit C, densité ×2) et #157 (sauvegarde) fusionnées par Hardy ; **netteté de la carte en ×2 : aucune perte vue sur l'iPhone** (Hardy)
- Mesures d'abord, sans rien modifier (deux passages `unzip | grep` sur l'export, 2 × 1 min 45) : 3 818 fiches sur 3 969 avec une description longue en français ; 2 271 plus longues que la nôtre, 1 390 là où nous n'avions rien ; médiane 505 caractères, 146 au-delà de 2 000 ; langues : anglais 3 825, allemand 3 822, français, espagnol, néerlandais, italien 3 818
- Choix de Hardy : 2 000 caractères, coupe en fin de phrase (≥ 80 %) sinon au mot ; paragraphes en texte brut (`pre-line`, jamais de HTML) ; français seul, sans colonne langue (une colonne ne tiendrait qu'une description : table `description_lieu` notée pour plus tard) ; « Source : » sous la description ; question de Hardy sur le décodage : N-Triples déjà décodé (testé maintenant), entités hexadécimales et nommées françaises **ajoutées**
- **#158** : `transformations/description.ts` (nettoyage), `datatourisme-descriptions.ts` (lecteur, réutilise le passage des photos), étape `pnpm etl descriptions` (cache, contrôle `descriptionsMin`, rapport), `chargement/descriptions.ts` ; fiche lieu : `whitespace-pre-line`, « Source : DATAtourisme (ADN Tourisme), Licence Ouverte Etalab 2.0 », attribution une seule fois ; échantillon : description à deux paragraphes (ECH_L14)
- Base locale : 3 668 remplacées (1 390 nouvelles, 2 278 plus longues, 146 coupées : 145 en fin de phrase, 3 au mot), 3 829 avec une description (moyenne 649, contre 120), 1 245 avec paragraphes, aucune entité, balise ou échappement restant ; captures de la fiche repliée et dépliée vérifiées
**Décisions :** D105 (descriptions complètes) ; D107 complétée (netteté validée)
**Problèmes rencontrés :**
- `pnpm verifier` en échec une fois : format du nouveau parcours (corrigé)
- `pnpm etl descriptions` : 11 min (lecture ligne par ligne en Node, contre 3 min 30 avec `grep`) ; les parcours lancés en même temps ont échoué sur la carte (5) ; rejoués seuls : branche 1/10, `main` 4/10
**À valider par Hardy :** #158 sur l'iPhone, puis 0.5.0 (code et données) ; 3 textes du pitch avant le 22/11
**Prochaine action :** `CLAUDE.md` § 9 (20/11 : #158, 0.5.0, intégration continue avant le 22/11, horaires, Wikipédia, audit A)
**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (690, branche de #158) · intégration ✅ (207) · parcours 247/252 (5 de la carte pendant le traitement, voir ci-dessus)
**Commit :** `main` : `1f18767` ; #158 : `etape/E12-descriptions-completes`

---

## 18/11/2026 (soir) — Étapes E17, E12, E15 — 0.4.0 en ligne, fiche destination sur le fond de la marque, D102, audit C
**Fait :**
- Reprise après une session coupée : rien de perdu (sauvegarde #150 poussée, copies propres) ; #150 fusionnée
- Tunnel : le réseau de l'école renvoie `0.0.0.0` pour `api.trycloudflare.com` (seul nom bloqué) ; contournement écarté (règle de l'école), essai repris à la maison
- **0.4.0 en ligne** : PR de version (#151, `compter-lignes.sql` + `lieu_wikidata`, `photo_lieu`) ; sauvegarde `avant.dump` (18 Mo) ; **premier Redeploy en échec** (`next build` : `playwright.config.ts` importait `tests/instant-de-test.ts`, exclu de l'image), production restée en 0.3.1 ; reproduit en local, configurations des tests exclues de l'image, essai complet de l'image (`migrer` 0, `web` sain, version 0.4.0) (#152) ; second Redeploy ; données : empreinte et 9 comptages identiques au poste (3 322 photos) ; deux photos vérifiées en ligne ; tag `v0.4.0`
- « Les lieux de Beaune ne chargent pas » : en ligne et dans un navigateur neuf, tout charge ; Chrome sur l'iPhone gardait les réponses de la 0.3.1 (`max-age` 24 h), la PWA neuve non → reporté par Hardy, le jury installera la PWA (#153)
- **Fiche destination d'après la maquette de Hardy** (#154, D106) : fond de la marque sur toute la fiche (trois onglets, colonne de gauche sur ordinateur, choix de Hardy) ; jetons génériques (`--page-marque-*`, `--carte-sur-marque-*`, dimensions), classe `vignette-arc`, variantes `sur-marque`, `CadreFiche fond="marque"` ; cartes de lieux en arc ; « Voir les N autres » (`limites.lieuxParCategorie` 5) ; pilule de la mini-carte (Échap) ; **Qualité Tourisme en icône** sur la ligne de la sous-catégorie, idée de Hardy après mesure (174 px de texte, badge 136 px) ; contraste AA mesuré dans le navigateur (`contraste.e2e.ts`), vu en échec, qui a trouvé l'attribution de la carte sur le violet → `bg-map-land`
- **D102** (#155) : `formaterDureeEstimee` aux 8 affichages de minutes ; « à vol d'oiseau » pour la distance seule d'une gare (choix de Hardy) ; pas pour les lieux (déjà distance à pied estimée) ; #155 recalée sur `main` après la fusion de #154
- **Audit C** (#156, D107) : navigateur de test 2,8–3,0 s (immédiat) contre 1,1–1,3 s, trace = démarrage de la carte, mais SwiftShader ; règle de Hardy fixée avant la mesure ; chronomètre temporaire dans la copie d'essai ; iPhone : 222 / 225 ms (immédiat / après 10 s), puis en ×2 : 253 ms dont 237 ms de réseau (≈ 19 ms pour l'app) ; densité ×2 gardée ; pas de carte différée ; chronomètre retiré
**Décisions :** D106 (surfaces de marque), D107 (audit C, densité ×2) ; D099 modifiée (C et A avancés) ; D102 réalisée
**Problèmes rencontrés :**
- Redeploy 0.4.0 en échec (L80)
- Safari a gardé l'ancien chronomètre : nouvelle adresse de tunnel oubliée après un build (règle du § 9) → tunnel relancé
- Le contraste sur ordinateur a d'abord échoué : carte transparente dans les tests (fond de carte vide)
- `explorer.e2e.ts:121`, `:139`, `:178`, `:194` instables, aussi sur `main`
**À valider par Hardy :** fusion de #156 ; 0.5.0 ; netteté de la carte en ×2 ; ménage du VPS (`avant-donnees.dump` écrasé le 18/11) ; audit A sur l'iPhone
**Prochaine action :** `CLAUDE.md` § 9 (19/11 : #156, 0.5.0, D105, horaires, Wikipédia, audit A, intégration continue)
**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (663, `main` `eccb24b`) · intégration ✅ (205) · parcours 246/248 sur #156 (2 instables connus, aussi sur `main`)
**Commit :** `main` : `eccb24b`

---

## 18/11/2026 (jour) — Étape E11 — lieux avec photo d'abord (D104), horloge des tests
**Fait :**
- #145, #147 fusionnées par Hardy ; avant/après sur l'iPhone par tunnel (copie `../tourisme-recherche`)
- **Idée de Hardy : les lieux avec photo d'abord** dans « Près de vous », « Près de la gare de… » et l'écran Lieux, tri habituel dans chaque groupe, temporaire (D104, #148, fusionnée). Vérifié avant de coder : le serveur choisit les 50 lieux (30 par page dans Lieux) ; un tri dans le composant n'aurait réordonné que ceux-là → tri dans la requête, avant le `LIMIT` (`triPhotosDabord`), réglage `photos.enPremier`
- Mesures (base locale) : « Près de vous » à Dijon 24 → 50 photos sur 50 (4 → 10 parmi les 10 premiers) ; Lieux depuis Dijon, page 1 : 9 → 30 sur 30, trajets 16–29 → 21–33 min (Besançon 8–25 → 10–32). Hardy : « parfait », un peu plus de trajet accepté
- Tests d'abord : 5 en paires (réglage actif / inactif, un seul lieu, page de Lieux), vus en échec ; 3 tests d'ordre adaptés
- **12 tests des trains en échec le 18/11, sur `main` aussi** : l'échantillon n'a que deux jours (15/07, 18/11) ; le 18/11 était aujourd'hui, trains déjà partis cachés. Prouvé avec l'horloge avancée (19/11 et 03/12 : 197/197). **Horloge fixée dans les tests** (#149, fusionnée) : `instant-de-test.ts` (19/11/2026 10 h), serveur par `horloge-de-test.ts` (`setupFiles`, `node --import`), navigateur par `e2e/test.ts` (`setFixedTime`) ; 17 parcours l'importent ; code de l'app inchangé ; L79
**Décisions :** D104 (lieux avec photo d'abord, temporaire). Descriptions complètes renvoyées à D105
**Problèmes rencontrés :**
- Docker inaccessible depuis WSL au début (base arrêtée) : Hardy l'a lancé
- Le tunnel ne s'ouvrait pas depuis le poste (adresse neuve pas encore connue du DNS local) : sans effet sur l'iPhone
- Premier essai de l'horloge : serveur seul réglé, 4 parcours encore en échec (l'onglet Trains lit l'heure du navigateur, `use-maintenant.ts`) → navigateur réglé aussi
- `explorer.e2e.ts:178` et `:194` instables : seuls ×3, branche 1/6, `main` 2/6 ; `carte-cadrage:25` (cause B) 1 fois sur la #148
**À valider par Hardy :** mise en ligne 0.4.0 (dans quelques heures)
**Prochaine action :** `CLAUDE.md` § 9 (0.4.0 : PR de version avec `compter-lignes.sql` complété, puis D, B, C, E)
**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (645, `main` `7c4f4d1`) · intégration ✅ (205) · parcours 240/242 sur #149 (2 instables connus, aussi sur `main`)
**Commit :** `main` : `7c4f4d1`

---

## 17–18/11/2026 (soir) — Étape E11 — coefficient de détour (D102), photos : données (#143) et affichage (#145)
**Fait :**
- Coefficient de détour : 22 trajets réels (routing.openstreetmap.de, points types, jamais la position de Hardy) : commune → gare ×1,22, gare → lieu ×1,32 ; 1,3 gardé (D102) ; distance à vol d'oiseau dite comme telle, « ≈ » à pied (PR à venir)
- D101 (planche : ≈ 55 photos bonnes sur 60 ; `photos_exclues.csv`, cartes postales, commune sur les cartes, noms vagues masqués, « renommer », `<img>` simples) ; leçons L70 → L75 (#141)
- En-têtes de sécurité mesurés en production : aucun des quatre de `07` § 6 (#142, ouverte) ; `URL_CONTACT` dans `infra/README.md` (#144, ouverte)
- **PR 1 des photos (#143, fusionnée)** : migration 0017 (`photo_lieu`, `lieu.wikidata`), étape `pnpm etl photos` (Wikimedia poli, export national DATAtourisme lu en flux), règles et `photos_exclues.csv` ; base locale : **3 322 photos** ; tests d'abord ; parcours 230/230, image ✅
- Deux bugs au premier chargement réel, test d'abord chacun : Commons ne sert plus que des tailles standard (400 → 500, 800 → 960 px, `thumb.wikimedia.org` ; une adresse « 400px » répond HTTP 400) ; data.gouv.fr coupe le téléchargement de 1,9 Go (reprise par `Range`)
- **PR 2 des photos (#145, ouverte)** : `photo` dans les quatre routes de lieux, droits filtrés à la date du jour ; photo à la place de l'icône, icône tout de suite, fondu (`prefers-reduced-motion`), abandon au-delà de 4 s ; ⓘ ; mini-fiches ; Sources ; mentions légales ; D103 ; tests d'abord ; parcours 238/240 (2 instables aussi sur `main`, comparés 10 fois)
- Essais iPhone (Hardy) : les fiches affichent leur photo ; « presque aucune photo autour de moi » → mesuré : le chargement marche (iPhone imité, 4G simulée : 41/41 à Dijon centre, aucune > 4 s), c'est la couverture : en périphérie, surtout des parcs, squares et aires de jeux sans photo (Fontaine-lès-Dijon 4/29, Talant 7/36 ; Dijon centre 41/50)
- Recherche de sources d'images (65 lieux sans photo) : Commons par proximité ≈ 8 bons sur 65, beaucoup de faux ; Panoramax 23/65 tournées vers le lieu, vues de rue (planche) ; API DATAtourisme : rien de plus que l'export. **Hardy : pas de photos pour remplir** ; ses propres photos ou un fournisseur libre, stockage VPS ou R2 + WebP, après la soutenance (`A-FAIRE`)
- Hardy (18/11) : pas de ⓘ dans « Près de vous » (même DATAtourisme) ; sur la fiche, ⓘ discret en bas à gauche de la photo au lieu de la ligne de crédit (crédit complet dans la bulle) ; photos des utilisateurs et bouton Commons notés (`A-FAIRE`)
- Fiche lieu, mesures du 18/11 : Château de Pouilly = OSM sans description (normal) ; Hospices : 149 caractères, tout le CSV, rien coupé par nous ; **l'export national a une description plus longue pour 3 571 fiches sur 3 827** ; horaires : 278 lieux, format `opening_hours` d'OSM en anglais
**Décisions :** D101, D102 (#141) ; D103 (#145) ; **18/11, à écrire en D104 avec leur PR** : (1) descriptions complètes de DATAtourisme depuis l'export national, (2) l'écran garde 4 lignes + « Lire la suite », (3) extrait Wikipédia pour les lieux sans description, à mesurer d'abord ; horaires lisibles validés
**Problèmes rencontrés :**
- `parametres.json` réécrit par `json.dumps` : objets compacts dépliés ; repris en texte
- Lien direct `400px` de Commons refusé (HTTP 400) ; adresses servies par l'API gardées telles quelles (L76)
- Téléchargement de l'export coupé deux fois, la seconde fois l'étape a échoué sans rien remplacer (L77)
- Test de reprise de téléchargement instable sous la charge (le faux serveur coupait trop tôt) : 100 ms avant la coupure, 4/4
- `explorer.e2e.ts:121` et `:139` instables : `main` 3/10 et 1/10, branche 4/10 et 2/10
**À valider par Hardy :** essai iPhone puis fusion de #145 ; fusion de #142 et #144 ; `URL_CONTACT` dans son `.env`
**Prochaine action :** `CLAUDE.md` § 9
**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (645, #145 `28d949f`) · intégration ✅ (197) · parcours photos 12/12 ; suite complète 238/240 sur `4fd1541`
**Commit :** `main` : `a3427ab` ; #145 : `28d949f`

---

## 17/11/2026 (après-midi) — Étape E11 — étude des photos des lieux (D100)
**Fait :**
- Programme jusqu'à la soutenance validé par Hardy (D099, #138) : photos d'abord, audit C puis A en E15, B après la soutenance, marge les 26–27/11
- Étude des photos, sans rien modifier : 11 180 lieux montrés ; Wikidata 2 663 fiches avec photo sur 2 985, Wikipédia 1 534 articles avec image libre sur 1 853, Commons 3 086 fichiers trouvés sur 3 094 (auteur et licence lus automatiquement, 34 sans auteur écartés) ; DATAtourisme : export national RDF (1,9 Go, 14,2 Go en clair, lu en continu, 4 passages d'environ 2,5 min), 718 de nos fiches avec une représentation, 703 utilisables, 34 aux droits expirés, toutes chez Tourinsoft
- Résultat avec les règles de Hardy et le filtre (SVG, Blason, Carte, Map, Logo, Locator : 16 lieux touchés, 12 perdent leur photo) : **3 340 lieux avec photo (30 %)**, 892 sur 2 243 près des gares (40 %)
- Droits DATAtourisme lus à la source (FAQ, CGU diffuseurs v2.0 § 15) : Licence Ouverte si le producteur a les droits, crédit et dates de cession obligatoires
- Poids : Commons 320 px ≈ 31 Ko ; originaux Tourinsoft ≈ 1,5 Mo (jusqu'à 4,3 Mo), `?width=800` → 138 Ko
- Planche de contrôle de 60 photos publiée (artifact privé : https://claude.ai/artifact/LPvTnUAQQW9fgFg96PRHzW)
- D100 et `A-FAIRE` (copie des photos réduites sur R2 ou le VPS si le MVP est validé) : PR #139 ouverte
**Décisions :** D099 (#138), D100 (#139, ouverte)
**Problèmes rencontrés :**
- Wikimedia : réponses 429 (trop de requêtes) ; une seconde entre deux appels et le délai `Retry-After` respecté : 17 pauses, tout est passé
- Téléchargement de l'export national coupé à 312 Mo ; repris avec `curl -C -`
- PDF des CGU illisible sans outil (pas de `pdftotext`) : texte extrait des flux du PDF en Python
- Images d'autres sites bloquées dans un artifact : vignettes intégrées à la page (2,6 Mo)
**À valider par Hardy :** #139 ; planche (numéros des photos fausses) ; export national ou API pour DATAtourisme ; faux positifs du filtre ; service d'itinéraire pour l'étude du coefficient
**Prochaine action :** `CLAUDE.md` § 9
**Vérifications :** aucun code modifié depuis la 0.3.1 (documents seuls) ; dernière vérification complète : `e38358a` (585 tests, intégration 187)
**Commit :** `main` : `dd0da15`

---

## 17/11/2026 — Étapes E11 et E17 — compression et Next.js 16.4.5 (D098), 0.3.0 et 0.3.1 en ligne
**Fait :**
- Essai iPhone de #132 : règle bonne, mais distance disparue à vélo → à droite sur deux lignes, « ≈ N min à vélo » puis la distance en plus petit, listes et « Votre gare » (tests d'abord, 4 unitaires et 3 parcours rouges, puis verts) ; #132 fusionnée
- #133 : cause du « doublon » de `/api/carte/lieux` trouvée par des traces temporaires dans la copie : Next.js 16.4.5 retire `Content-Encoding` des réponses de route (correctif GHSA-pc58, même code en 16.4.6) ; notre route compressait elle-même : corps illisible, deux nouveaux essais, **aucune bulle sur la carte**. Test d'abord (« illisible »), puis `repondreCompresse` retirée (seule route qui l'utilisait) ; D092 point 1 « modifié après coup », D098 complétée ; `carte-chargement` 60/60 ; #133 fusionnée, #129 fermée par Dependabot
- **0.3.0 en ligne** (#135) : CHANGELOG corrigé (ligne « ne parle plus de vélo » devenue fausse), essai de l'image sans cache (17 migrations, version 0.3.0), sauvegarde `avant.dump` (18 Mo), Redeploy, contrôle 0, `/api/carte/lieux` en gzip par le proxy (19,4 Ko reçus, 985 lieux) ; données : export (empreinte `db25cbc0…`), restauration, comptages identiques (mobilite_locale 830), Redeploy, parkings visibles en production ; étiquette `v0.3.0`
- Essai iPhone de la 0.3.0 : à 2,9 km, « Votre gare » affichait « 50 min à pied » (cas D064 laissé à part dans #132, signalé seulement dans la PR) → #136 : une seule règle partout (« Votre gare », phrase « Gare la plus proche », listes), test d'abord avec la position de la capture (6 rouges), D097 point 4 « modifié après coup »
- **0.3.1 en ligne** (#137) : code seul, Redeploy, contrôle 0, essai iPhone ✅, étiquette `v0.3.1`
- Liste des fonctionnalités de la 0.2.0 rédigée pour le professeur de Hardy (conversation)
**Décisions :** D098 complétée (compression par le proxy) ; D092 point 1 et D097 point 4 modifiés après coup. Hardy : distance affichée décidée après l'étude du coefficient de détour ; « ≈ » devant les minutes à pied dans la PR suivante ; retouches UI/UX minimales plus tard (textes petits, présentation du produit)
**Problèmes rencontrés :**
- La PR #133 disait « rien de visible » : faux, la carte n'avait plus de bulles ; trouvé avant toute fusion (L69)
- Hardy demandait de marquer D091 comme remplacée : la compression venait de D092 point 1 (D091 = section `acces`, toujours valable) ; signalé, D092 marquée
- `pkill -f` et `pgrep -f` avec le motif dans la commande ont tué leur propre commande (deux fois) : arrêter un serveur par son port
- `gh pr edit` en échec (API « Projects classic » retirée) : description modifiée par `gh api -X PATCH`
- Docker Desktop arrêté en début de session : base locale injoignable, relancé par Hardy
- Blocs de commandes collés, difficiles à distinguer pour Hardy : une commande par bloc, avec titre (mémoire)
- Parcours instables vus : `explorer.e2e.ts:45` (cause C), `carte-cadrage:25` (cause B, 5/5 relancé), `explorer.e2e.ts:139` (mini-fiche : 1 sur 10 sur `main`, 2 sur 10 sur #136)
**À valider par Hardy :** coefficient de détour après l'étude, puis distance affichée ; plan de l'audit (C, A, B) ; ménage du VPS
**Prochaine action :** `CLAUDE.md` § 9
**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (585, `e38358a` = `main` + version 0.3.1) · intégration ✅ (187) · parcours (#136, `2bd1cc8`) : 229/230, échec `explorer.e2e.ts:139` instable aussi sur `main` ; image 0.3.0 ✅
**Commit :** `main` : `5302bdf` (0.3.1, en ligne)

---

## 16–17/11/2026 (nuit) — Étape E11 — itinéraire sans position, parkings vélo (D097), audit des parcours, Next.js 16.4.5 (D098)
**Fait :**
- Tunnel d'essai de #126 ; #126 puis #130 fusionnées : « Voir l’itinéraire » dès qu'une gare de départ est connue, même choisie à la main ou sans position (test d'abord, 4 cas rouges puis verts) ; icônes génériques confirmées
- Comptage des parkings vélo OSM par la requête de l'extraction (une seule partie téléchargée, rien en base) : 5 136 parkings, 196 gares : 111 à 100 m, **122 à 200 m**, 136 à 500 m, 165 à 2 km ; Hardy choisit 200 m
- #131 (fusionnée) : `acces.rayonParkingVeloM`, migration 0016 `PARKING_VELO`, requête de plus dans `pnpm etl osm` (fichier `parkings-velo.json`), rattachement SQL, `parkingVelo` dans `/api/gares/proches`, « ≈ N min à vélo » + « Parking vélo à la gare » dans les gares proches ; portes sœurs : `transport_local` vidait toute la table et un contrôle aurait bloqué, `/api/mobilites` ne renvoie pas les parkings (test qui échoue sans le filtre, vérifié)
- Base locale : 0016 appliquée, parkings chargés hors ligne : 277 couples, 122 gares, contrôles ✅, lieux et transports inchangés
- #132 (ouverte) : « Votre gare » suit la même règle (demande de Hardy), une seule fonction `accesGare(volOiseauM, parkingVelo)`
- Audit des parcours instables (`A-FAIRE` § 1) : 3 causes, chacune test fragile et défaut de l'app : A épingle recouverte (cadrage non refait en plein écran), B vue provisoire avant le cadrage, C « Voir la sortie » retardée par le démarrage de la carte ; plan C, A, B
- Next.js : 7 failles corrigées par 16.4.5 (article du 03/11), Wagoo exposé à aucune ; #133 ouverte (16.4.5 seul, image Docker ✅), **régression** : `/api/carte/lieux` demandée 2 fois ; image de `main` (16.4.1) construite deux fois sans l'avertissement : déploiement du 17/11 sans risque
**Décisions :** D097 (point 4 modifié dans #132), D098 (dans #133)
**Problèmes rencontrés :**
- Trois commits de la sauvegarde poussés après la fusion de #128 : absents de `main`, retrouvés et repris dans cette sauvegarde (L67)
- #131 fusionnée quelques minutes après son ouverture : le complément « Votre gare » est parti dans #132
- Première analyse de sécurité fausse : `pnpm audit` et Dependabot ne connaissaient qu'une des 7 failles ; corrigée par Hardy (L66)
- Premier `next build` arrêté par `SecurityFatalError` (16.4.1), réussi au second ; sans effet sur l'image Docker
**À valider par Hardy :** essai iPhone de #131 et #132 ; plan de l'audit ; cause du doublon de #133 puis choix ; fermer #129
**Prochaine action :** `CLAUDE.md` § 9
**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (586, `main`) · intégration ✅ (187) · parcours : `main` + #131 : 221/222, #132 : 223/224 (échec : `carte-cadrage:25`, cause B) ; #133 : 219/222 (cause B + régression)
**Commit :** `main` : `2e3a6f9` ; #132 `b800830` ; #133 `3e9d135`

---

## 16/11/2026 — Étapes E11 et E17 — carte rapide (D095), 0.2.0 en ligne, « Voir l’itinéraire » (D096)
**Fait :**
- Mesures de la carte (navigateur qui imite un iPhone, Dijon, 101 gares) : 641 ms sur 727 de la requête des lieux partaient dans la compilation JIT de PostgreSQL ; les lieux n'étaient demandés qu'après toutes les tuiles
- #123 : JIT coupé pour l'application, lieux demandés sans attendre la carte (D095). Comparaison de référence (5 chargements alternés, médiane) : requête 489 → 50 ms ; lieux reçus 3,98 → 1,11 s (PC), 10,3 → 4,6 s (processeur ×4 + 4G). Leçons L63 → L65 et chiffres pour le jury
- #124 : version 0.2.0 (`apps/web/package.json`, renvoyée par `/api/sante`)
- **Mise en ligne de la 0.2.0** avec Hardy : sauvegarde (`avant.dump`, 18 Mo), Redeploy (migrations 0014–0015), contrôle 0 ; export local (empreinte `6023b16a…`), `scp`, deuxième sauvegarde (`avant-donnees.dump`), restauration, comptages identiques au poste (12 242 lieux, 268 025 liaisons…), Redeploy, contrôle 0, iPhone ✅ ; étiquette `v0.2.0`
- #125 : aide-mémoire « mettre en ligne seul » en tête d'`infra/README.md` (quel cas, étapes A → E, pièges vus)
- #126 ouverte : « Votre gare » sans durée à vélo (à pied ou distance), « Voir l’itinéraire » (gare seule en destination), feuille Plans / Google Maps sur iPhone (D096)
- #127 : sauvegarde de session fusionnée
- Essai de #126 par Hardy (soir) : feuille Plans / Google Maps ✅. Il ne voyait que « Voir l’itinéraire » : depuis sa position, la gare proposée (Dijon) n'est pas la plus proche (Dijon Porte Neuve), donc la durée à pied s'affichait déjà avant (D064). Le changement se voit dans « Gares proches » (page Trajet) : « X min à pied » ou la distance au lieu de « X min à vélo ». En touchant « Partir de Dijon Porte Neuve », la gare devient choisie à la main : ni distance ni lien (question ouverte)
- Logos de Plans et Google Maps : marques déposées, règles d'usage publiées par Apple et Google ; pas de réponse « autorisé » sans les avoir lues. Conseil : garder les icônes génériques ; lecture des règles proposée à Hardy
**Décisions :** D095, D096
**Problèmes rencontrés :**
- Un premier passage de mesure donnait 18–21 s avant correction ; la médiane de 5 passages donne 10,3 s : chiffre corrigé auprès de Hardy (L65)
- Essai de l'image : `migrer` a échoué au premier lancement sur un volume neuf (base qui redémarre après son initialisation) ; reporté dans `A-FAIRE` § 3
- Test de « Votre gare » d'abord écrit sur la mauvaise zone (`/Dijon/` attrapait « En train direct depuis Dijon-Ville ») : il échouait sur `main` pour une mauvaise raison ; corrigé et revérifié sur `main`
- Lien d'itinéraire sur une ligne à part : feuille plus haute, carte recadrée, `explorer.e2e.ts:178` 3 échecs sur 4 ; lien déplacé sous la distance
- Même adresse de tunnel après un nouveau build : l'iPhone garde l'ancienne version (service worker) ; une adresse neuve à chaque build
- Ordinateur de Hardy : position estimée hors région → « Wagoo arrive bientôt » ; serveurs vérifiés (Dijon trouvée, `dansRegion` vrai), reproduit avec une position à Paris
- Alerte Dependabot de MapLibre présentée comme nouvelle alors qu'elle était tranchée (D065) ; corrigé
**À valider par Hardy :** fusion de #126 ; lien d'itinéraire aussi avec une gare choisie à la main ; logos officiels (après lecture des règles de marque) ou icônes génériques
**Prochaine action :** `CLAUDE.md` § 9
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (580) · intégration ✅ (182) · parcours : 212 sur 215 sur #126, échecs = touchers de carte instables aussi sur `main`
**Commit :** `690c0c1` (#126, ouverte) ; `main` : `6e0a1c9`

---

## 12/11/2026 (nuit) — Étape E11 — parcours des filtres (F05), cadrage de la carte (D087)
**Fait :**
- #104 : idées de la maquette v6 notées dans `A-FAIRE` (nombre de lieux par gare, section « À deux pas » en 4 situations, « Distance à pied ») ; reportés : icônes au zoom libre, Dijon-Ville par défaut sans position
- #105 : parcours des filtres durée, faisable, rayon (léger), ville, Lieux ; F05 ✅ ; plan en 6 points terminé
- #107 : cadrage de départ à 16 min (mesuré : Genlis 10 min, Mâlain 16 min depuis Dijon) et centrage sur la destination choisie ; bug trouvé par Hardy sur iPhone (✕ sans effet, feuille montée) : test du chemin exact d'abord, puis marges limitées et remises à zéro
- #106 : règle des deux copies (`tourisme-recherche` pour le serveur d'essai, `tourisme-parcours` pour les parcours)
- Plan du point (b) proposé à Hardy
**Décisions :** D087
**Problèmes rencontrés :**
- Les parcours refaisaient le build sous le serveur d'essai de Hardy : d'où la deuxième copie
- J'avais décrit « Recentrer » comme ramenant sur la destination alors que le prototype ne le faisait pas ; corrigé
**À valider par Hardy :** plan du point (b)
**Prochaine action :** point (b) après l'accord de Hardy (`CLAUDE.md` § 9)
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (343) · parcours des PR : filtres 30/30, cadrage 7/7
**Commit :** `fcbb8f1` (#107)

---

## 14/11/2026 — Étape E11 — piscines masquées, nombres sans fondu, carte par zone (D093, D094)
**Fait :**
- #114 et #115 fusionnées
- #116 fusionnée (D093) : piscines rechargées en base et masquées (`lieu.masque`, migration 0015) ; 95 en base, 94 masquées
- #117 fusionnée : nombres des bulles sans fondu (`fadeDuration` 0)
- #118 ouverte (D094) : carte des lieux autour de soi (rayon du filtre) et de chaque gare de destination affichée ; bulles décalées [20, -5] ; réglages de Hardy sur iPhone (37 px, zoom 13). Parcours 207/207
- `LECONS.md` : L56 → L62 et questions du jury sur la carte (#119 fusionnée)
- #118 fusionnée ; #120 ouverte : bulles à la couleur de la marque, nombre clair (essai validé par Hardy)
**Décisions :** D093, D094
**Problèmes rencontrés :**
- Hardy a modifié `parametres.json` dans le dépôt alors que son serveur d'essai tourne dans `../tourisme-recherche` : un réglage s'essaie dans la copie, et demande un nouveau build
- Cadrage sur Beaune (`carte-cadrage.e2e.ts:25`, téléphone) : 3 réussis sur 6 sur `main` après #118 (la suite complète de #118 était passée) ; mini-fiche d'une épingle (`explorer.e2e.ts:121`) échoue aussi parfois. Priorité de la prochaine session
**À valider par Hardy :** fusion de #118 ; couleurs inversées des bulles (à essayer dans `tourisme-recherche`) ; mise en ligne quand il le décide
**Prochaine action :** performance de la carte d'abord (Hardy : la carte charge longtemps, les bulles arrivent après ; #120 et #121 fusionnées), avec les parcours instables, puis PR vélo prouvé ; mise en ligne (« mets en ligne ») : 2 migrations (0014, 0015) puis les données
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (`pnpm verifier` 573, intégration 181, parcours 207/207 sur la branche de #118)
**Commit :** #116 (`ba3f660`), #117 (`3edd8ce`) ; #118 ouverte

---

## 13/11/2026 (soir) — Étape E11 — audit des lieux hors périmètre, section `acces`, carte de tous les lieux
**Fait :**
- Audit sans code (D090) : 81 % des lieux cachés par le périmètre (8 678 sur 10 749), jamais écartés à l'import ; rapport `docs/audits/carte-lieux-accessibilite.md` (non versionné, dans le dossier de Hardy)
- #113 fusionnée (D091) : section `acces` (2 km à pied, vélo 6 km, aires de jeux à 1 km, piscines retirées), action `inclure` ; 2 243 lieux à pied
- #114 ouverte (D092) : tous les lieux en bulles qui se divisent au zoom puis icônes, réglées par Hardy sur iPhone (zoom 12, 45 px) ; tri du patrimoine OSM pauvre loin des gares (8 733 → 7 459, musées et abbayes gardés) ; `lieu.wikipedia` (migration 0014, 1 943 lieux)
- Idée de Hardy, gardée pour la suite : cercles à pied et vélo autour de la destination choisie, vélo seulement si une donnée le prouve (`A-FAIRE`)
**Décisions :** D091, D092 (dans #114)
**Problèmes rencontrés :**
- Erreur de Claude : #113 « ne charge pas » les piscines, ce qui les supprime de la base au rechargement. Hardy ne voulait que les retirer de la carte. Correction prévue (PR piscines) avant toute mise en ligne des données
- La carte de tous les lieux ralentissait l'affichage sur téléphone (`react-dom/server`, demande en parallèle) : trouvé par les parcours, corrigé
- Une commande `pkill -f` a arrêté sa propre session (motif contenu dans la commande) : arrêter un serveur par son port
**À valider par Hardy :** fusion de #114 ; rayon à pied 1 560 m (cercle de 1,2 km) pour la PR cercles ; design des bulles
**Prochaine action :** PR piscines (recharger en base, cacher à l'affichage), puis PR cercles
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (`pnpm verifier` 573 sur la branche de #114 ; `main` `16d9015` vérifié avec #113 : 568) · intégration 177 ✅ · parcours 207 ✅, 0 échec (#114)
**Commit :** #113 (`16d9015`) ; #114 ouverte

---

## 13/11/2026 — Étape E11 — carte v6 : bulles (#110), « Près de vous » et mode destination (#111)
**Fait :**
- #110 : bulle du nombre de lieux à pied sur chaque gare, à côté du point ; mini-fiche avec le détail par catégorie (D088). Validée par Hardy sur iPhone
- #111 : « Près de vous » / « Près de la gare de… » ; destination choisie : section en bas autour de sa gare, train vers elle dans « Votre gare », « Filtres » réduit à « Quand ? » (D089). Essais successifs sur iPhone : distance grisée, puis temps et faisable grisés avec une phrase, enfin cachés
- #109 : `A-FAIRE`, périmètre dessiné autour de la gare et lieux hors périmètre (retour d'un testeur : Mâlain)
- Mesure du 13/11 (gare la plus proche, hors lieux en longueur, estimation) : ≈ 2 085 lieux à 1,5 km à pied d'une gare, 2 587 à 2 km, 2 947 à 2,5 km, 3 299 à 3 km, sur 10 749 ; Mâlain à 2 178 m
- c2 prévue (icônes au zoom, limitées au périmètre) abandonnée : audit d'abord (D090)
**Décisions :** D088, D089, D090
**Problèmes rencontrés :**
- Sous la charge des parcours, des touchers sur les points de la carte n'aboutissent pas en 30 s (téléphone), sur `main` comme sur la branche : instabilité existante, ajoutée à `A-FAIRE`
**À valider par Hardy :** design des bulles (plus tard) ; prompt de l'audit des lieux hors périmètre
**Prochaine action :** audit sans code des lieux hors du périmètre des gares (D090), d'après le prompt de Hardy
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (558, `pnpm verifier` sur `main` `3bd4398`) · parcours : 111 réussis, 2 échecs sous la charge, qui passent ensuite seuls (cadrage 6/6, mini-fiche 5/5) ; 2 échecs de même nature sur `main`
**Commit :** #109, #110 (`8ab5a95`), #111 (`3bd4398`)

---

## 12/11/2026 — Étape E11 — page de départ sur Lieux, fond sous le clavier, date dans « Filtres » (D086)
**Fait :**
- Dépôt réparé : objet du commit `4c571eb` et 5 documents vidés par un arrêt brutal de WSL pendant un `pull` ; objet retéléchargé, documents remis depuis le commit
- #99 : le fond de la page plein écran ne suit plus le clavier, seul le contenu se cale au-dessus (`placement-page.ts`, test d'abord) ; validé par Hardy sur iPhone
- #100 : page « D'où partez-vous ? » plein écran sur Lieux, au téléphone ; validée par Hardy sur iPhone
- Parcours instable : non reproduit seul (80/80) ni dans une suite complète (166/166), puis 1 échec sur 180 dans une autre suite complète (adresse inchangée après le toucher)
- En-tête allégé, date dans « Filtres » (maquette « Explorer Mobile v5 »), sur Explorer **et** Lieux : prototype validé par Hardy, puis tests et documentation
**Décisions :** D086 ; D084 point 4 remplacé
**Problèmes rencontrés :**
- Les parcours refont le build dans la copie `../tourisme-recherche` : le serveur de Hardy lancé dessus sert alors un build périmé, à relancer
**À valider par Hardy :** le texte « Voir les sorties » ou « Afficher N sorties » (maquette v5) ; l'ordinateur sans bouton date
**Prochaine action :** point 6 du plan (D080) : parcours des filtres rayon, durée, ville (F05)
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (340 dans `apps/web`) · parcours 174/180 puis les 6 échecs repris : 5 erreurs de test corrigées, 1 = parcours instable connu
**Commit :** `9630e7a` (#101), sauvegardes #102 et suivante

---

## 11–12/11/2026 (soir) — Étape E11 — #94 : page « Trajet » plein écran sur téléphone (D085)
**Fait :**
- Trois essais sur les feuilles, abandonnés après l'essai de Hardy sur iPhone : hauteur fixe à 250 px du haut ; hauteur fixe aux filtres, clavier par-dessus (`repositionInputs` de vaul coupé) ; feuille `vaul` agrandie à tout l'écran avec un champ d'amorce du clavier (page qui part en haut, sortie coupée par le clavier). Chaque essai annulé par `git revert`
- Solution de Hardy, d'après la maquette « Explorer mobile v4 » : une page plein écran « Trajet » (D085), couche fixe superposée sans route, fondu, champ qui prend la main dans le toucher, enchaînement Départ → Destination. Prototype validé par Hardy sur iPhone
- Page fixe sous le doigt : geste annulé hors de la liste ou aux bords de la liste (`lib/blocage-geste.ts`, test d'abord), fond verrouillé
- Tri par temps de la recherche (test d'abord) : Besançon Franche-Comté TGV avant Paris
- Les parcours ont trouvé un défaut d'accessibilité : le ✕ dans le `<label>` s'ajoutait au nom du champ ; corrigé
- `main` fusionnée dans la branche (sauvegardes #95 → #97)
**Décisions :** D085 ; D084 renvoie à D085 pour le téléphone
**Problèmes rencontrés :**
- Trop de tests et de builds écrits pour des essais ensuite abandonnés. Règle de Hardy pour cette session : prototype d'abord, tests et documentation une fois le design approuvé
**À valider par Hardy :** le plan de la page « Trajet » sur Lieux
**Prochaine action :** page « Trajet » sur l'écran Lieux (`A-FAIRE`), plan court d'abord, prototype avant les tests
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (535, sur `main` après fusion) · parcours 161 réussis, 1 échec de test corrigé (`destination.e2e.ts`, « Retour » visé dans `main`), relancé 26/26
**Commit :** #94 fusionnée (`c41c2c3`)

## 11/11/2026 (après-midi) — Étape E11 — #94 : feuille « Où allez-vous ? » et indicateur de défilement
**Fait :**
- #94, retours de Hardy sur téléphone : « Où allez-vous ? » ne s'ouvre plus à sa hauteur maximale ; elle prend la hauteur de son contenu, comme « D'où partez-vous ? » (une hauteur fixe, essayée entre-temps, faisait monter la feuille vide en haut de l'écran avec le clavier)
- Fermeture au choix d'une destination : la feuille disparaissait d'un coup. Cause mesurée : filtrer la liste et la carte bloquait le navigateur ~0,7 s (9 tâches longues) pendant la glissade. Le choix s'applique désormais une fois la feuille sortie (`Feuille.apresFermeture`). Test qui reproduisait le défaut (3 échecs sur 3), puis correction
- Indicateur de défilement dans toutes les feuilles (trait de la marque, rail presque invisible, même largeur), visible tant que du contenu est caché : Safari sur iPhone n'affiche sa barre que pendant le geste et ignore son style. Calcul pur testé (`lib/defilement.ts`), jetons `--indicateur-defilement-*`
- Bouton « Afficher les x destinations » dans la liste, plus collé en bas (il écrasait la liste)
- `A-FAIRE` : « Où allez-vous ? » deviendra probablement une page
**Décisions :** D084 modifiée (sur la branche de la #94)
**Problèmes rencontrés :**
- Première hypothèse fausse (montée de la feuille de résultats) : trouvée par expériences, mais trop de builds et d'erreurs évitables ; Hardy a relevé le coût (45 000 tokens)
- Parcours instable connu : 1 échec sur 40 relances, même erreur qu'avant
**À valider par Hardy :**
- #94 sur iPhone (`767d36f`) : « Où allez-vous ? » posée sur le clavier, glissade à la fermeture, indicateur
- Vu sans y toucher : choisir une gare proche dans « D'où partez-vous ? » semble aussi faire disparaître la feuille d'un coup ; en tapant « b », Paris (1 h 36) passe avant Besançon Franche-Comté TGV (26 min)
**Prochaine action :**
- Retour de Hardy sur la #94 ; puis parcours instable (PR à part), puis en-tête repliable
**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (523) · parcours 160/161, l'échec = parcours instable connu
**Commit :** `767d36f` (branche `etape/E11-recherche-destination`)

## 10–11/11/2026 — Étape E11 — recherche de ville, TER Mobigo, guidage, recherche de destination ; travail « comme un produit »
**Fait :**
- Nouvelle façon de travailler (D080) : `main` + CHANGELOG, versions (0.1.0 = mise en ligne du 07/11, étiquette `v0.1.0` posée ; 1.0.0 = premier client), une PR = un sujet, un bug commence par un test, règles de travail dans une PR à part.
- #90 : recherche de ville limitée aux communes (D081). Mesuré : les « Beaune » parasites étaient surtout des **rues**, pas des lieux-dits.
- #91 : « TER Mobigo » si les deux terminus du train sont dans la région (D082). Mesuré : 1 104 TER Mobigo, 1 449 TER sur 2 553 ; les horaires SNCF ne donnent pas la région.
- #92 : test « prix non calibré » sur les cartes d'Explorer.
- #93 : guidage de la localisation refusée selon l'appareil (D083), essayé par Hardy sur iPhone.
- #94, **ouverte, non fusionnée** : barre du trajet « Autour de Dijon → Où aller ? » et feuille « Où allez-vous ? » (D084), après comparaison de trois variantes sur maquette ; corrigée deux fois après les essais de Hardy sur téléphone.
- Production inchangée (0.1.0) : tout attend sous « Non publié » dans `CHANGELOG.md`.

**Décisions :** D080, D081, D082, D083, D084 (D084 dans la #94).

**Problèmes rencontrés :**
- Une règle « nom exact » dans la recherche de destination faisait perdre Besançon TGV : écartée par les tests.
- « Bligny-lès-Beaune » de la maquette n'existe pas : donnée inventée de mes tests, recopiée dans le prompt (L54).
- Parcours « les résultats arrivent, puis une destination s'ouvre » **instable sur `main`** : 3 échecs sur 20 (la fiche ne s'ouvre pas en 5 s). À corriger dans une PR à part (`A-FAIRE` § 1, L55).
- Hardy a noté des « comportements bizarres » dans la #94, sans les détailler : à reprendre avec lui.
- Demande mal comprise : « que la feuille monte comme celle d'Autour de Dijon » a été lue comme « même hauteur d'ouverture » (`0cf7202`). Hardy a demandé de revenir en arrière : `7789d45` annule ce commit, la #94 est identique à `f3ee6d8`, la version qu'il avait essayée. Avant de recoder, lui faire décrire le geste attendu, avec un exemple à l'écran.

**À valider par Hardy :**
- La #94 sur téléphone, puis la fusion. Textes Android du guidage pendant E14.

**Prochaine action :**
- Voir `CLAUDE.md` § 9.

**Vérifications :** `main` (`53b43fe`) : typecheck ✅ · lint ✅ · format ✅ · tests ✅ (500). Parcours : 3 échecs sur 20 du même test instable, existant avant la session.
**Commit :** voir `docs(contexte): sauvegarde de session du 11/11` (branche `etape/contexte-1111`)

---

## 07/11/2026 — Étape E13 — chiffres en ligne, ordre du travail fixé
**Fait :**
- #88 fusionnée et déployée (`d1f0206`). Contrôle de la production : tout est bon. `/a-propos` affiche 97 Mt, 69 % et 14 kg contre 2,8 kg, sans erreur ni débordement en 390 px dans Chromium.
- Ordre fixé par Hardy : les étapes prévues d'abord, le design et la structure UI/UX ensuite.

**Décisions :** D079.

**Problèmes rencontrés :**
- Copie locale et branche retirées alors que la #88 était encore ouverte : ma commande n'attendait pas le résultat de la vérification. Rien de perdu (aucun changement non commité, branche sur GitHub). Vérifier l'état de la PR avant tout nettoyage.

**À valider par Hardy :**
- À propos sur l'iPhone.

**Prochaine action :**
- Voir `CLAUDE.md` § 9.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (482), sur une copie. Documents seuls depuis la #88.
**Commit :** voir `docs(contexte): sauvegarde de session du 07/11, ordre du travail` (branche `etape/contexte-0711-ordre`)

---

## 07/11/2026 — Étapes E13 et E17 — chiffres de l'ADEME, dates, changements de structure
**Fait :**
- 97 Mt et 69 % affichés sur À propos, source ADEME, sans les 11 %. Texte du communiqué copié par Hardy et noté dans `equipe/pitch.md`.
- Dates de Hardy notées : P0 au plus tard le 22/11, gel des nouveautés au plus tard le 27/11, puis corrections, design et déploiements jusqu'à la soutenance.
- Procédure : plan validé et essai sur téléphone avant la fusion pour tout changement de structure ou de présentation.
- Réglages Coolify confirmés par Hardy : déploiement manuel, mises à jour automatiques coupées (elles tournaient chaque nuit à 0 h 24 UTC).

**Décisions :** D078.

**Problèmes rencontrés :**
- `ademe.fr` répond 403 à la lecture automatique, encore essayé le 07/11. Résolu par le texte copié par Hardy.
- La page du ministère rapproche à tort les 11 % des 97 Mt, et donne d'autres chiffres pour l'avion : elle n'est pas citée sur le site.

**À valider par Hardy :**
- Fusion de la PR de sauvegarde, puis Redeploy pour publier les chiffres.
- Liste de changements à envoyer.

**Prochaine action :**
- Voir `CLAUDE.md` § 9.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ · intégration ✅ (167) · parcours ✅ (133, 1 ignoré), avant le retrait du lien du ministère ; ensuite `pnpm verifier` (482) et le parcours À propos relancés, tous bons.
**Commit :** voir `docs(contexte): sauvegarde de session du 07/11, chiffres de l'ADEME et dates` (branche `etape/E13-chiffres-ademe`)

---

## 07/11/2026 — Étape E17 — mise en ligne complète, procédure pour chaque mise à jour
**Fait :**
- Lots 2 à 5 : VPS OVH, Coolify 4.6.0, `wagoo.hardylino.com` en HTTPS, base chargée (12 242 lieux, 268 025 liaisons, chiffres identiques au poste). Tickets #74 et #75 fermés.
- Panneau passé en HTTPS sur `coolify.hardylino.com`, mot de passe changé, ports 8000, 6001 et 6002 limités à `localhost`, 8080 retiré. Mesuré de l'extérieur : seuls 22, 80 et 443 ouverts.
- Mentions légales complétées : OVH SAS, capital, adresse, téléphone, tels que donnés par Hardy.
- Procédure de mise en ligne dans `infra/README.md`, protocole « mets en ligne » dans `CLAUDE.md` § 15, scripts `controler-production.sh` (essayé sur le site, et sur une adresse fausse : échec attendu) et `compter-lignes.sql`.
- Point du reste à faire avant le P0 : `BACKLOG` § 8.

**Décisions :** D077.

**Problèmes rencontrés :**
- `infra/README.md` demandait à tort de saisir `NODE_ENV` et écrivait les exports à la racine, sans protection de Git. Corrigé (#84).
- Premier contrôle des positions sans valeur : le Redeploy avait remplacé le conteneur et son journal. Relevé par Hardy ; refait sur le conteneur en place, 0 et 0.
- Panneau d'abord accessible en HTTP simple, compte créé ainsi : mot de passe changé depuis le HTTPS.

**À valider par Hardy :**
- Auto deploy sur *Manual deployments only* et mises à jour automatiques de Coolify (`A-FAIRE` § 2).
- Retouches de design notées sur iPhone.

**Prochaine action :**
- Session de retouches, puis les cases d'E11 et E12.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (482), sur une copie. Intégration et parcours non relancés : seuls un texte et des documents ont changé depuis la PR #82. **Pas essayé :** les retours en arrière de la procédure, et une mise à jour avec migration. **Limite :** aucun pare-feu de l'hébergeur (`A-FAIRE`, phase 2).
**Commit :** voir `docs(contexte): sauvegarde de session du 07/11` (branche `etape/contexte-0711`)

---

## 06/11/2026 — Étapes E13 et E17 — écrans d'information, CO₂ défendu, mise en ligne préparée
**Fait :**
- E13 : écran Sources par thème, page À propos, Mentions légales et confidentialité (PR #72, #81 et #82 fusionnées).
- CO₂ : licence d'Impact CO2 relue, Base Carbone et applications du marché comparées, 14 kg contre 2,8 kg gardé. Dossier pour la soutenance dans `LECONS`.
- E17 : audit, Hardy devient responsable infrastructure, plan en deux phases. Tickets I01 à I22 fermés, #73 à #80 créés ; guides SR supprimés ; Ethan retiré des collaborateurs par Hardy.
- E17 lot 1 : `apps/web/Dockerfile` (430 Mo), `infra/compose.prod.yml`, scripts d'export et de restauration, essayés en local avec le compose complet.

**Décisions :** D075, D076.

**Problèmes rencontrés :**
- **Position dans le journal** quand une requête échouait (règle 5). Corrigé, et testé sur une vraie requête en échec.
- **Connexion à la base perdue** sans gestionnaire d'erreur : objets bruts dans le journal à chaque redémarrage de la base. Corrigé : 453 lignes avant, 10 après.
- La construction échoue sans variables : valeurs factices limitées à la construction.
- `pg_restore --clean` seul plante après avoir supprimé les tables, à cause des extensions de l'image : le script retire les lignes `EXTENSION`.
- Licence d'Impact CO2 annoncée sans vérification : corrigée (réutilisation non commerciale). J'ai d'abord recommandé 25,6 kg avant de me rétracter : le jury aurait lu 14,2 kg sur le site de l'ADEME.

**À valider par Hardy :**
- Lots 2 à 5 : VPS, Coolify, DNS, secrets (fiche E17).
- Communiqué de l'ADEME à ouvrir pour 97 Mt et 69 %, encore masqués ; textes du pitch à finir à la fin du projet.

**Prochaine action :**
- Hardy suit le pas-à-pas de la fiche E17. VPS prêt : commandes du lot 4 et hébergeur dans les mentions.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (482) · intégration ✅ (167) · parcours ✅ (133, 1 ignoré), sur la branche de la PR #82. **Pas essayé :** VPS, Coolify, HTTPS, vrai téléphone sur cette image.
**Commit :** voir `docs(contexte): sauvegarde de session du 06/11` (branche `etape/E17-contexte`)

---

## 06/11/2026 — Étape E11 — mention de la carte, ligne du train, retouches de design
**Fait :**
- Mini-fiche : reste juste au-dessus de la feuille dans toutes les positions, se cache quand la feuille est tout en haut, se referme quand on touche une carte de la liste.
- Mention de la carte sur une ligne, trois liens sans couleur ni soulignement (D073).
- Ligne du prochain train, d'arrêt en arrêt, à la sélection d'une carte ou d'un point ; segments droits cachés, à l'essai (D074).
- Retouches de Hardy : `--espace-bas` à 16 px, 24 px sous « Acheter mon billet », 4 px au-dessus de l'en-tête d'Explorer, ligne des trains centrée, bouton de la carte aux couleurs du menu, icône `binoculars` pour Lieux, « Infos » et icône `info` au lieu de « Menu ».
- Noté dans `A-FAIRE` : poignée en chevron, vrais tracés de rails (option A).

**Décisions :** D073, D074 ; D072 modifiée après coup.

**Problèmes rencontrés :**
- La ligne était lente : toutes les couches de la carte étaient recalculées à chaque affichage. Corrigé (`useMemo`) ; mesuré dans Chromium sans carte graphique, premier toucher de 2 469 à 1 250 ms. Pas mesuré sur un vrai téléphone.
- `pnpm dev` rechargeait la page en boucle. Le même code dans un `.next` neuf ne bouclait pas, et la boucle a disparu après le redémarrage de Hardy. Cause exacte non isolée, mais j'avais conseillé de reconstruire pendant que `pnpm dev` tournait et lancé `pnpm typecheck` dans le dépôt, qui écrit aussi dans `.next`.
- Lu à tort que les conditions d'OpenFreeMap ne demandaient rien : elles demandent bien une mention. Sans effet, les trois sont gardées.

**À valider par Hardy :**
- Sur iPhone : délai de la ligne, marges. Fusion de la #71.

**Prochaine action :**
- Après la fusion : mettre `main` à jour, plan de E13.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (471) · intégration ✅ (164) · parcours ✅ (113, 1 ignoré), sur une copie, avant les derniers commentaires et documents
**Commit :** voir `docs(contexte): sauvegarde de session du 06/11` (branche `etape/E11-carte-plein-ecran`)

---

## 05/11/2026 — Étape E14 — PR #70 fusionnée, #71 recalée
**Fait :**
- PR #70 (PWA) fusionnée par Hardy ; PR #71 recalée sur `main`.
- Tunnel décroché après une coupure d'Internet : `cloudflared` tourne encore mais l'adresse n'existe plus (`/ready` à 503). Serveur local sain.

**Décisions :** aucune.

**À valider par Hardy :**
- Marges sur iPhone, puis fusion de la #71.

**Prochaine action :**
- Corriger ce qu'il signale ; après la fusion, plan de E13.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (465) · intégration ✅ (158) · parcours ✅ (106), sur la branche de la PR #71
**Commit :** voir `docs(contexte): sauvegarde de session du 05/11` (branche `etape/E11-carte-plein-ecran`)

---

## 05/11/2026 — Étapes E11 et E14 — retour de Hardy sur iPhone : gel validé, marges corrigées
**Fait :**
- Gel hors ligne validé par Hardy sur iPhone : les pages parcourues restent lisibles, les autres non, ce qu'il juge correct.
- Carte sous les filtres validée par Hardy.
- Marges : 5 px en bas au lieu de toute la marge de l'iPhone ; hauteur corrigée dans l'application installée (`--hauteur-app`) pour supprimer la bande blanche ; bandeau hors ligne sous la caméra. PR #71.

**Décisions :** D072 précisée : en bas, quelques pixels seulement (choix de Hardy).

**Problèmes rencontrés :**
- J'avais appliqué toute la marge de l'iPhone alors que Hardy demandait quelques pixels, ce qui a fait monter la barre de menu. Avec la bande blanche, le rendu était mauvais.
- La cause de la bande blanche est déduite de la capture de Hardy et simulée dans Chromium, pas mesurée sur un iPhone.

**À valider par Hardy :**
- Fusion de la #70 ; marges sur iPhone (#71). Avec 5 px, le texte de la barre de menu peut approcher le trait de l'iPhone : une seule valeur à changer (`--espace-bas`).

**Prochaine action :**
- Recaler la #71 après la #70 ; plan de E13.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (465) · intégration ✅ (158) · parcours ✅ (106), sur la branche de la PR #71
**Commit :** voir `docs(contexte): sauvegarde de session du 05/11` (branche `etape/E11-carte-plein-ecran`)

---

## 05/11/2026 — Étapes E11 et E14 — Explorer gardé en vie, PWA, essais sur iPhone
**Fait :**
- PR #66 → #69 fusionnées : navigation sans rechargement, « Votre gare », Explorer gardé en vie (mémoire mesurée), filtres gardés entre les onglets. `BACKLOG.md` relu ligne par ligne.
- PR #70 ouverte (E14) : manifest, service worker, liste explicite des routes gardées, dernière gare sur l'appareil, bandeau, page indisponible hors ligne, retour du réseau, message si les scripts manquent.
- PR #71 ouverte : carte sous les filtres sur mobile, marges iPhone, dégradé, poignée posée sur le menu.
- Hardy a installé la PWA sur son iPhone : plein écran et localisation fonctionnent, liste de retouches reçue.

**Décisions :** D069, D070, D071, D072. Hardy : fonctionnalités, performance et bugs d'abord ; logo et icônes à la fin ; E14 avant E13 ; PWA pour Android **et** iPhone.

**Problèmes rencontrés :**
- Écran blanc sur l'iPhone de Hardy : mes parcours ont reconstruit le `.next` de son serveur (12 scripts sur 18 en erreur 500). Depuis, parcours et builds dans une copie.
- Tunnel Cloudflare décroché : adresse disparue, serveur sain ; il a fallu un nouveau tunnel.
- Localisation « bloquée » dans un navigateur iPhone autre que Safari : réglage du téléphone, marche dans la PWA. Meilleur message noté dans `A-FAIRE`.
- Gel hors ligne constaté par Hardy : une fiche jamais ouverte menait à la page d'erreur du navigateur.
- Trois bugs de ma part trouvés par les parcours : page hors ligne qui se rechargeait en boucle, bouton retour qui restait sur place, couche invisible sur la carte. Un commit fait avant de voir un test échouer, repris ensuite.

**À valider par Hardy :**
- Sur iPhone : gel et retour du réseau, marges, carte, poignée ; puis fusion de la #70 et de la #71. Android à trouver.

**Prochaine action :**
- Corriger ce qu'il signale ; recaler la #71 après la #70 ; plan de E13.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (462) · intégration ✅ (158) · parcours ✅ (106), sur la branche de la PR #71
**Commit :** voir `docs(contexte): sauvegarde de session du 05/11` (branche `etape/E11-carte-plein-ecran`)

---

## 05/11/2026 — Étape E11 — gare par défaut corrigée, écran Lieux, navigation sans rechargement
**Fait :**
- PR #60 corrigée puis fusionnée : gare la plus proche, sauf gare à 3 km au plus, au moins 1,5 fois plus de trains et aucune destination perdue. Beaune validée par Hardy chez lui.
- PR #61 (parcours de carte vide), #62 (MapLibre 5, Dependabot, risque accepté), #63 (`minimatch`), #64 (`CLAUDE.md` de 400 à 340 lignes), #65 (écran Lieux, mobile et desktop) fusionnées. PR #58 fermée.
- PR #66 ouverte : position gardée, durée de cache par type de données, train parti jamais affiché. PR #67 ouverte : temps à pied et gare la plus proche sur « Votre gare ».
- Audit du retour sur Explorer : carte recréée à chaque retour, chiffres dans `A-FAIRE` § 1 ; aucun code gardé.

**Décisions :** D064 (révisée), D065, D066, D067, D068.

**Problèmes rencontrés :**
- Chiffres faux annoncés à Hardy : « 1 035 trains par jour » (somme par destination, 148 départs réels), « 225 trajets vers Beaune » (45 en base), « 0 % de fond manquant » (jamais mesuré). Règle de Hardy : aucun chiffre non mesuré.
- La première règle de gare faisait perdre 26 destinations à Belfort-Montbéliard TGV : trouvé en la simulant sur toutes les gares.
- Dit que la cause de la carte vide n'était pas cherchée, alors que D062 l'expliquait déjà.
- Commande `@dependabot ignore` sans effet sur une PR groupée : seul `dependabot.yml` protège.
- Ma protection masquait les trains d'une date passée demandée exprès : repéré par les parcours.
- Une erreur d'hydratation vue une fois sur la navigation, jamais reproduite, cause non trouvée.
- Mes essais ont touché le `next dev` de Hardy (même dossier, paramètres temporaires, changements de branche) : les mesures se font maintenant dans une copie à part.

**À valider par Hardy :**
- Fusion des PR #66 puis #67 ; essai sur téléphone ; garder Explorer en vie ou non.

**Prochaine action :**
- Après la #66, recaler la branche de la #67 sur `main` ; puis selon la décision de Hardy et ses essais, et plan de E13.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (431) · intégration ✅ (158) · parcours ✅ (68), sur la branche de la PR #67
**Commit :** voir `docs(contexte): sauvegarde de session du 05/11` (branche `etape/E11-retouches-gare`)

---

## 05/11/2026 — Étape E11 — gare de départ par défaut et diagnostic de Beaune
**Fait :**
- PR #59 (E12) fusionnée par Hardy.
- Diagnostic de « Beaune a disparu » : base et API saines. Depuis Dijon Porte Neuve, aucun trajet vers Beaune dans les horaires ; l'application partait de cette gare car elle était la plus proche.
- Gare conseillée : la mieux desservie à moins de 5 km, sinon la plus proche ; même règle pour une ville recherchée. PR #60 ouverte.
- Noté dans `A-FAIRE` : écran Lieux (prévu dans aucune fiche d'étape), recherche de destination, réaction des filtres, « Gare de Dijon » seulement à l'affichage.

**Décisions :** D064. Hardy garde « Dijon » pour le moment, et la base ne change pas.

**Problèmes rencontrés :**
- Annonce à tort d'un filtre cassé sur ordinateur : mon test n'attendait que 2 s, le filtre répond en 1,5 à 2,4 s sans aucun signe. Corrigé dans ma réponse à Hardy, leçon L39.
- Un test d'intégration a lu la vraie base (lecture seule) : import du service trop tôt, corrigé par un import différé.

**À valider par Hardy :**
- Fusion de la PR #60, puis Beaune visible chez lui ; vérifications de design et téléphone (`A-FAIRE` § 1).

**Prochaine action :**
- Fusion de la PR #60 si besoin, puis plan de l'écran Lieux.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (401) · intégration ✅ (156) · parcours ✅ (38, avant la dernière modification de documents)
**Commit :** voir `docs(contexte): sauvegarde de session du 05/11` (branche `etape/E11-gare-par-defaut`)

---

## 04/11/2026 — Étapes E11 et E12 — parcours Playwright, fiche destination et fiche lieu
**Fait :**
- E11 fusionnée (PR #57) : carte découpée, parcours Playwright, mesures sur version de production.
- 2 exclusions de lieux (Collège Jules Ferry, Bataille de Nuits-Saint-Georges), traitement relancé hors ligne.
- E12 : fiche destination (lieux, trains, sur place, CO₂ et « Comparer », prix estimé, billetterie), fiche lieu, mention « estimation » sur les cartes d'Explorer.

**Décisions :** D063.

**Problèmes rencontrés :**
- Sur mobile, la navigation recouvrait le pied de la fiche : vu grâce au test de « Y aller en train » et aux captures, corrigé.
- `next build` échouait lancé par Playwright : `NODE_ENV` fixé à `production` pour ce serveur.

**À valider par Hardy :**
- PR de E12 ; vérifications de design et téléphone (`A-FAIRE` § 1).

**Prochaine action :**
- E13 après la fusion.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (388) · intégration ✅ (153) · parcours ✅ (38)
**Commit :** branche `etape/E12-fiche-destination`

---

## 04/11/2026 — Étape E11 — corrections de lieux, carte et assemblage (lots 4 et 5)
**Fait :**
- 6 corrections de lieux validées par Hardy et appliquées par le traitement ; chiffre du pitch : 348 sorties pour enfants, 41 à 1,5 km à pied d'une gare (hors aires de jeux et piscines).
- Lot 4 : carte MapLibre aux couleurs des tokens, segments, étiquettes sur les 5 destinations avec le plus de trains, mini-fiches, recentrage ; vérifiée aussi sur une version de production.
- Lot 5 : carte en grand, feuille à 3 positions, panneau de 440 px, survol croisé.

**Décisions :** D061, D062.

**Problèmes rencontrés :**
- MapLibre 6 laissait le fond de carte vide sous Next.js (« Worker failed to load ») : version 5 fixée.
- Un chargement en échec a été commité avant d'être vu, et Dolescapegame avait perdu « enfants » en secondaire : corrigés avant tout envoi. Glissement de la feuille perdu hors de la poignée : corrigé.

**À valider par Hardy :**
- Lots 3 à 5, après son test.

**Prochaine action :**
- Lot 6 de E11 après l'avis de Hardy.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (374) · intégration ✅ (153)
**Commit :** voir `docs(contexte): sauvegarde de session du 04/11` (branche `etape/E11-explorer`)

---

## 04/11/2026 — Étapes E10 et E11 — socle de l'interface, règles sur les listes, lots 1 à 3 d'Explorer
**Fait :**
- E10 terminée et fusionnée (PR #56) : `globals.css` en 3 niveaux, composants, logo, navigation à 4 onglets, rail desktop, planche `/design`, validés par Hardy. Légende des temps 30, 60, 90.
- Route `/api/lieux`. Liste de Dijon de 867 à 697 lieux après les règles ; ordre sans filtre identique avec la catégorie secondaire (Dijon, Besançon, Nevers comparés avant et après).
- E11 : lot 1 (position, refus, hors région, gare), lot 2 (date, calendrier, catégories, filtres dans l'URL), lot 3 (votre gare, à deux pas, destinations, états).
- Chiffre du pitch : 350 sorties pour enfants (hors aires de jeux et piscines), dont 43 à 1,5 km à pied d'une gare ; autour de 348 et 41 une fois les corrections validées.

**Décisions :** D053 → D060.

**Problèmes rencontrés :**
- Incident GitHub sur SSH : push et pull refusés par intermittence. Un `git pull` échoué a laissé E11 partir de l'ancien `main` ; corrigé sans perte. Ne pas enchaîner une suite de commandes après un pull sans vérifier son résultat.
- Mesure « villes entières » d'abord trop large : « Auxonne » était le bâtiment de la gare, pas une ville.
- Un commit de D060 contenait un test en échec : corrigé par amendement avant tout envoi.

**À valider par Hardy :**
- Lot 3 ; `corrections_manuelles.csv` ligne par ligne.

**Prochaine action :**
- Lot 4 de E11 (carte) après validation du lot 3.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (347) · intégration ✅ (153)
**Commit :** voir `docs(contexte): sauvegarde de session du 04/11` (branche `etape/E11-explorer`)

---

## 04/11/2026 — Étape E10 — audit du socle de l'interface
**Fait :**
- Reprise ; réponse à Hardy : la géolocalisation est demandée à l'ouverture, refus → recherche de ville (F01, interface en E11), position jamais enregistrée.
- Audit de E10 : `apps/web/src/styles/globals.css` encore provisoire, `components/ui/` vide, aucune dépendance d'interface installée. Comparaison de `design/globals.css` avec la version du projet Claude Design (tokens de fond de carte, `--map-time-1…4`, animation des squelettes, correctif de `eco` en mode sombre) et lecture du « Kit de composants Wagoo » (02/10) : 7 écarts à régler dans la refonte des maquettes (`A-FAIRE` § 1).
- Plan de E10 proposé (`A-FAIRE` § 1) ; avis sur l'idée de Hardy : favoris et « Carnet de voyage » montrés au jury en aperçu « Bientôt », non fonctionnels, après le P0.

**Décisions :** aucune (plan, dépendances et aperçus à valider).

**Problèmes rencontrés :**
- Hardy demandait seulement si les maquettes étaient nécessaires à l'audit (il va les refaire) : Claude Code les a lues sans attendre la réponse. Ce qui ne dépend pas des maquettes reste valable ; l'aspect des composants attendra la nouvelle version.

**À valider par Hardy :**
- Plan de E10 et dépendances ; design system changé ou seulement les écrans ; aperçus favoris et carnet.

**Prochaine action :**
- Validation du plan, puis D053 et la partie de E10 indépendante des maquettes.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (257) ; aucun code modifié
**Commit :** voir `docs(contexte): sauvegarde de session du 04/11` (branche `etape/E10-socle-interface`)

---

## 03/11/2026 — Étape E09 — terminée (P0), avis de Hardy intégré
**Fait :**
- Vérification de Hardy sur SNCF Connect : TGV 12177 Dijon 16:17 → Beaune 16:37 conforme (SNCF Connect affichait un retard temps réel de 5 min, hors P0), dernier retour 21:58 conforme, prix Dijon → Paris ≈ 40–66 € cohérent.
- `/api/impact` : champ `trajet` (CO₂ aller-retour, prix aller simple) ; `/api/trains` : retours proposés après l'arrivée du premier aller (règle de Hardy), test en paire (retour de 07:10 écarté, 18:44 gardé).
- A-FAIRE pour E11 : « TER Mobigo » (nom commercial, dans la configuration), recherche de ville sans lieux-dits (`locality`), sans filtre de région.
- PR #55 fusionnée (E09 ✅, ticket #11 fermé ; T4 « API de l'application » ✅) ; branche `etape/E10-socle-interface` créée. **Jalon « API complète » atteint le 03/11.**

**Décisions :** D051 complétée (8 bis : retours après l'arrivée, gares en tête ; 8 ter : périmètre de chaque chiffre).

**Problèmes rencontrés :**
- Première règle des retours (« les 20 derniers du jour ») jugée mauvaise par Hardy : remplacée (L36).

**À valider par Hardy :**
- Avant E10–E11 : Design System dans Claude Design, variantes de la maquette, légende des temps de trajet (`A-FAIRE` § 1).

**Prochaine action :**
- Audit E10 (socle interface).

**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (257 unitaires, 124 intégration)
**Commit :** voir `docs(contexte): sauvegarde de session du 03/11 (E09 fusionnée)` (branche `etape/E10-socle-interface`)

---

## 03/11/2026 — Étape E09 — API complète, codée (PR en attente de l'avis de Hardy)
**Fait :**
- Audit : trains Dijon → Beaune (45, identiques à `liaison_directe`), jumelage (TGV 12177 / 5537), train après minuit (Joigny) ; API Adresse : ancien domaine obsolète (`sunset` 31/01/2026) → Géoplateforme, sans clé ; recherche inverse vide avec `type=municipality` ; contrats § 3.5 et § 3.12 sans forme écrite.
- Décisions de Hardy : routes P1 hors E09, fiche = mêmes chiffres que la carte, heures `{ s, texte, lendemain }`, impact au type le moins favorable, recherche inverse sans cache, sources affichées (champ `affichee`), lieu membre d'un site ; puis **identifiants publics stables** (question de Hardy sur les liens partagés) : code UIC pour les gares, clé de source pour les lieux.
- Code : migration `0011_lieu_cle` (colonne générée unique) ; `gareParUic`, `verifierDateDansFenetre` partagées ; E08 ajustée (`uic`, `cle`) ; routes `/api/destinations/[uic]` (+ `/lieux`), `/api/lieux/[cle]`, `/api/trains`, `/api/impact`, `/api/mobilites/[uic]`, `/api/sources`, `/api/geocodage` (+ `/inverse`) ; adaptateur `lib/external/adresse.ts` ; `debutDuWeekEnd` ; échantillon complété (jumelage, code UIC secondaire, membre de site, `lieu_gare`).
- Vérifié sur les vraies données : fiche Beaune = carte (18 min, 45 trains, ≈ 7–12 €) ; doublon OSM → fiche DATAtourisme gardée ; Talant trouvée ; 26 sources, attribution OpenStreetMap ; 13 → 110 ms.

**Décisions :** D051 (contrats de l'API complète ; précisions du codage : derniers retours, gares en tête de la recherche), D052 (identifiants publics stables).

**Problèmes rencontrés :**
- Les routes Next.js reçoivent leurs segments (`[uic]`, `[cle]`) en second argument : `gererRoute` transmet le contexte, `validerSegment` le valide.
- Clé des lieux de l'échantillon (`echantillon-ECH_L11`) refusée par la première version de la validation (`_`) : corrigée.
- `CLAUDE.md` à la limite de 400 lignes : entrées d'historique du 03/11 regroupées.

**À valider par Hardy :**
- Avant la PR : 3 horaires et 1 prix sur SNCF Connect ; derniers retours et gares en tête ; lieux-dits « Dijon » dans la recherche (`A-FAIRE` § 1).

**Prochaine action :**
- Avis de Hardy → corrections éventuelles → PR E09 → E10.

**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (257 unitaires, 124 intégration) · vraies données ✅
**Commit :** voir `docs(contexte): sauvegarde de session du 03/11 (E09)` (branche `etape/E09-api-complete`)

---

## 03/11/2026 — Étape E08 — socle de l'API, terminée (P0)
**Fait :**
- Mesures avant décision (vraies données, 03/11) : 13 villes à plusieurs gares, 104 gares de départ sur 194 concernées ; durée minimale 5/10/15 min (143/434/699 cartes perdues) ; 20 gares de la région sans lieu ; limite 60 → Paris (73ᵉ) et Lyon (74ᵉ) coupées depuis Dijon ; seuil de lieux 1/3/5 (8/30/45 cartes reléguées depuis Dijon).
- Maquette Explorer desktop v2 lue sur Claude Design (DesignSync) : champs de la carte de destination comparés au contrat ; CO₂, prix, prochaine arrivée et regroupement ajoutés.
- CO₂ ImpactCO2 relevé (Intercités 8,98, avion 225 ; TER et TGV revérifiés) ; licence des tarifs TER non spécifiée → prix au km calibré sur les tarifs TGV SNCF (ODbL, 2 211 couples) : TGV 0,17 €/km, TER et Intercités 0,22 €/km.
- Code : `lib/http`, `lib/geo`, `lib/dates/tranche-temps`, `lib/impact` (avancé d'E09), `lib/db/requetes-partagees` ; routes `/api/sante` (`features/sante`), `/api/gares/proches`, `/api/autour`, `/api/destinations` ; échantillon complété (Paris à deux gares, gares TGV, liaisons, `gare_stats`).
- Vérifié sur les vraies données : 101 destinations depuis Dijon, 13 → 80 ms ; aucune position dans les journaux.
- PR #54 fusionnée (E08 ✅, ticket #10 fermé) ; branche `etape/E09-api-complete` créée.

**Décisions :** D047 (une carte par ville, gare en tête, aucune durée minimale, limite 150, CO₂ et prix dans `/api/destinations`, `features/sante`, journal des requêtes désactivé, cache 300 s), D048 (CO₂ une seule source, prix calibré), D049 (gare TGV : sa propre carte, au nom de la gare), D050 (moins de 3 lieux → fin de liste ; filtre des envies : 0 → retirée).

**Problèmes rencontrés :**
- `next dev` écrivait les URL (donc les positions) dans son journal : désactivé (`logging.incomingRequests: false`), vérifié après redémarrage (L29).
- Les tests ETL comptaient les gares et communes de l'échantillon : attentes ajustées ; la requête « gares référencées » du test des gares élargie à `gare_stats` et `liaison_directe`, comme la règle de suppression.
- Test de la gare en tête qui ne pouvait pas échouer (Gare de Lyon aussi la plus rapide) : cas Belfort / Danjoutin ajouté (L31).
- Le conteneur `web` n'existe pas encore (Dockerfile prévu en E16) : vérification par `pnpm dev` sur la base Docker.

**À valider par Hardy :**
- Gevrey-Chambertin et Meursault n'ont qu'un lieu à pied (`A-FAIRE`, avec les compléments vins).
- Restent de `A-FAIRE` § 1 : légende de la carte (avant E11), photos (avant E12), lien de billetterie (avant E12).

**Prochaine action :**
- Lire `docs/etapes/E09-api-complete.md` et `05` § 3.5 → 3.13, auditer, proposer le plan.

**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (252 unitaires, 93 intégration) · vraies données ✅
**Commit :** voir `docs(contexte): sauvegarde de session du 03/11` (branche `etape/E09-api-complete`)

---

## 02/11/2026 — Étape E07 — transports sur place, terminée (P0)
**Fait :**
- Sauvegarde des décisions de Hardy avant le code (D046).
- `config/sources.json` : 16 réseaux (13 urbains, Mobigo à 7 fichiers, 2 GBFS avec `station_status`), liens stables data.gouv.fr, licence vérifiée ; schéma `reseau` dans `packages/commun`, `LICENCES_RESEAU`.
- Migration `0010` (type `CAR`, unicité gare-source-arrêt) ; `mobilite.regroupementQuaisM` ; `pnpm etl transport_local` (GTFS lus dans le ZIP, GBFS, transport à la demande exclu, quais regroupés, couple arrêt-gare à pied).
- Résultat : 553 couples arrêt-gare, 122 gares de la région sur 196 (Mobigo : 84) ; Dijon-Ville : tram T1, T2 et 13 arrêts de bus. Docker vérifié.
- PR #53 fusionnée (E07 ✅, ticket #9 fermé) ; branche `etape/E08-socle-api` créée. **Jalon « données en base » atteint le 02/11.**

**Décisions :** D046 (réseaux, licence obligatoire, `CAR`, couple arrêt-gare, rayon à pied, P1 reporté, cyclable en tête après le P0).

**Problèmes rencontrés :**
- Noms d'arrêts Mobigo terminés par « - » : nettoyés (`nettoyerNomArret`), testés.
- Liens de téléchargement datés sur static.data.gouv.fr : remplacés par les liens stables `data.gouv.fr/api/1/datasets/r/…`.

**À valider par Hardy :**
- Avant E08 : une destination par ville ou par gare (`A-FAIRE` § 1, Paris Gare de Lyon / Paris Bercy).
- Vérification manuelle de la fiche E07 : arrêts autour de Dijon-Ville comparés au plan Divia.

**Prochaine action :**
- Décision « ville ou gare », puis lire `docs/etapes/E08-socle-api.md`, auditer, proposer le plan.

**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (206 unitaires, 67 intégration) · Docker ✅
**Commit :** voir `docs(contexte): sauvegarde de session du 02/11` (branche `etape/E08-socle-api`)

---

## 02/11/2026 — E06 fusionnée, audit E07 — décisions de Hardy
**Fait :**
- Relecture par Hardy de la liste des lieux écartés par leur nom : statues gardées, `^retables` et `^application` ajoutés (72 lieux écartés) ; PR #52 fusionnée (E06 ✅, ticket #8 fermé) ; branche `etape/E07-mobilites`.
- 8 dernières paires de doublons décidées (6 oui dont Sainte-Madeleine, musée dans l'église ; 2 non) : 968 doublons, plus aucune paire à relire. Référence MH et Wikidata notées dans A-FAIRE (doublons automatiques, photos Wikidata).
- Audit E07 : 813 jeux de transport.data.gouv.fr filtrés sur la région ; 13 réseaux urbains, Mobigo (7 fichiers départementaux), 2 flux vélos (Besançon, Belfort) téléchargés et analysés (arrêts à pied des gares, types de lignes, tram de Dijon, licences, `station_status`).

**Décisions :** D046 (réseaux retenus, licence obligatoire, type `CAR`, une ligne par couple arrêt-gare, rayon à pied, P1 reporté).

**Problèmes rencontrés :**
- Branche créée sous le mauvais nom (`etape/E07-transports`) : renommée `etape/E07-mobilites` comme la fiche.
- Homonymes hors région dans le catalogue (Tanéo de Nouméa, Sablons Bus dans l'Oise, TCL, SITAC) : écartés.

**À valider par Hardy :**
- Rien : plan E07 validé.

**Prochaine action :**
- Coder le plan E07 (`sources.json`, migration, `pnpm etl transport_local`, tests, Docker).

**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (200 unitaires, 65 intégration)
**Commit :** voir `docs(contexte): sauvegarde de session du 02/11` (branche `etape/E07-mobilites`)

---

## 02/11/2026 — Étape E06 — rattachements, PR #52 ouverte
**Fait :**
- PR Dependabot #51 (Next.js 16.4.1, 6 alertes de sécurité) testée dans un dossier séparé (vérifications, build, démarrage) puis fusionnée par Hardy ; `main` intégrée à la branche E06.
- Audit E06 sur les vraies données : paires de lieux proches, regroupement en site (92 monuments enchaînés à Dijon avec une distance seule), canaux, rayon (810 liens au-delà de 1,5 km à pied).
- `pnpm etl rattachements` : doublons en deux paliers (noms sans accents, `unaccent`), sites (`lieu.site_de`), lieux en longueur (`lieu.trace`, tracés Overpass des canaux, tronçons réunis), `lieu_gare` au rayon **à pied**, `gare_stats`, contrôles et rapports ; migration `0009`.
- Après relecture de Hardy : fichier versionné `regles/doublons_manuels.csv` (193 décisions : 116 oui, 77 non), doublons d'une même source (noms identiques seulement), 32 Monuments historiques fermés au public écartés (priorité 140), rapport des fusions limité à la paire retenue.
- Résultat : 12 323 lieux, 965 doublons (133 dans une même source), 293 sites (Arcy-sur-Cure 29 → 1, Bibracte 17 → 1), **2 114 lieux à pied d'une gare**, 175 gares de la région sur 196 avec au moins un lieu ; 8 paires à relire.
- Docker : `docker compose run --rm etl rattachements` vérifié (mêmes chiffres).
- Quatre problèmes relevés par Hardy, mesurés et chiffrés sans correction (noms « fermé », activités, objets, château et parc).

**Décisions :** D043 (doublons, sites, lieux en longueur, rayon à pied, Qualité Tourisme lu dans DATAtourisme), D044 (décisions manuelles, même source prudente, lieux fermés au public).

**Problèmes rencontrés :**
- Une requête de contrôle groupée par nom de représentant faisait croire à un site de 393 aires de jeux (même nom « Aire de jeux ») : recompté par identifiant, 6 au plus.
- `ST_Collect` de lignes multiples donnait une collection mixte : `ST_Union`.
- 699 paires « Aire de jeux » / « Aire de jeux » dans la liste à relire : noms génériques exclus des paires d'une même source.
- Exclure les classes DATAtourisme d'activité (`Visit`, `Product`, `Practice`) ne retire aucun lieu : elles portent aussi une classe précise.

**À valider par Hardy :**
- Les quatre corrections proposées (`A-FAIRE` § 1), avant la fusion de la PR #52 ; les 8 paires restantes.

**Prochaine action :**
- Selon la réponse de Hardy : coder les corrections sur la branche E06 (même PR), relancer `rattachements`, puis fusion de la PR #52 et E07.

**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (195 unitaires, 63 intégration) · Docker ✅
**Commit :** voir `docs(contexte): sauvegarde de session du 02/11` (PR #52)

---

## 02/11/2026 — Avant E06 — relecture des règles de catégories
**Fait :**
- Relecture par Hardy des 59 valeurs OSM non classées : grottes, sommets, sources, lavoirs, observatoires d'oiseaux, canal, barrage (condition « notable »), baignade, port de plaisance, galerie, abbaye gardés ; le reste en exclusion faible.
- Question de Hardy sur le filtre des grottes, attractions, lavoirs : aucun filtre au-delà du nom → condition « notable » ajoutée ; simulation sur `overpass.json` : `tourism=attraction` laissé sans règle (102 Monuments historiques renommés sinon).
- Pique-nique, caves, cinémas, pêche, écluses, puis cinémas (59) et bibliothèques (156) DATAtourisme retirés des destinations : idée de « compléments de destination » chiffrée dans `A-FAIRE` § 3 (≈ 1 jour, après le P0).
- `pnpm etl regles`, `osm --hors-ligne`, `datatourisme --hors-ligne` : **12 355 lieux** (DATAtourisme 4 256 → 4 045, OSM 8 310 inchangé, sous-catégories précisées : 32 grottes, 24 lavoirs, 9 sommets…).
- Fiche E06 : audit élargi au regroupement en site (29 grottes à Arcy-sur-Cure) et aux lieux en longueur (canal rattaché aux gares de son tracé, une fois par gare).
- `LECONS.md` : L22 → L24.

**Décisions :** D042 (attractions sans règle, condition « notable », compléments écartés, priorité 40).

**Problèmes rencontrés :**
- Bibliothèques DATAtourisme : toutes portent `CulturalSite` (50), l'exclusion faible ne les retirait pas → priorité 40.
- Cinémas DATAtourisme classés aussi par `MovieTheater` (schema.org) : seconde règle à passer en exclusion.
- Commande `docker` absente dans WSL (intégration Docker Desktop) ; la base répond quand même sur le port local.

**À valider par Hardy :**
- Plan de l'audit E06 (à venir).

**Prochaine action :**
- Lire `docs/etapes/E06-categories-rattachement.md` et les documents cités, auditer, proposer le plan.

**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (187 unitaires, 50 intégration)
**Commit :** voir `docs(contexte): sauvegarde de session du 02/11`

---

## 01/11/2026 — Étape E05 — lieux DATAtourisme et OpenStreetMap, terminée
**Fait :**
- Questions de Hardy sur DATAtourisme : CSV ou API (réponse selon le besoin : croiser tous les lieux avec toutes les gares → fichier complet en base) ; photos jugées importantes → `A-FAIRE` § 1.
- Test GéoDataMine par Hardy (aires de jeux, patrimoine) : code INSEE présent, mais 2 thèmes seulement sur 5.
- Audit E05 : CSV DATAtourisme régional (34 033 lignes, 269 classes, aucune photo ni code INSEE) ; code postal + nom de commune → 8,4 % ambigus ou introuvables ; contours des communes testés (geo.api.gouv.fr, 3 685) ; Overpass compté par tag. Six recommandations validées, avec deux précisions de Hardy (plans d'eau avec un signe de sortie ; contour dans `commune`, pas dans `lieu`).
- Pour Hardy (révision, soutenance) : sommaire par thème et ligne « En clair » dans `DECISIONS.md` ; nouveau `LECONS.md` (leçons réutilisables) ; « En clair » des décisions D001 → D040 reporté (`A-FAIRE` § 3).
- E05 : migration `0008` (`commune.contour`, `lieu.code_insee` → `commune`, `categorie_regle.condition`, `doublon_de` ON DELETE SET NULL) ; `pnpm etl contours`, `regles`, `datatourisme`, `osm` ; `categories.csv` (priorités 10 → 900, conditions OSM) ; tests en paires sur le vrai fichier de règles ; Docker vérifié.
- Résultat : **12 566 lieux** (DATAtourisme 4 256, OSM 8 310), 0 sans commune, 0 sans catégorie, 0 hors région ; 106 plans d'eau dont le lac des Settons ; Jardin de l'Arquebuse et Hospices de Beaune présents.
- Règles d'usage d'Overpass, relevées par Hardy : `osm` une fois par semaine au plus (`07` § 5), `User-Agent` avec l'adresse du dépôt, Geofabrik noté comme solution écartée.
- PR #50 fusionnée (ticket #7 fermé).

**Décisions :** D041 (Overpass seul, une requête par règle ; commune par contour ; événements écartés ; P1 culture reportés ; photos OSM en v1 ; patrimoine et plans d'eau filtrés ; usage poli d'Overpass).

**Problèmes rencontrés :**
- Même lieu publié deux fois par deux diffuseurs (16 identifiants) : bloqué par le contrôle d'unicité, puis premier gardé et compté.
- « Lac de Narlay » classé « tourbière » (égalité de priorité) : priorité 15 « lieu phare ».
- Overpass saturé (502 « file d'attente pleine »), puis une seule grosse requête au-delà du délai (306 s), sur le serveur principal et deux miroirs : nouvelles tentatives à attente doublée, puis une requête par règle (16 requêtes, ≈ 17 min).
- Petits monuments (monuments aux morts, croix) gardés grâce à un lien Wikidata : exclus sauf Monument historique, reclassés depuis le fichier gardé (`--hors-ligne`).
- Cascades OSM : 0, mauvais tag (`natural` au lieu de `waterway=waterfall`) ; règle corrigée, prise à la prochaine extraction.

**À valider par Hardy :**
- Relire `categories_non_classees_osm.csv` (59 valeurs) et compléter `categories.csv` avant E06.

**Prochaine action :**
- `pnpm etl regles` puis `pnpm etl osm --hors-ligne` après la relecture ; puis audit E06.

**Vérifications :** typecheck ✅ · lint ✅ · tests ✅ (184 unitaires, 50 intégration)
**Commit :** 5400b3d (fusion de la PR #50)

---

## 01/11/2026 — Étape E04 — trains directs, terminée
**Fait :**
- Réponses de Hardy : cartes de destination **choix A** ; jumelage : un train compté une fois, deux numéros gardés pour l'affichage. Question sur `gare.dans_region` (dépendance transitive gare → commune → département) : expliquée, **gardée** avec un contrôle bloquant et une ligne dans `03`.
- Audit E04 : GTFS rechargé (fenêtre 01/11 → 31/12 : 3 213 trajets, 31 148 passages) ; 128 912 paires, 268 025 lignes attendues, 12 314 doublons de jumelage.
- E04 : migrations `0006_liaison_directe` et `0007_liaison_directe_index_arrivee`, `pnpm etl liaisons` (`transformations/liaisons.sql`, `chargement/liaisons.ts`), contrôles, tests en paires ; contrôle `dans_region` au chargement des gares. Fonctionne aussi dans Docker.
- Résultat : 268 025 liaisons, 5 344 paires, 155 destinations hors région, 188 540 liaisons faisables dans la journée, ≈ 17 s. Requête de référence « destinations depuis une gare » : **1,3 ms** (Dijon, 03/11, dernier retour compris).
- Vérification SNCF Connect par Hardy : Dijon → Beaune et → Lyon conformes ; → Paris Gare de Lyon conforme, le 05:35 vu sur SNCF Connect va à **Paris Bercy** (SNCF Connect regroupe les gares de Paris) → `A-FAIRE` § 1.
- PR #49 fusionnée (ticket #6 fermé) ; explication du contournement de la relecture obligatoire pour ses propres PR.

**Décisions :** D040 (liaisons dans les deux sens, `premiere_arrivee_s`, `faisable_journee`, dernier retour par jointure sur la liaison inverse, jumelage, `dans_region` gardée et contrôlée).

**Problèmes rencontrés :**
- Docker non joignable depuis WSL en début de session : relancé par Hardy.
- Protection « gare référencée par une liaison » sans index : chargement des gares de 4 s à 60 s ; index `gare_arrivee_id` (migration `0007` plutôt que réinitialiser la base locale).
- Test d'intégration « tables P0 » à compléter avec `liaison_directe` (il a bien détecté la nouvelle table).
- Écarts assumés avec la fiche : contrôle « Dijon ↔ Beaune » vérifié à la main (nom propre à la région) ; tests sur l'échantillon de la base de test plutôt que sur le GTFS miniature.

**À valider par Hardy :**
- Gares d'une même ville : une carte par commune ou par gare (avant E08) ; légende de la carte (avant E11).

**Prochaine action :**
- Hardy : URL du CSV DATAtourisme, extraction GéoDataMine ; puis audit E05.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (151) · intégration ✅ (46)
**Commit :** `e25e0b4` (fusion de E04) ; sauvegarde sur `etape/E05-lieux`

---

## 30/10/2026 — Avant E04 — reprise, cartes de destination réexpliquées
**Fait :**
- Reprise après une semaine d'arrêt ; situation résumée à Hardy.
- Proposition « cartes de destination » réexpliquée simplement, avec son coût : (1) dernier retour et « faisable dans la journée » dans `liaison_directe`, ½ journée en E04 ; (2) départ **ou** arrivée dans la région, quelques minutes ; (3) prochain train à la demande, ½ journée en E08. Total ≈ 1 jour, faible tant que `liaison_directe` n'est pas construite. Trois choix : A tout (recommandé), B minimum, C rien.
- Aucun code modifié.

**Décisions :** aucune (D040 en attente).

**Problèmes rencontrés :**
- Hardy en déplacement vers Nantes, peu de réseau : décision reportée au retour à Dijon.
- E04 en retard (prévue en S3) ; jalon « données en base » du 01/11 non tenu. Fenêtre GTFS en base (23/10) à recharger avant le calcul des liaisons.

**À valider par Hardy :**
- Cartes de destination : A, B ou C ; trains en jumelage : oui / non.

**Prochaine action :**
- Recueillir les deux réponses, écrire D040 et les documents `03`, `04`, `05`, recharger le GTFS, puis audit E04.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (149) · intégration non relancée (aucun code modifié depuis le 23/10)
**Commit :** sauvegarde sur `etape/E04-trains-directs`

---

## 23/10/2026 — Correctifs avant E04 — table `commune`, codes UIC des gares
**Fait :**
- Essais de Hardy dans Docker et Adminer (connexion, requêtes de contrôle des horaires, Dijon → Beaune) ; explications sur les tables d'horaires (`trajet`, `passage`, `service_jour`) et la lecture du GTFS (ZIP lu en flux, tables brutes temporaires).
- **Remarque du professeur (normalisation)** : nom et département de la commune recopiés dans `gare`. Table `commune` (code INSEE clé, nom, département) remplie par `pnpm etl communes` (36 912 codes), `gare.code_insee` en clé étrangère indexée, migration `0005_table_commune` complétée à la main (données gardées) ; `dans_region` reste dans `gare` ; `lieu` décidé en E05. PR #47.
- **Doublon de Paris Gare de Lyon** : le fichier SNCF du 23/10 a inversé ses codes UIC, la gare a été recréée (id 27041) à côté de l'ancienne (id 1913, 530 passages). Gares désormais reconnues par un code UIC commun, deux contrôles bloquants ; le contrôle a bien échoué sur la base avant nettoyage ; doublon sans référence supprimé, gare 1913 passée au code `87686030`. PR #48.
- Rechargement complet : 2 792 gares, 3 467 trajets, 33 275 passages, 11 231 jours (fenêtre commençant le 23/10) ; 499 passages sur l'unique Paris Gare de Lyon. Commandes testées aussi dans Docker.
- Alerte Dependabot n° 2 (esbuild ≤ 0.24.2 via drizzle-kit) fermée « code non utilisé » ; rappel dans `A-FAIRE` § 3.
- Prompt fourni à Hardy pour mettre à jour sa page « Audit des gares Wagoo » (table `commune`, codes UIC, schéma des tables).

**Décisions :** D038 (table `commune`), D039 (gare reconnue par un code UIC commun) ; proposition « cartes de destination » en attente (future D040).

**Problèmes rencontrés :**
- La migration de `0005` aurait laissé `communes` en `IGNORE` (même empreinte) avec une table partielle : empreinte remise à zéro dans la migration.
- Message de commentaire Dependabot limité à 280 caractères (refus de l'API, raccourci).

**À valider par Hardy :**
- Proposition « cartes de destination » (`A-FAIRE` § 1) ; trains en jumelage (E04) ; copie de la page d'audit dans le dépôt.

**Prochaine action :**
- Trancher les cartes de destination, puis audit E04 sur `etape/E04-trains-directs`.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (149) · intégration ✅ (35)
**Commit :** #47 `505d155`, #48 `55759f7` sur `main` ; sauvegarde sur `etape/E04-trains-directs`

---

## 22/10/2026 — Étape E03 — horaires GTFS SNCF
**Fait :**
- Audit du GTFS SNCF (transport.data.gouv.fr, ODbL) : pas de `calendar.txt`, type de train dans le `stop_id`, cars dans le fichier, gares étrangères, montée et descente interdites ; tableaux colonne par colonne validés par Hardy.
- Migration `0004_passage_montee_descente` ; `regles/types-train.ts`, `sources/zip.ts`, `chargement/gtfs-brut.ts`, `transformations/gtfs.sql` + `sql.ts`, `chargement/gtfs.ts` + `gtfs-controles.ts`, `sources/gtfs-sncf.ts` ; `pnpm etl gtfs_sncf`.
- GTFS miniature (`etl/tests/donnees/gtfs_mini/`) : calendrier, exceptions, changement d'heure, après minuit, montée interdite, cars, AUTRE.
- Premier chargement : 3 516 trajets (TER 2 669, TGV 613, Intercités 234), 33 650 passages, 11 100 jours de circulation ; 98,4 % rapprochés ; 6 contrôles ✅ ; ~26 s ; `SUCCES` puis `IGNORE`, aussi dans Docker.
- **Requête de référence « trains A → B »** : ~5 ms ; Dijon → Beaune le lundi 26/10 : 46 trains.
- Hardy : 3 horaires Dijon → Beaune vérifiés sur SNCF Connect (conformes).

**Décisions :** D036 (source, type de train, cars exclus, `calendar.txt`, sans rattrapage par distance, montée et descente), D037 (IGNORE du jour, règle en un fichier, GTFS miniature, sections SQL, seuil de rapprochement).

**Problèmes rencontrés :**
- Nombre de trajets en car mal recopié dans `02` (2 789 au lieu de 6 822) : corrigé.
- Un BOM invisible inséré dans le code par une édition : remplacé par `\uFEFF`.
- Une requête d'audit sans index a dépassé 5 min : arrêtée et réécrite.
- Corbigny et Flez-Cuzy - Tannay : cars seulement jusqu'au 26/12 (signalées dans le rapport).
- **Trains en jumelage** (ex. TGV 12177 et 5537) : deux trajets aux mêmes horaires, 139 départs en double le 26/10 ; à traiter en E04.

**À valider par Hardy :**
- Données des cartes de destination et traitement des trains en jumelage (audit E04) ; légende de la carte (avant E11).

**Prochaine action :**
- Fusionner la PR de E03, puis lire `docs/etapes/E04-trains-directs.md`.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (149) · intégration ✅ (28)
**Commit :** `aa863a9` → `52822f8` ; sauvegarde sur `etape/E03-horaires`

---

## 22/10/2026 — Étape E02 — socle de l'ETL, gares en base, image Docker
**Fait :**
- Socle ETL : `sources/base.ts` (téléchargement, empreinte, `--hors-ligne`), `chargement/base.ts` (CSV validé, `COPY`, transaction), `controles/base.ts`, `chargement/execution.ts` (`execution_etl`) et `chargement/rapport.ts` (rapport Markdown).
- Gares : migration `0003_gare_codes_uic` (remplie avant de devenir obligatoire, contrainte `uic = ANY(codes_uic)`), `transformations/gares.ts`, `sources/communes.ts`, `sources/gares.ts`, `chargement/gares.ts` ; `pnpm etl gares`.
- `etl/Dockerfile` et `.dockerignore` ; `docker compose run --rm etl gares` vérifié (aide, SUCCES, IGNORE, hors ligne, erreur → code 1).
- Résultats : 2 792 gares, 196 dans la région, 0 écartée, 11 à plusieurs codes UIC, 8 sans nom de commune (communes fusionnées, hors région) ; 4 contrôles ✅.
- **Requête de référence « gares les plus proches »** sur les vraies données : ~12 ms à chaud (17 ms à froid), index GIST utilisé.
- Hardy : rapport relu, 5 gares au hasard vérifiées sur une carte, démonstration Docker + Adminer rejouée.

**Décisions :** D035 (socle ETL, fusion par source, durée mesurée par la base, `.dockerignore`, `DOSSIER_DONNEES` relatif).

**Problèmes rencontrés :**
- `DOSSIER_DONNEES=./data` était lu depuis `etl/` : résolu depuis la racine du dépôt.
- drizzle-kit générait `ADD COLUMN … NOT NULL` direct (échec sur une table remplie) : migration complétée à la main, testée sur 10 gares.
- 584 communes déléguées partagent le code de leur commune dans le COG 2026 : la commune l'emporte (testé).
- Docker non joignable depuis WSL en début de session : Docker Desktop relancé par Hardy.
- La SNCF a republié le fichier des gares le 22/10 à 12:43 UTC : empreinte changée, rechargement détecté automatiquement (comportement attendu).

**À valider par Hardy :**
- Données des cartes de destination (avant E04) ; légende de la carte (avant E11).

**Prochaine action :**
- Fusionner la PR de E02, puis lire `docs/etapes/E03-horaires.md`, audit du GTFS SNCF.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (112) · intégration ✅ (17)
**Commit :** `2ca2c51` → `860c077` ; sauvegarde sur `etape/E02-gares`

---

## 19/10/2026 — Étape E02 — audit des gares, configuration des sources
**Fait :**
- E01 fusionnée dans `main` le 11/10 (PR #44) ; branche `etape/E02-gares` créée.
- Audit du fichier réel des gares (data.sncf.com, ODbL) : 2 792 gares, 196 dans la région, aucune sans position ni sans UIC ; BOM, position `"lat, lon"`, 11 gares à plusieurs codes UIC, nom de commune absent. `02`, `03`, `04` corrigés.
- Fichier des communes du COG INSEE 2026 testé : nom de commune trouvé pour 2 784 gares sur 2 792 (8 codes de communes fusionnées, toutes hors région).
- `config/sources.json` (16 sources, champ `verifie`) et son schéma `packages/commun/src/sources.ts` (7 tests) ; `parametres.json` : `region.emprise`, `controles`.
- `pnpm etl sources` remplit `source_donnees` (16 lignes vérifiées en base).

**Décisions :** D034 (codes UIC multiples, source `communes`, mise à jour par `uic`, toute la France, seuils dans `parametres.json`).

**Problèmes rencontrés :**
- La section 9 de `CLAUDE.md` annonçait encore la PR de E01 à fusionner : corrigée.
- E02 démarre avec une semaine de retard sur le calendrier (prévue en S2).

**À valider par Hardy :**
- Données des cartes de destination (avant E04) ; légende de la carte (avant E11).

**Prochaine action :**
- Socle de l'ETL : `etl/src/sources/base.ts` (téléchargement, SHA-256, `--hors-ligne`), puis chargement, contrôles, journal `execution_etl` et rapport.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (49)
**Commit :** `0301632` (sources) ; sauvegarde sur `etape/E02-gares`

---

## 11/10/2026 — Backlog et étape E01 — base PostGIS, schéma, migrations
**Fait :**
- Backlog produit intégré (`docs/BACKLOG.md`) : CLAUDE.md § 6, § 7, § 14 ; colonne « Étape » de `00` § 6 alignée ; critère « requête de référence mesurée » dans E02 → E04 ; `Closes #` dans le modèle de PR et `demarrage-SR` ; ligne « Fonctionnalités » ajoutée aux 41 tickets (seul ajout, vérifié par comparaison).
- E01 : `docker-compose.yml` (db, adminer, etl et web déclarés ; ports réglables `BDD_PORT_HOTE`, `ADMINER_PORT_HOTE`) ; schéma Drizzle des 11 tables P0 ; migrations 0000 extensions, 0001 schéma, 0002 droits ; scripts `db:generer`, `db:migrer`, `db:reinitialiser`, `db:test:preparer`, `test:integration` ; clients `pg` (web, ETL avec `COPY` et transaction) ; échantillon ; diagramme Mermaid dans `03` § 2.
- Élément « Créer les 41 tickets » retiré de `A-FAIRE` (réalisé avant cette session).

**Décisions :** D032 (backlog, lien fonctionnalités ↔ tickets), D033 (geography, scripts lancés par Node, `@tourisme/commun` lisible par Node, pilote `pg`, base de test, contrôle des mots de passe).

**Problèmes rencontrés :**
- drizzle-kit 0.31 met `"geography(Point, 4326)"` entre guillemets (refusé par PostgreSQL) : corrigé automatiquement par `pnpm db:generer`.
- drizzle-kit charge `drizzle.config.ts` en CommonJS (pas d'`import.meta`) ; nom de contrainte unique en camelCase (`idSource`) : nommée explicitement.
- L'image PostGIS crée déjà `postgis` (et topology, tiger) dans la base principale : migration 0000 en `IF NOT EXISTS`.
- Docker non joignable depuis WSL en début de session (intégration WSL de Docker Desktop) ; réglé par Hardy.
- `.env` de Hardy : mot de passe de `BDD_URL_MIGRATIONS` différent de `POSTGRES_PASSWORD` ; corrigé par Hardy, et contrôle ajouté aux scripts.
- Port 8080 occupé par un autre projet : `ADMINER_PORT_HOTE=8081` dans le `.env` de Hardy.

**À valider par Hardy :**
- Données des cartes de destination (avant E04) ; légende de la carte (avant E11).

**Prochaine action :**
- Fusionner la PR de E01, l'annoncer aux SR (I01), puis audit de E02.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (42) · intégration ✅ (11) · `next build` ✅
**Commit :** `cb804ac` (backlog) · `b7b81ac` → `89a71b9` (E01) ; sauvegarde sur `etape/E01-docker-base`

---

## 09/10/2026 — Étape E00 — audit de la documentation, initialisation du code
**Fait :**
- Audit complet de la documentation (44 fichiers `.md`) : contradictions corrigées (versions de Node, navigation basse, historiques, date de I01, dépôt déjà public dans E18, message « hors région » écrit en dur), écarts reportés dans `A-FAIRE` (données des cartes de destination, seuils écrits en dur, légende de la carte, licence, lien de billetterie).
- Essai Serwist + Next.js 16 réussi (construction Turbopack, service worker actif et page hors ligne vérifiés par Hardy) : Next.js 16 retenu.
- E00 : espace de travail pnpm 11 ; `@tourisme/commun` (schéma unique et strict de `parametres.json`, `dateDuJour()`, `maintenantParis()`, journal JSON, catégories) ; `apps/web` (Next.js 16, `marque.ts`, variables validées au démarrage, `secondesVersHeure`) ; `etl` (`pnpm etl` avec arguments et variables validés). PR #43 fusionnée, ticket #2 fermé.
- Commits dans `main` : documentation et code de E00 regroupés par la fusion « squash » de la PR #43 (`49cb17b`).

**Décisions :** D029 (versions : Next.js 16, Zod 4, TypeScript 5.9.3, pnpm 11.24), D030 (port de la base côté poste, `BDD_PORT_HOTE`), D031 (exceptions `server-only` et `export default`, `maintenantParis()`, rôles créés par script, journal commun, `marque.ts` sans URL, règle des `null`).

**Problèmes rencontrés :**
- `@next/env` gardait en cache le premier chargement : le `.env` de la racine est chargé par `process.loadEnvFile` (Node 24) dans `next.config.ts`.
- Une page statique calcule ses métadonnées à la construction : `URL_APP` retirée du layout (elle serait figée dans l'image) ; à lire à l'exécution en E14.
- `next dev` crée un `AGENTS.md` en anglais : désactivé (`agentRules: false`), `CLAUDE.md` reste le seul fichier maître.
- pnpm 11 bloque les scripts d'installation : `allowBuilds` dans `pnpm-workspace.yaml` (esbuild autorisé, unrs-resolver refusé).
- Le Chromium de Playwright ne démarre pas dans WSL (`libnspr4` manquant) : vérification du navigateur faite par Hardy sous Windows. À régler avant les tests Playwright (E11) : `sudo npx playwright install-deps`.
- Le port 5432 du poste est occupé par un autre projet : `BDD_PORT_HOTE=5433` dans le `.env` de Hardy.

**À valider par Hardy :**
- Données des cartes de destination (avant E04) ; légende de la carte (avant E11).

**Prochaine action :**
- Lire `docs/etapes/E01-docker-base.md`, phase d'audit, plan.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (31)
**Commit :** `49cb17b` (fusion de E00) ; sauvegarde sur `etape/E01-docker-base`

---

## 30/09/2026 — Préparation — documentation d'architecture
**Fait :**
- Analyse du défi, choix des sources, pitch, répartition DEV / SR.
- Rédaction de `CLAUDE.md`, du glossaire, des documents 00 → 08, de `DECISIONS.md`, `A-FAIRE.md`, des fiches E00 → E18 et du guide SR.
- Design system `globals.css` et prompt Claude Design préparés (hors dépôt pour l'instant).

**Décisions :** D001 → D016.
**À valider par Hardy :** relecture de la documentation.
**Prochaine action :** créer le dépôt et lancer E00.
