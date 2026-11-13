# 06 — Interface, design system et PWA

> **Version** 1.22 · **Date** 13/11/2026
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
- **Composants de base** (`components/ui/`, écrits à la main sur Radix et les tokens, D053) : `Bouton`, `Puce` (filtre), `Feuille` (bottom sheet ; un **indicateur de défilement** remplace la barre du navigateur : trait fin de la marque sur un rail presque invisible, visible tant que du contenu est caché plus bas, même sans geste, car Safari sur iPhone n'affiche sa barre que pendant le geste et ignore son style), `Onglets`, `Carte` (conteneur), `Badge`, `Squelette`, `Bandeau`, `ChampRecherche`, `Interrupteur`, `Selecteur`, `EtatVide`, `BoutonRetour`, `BoutonFermer`, `Logo`.
- **Mode sombre** (P1) : uniquement par les tokens `.dark`.
- **Maquettes Claude Design** : conseil visuel. On copie l'aspect, jamais le comportement sans vérification.

---

## 3. Écran « Explorer » (page d'accueil)

### Structure mobile, de haut en bas
1. **En-tête collant** : logo (`marque.nom`, **sur ordinateur seulement depuis D086**), puce de localisation « 📍 Autour de <commune> ▾ » (→ Ma position / Une autre ville ; `<commune>` vient de `/api/geocodage/inverse`, voir `05` § 3.11 bis ; en attendant la réponse : « Autour de vous »), **date** : depuis D086, elle se choisit dans « Filtres », section « Quand ? » en premier (Aujourd'hui · Demain · Ce week-end · Choisir une date, calendrier dans la même feuille) ; « aujourd'hui » par défaut, sans bouton ; sinon pastille « 📅 Demain ✕ » avant « Tout » (la toucher revient à aujourd'hui), +1 au compteur de « Filtres » et « · demain » en fin de titre de la liste. **« Ce week-end »** = samedi (ou aujourd'hui si on est déjà le week-end), voir `05` § A.3.
   **Depuis D084**, une fois la gare prête, la puce de localisation devient la **barre du trajet**, sur une seule ligne : « 📍 Autour de Dijon → Où aller ? ». Si la place manque, le départ est coupé (« … »), la destination reste entière. Le départ ouvre la feuille « D'où partez-vous ? » d'avant. La destination ouvre la feuille **« Où allez-vous ? »**, qui se comporte comme « D'où partez-vous ? » : hauteur de son contenu, posée sur le clavier, elle grandit avec les résultats ; le clavier ne vient qu'au toucher du champ « Nom de la destination ». Pendant la frappe, les destinations trouvées s'affichent sous le champ, triées par temps de trajet, suivies du bouton « Afficher les x destinations » (dans la liste, pas collé en bas : il écrasait la liste dans une feuille basse). Recherche dans la liste déjà chargée, sans appel à l'API : sans accents ni majuscules, début de mot, sur la ville, la commune et toutes les gares. Texte tapé : `?recherche=` ; destination touchée : `?destination=<UIC>` en plus. Ensuite, la feuille de résultats monte au plus haut, sous les catégories, et défile jusqu'à la première destination trouvée, centrée ; la liste et la carte ne montrent que les destinations trouvées (« 2 destinations sur 101 ») ; barre « → Beaune ✕ » ou « → « beau » · 2 ✕ » ; aucun résultat : « Aucune destination « xyz » avec ces filtres », « Effacer la recherche » et « Effacer les filtres ». Le choix s'applique une fois la feuille sortie de l'écran : filtrer la liste et la carte pendant sa glissade bloquerait le téléphone, et la feuille disparaîtrait d'un coup. La gare de départ ne change jamais. Textes : `features/explorer/contenu-trajet.ts`.
   **Sur téléphone, depuis D085**, les deux côtés de la barre (et « Changer de gare ») ouvrent la **page « Trajet »** plein écran, en fondu, curseur dans le champ touché et clavier ouvert : « ← Retour », champs Départ et Destination reliés par la ligne du logo, zone du bas selon le champ actif (Départ : « Ma position », gares proches, villes tapées ; Destination : « En train direct depuis… », « Voir toutes les destinations », « Les plus proches en train », puis compteur, « Afficher » et résultats triés par temps). Un choix fait passer le curseur à l'autre champ s'il est vide, sinon la page se ferme ; la page reste fixe sous le doigt, seule sa liste défile. Les feuilles ci-dessus restent sur ordinateur.
2. **Rangée de filtres** (défilement horizontal) : « Tout » + 5 catégories (multi-sélection) ; bouton « Filtres » avec compteur → feuille : « Distance autour de vous » (`autourDeMoiOptionsM`), durée de train max (`trainMaxOptionsMin`), « Faisable dans la journée » (P1). **Destination choisie** (recherche, D084) : on ne cherche plus où aller, la feuille ne garde que « Quand ? » et ses boutons, « Réinitialiser » ne remet à zéro que la date, et le compteur ne compte pas les filtres cachés ; tout revient quand la destination est effacée. Les catégories ne changent pas.
3. **Carte (sur mobile : plein écran, sous l'en-tête sans fond, D072 ; ~40 % de la hauteur visible)** : point pulsant de l'utilisateur, gare la plus proche, lieux proches (épingles par catégorie), gares de destination **colorées par tranche de temps**, chacune avec une **bulle** à côté du point (sans le recouvrir) : le nombre de lieux à voir à pied depuis la gare dans les catégories choisies, absente à 0 (maquette v6) ; mini-fiche au toucher (pour une gare : ce nombre et une pastille par catégorie) ; boutons « Recentrer » et « Plein écran ».
   - **Liaisons :** segments droits vers toutes les destinations cachés, à l'essai ; à la sélection d'une carte ou d'un point, **une ligne d'arrêt en arrêt** suit le prochain train (D074). Vrais tracés plus tard (`A-FAIRE`). *La maquette montre des lignes « bien rangées » : c'est un dessin, la vraie carte ne l'est pas.*
   - **Étiquettes « Beaune 22 min » :** affichées pour les 5 destinations avec le plus de trains (D062), au survol et pour la destination sélectionnée ; les autres gares restent des points. Collisions gérées par MapLibre.
   - **Survol croisé (desktop) :** survoler une carte de destination met la gare en évidence sur la carte, et inversement.
4. **Feuille de résultats (glissante, par-dessus la carte)** :
   - **a. Votre gare** : nom, distance, durée vélo ; prochain départ direct (destination choisie : le prochain train **vers elle**, ou « aucun aujourd'hui → Beaune ») ; « Changer de gare ». Si la gare proposée n'est pas la plus proche (D064) : temps à pied jusqu'à elle, gare la plus proche, et bouton pour y revenir d'un geste.
   - **b. Près de vous** (maquette v6) : lieux à pied, cartes horizontales (image ou illustration de catégorie, nom, puce, « 🚶 8 min · 650 m »), « à moins de <distance> » à droite du titre. Titre : « Près de vous » (position) ou « Près de la gare de <départ> » (gare ou ville choisie), autour de ce point, rayon du filtre « Distance autour de vous ». **Destination choisie** : la section passe **après** la liste (c), « Près de la gare de <destination> », lieux du périmètre fixe des gares (`acces.rayonPiedM`, 2 km, D091) dans les catégories choisies, aussi sur la carte ; pas de section pour une destination hors région.
   - **c. En train direct depuis <gare>** : cartes de destination triées par **durée de train** : nom, durée, trains/jour, premier départ et dernier retour, compteurs par catégorie sélectionnée, « ✓ Faisable dans la journée » **ou** « 🌙 Retour tôt, plutôt sur 2 jours » (P1), CO₂ économisé, prochain train « 10:12 → 10:34 », prix estimé **uniquement s'il est calibré** (sinon la ligne disparaît, sans espace vide), bouton `action` « Voir la sortie ».
5. **Écran Lieux** (maquette `Explorer Mobile v3`, D067) : même en-tête qu'Explorer sur fond de marque (gare, catégories, « Filtres » réduit à la date et au temps de train, D086) ; titre « Lieux à visiter » et nombre de lieux ; cartes : illustration de catégorie, catégorie, nom, gare et temps de train, temps et distance à pied, badge Qualité Tourisme ; « Voir plus » (D056) ; états : chargement, sans position, hors région, aucun résultat (« Tout afficher »), date hors horaires, erreur. La gare choisie et la date suivent entre Explorer et Lieux, et chaque écran retrouve ses filtres au retour (D070). Grand écran (`Explorer Desktop v3`) : contrôles dans le panneau de gauche, titre et grille de cartes à droite. Une colonne de cartes sur mobile, autant que la largeur en permet sur grand écran.
6. **Navigation basse** : Explorer · Lieux · Mon espace · Menu (D054). Changer d'onglet ne redemande pas la position : elle est gardée en mémoire jusqu'au rechargement de la page ou à « Ma position » (D068). Explorer reste en vie, caché, une fois ouvert : au retour, la carte est déjà là (D069). Lieux : données réelles. Mon espace (favoris, récompenses) : **fictif, marqué « Aperçu · bientôt »**.

### Desktop
Rail de navigation à gauche (88 px, `--rail-largeur`) + panneau de 440 px (en-tête, filtres, résultats) + carte pleine hauteur à droite ; le Menu s'ouvre en panneau flottant à côté du rail ; la fiche destination s'ouvre en panneau latéral de 480 px.

### États (obligatoires)
| État | Affichage |
|---|---|
| Chargement | Squelettes + « On cherche ce qu'il y a autour de vous… » |
| Localisation refusée ou impossible | Grand champ « Dans quelle ville êtes-vous ? » + suggestions de villes de la région ; sous « Autoriser la localisation », lien repliable « Comment autoriser la localisation ? » avec les étapes de l'appareil (iPhone Safari ou installée, iPhone Chrome, Android Chrome ou installée, autre navigateur de téléphone, ordinateur, inconnu : texte générique), ouvert tout seul si une nouvelle demande est encore refusée. Textes : `features/localisation/contenu-guidage.ts` (D083) |
| Hors région pilote | Message clair : « Pour l'instant, <marque> couvre <région> » (`marque.nom` et `parametres.region.nom`, jamais écrits en dur) + choix d'une ville de la région |
| Aucun résultat | Message utile + action (« Élargir à 1 h de train ») |
| Hors ligne | Bandeau discret + dernières recherches |
| Erreur serveur | Message simple + « Réessayer » |

---

## 4. Fiche destination

- **Mobile :** page plein écran, au-dessus de la navigation. **Desktop :** panneau latéral et carte (D063).
- **En-tête :** nom de la gare, durée, trains/jour, sélecteur de date ; si « Ce week-end » : bascule **Samedi / Dimanche** ; bouton **Partager** (P1 : partage natif du téléphone, sinon copie du lien + message « Lien copié »).
- **Onglets :**
  - **Lieux** : mini-carte + liste par catégorie (nom, durée à pied, sous-catégorie, badge Qualité Tourisme ; description et horaires dans la fiche lieu, D063). **Lieu sans description ni horaires** (fréquent pour OpenStreetMap) : nom, catégorie, durée à pied et lien « Voir sur la carte », sans case vide. Hors région : « Les lieux de cette destination ne sont pas encore disponibles. »
  - **Trains** : deux colonnes Aller / Retour ; départ, arrivée, durée, type ; **dernier retour** mis en évidence. **Par défaut : horaires théoriques, sans statut.** Statut « À l'heure / +5 min / Supprimé » (P1) **seulement** pour les trains des 3 prochaines heures **aujourd'hui**, si la clé API SNCF est disponible ; un train supprimé reste visible, barré.
  - **Sur place** : bus et tram (numéros de lignes), stations vélos/trottinettes, distance à pied ; **nombre de vélos disponibles** en direct (P1, villes avec flux GBFS, sinon pas de nombre) ; aménagements cyclables (P1). **Pas de transport à la demande** (données non fiables, voir `00` § 9).
- **Pied collant :** bloc `eco` (« 🌱 Vous économisez 5,2 kg de CO₂ par rapport à la voiture ») avec lien « Comparer » (voiture partagée, avion) ; prix estimé si calibré ; bouton `action` « Acheter mon billet » (lien externe vers la billetterie officielle).

---

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
- Estimations : « ≈ 8–12 € (estimation) ».
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
