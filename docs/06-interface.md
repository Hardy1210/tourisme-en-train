# 06 — Interface, design system et PWA

> **Version** 1.55 · **Date** 26/11/2026
> **Dépend de :** `00-vision.md`, `05-api.md`, `GLOSSAIRE.md`, `apps/web/src/styles/globals.css`
> **Utilisé par :** fiches E10 → E14
> **Document de référence pour :** écrans, états, composants, règles d'usage du design system, carte, PWA, accessibilité, textes.
> **Si ce document dépasse ~400 lignes**, il devient un dossier `06-interface/` (un fichier par écran + `composants.md`) avec un sommaire.

---

## 1. Principes UX

1. **Zéro recherche** : à l'ouverture, des résultats s'affichent sans que l'utilisateur tape quoi que ce soit.
2. **Tout se modifie en un geste** : lieu, rayon ou durée de train, catégories, date.
3. **Révélation progressive** : l'essentiel d'abord (où, combien de temps, quoi faire), le détail au toucher.
4. **Au pouce, d'une main** : actions importantes dans la moitié basse de l'écran.
5. **Mobile d'abord** (390 × 844), puis desktop (1440 × 900).
6. **Honnêteté** : estimation annoncée comme telle, données manquantes signalées sans alarmer.
7. **Train d'abord**, puis transports en ville, puis marche.

---

## 2. Design system

- **Source unique :** `apps/web/src/styles/globals.css` (Tailwind CSS 4). La section 1 du fichier contient les réglages de marque ; tout le reste en découle.
- **Interdit :** toute couleur, rayon, ombre, police ou durée en dur. Un besoin nouveau = un nouveau token dans `globals.css`.
- **Rôle des couleurs :**

| Token | Usage | Jamais pour |
|---|---|---|
| `primary` | Train, marque, navigation active | Actions d'achat |
| `action` | Action d'achat : « Acheter mon billet » (« Voir la sortie » a son token `sortie-*`, D054) | Décoration |
| `transit` | Bus, tram, vélos, trottinettes | Train |
| `cat-*` | Les 5 catégories, une seule couleur par défaut, **toujours avec une icône et un nom** (D054) | Autre chose que des lieux |
| `eco` | CO₂ économisé | Succès génériques |
| `danger` | Erreurs réelles (train supprimé) | Retard modéré (→ `warning`) |

- **Typographie :** `font-display` (titres, noms de lieux), `font-sans` (reste). Classe `tabular` sur **tous** les horaires, durées, distances, prix.
- **Icônes :** Lucide, trait 1,75 px. Catégories : `enfants` → `FerrisWheel`, `nature` → `Mountain`, `parcs` → `Trees`, `patrimoine` → `Castle`, `culture` → `Theater`. Transports : `TrainFront`, `Bus`, `TramFront`, `Bike`.
- **Composants de base** (`components/ui/`, écrits à la main sur Radix et les tokens, D053) : `Bouton`, `Puce` (filtre), `Feuille` (bottom sheet ; un **indicateur de défilement** remplace la barre du navigateur : trait fin de la marque sur un rail presque invisible, visible tant que du contenu est caché plus bas, même sans geste, car Safari sur iPhone n'affiche sa barre que pendant le geste et ignore son style), `Onglets`, `Carte` (conteneur), `Badge`, `Squelette`, `Bandeau`, `ChampRecherche`, `Interrupteur`, `Selecteur`, `EtatVide`, `BoutonRetour`, `BoutonFermer`, `Logo` (le nom de la marque, sa dernière lettre en couleur ; provisoire, seul fichier à changer pour une image, D112), `EcranLancement`.
- **Mode sombre** (P1) : uniquement par les tokens `.dark`.
- **Maquettes Claude Design** : conseil visuel. On copie l'aspect, jamais le comportement sans vérification.

---

## 3. Écran « Explorer » (page d'accueil)

### Premier lancement (D113)
Avant Explorer, une seule fois par appareil : **écran de bienvenue** plein écran sur le fond de la marque, au-dessus du menu (maquette « Accueil », écran 1) : photo en haut dans la courbe de la fiche lieu, au hasard parmi `features/explorer/photos-accueil.ts`, crédit ⓘ ; logo ; « Que faire autour de vous ? » ; **« Utiliser ma position »**, seul geste qui fait demander la position au téléphone ; « ou » ; recherche de ville ou de gare ; trois grandes gares de la région ; « Votre position n'est jamais enregistrée par <marque> ». Un départ choisi mène à l'**écran 3a** (même cadre, même photo) : « Votre gare de départ », la gare et son trajet (même règle que « Votre gare »), « Changer », « Vous savez déjà où aller ? (facultatif) » avec un champ « Destination », « Voir les sorties ». « Changer » et « Destination » ouvrent la page « Trajet » (téléphone) ou ses feuilles (ordinateur) ; « Voir les sorties » ouvre Explorer, barre du trajet remplie. Quitter 3a ferme l'accueil pour de bon (repère « accueil vu » sur l'appareil) ; position refusée : « Dans quelle ville êtes-vous ? », puis 3a dès qu'une ville est choisie ; un lien avec une gare (`?gare=`) ne le montre jamais. Aux lancements suivants, la position n'est demandée qu'une fois l'écran de lancement parti. Textes : `features/explorer/contenu-accueil.ts`.

