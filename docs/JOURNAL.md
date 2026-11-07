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