### Structure mobile, de haut en bas
1. **En-tête collant** : logo (`marque.nom`, **sur ordinateur seulement depuis D086**), puce de localisation « 📍 Autour de <commune> ▾ » (→ Ma position / Une autre ville ; `<commune>` vient de `/api/geocodage/inverse`, voir `05` § 3.11 bis ; en attendant la réponse : « Autour de vous »), **date** : depuis D086, elle se choisit dans « Filtres », section « Quand ? » en premier (Aujourd'hui · Demain · Ce week-end · Choisir une date, calendrier dans la même feuille) ; « aujourd'hui » par défaut, sans bouton ; sinon pastille « 📅 Demain ✕ » avant « Tout » (la toucher revient à aujourd'hui), +1 au compteur de « Filtres » et « · demain » en fin de titre de la liste. **« Ce week-end »** = samedi (ou aujourd'hui si on est déjà le week-end), voir `05` § A.3.
   **Depuis D084**, une fois la gare prête, la puce de localisation devient la **barre du trajet**, sur une seule ligne : « 📍 Autour de Dijon → Où aller ? ». **Depuis D115**, dès qu'une destination est cherchée (touchée ou texte tapé), elle passe sur **deux lignes** : « ○ Départ  Dijon » (la commune, ou le nom de la gare choisie), puis « ● Arrivée  Beaune », et le ✕ à droite. Si la place manque, le départ est coupé (« … »), la destination reste entière. Le départ ouvre la feuille « D'où partez-vous ? » d'avant. La destination ouvre la feuille **« Où allez-vous ? »**, qui se comporte comme « D'où partez-vous ? » : hauteur de son contenu, posée sur le clavier, elle grandit avec les résultats ; le clavier ne vient qu'au toucher du champ « Nom de la destination ». Pendant la frappe, les destinations trouvées s'affichent sous le champ, triées par temps de trajet, suivies du bouton « Afficher les x destinations » (dans la liste, pas collé en bas : il écrasait la liste dans une feuille basse). Recherche dans la liste déjà chargée, sans appel à l'API : sans accents ni majuscules, début de mot, sur la ville, la commune et toutes les gares. Texte tapé : `?recherche=` ; destination touchée : `?destination=<UIC>` en plus. Ensuite, la feuille de résultats monte au plus haut, sous les catégories, et défile jusqu'à la première destination trouvée, centrée ; la liste et la carte ne montrent que les destinations trouvées (« 2 destinations sur 101 ») ; barre « → Beaune ✕ » ou « → « beau » · 2 ✕ » ; aucun résultat : « Aucune destination « xyz » avec ces filtres », « Effacer la recherche » et « Effacer les filtres ». Le choix s'applique une fois la feuille sortie de l'écran : filtrer la liste et la carte pendant sa glissade bloquerait le téléphone, et la feuille disparaîtrait d'un coup. La gare de départ ne change jamais. Textes : `features/explorer/contenu-trajet.ts`.
   **Sur téléphone, depuis D085**, les deux côtés de la barre (et « Changer de gare ») ouvrent la **page « Trajet »** plein écran, en fondu, curseur dans le champ touché et clavier ouvert : « ← Retour », champs Départ et Destination reliés par la ligne du logo, zone du bas selon le champ actif (Départ : « Ma position », gares proches (« ≈ 27 min à pied » jusqu'à 2 km à pied ; au-delà, si la gare a un parking vélo et jusqu'à `acces.rayonVeloM` avec le détour, à droite sur deux lignes « ≈ 17 min à vélo » puis la distance, en plus petit, et « Parking vélo à la gare » sous le nom ; sinon la distance « à vol d'oiseau », D097, D102) ; **sans position connue** (refusée, introuvable ou jamais demandée) : « Grandes gares de la région » à la place des gares proches, les trois de l'accueil (`features/localisation/gares-suggerees.ts`) ; villes tapées ; Destination : « En train direct depuis… », « Voir toutes les destinations », « Les plus proches en train », puis compteur, « Afficher » et résultats triés par temps). **Depuis D117**, un bouton ⇅, à droite et à cheval sur Départ et Destination, quand une destination est touchée dans la liste : la gare de la destination devient le départ, l'ancien départ la destination (« Pas de train direct de … à … » s'il n'y en a pas dans ce sens). **Depuis D116**, une 3ᵉ ligne « Date » (« Aujourd'hui · sam. 21 nov. ») sous Destination, toujours visible ; pastilles « Aujourd'hui / Demain / Ce week-end » sous les champs quand Destination ou Date est actif ; la ligne touchée ouvre le calendrier ; même date que « Filtres ». Un choix fait passer le curseur à l'autre champ s'il est vide, sinon la page se ferme ; la page reste fixe sous le doigt, seule sa liste défile. Les feuilles ci-dessus restent sur ordinateur.
2. **Rangée de filtres** (défilement horizontal) : « Tout » + 5 catégories (multi-sélection) ; bouton « Filtres » avec compteur → feuille : **« Catégories » en premier (les mêmes puces, avec icônes, dans le même état que la rangée, D114)**, « Distance autour de vous » (`autourDeMoiOptionsM`), durée de train max (`trainMaxOptionsMin`), « Faisable dans la journée » (P1). **Destination choisie** (recherche, D084) : on ne cherche plus où aller, la feuille ne garde que « Catégories », « Quand ? » et ses boutons, « Réinitialiser » ne remet à zéro que la date et les catégories (D114), et le compteur ne compte pas les filtres cachés ; tout revient quand la destination est effacée. Les catégories ne changent pas.
3. **Carte (sur mobile : plein écran, sous l'en-tête sans fond, D072 ; ~40 % de la hauteur visible)** : point pulsant de l'utilisateur, gare la plus proche, gares de destination **colorées par tranche de temps** (de loin, des points ; à partir du zoom `carte.zoomIconesGares`, des icônes de train inversées dans la couleur de leur tranche ; la destination du trajet avec un bord jaune, D118) ; les lieux **autour de l'utilisateur** (ou de la gare de départ choisie), au rayon du filtre « Distance autour de vous », **et autour de chaque gare de destination affichée** (périmètre à pied) ; destination choisie : seulement ses lieux (`/api/carte/lieux`, D094) ; en **bulles** pleines à la couleur de la marque (`--primary`), nombre clair et contour clair (essai de Hardy, 14/11), avec leur nombre, décalées de `acces.bullesDecalagePx` pour que le point d'une gare ne cache pas le nombre, qui se divisent en zoomant (toucher une bulle zoome dessus), puis, au-delà du zoom `acces.bullesZoomMax`, l'**épingle** de chaque lieu (goutte lilas au contour violet, icône de sa catégorie, pointe sur le lieu ; le lieu touché, plus grande et pleine, D119), dessinée dans la carte ; les catégories choisies filtrent bulles et icônes ; mini-fiche au toucher (pour une gare : « N lieux à voir à pied depuis la gare » et une pastille par catégorie ; pour un lieu : nom, catégorie, commune, « Voir le lieu ») ; boutons « Recentrer » et « Plein écran ».
   - **Liaisons :** segments droits vers toutes les destinations cachés, à l'essai ; à la sélection d'une carte ou d'un point, **une ligne d'arrêt en arrêt** suit le prochain train (D074). Vrais tracés plus tard (`A-FAIRE`). *La maquette montre des lignes « bien rangées » : c'est un dessin, la vraie carte ne l'est pas.*
   - **Étiquettes « Beaune 22 min » :** affichées pour les 5 destinations avec le plus de trains (D062), au survol et pour la destination sélectionnée ; les autres gares restent des points. Collisions gérées par MapLibre.
   - **Survol croisé (desktop) :** survoler une carte de destination met la gare en évidence sur la carte, et inversement.
4. **Feuille de résultats (glissante, par-dessus la carte)** : trois positions (en bas, à moitié, en haut), à moitié à l'ouverture. **Depuis D120**, sur téléphone, elle se glisse au doigt partout sur elle et le suit ; au lâcher, le cran le plus proche de là où sa vitesse la porterait. Un geste horizontal fait défiler « Près de vous » ; tout en haut, la liste défile, et un geste vers le bas avec la liste à son début redescend la feuille ; hors du haut, la liste revient à son début. Un toucher ouvre ce qu'il touche, un glissement jamais. La poignée garde le toucher et le clavier (Entrée, ↑, ↓). La mention du fond de carte est posée sur la feuille ; la carte et la mini-fiche suivent au lâcher :
   - **a. Votre gare** : nom ; durée à pied si la gare est à `acces.rayonPiedM` au plus ; au-delà, si la gare a un parking vélo et jusqu'à `acces.rayonVeloM` avec le détour, à droite sur deux lignes « ≈ 17 min à vélo » puis « 3,2 km », en plus petit, et « Parking vélo à la gare » sous le nom (même règle que les gares proches, D097) ; sinon la distance seule, « 2,9 km à vol d'oiseau » (D102), et « Voir l’itinéraire » sous la distance, **aussi sans distance** (gare choisie à la main, position refusée), sur iPhone une feuille « Ouvrir l’itinéraire avec » (Plans ou Google Maps), ailleurs Google Maps directement, la gare seule en destination (D096) ; prochain départ direct (destination choisie : le prochain train **vers elle**, ou « aucun aujourd'hui → Beaune ») ; « Changer de gare ». Si la gare proposée n'est pas la plus proche (D064) : « Gare la plus proche : X, … » et un bouton pour y revenir d'un geste ; **la même règle partout**, pour la gare proposée comme pour la plus proche (D097) : à pied jusqu'à `acces.rayonPiedM`, à vélo avec un parking jusqu'à `acces.rayonVeloM`, sinon la distance seule ; jamais de minutes à pied au-delà.
   - **b. Près de vous** (maquette v6) : lieux à pied, cartes horizontales (image ou illustration de catégorie, nom, puce, « 🚶 8 min · 650 m »), « à moins de <distance> » à droite du titre. Titre : « Près de vous » (position) ou « Près de la gare de <départ> » (gare ou ville choisie), autour de ce point, rayon du filtre « Distance autour de vous ». **Destination choisie** : la section passe **après** la liste (c), « Près de la gare de <destination> », lieux du périmètre fixe des gares (`acces.rayonPiedM`, 2 km, D091) dans les catégories choisies, aussi sur la carte ; pas de section pour une destination hors région.
   - **c. En train direct depuis <gare>** : cartes de destination triées par **durée de train** : nom, durée, trains/jour, premier départ et dernier retour, compteurs par catégorie sélectionnée, « ✓ Faisable dans la journée » **ou** « 🌙 Retour tôt, plutôt sur 2 jours » (P1), CO₂ économisé, prochain train « 10:12 → 10:34 », prix estimé **uniquement s'il est calibré** (sinon la ligne disparaît, sans espace vide), bouton `action` « Voir la sortie ». **Depuis D122**, les 10 premières seulement (`limites.destinationsParPage`), puis « Voir plus » en ajoute 10 ; le compte annonce toute la liste, la carte garde toutes les gares.
5. **Écran Lieux** (maquette `Explorer Mobile v3`, D067) : même en-tête qu'Explorer sur fond de marque (gare, catégories, « Filtres » réduit à la date et au temps de train, D086) ; titre « Lieux à visiter » et nombre de lieux ; **depuis D121 (maquette « Lieux-Rangees »), une rangée par gare d'arrivée**, celles qui ont une photo d'abord (D104), puis la plus courte en train : nom de la gare, pastille jaune du temps de train, « · N lieux », « Voir tout › » vers sa fiche destination, puis ses 8 premiers lieux (`limites.lieuxParRangee`) qui défilent de côté, en cartes sur photo (320 × 210 px sur téléphone, 250 × 210 px sur ordinateur, jetons `--carte-rangee-largeur` et `--carte-rangee-hauteur` : photo plein cadre, voile sombre en bas, pastille de catégorie, nom, temps et distance à pied, sans ⓘ : le crédit est sur la page du lieu, D103 ; sans photo, fond de marque et grande icône de catégorie) ; « Voir plus » ajoute des rangées (`limites.rangeesParPage`) ; une autre sorte de rangée s'ajoutera comme une nouvelle variante (`type`) ; états : chargement, sans position, hors région, aucun résultat (« Tout afficher »), date hors horaires, erreur. La gare choisie et la date suivent entre Explorer et Lieux, et chaque écran retrouve ses filtres au retour (D070). Grand écran (`Explorer Desktop v3`) : contrôles dans le panneau de gauche, titre et grille de cartes à droite. Une colonne de cartes sur mobile, autant que la largeur en permet sur grand écran.
6. **Navigation basse** : Explorer · Lieux · Mon espace · Menu (D054). Changer d'onglet ne redemande pas la position : elle est gardée en mémoire jusqu'au rechargement de la page ou à « Ma position » (D068). Explorer reste en vie, caché, une fois ouvert : au retour, la carte est déjà là (D069). Lieux : données réelles. Mon espace (favoris, récompenses) : **fictif, marqué « Aperçu · bientôt »**.

### Desktop
Rail de navigation à gauche (88 px, `--rail-largeur`) + panneau de 440 px (en-tête, filtres, résultats) + carte pleine hauteur à droite ; le Menu s'ouvre en panneau flottant à côté du rail ; la fiche destination s'ouvre en panneau latéral de 480 px.

### États (obligatoires)
| État | Affichage |
|---|---|
| Chargement | Squelettes + « On cherche ce qu'il y a autour de vous… » |
| Localisation refusée ou impossible | Écran 2 de la maquette « Accueil » (D113), sur le fond de la marque, photo de l'accueil : plein écran par-dessus le menu dans Explorer, dans la page avec le menu dans Lieux. Grand champ « Dans quelle ville êtes-vous ? » + trois grandes gares de la région ; sous « Autoriser la localisation », lien repliable « Comment autoriser la localisation ? » avec les étapes de l'appareil (iPhone Safari ou installée, iPhone Chrome, Android Chrome ou installée, autre navigateur de téléphone, ordinateur, inconnu : texte générique), ouvert tout seul si une nouvelle demande est encore refusée. Textes : `features/localisation/contenu-guidage.ts` (D083) |
| Hors région pilote | Message clair : « Pour l'instant, <marque> couvre <région> » (`marque.nom` et `parametres.region.nom`, jamais écrits en dur) + choix d'une ville de la région |
| Aucun résultat | Message utile + action (« Élargir à 1 h de train ») |
| Hors ligne | Bandeau discret + dernières recherches |
| Erreur serveur | Message simple + « Réessayer » |

---

## 4. Fiche destination

- **Mobile :** page plein écran, au-dessus de la navigation. **Desktop :** panneau latéral et carte (D063).
- **Fond de la marque** sur toute la fiche, ses trois onglets compris (`CadreFiche fond="marque"`, jetons « surfaces de marque » de `globals.css`, D106) ; les surfaces blanches gardent leurs couleurs ; contraste AA vérifié en clair et en sombre (`contraste.e2e.ts`).
- **En-tête :** nom de la gare, durée, trains/jour, sélecteur de date ; si « Ce week-end » : bascule **Samedi / Dimanche** ; bouton **Partager** (P1 : partage natif du téléphone, sinon copie du lien + message « Lien copié »).
- **Onglets :**
  - **Lieux** : mini-carte + une **carte par lieu** et par catégorie (D106) : vignette en quart de cercle bordé de jaune (photo, sinon icône de la catégorie), nom sur 2 lignes, durée à pied, sous-catégorie (cachée si elle répète le nom) suivie de l'icône Qualité Tourisme (sans badge, D106) ; vignette et texte = lien vers la fiche ; bouton rond « Voir {nom} sur la carte » ; pas de ⓘ. Au-delà de `limites.lieuxParCategorie` lieux : « Voir les N autres », qui déplie sur place. **Pilule de la mini-carte** : nom du lieu et flèche, toute la pilule ouvre la fiche ; fermée en touchant la carte ailleurs ou avec Échap. Description et horaires dans la fiche lieu (D063). Hors région : « Les lieux de cette destination ne sont pas encore disponibles. »
  - **Trains** : deux colonnes Aller / Retour ; départ, arrivée, durée, type ; **dernier retour** mis en évidence. **Par défaut : horaires théoriques, sans statut.** Statut « À l'heure / +5 min / Supprimé » (P1) **seulement** pour les trains des 3 prochaines heures **aujourd'hui**, si la clé API SNCF est disponible ; un train supprimé reste visible, barré.
  - **Sur place** : bus et tram (numéros de lignes), stations vélos/trottinettes, distance à pied ; **nombre de vélos disponibles** en direct (P1, villes avec flux GBFS, sinon pas de nombre) ; aménagements cyclables (P1). **Pas de transport à la demande** (données non fiables, voir `00` § 9).
- **Pied collant :** bloc `eco` (« 🌱 Vous économisez 5,2 kg de CO₂ par rapport à la voiture ») avec lien « Comparer » (voiture partagée, avion) ; prix estimé si calibré ; bouton `action` « Acheter mon billet » (lien externe vers la billetterie officielle).

---

## 4 ter. Photos des lieux (D100, D101, D103)
- **À la place de l'icône de catégorie, dans le même cadre** : cartes « À pied » (188 × 96 px), liste Lieux (pleine largeur × 160 px), fiche lieu (toute la largeur, découpée en arc, D109), mini-fiches de la carte (vignette carrée de 64 px à gauche, sans changer leur hauteur). Composant `features/lieux/ui/photo-lieu.tsx`.
- **Jamais de carré vide** : fond et icône de la catégorie tout de suite ; la photo se pose par-dessus en fondu (respecte `prefers-reduced-motion`) ; abandonnée au-delà de `photos.delaiMaxMs` (4 s) ou en cas d'erreur, l'icône reste.
- **Ordre des listes (temporaire, D104)** : dans « Près de vous », « Près de la gare de… » et l'écran Lieux, les lieux avec une photo passent d'abord, puis le tri habituel ; décidé par le serveur (`photos.enPremier`), l'écran ne retrie pas.
- **Crédit** : sur la fiche, un ⓘ rond sombre en haut à droite de la photo, dans la barre du haut (seulement quand elle est affichée, D109) ouvre « Photo : auteur · licence · source » (licence et page du fichier liées) ; **ⓘ** en bas à droite des cartes de l'écran Lieux et des mini-fiches (zone de 44 px, hors du lien de la carte), qui ouvre la même ligne dans une bulle ; **pas de ⓘ** sur les petites cartes de « Près de vous » / « Près de la gare de… » (Hardy, 18/11) : le crédit est sur la page du lieu. Texte alternatif : le nom du lieu.
- Mentions légales : les photos viennent de Wikimedia et de Tourinsoft, qui reçoivent l'adresse IP du visiteur.

## 4 quater. Description d'un lieu (D105)
- **Texte brut, jamais du HTML** (pas de `dangerouslySetInnerHTML`) ; paragraphes gardés par `white-space: pre-line` (`features/lieux/ui/infos-lieu.tsx`). Repliée : 4 lignes, puis « Lire la suite » / « Réduire » au-delà de 240 caractères.
- **« Source : » + attribution de la source du lieu, juste sous la description** (règle 8 ; DATAtourisme : « DATAtourisme (ADN Tourisme), Licence Ouverte Etalab 2.0 », `config/sources.json`). Sans description, l'attribution reste en bas de la fiche : jamais deux fois.
- **Texte ajouté (D123)** : un seul texte par fiche, choisi par `choisirDescription` (`features/lieux/description.ts`) : nos textes, puis la description des sources de `lieux.descriptionsAvantWikipedia` (DATAtourisme), puis Wikipédia, puis la description des autres sources (OSM). Sous un texte Wikipédia : « Texte : Wikipédia (extrait) · CC BY-SA 4.0 », l'article et la licence liés (la licence demande l'auteur, la licence et de dire que le texte est modifié : il est coupé et nettoyé) ; l'attribution de la source du lieu reste alors en bas de la fiche.

## 4 sexies. Fiche lieu, barre du haut et pied des fiches (D109)
- **Fiche lieu** (maquette `design/maquettes/Fiche-Lieu.dc.html`) : toute la fiche sur le fond de la marque, cartes sur les surfaces de marque (D106). **Haut** : photo pleine largeur, jusqu'en haut de l'écran derrière l'heure et la batterie (`CadreFiche hautPlein`), découpée par un grand cercle bordé de jaune (`entete-arc`, mesures en `cqw`) ; sans photo, même courbe plus basse, icône de la catégorie. Puis titre, pastille de catégorie, Qualité Tourisme, carte des gares, description, bloc horaires + adresse, « Site officiel » à bord fin, mini-carte, source.
- **Barre du haut de toutes les fiches** (`BarreRetour`) : Retour à gauche, une action à droite (ⓘ de la photo, date de la destination). **Une seule position** (`--retour-haut`, `--retour-bord`, `--retour-zone`, utilitaire `barre-retour`) et **un seul dessin** (rond sombre, `sur-photo`) : aucun écran ne place son bouton Retour lui-même. Les pages de lecture (Sources, À propos, Mentions légales, `CadrePage`) ont la même barre depuis le 21/11 ; les pages plein écran d'Explorer (Départ, Trajet), avec un champ de saisie, gardent leur « ← Retour » en texte (choix de Hardy). Vérifié par `barre-retour.e2e.ts`.
- **Pied des fiches** (`PiedFiche`) : celui de la fiche destination, haut arrondi des feuilles et leur ombre, hauteur qui suit le contenu.

## 4 quinquies. Horaires d'ouverture d'un lieu (D108)
- **Lignes françaises** dans le bloc « Horaires » de la fiche (`features/lieux/ui/horaires-lieu.tsx`) : « quand » à gauche (dates, jours : « 1er avr. – 15 nov. », « Lun. – ven. », « Juil. – août · tous les jours »), heures à droite, une plage par ligne (« 9 h – 12 h », « 14 h – 18 h 30 »), en `tabular`. « Fermé », « 24 h/24 », « Ouvert » (période sans heures), commentaire de la source tel quel.
- **Résumé du jour en haut du bloc** : « Aujourd'hui, ven. 20 nov. » à gauche, ses plages à droite, **une par ligne et alignées** sur la colonne des heures du dessous, jamais coupées au milieu (« Fermé » un jour de fermeture ; Hardy, 20/11), et la ligne qui vaut ce jour-là sur un fond `primary-soft`, **sans badge** (Hardy, 20/11 : un badge posé à côté de « 16 nov. » ou de « Lun. – sam. » se lisait « aujourd'hui = 16 nov. »). **Aucun résumé** quand on ne peut pas être sûr de la règle du jour (vacances scolaires possibles, règles ajoutées ou de secours, commentaire seul) ni un jour sans règle.
- **Horaires non compris** (4 % mesurés) : le texte d'origine, tel quel, à la même taille.
- **Date du jour calculée à l'affichage, jamais au rendu du serveur** : la page n'est ni statique ni ISR, l'API (en cache 24 h et hors ligne) ne renvoie que le texte brut. L'écran la tient à jour avec `useDateDuJour()` (`lib/utiliser-date-du-jour.ts`) : recalculée à minuit (Paris) et au retour de l'app au premier plan, pour une fiche restée ouverte. Le composant la reçoit en paramètre.

## 4 bis. Maquettes et variantes

- Maquettes de référence (Claude Design) : Explorer mobile et desktop, avec la fiche destination intégrée. Captures et liens : `design/README.md`.
- **Variantes à concevoir** (avant E11–E12) :
  1. carte avec **une vingtaine de destinations** (lisibilité des étiquettes) ;
  2. **lieu sans description ni horaires** ;
  3. **carte de destination et pied de fiche sans prix** ;
  4. **onglet Trains sans statut** (cas par défaut) ;
  5. bascule **Samedi / Dimanche** ;
  6. station de vélos **sans nombre** disponible.
- À **retirer** de la maquette : le transport à la demande, le bouton « Mes sorties » (remplacé par « Mon espace » dans la navigation basse, § 3).
- **Écrans complémentaires à concevoir** (prompts : `design/prompts-ecrans.md`) : fiche lieu · calendrier « Choisir une date » · utilisateur hors région · destination hors région · écran Sources + menu · erreurs (sortie expirée, 404, panne) · détail « Comparer » (CO₂) · écran avant la localisation · invitation à installer l'app.

## 5. Page « L'âme du produit » et écran Sources

- Accessibles depuis le menu « Infos ».
- Sections : accroche · le constat · pourquoi c'est important (3 chiffres sourcés) · la solution en 3 étapes (captures) · pour qui · ce que ça change · conclusion + bouton « Ouvrir l'application ».
- Textes de référence : `docs/equipe/pitch.md`, repris dans `features/presentation/contenu-a-propos.ts`. Une section sans texte validé n'est pas affichée ; un chiffre non confirmé non plus (D075).
- **Mentions légales et confidentialité** (`/mentions-legales`) : éditeur, hébergeur, ce qui arrive à la position, stockage sur l'appareil. Pas de bandeau cookies tant qu'on n'utilise ni mesure d'audience ni cookies non essentiels.
- **Écran Sources** (`/sources`, D075) : liste issue de `/api/sources`, par thème (nom, producteur, licence, attribution, lien, date « Relevé le ») + attributions OpenFreeMap, OpenMapTiles, OpenStreetMap + mention du défi data.gouv.fr. Plein écran sur mobile ; sans carte sur grand écran, à côté du rail, sur deux colonnes.

---

## 6. Carte

- **MapLibre GL** + `react-map-gl`, style **OpenFreeMap** personnalisé : couleurs du fond lues depuis les tokens (`--map-*`), labels réduits.
- Les **épingles et le point utilisateur sont des composants à nous** (couleurs `cat-*`, `map-user`, `map-station`).
- **Isochrone simplifiée :** couleur des gares de destination selon `trancheTemps`, légende visible.
- **Accessibilité :** la carte est toujours doublée d'une liste ; aucune information n'existe uniquement sur la carte.
- **Attribution** visible en bas de la carte, sur une ligne, avec des liens sans couleur ni soulignement (D073).
- Hors ligne (option E16) : fichier PMTiles régional.

---

## 7. PWA

| Élément | Règle |
|---|---|
| Manifest | Généré par `app/manifest.ts` depuis `config/marque.ts` ; icônes 192/512 + maskable ; `display: standalone` ; `lang: fr` |
| Service worker | Serwist : précache de l'interface ; réseau d'abord pour une liste explicite de routes et les pages (`lib/pwa/routes-hors-ligne.ts`, `cache.reseauMaxS`, `cache.horsLigneS`, `cache.horsLigneEntrees`) ; **jamais une adresse avec une position** (D071). Le cache hors ligne ne change rien aux trains partis : l'écran compare toujours l'heure du train à l'heure actuelle (D068). |
| Hors ligne | Dernières recherches lisibles, à partir de la dernière gare gardée sur l'appareil ; bandeau « Vous êtes hors ligne » ; carte sans fond ; page jamais ouverte : message, navigation et lien vers Explorer ; réseau revenu : tout se met à jour seul |
| Écran de lancement | À chaque ouverture : logo, `marque.accroche` et nom de la région sur le fond de la marque, puis fondu de sortie (durées `--lancement-*`) ; dans le HTML de départ, sans JavaScript ; jamais rejoué en changeant d'écran ; Android : `background_color` du manifest = couleur de la marque, sans saut (D112) |
| Scripts qui ne se chargent pas | Message et lien pour recharger, après 8 s, au lieu d'une page blanche |
| Installation | Android et iPhone. Icônes provisoires. Invitation discrète après une première recherche réussie, jamais au premier affichage : reportée (`A-FAIRE`) |

---

## 8. Accessibilité (WCAG 2.1 AA)

Contraste AA · cibles tactiles ≥ 44 px (`h-touch`) · navigation clavier complète · libellés ARIA sur les icônes seules · focus visible (token `ring`) · `prefers-reduced-motion` respecté · couleur jamais seule porteuse d'information · textes lisibles à 16 px.

---

## 9. Textes

- Tutoiement ou vouvoiement : **vouvoiement**.
- Ton : chaleureux, simple, sans jargon (« train direct », pas « liaison directe » dans l'interface).
- Nom de marque : **toujours** via `marque.nom`.
- Estimations : « ≈ 8–12 € (estimation) ». **Minutes à pied et à vélo : toujours « ≈ 9 min »** (`formaterDureeEstimee`) ; une distance à vol d'oiseau seule est dite comme telle (`formaterDistanceVolOiseau`), celle des lieux est déjà une distance à pied estimée (D043) et reste courte (D102).
- Horaires : « 10:12 » ; après minuit : « 00:35 (+1) ».

---

## 10. Processus de design

Un écran à la fois, celui que Hardy indique ; montré avant de passer au suivant. Hardy apporte l'expérience d'usage ; l'implémentation est proposée par Claude Code. Une demande de design qui toucherait la logique ou les données est signalée avant.

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 30/09/2026 | 1.0 | Création |
| 30/09/2026 | 1.1 | Alignement sur la maquette Explorer : carte en segments + étiquettes, week-end, partage, vélos disponibles, temps réel limité, états sans description / sans prix / sans statut, variantes à concevoir — D017 à D021 |
| 02/10/2026 | 1.2 | Nom de la commune de la puce de localisation par `/api/geocodage/inverse` — D022 ; écrans complémentaires listés en § 4 bis |
| 09/10/2026 | 1.3 | Navigation basse alignée sur E10 (Explorer · Menu) ; message « hors région » tiré de `marque` et `parametres.region` |
| 04/11/2026 | 1.4 | § 2 : composants écrits à la main sur Radix — D053 ; rôles `action` et `cat-*`, navigation à 4 onglets, rail sur grand écran, composants réels — D054 |
| 04/11/2026 | 1.5 | § 4 : page plein écran, contenu de la liste des lieux — D063 |
| 05/11/2026 | 1.6 | § Explorer : écran Lieux, mobile et grand écran — D067 |
| 05/11/2026 | 1.7 | § Explorer et PWA : position gardée entre les écrans, train parti jamais affiché — D068 |
| 05/11/2026 | 1.8 | § Explorer : « Votre gare » quand la gare proposée n'est pas la plus proche — D064 |
| 05/11/2026 | 1.9 | § Explorer : écran gardé en vie — D069 |
| 05/11/2026 | 1.10 | § Explorer : filtres gardés entre les onglets — D070 |
| 05/11/2026 | 1.11 | § 7 : réseau d'abord, liste explicite, secours sans scripts — D071 |
| 05/11/2026 | 1.12 | § Explorer : carte sous les filtres sur mobile, marges iPhone — D072 |
| 06/11/2026 | 1.13 | § Carte : ligne d'arrêt en arrêt à la sélection — D074 |
| 06/11/2026 | 1.14 | § 5 : écran Sources par thème, adresse `/sources` — D075 |
| 06/11/2026 | 1.15 | § 5 : page Mentions légales et confidentialité (E13) |
| 10/11/2026 | 1.16 | § 3 : guidage de la localisation selon l'appareil — D083 |
| 11/11/2026 | 1.17 | § 3 : barre du trajet et recherche de destination — D084 |
| 12/11/2026 | 1.19 | Page « Trajet » plein écran sur téléphone — D085 |
| 11/11/2026 | 1.18 | « Où allez-vous ? » à la hauteur de son contenu, bouton dans la liste, choix appliqué après la glissade ; indicateur de défilement des feuilles — D084 |
| 12/11/2026 | 1.20 | En-tête allégé : logo sur ordinateur seulement, date dans « Filtres », pastille de date — D086 |
| 13/11/2026 | 1.21 | § carte : bulle du nombre de lieux à pied sur chaque gare de destination, et dans la mini-fiche (maquette v6) |
| 13/11/2026 | 1.22 | § 3 : section « Près de vous » et « Près de la gare de… », en bas avec une destination choisie ; « Votre gare » donne le train vers elle ; « Filtres » réduit à « Quand ? » dans ce mode ; « Distance autour de vous » (maquette v6) |
| 13/11/2026 | 1.23 | § 3 carte : tous les lieux en bulles qui se divisent au zoom, puis icônes ; la bulle par gare (D088) passe dans la mini-fiche — D091, D092 |
| 14/11/2026 | 1.24 | § 3 carte : lieux autour de soi (rayon du filtre) et de chaque gare de destination, bulles décalées — D094 |
| 14/11/2026 | 1.25 | § 3 carte : bulles à la couleur de la marque, nombre clair |
| 16/11/2026 | 1.26 | § Explorer : « Votre gare » sans durée à vélo, « Voir l’itinéraire » ; listes de gares proches : à pied ou distance — D096 |
| 16/11/2026 | 1.27 | § Explorer : « Voir l’itinéraire » dès qu'une gare de départ est connue, même sans position — D096 |
| 16/11/2026 | 1.28 | § Explorer : gares proches, durée à vélo avec sa preuve « Parking vélo à la gare » — D097 |
| 17/11/2026 | 1.29 | § Explorer : « Votre gare » suit la règle des gares proches (vélo avec parking) ; à vélo, la distance sous la durée, en plus petit (essai iPhone) — D097 |
| 17/11/2026 | 1.30 | § Explorer : « Votre gare » quand la gare proposée n'est pas la plus proche suit la même règle (plus de minutes à pied au-delà de 2 km) — D097 |
| 17/11/2026 | 1.31 | § 4 ter : photos des lieux (cartes, fiche, mini-fiches, crédit, limite de temps) — D100, D101, D103 |
| 18/11/2026 | 1.32 | § 4 ter : lieux avec photo d'abord dans les listes (temporaire) — D104 |
| 19/11/2026 | 1.35 | § 4 quater : description d'un lieu en texte brut avec paragraphes, « Source : » dessous — D105 |
| 18/11/2026 | 1.34 | § 2, § 3, textes : « ≈ » devant les minutes, distance seule des gares « à vol d'oiseau » — D102 |
| 18/11/2026 | 1.33 | § 4 : fiche destination sur le fond de la marque, cartes de lieux en arc, « Voir les N autres », pilule de la mini-carte — D106 |
| 20/11/2026 | 1.36 | § 4 quinquies : horaires d'ouverture en lignes françaises, résumé « Aujourd'hui, … » en haut quand c'est sûr, date tenue à jour — D108 |
| 20/11/2026 | 1.37 | § 4 sexies : fiche lieu de la maquette, barre du haut commune (`BarreRetour`), pied commun (`PiedFiche`) ; § 4 ter : ⓘ en haut à droite — D109 |
| 21/11/2026 | 1.38 | § 4 sexies : Sources, À propos, Mentions légales au même bouton Retour ; Départ et Trajet gardent le texte — D109 |
| 24/11/2026 | 1.39 | § 7 : écran de lancement ; § 2 : logo en texte — D112 |
| 24/11/2026 | 1.40 | § 3 : premier lancement, écran de bienvenue, position demandée au toucher — D113 |
| 24/11/2026 | 1.41 | § 3 : écran 3a de l'accueil (gare de départ, destination facultative) — D113 |
| 24/11/2026 | 1.42 | § 3 États : écran 2 « Dans quelle ville êtes-vous ? » sur le fond de la marque — D113 |
| 24/11/2026 | 1.43 | § 3 : catégories aussi dans « Filtres », « Réinitialiser » remet à zéro ce que la feuille montre — D114 |
| 24/11/2026 | 1.44 | § 3 : barre du trajet sur deux lignes quand une destination est cherchée — D115 |
| 24/11/2026 | 1.45 | § 3 : la date dans la page « Trajet » — D116 |
| 24/11/2026 | 1.46 | § 3 : ⇅ dans la page « Trajet » — D117 |
| 24/11/2026 | 1.47 | § 3 : gares en points de loin, en trains de près, bord jaune de la destination — D118 |
| 24/11/2026 | 1.48 | § 3 : épingles des lieux en goutte, lieu touché plein — D119 |
| 25/11/2026 | 1.49 | § 3 : la feuille montre 10 destinations, puis « Voir plus » — D122 |
| 25/11/2026 | 1.50 | § 4 : feuille de résultats glissée au doigt partout sur elle, arrêtée selon la vitesse — D120 |
| 25/11/2026 | 1.51 | § 5 : écran Lieux en rangées par gare, cartes sur photo — D121 |
| 25/11/2026 | 1.52 | § 5 : plus de ⓘ sur les cartes des rangées, le crédit est sur la page du lieu — D103 |
| 26/11/2026 | 1.53 | § 4 : page « Trajet » sans position, grandes gares de la région à la place des gares proches |
| 26/11/2026 | 1.54 | § 4 quater : texte Wikipédia et son crédit dans la fiche lieu, ordre des textes — D123 |
| 26/11/2026 | 1.55 | § 5 : cartes des rangées de Lieux à 320 px de large sur téléphone (Hardy) |
