# Prompt Claude Design — Wagoo (nom provisoire)

> Joindre le fichier `globals.css` à ce prompt. C'est le design system du projet.

---

## Ton rôle

Tu es designer UI/UX senior, spécialiste des applications mobiles de mobilité et de découverte. Tu conçois deux écrans pour une application web installable (PWA), **mobile d'abord (390 × 844)**, avec une déclinaison **desktop (1440 × 900)**.

---

## Le produit en une phrase

**Wagoo** trouve pour l'utilisateur, dès l'ouverture, ce qu'il peut faire autour de lui et comment y aller en train. Il n'a rien à chercher : il n'a qu'à choisir.

### Le problème à résoudre
Pour organiser une sortie sans voiture, on passe aujourd'hui d'un site à l'autre : un pour les châteaux, un pour les aires de jeux, un pour la nature, un pour les horaires de train, un pour les bus sur place. Et on ne sait même pas ce qui existe près de chez soi. Résultat : une à deux heures perdues, du stress, et on reprend la voiture.

### La promesse
**En 30 secondes, l'utilisateur sait quoi faire et comment y aller.** Tout est réuni dans un seul écran.

### Ordre d'importance des transports
1. **Le train**, cœur du produit : trains directs, aller et retour.
2. **Les transports en ville** à l'arrivée : bus, tram, vélos et trottinettes en libre-service.
3. **La marche** depuis la gare jusqu'aux lieux.

### Pour qui
Familles avec enfants (cible principale), célibataires qui veulent s'évader, touristes dans une ville inconnue, personnes qui préparent un séjour loin de chez elles. L'application est sans compte et sans inscription.

---

## Design system : règles obligatoires

Le fichier `globals.css` joint est la **source unique de vérité**. Changer une ligne de sa section 1 doit changer tout le projet.

- **N'utilise que les tokens du fichier.** Aucune couleur, aucun rayon, aucune ombre, aucune police en dur. Utilise les classes Tailwind qu'il génère : `bg-background`, `bg-surface`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `bg-action`, `bg-cat-enfants-soft`, `text-cat-nature-foreground`, `bg-transit-soft`, `rounded-lg`, `rounded-xl`, `shadow-card`, `shadow-sheet`, `font-display`, `tabular`, `h-touch`, etc.
- **S'il te manque un token**, ajoute-le dans `globals.css` (sections 1 à 5), jamais en valeur locale.
- **Rôle des couleurs :**
  - `primary` : le train, la marque, les éléments de navigation actifs.
  - `action` : **uniquement** les actions principales (« Voir les trains », « Acheter le billet »). Une seule action principale visible à la fois.
  - `transit` : bus, tram, vélos, trottinettes.
  - `cat-*` : les 5 catégories de lieux, toujours associées à une **icône** (la couleur ne doit jamais être le seul repère).
  - `eco` : le CO₂ économisé.
- **Typographie :** `font-display` (Bricolage Grotesque) pour les titres et les noms de lieux, `font-sans` (Inter) pour le reste. Classe `tabular` sur **tous** les horaires, durées, distances et prix.
- **Icônes :** Lucide, trait de 1,75 px.
- **Mode clair et mode sombre** : les deux doivent fonctionner uniquement par les tokens.
- **Accessibilité :** contraste AA minimum, cibles tactiles d'au moins 44 px (`h-touch`), carte toujours doublée d'une liste, textes lisibles à 16 px.

### Catégories (icône Lucide + token)
| Catégorie | Icône | Token |
|---|---|---|
| Enfants (aires de jeux, parcs de loisirs, zoos) | `Baby` ou `FerrisWheel` | `cat-enfants` |
| Nature (sites naturels, lacs, points de vue, randonnées) | `Mountain` | `cat-nature` |
| Parcs et espaces verts | `Trees` | `cat-parcs` |
| Patrimoine (châteaux, monuments, musées) | `Castle` | `cat-patrimoine` |
| Culture (spectacles, festivals, lieux culturels) | `Theater` | `cat-culture` |

### Direction visuelle
**Un carnet de voyage moderne** : chaleureux, lumineux, rassurant. Fond « papier » légèrement chaud, cartes blanches aérées, beaucoup d'espace et de hiérarchie. Le train est représenté par une ligne continue qui relie les gares, comme un motif graphique récurrent.
À éviter : l'esthétique d'un site de billetterie, les tableaux denses, l'identité visuelle de la SNCF (ni ses couleurs ni son logo).

---

## Écran 1 : page principale « Explorer » (priorité absolue)

C'est l'écran que l'utilisateur voit **dès l'ouverture**. Il doit donner envie de naviguer, et permettre de filtrer, choisir et partir sans effort.

### Principe UX
- **Zéro recherche** : la position est détectée automatiquement et les résultats apparaissent tout de suite.
- **Tout est modifiable en un geste** : le lieu, la distance ou le temps de train, les catégories, la date.
- **Révélation progressive** : d'abord l'essentiel (où, combien de temps, quoi faire), puis le détail au toucher (trains, lieux, transports sur place).
- **Utilisable au pouce, d'une seule main** : les actions importantes sont dans la moitié basse de l'écran.

### Structure mobile, de haut en bas

**1. En-tête compact (collant)**
- Logo « Wagoo » à gauche.
- Une **puce de localisation** : « 📍 Autour de Talant · Dijon ▾ ». Au toucher, elle ouvre le choix : « Ma position », « Une autre ville », avec un champ de recherche.
- Une **puce de date** : « Aujourd'hui ▾ », avec les options Aujourd'hui, Demain, Ce week-end, Choisir une date.

**2. Rangée de filtres (défilement horizontal)**
- Puces : « Tout », puis les 5 catégories (icône + libellé). Plusieurs choix possibles. Une puce active prend son fond `cat-*-soft` et sa couleur `cat-*-foreground`.
- À droite, un bouton « Filtres » avec un badge indiquant le nombre de filtres actifs. Il ouvre une feuille (bottom sheet) avec :
  - **Rayon autour de moi** : 1 km, 2 km, 5 km, 10 km ;
  - **Temps de train maximum** : 30 min, 1 h, 2 h, 3 h ;
  - **Faisable dans la journée** (interrupteur) ;
  - **Adapté aux poussettes** (option future, affichée grisée « bientôt »).

**3. Carte interactive (environ 40 % de la hauteur)**
- La position de l'utilisateur, sous forme d'un point pulsant (`animate-pulse-dot`).
- La gare la plus proche, en épingle `primary`.
- Les lieux proches, en épingles colorées selon leur catégorie, avec leur icône.
- Au toucher d'une épingle : une mini-fiche flottante (nom, catégorie, distance à pied).
- Un bouton « Recentrer » et une bascule « Liste / Carte plein écran ».

**4. Panneau des résultats (bottom sheet déplaçable, par-dessus la carte)**

Il contient trois sections dans cet ordre :

**a) Bandeau « Votre gare »**
> 🚉 **Dijon-Ville** · 12 min à vélo · 6 km
> Prochain départ direct : **10:12** → Beaune
> [Changer de gare]

**b) « À deux pas de vous »** : lieux accessibles à pied, en cartes horizontales qu'on fait défiler.
Chaque carte affiche une photo (ou une illustration de la catégorie s'il n'y a pas de photo), le nom, la puce de catégorie et la durée à pied (« 🚶 8 min · 650 m »).

**c) « En train direct depuis Dijon-Ville »** : c'est le cœur de l'écran. Des cartes de destination empilées verticalement, triées par temps de trajet :

```
┌───────────────────────────────────────────────┐
│ Beaune                            ⏱ 22 min     │
│ 🚆 18 trains/jour · 1er 07:05 · retour 21:40   │
│ [🎡 3] [🌳 5] [🏰 7] [🎭 2]                     │
│ ✓ Faisable dans la journée   🌱 −2,6 kg CO₂    │
│ Prochain : 10:12 → 10:34      ≈ 8–12 €         │
│                          [ Voir la sortie → ]  │
└───────────────────────────────────────────────┘
```

- Les compteurs par catégorie ne s'affichent que pour les catégories sélectionnées, avec l'icône et la couleur de chacune.
- Le prix porte toujours la mention « ≈ » ou « estimé ».
- Le bouton « Voir la sortie » utilise `action`.

**5. Fiche destination** (ouverte au toucher d'une carte, en bottom sheet plein écran sur mobile)
- **En-tête** : nom de la ville, durée, sélecteur de date, bouton de partage.
- **Onglets** : `Lieux` · `Trains` · `Sur place`.
  - **Lieux** : liste des lieux autour de la gare d'arrivée, filtrée et regroupée par catégorie. Chaque ligne indique le nom, la durée à pied, une description courte, les horaires d'ouverture si connus, et un badge « Qualité Tourisme » si applicable. Une mini-carte en haut.
  - **Trains** : deux colonnes, « Aller » et « Retour ». Chaque ligne montre l'heure de départ, l'heure d'arrivée, la durée et le type de train (TER, Intercités, TGV). Le **dernier retour** est mis en évidence. Un emplacement est prévu pour le statut temps réel (« À l'heure », « +5 min », « Supprimé »).
  - **Sur place** : liste des transports urbains proches de la gare (`transit`). Arrêts de bus et tram avec les numéros de ligne, stations de vélos et trottinettes avec leur distance à pied. C'est une liste informative, simple.
- **Pied collant** : bloc `eco` avec « 🌱 Vous économisez 5,2 kg de CO₂ par rapport à la voiture », prix estimé, et **bouton principal `action`** « Acheter mon billet » (lien externe).

**6. Navigation basse**
Trois onglets : **Explorer** (actif), **Mes sorties** (favoris, marqué « bientôt »), **À propos** (sources et licences).

### États à dessiner (obligatoire)
1. **Chargement** : squelettes des cartes et message « On cherche ce qu'il y a autour de vous… ».
2. **Localisation refusée** : écran d'accueil avec un grand champ « Dans quelle ville êtes-vous ? » et des suggestions (Dijon, Besançon, Beaune).
3. **Aucun résultat** : message utile avec une action (« Élargir à 1 h de train »).
4. **Hors ligne** : bandeau discret « Vous êtes hors ligne : voici vos dernières recherches ».
5. **Mode sombre** de l'écran principal.

### Version desktop (1440 × 900)
- Panneau gauche de 440 px : en-tête, filtres et liste des résultats.
- Carte à droite, sur toute la hauteur.
- Fiche destination en panneau latéral de 480 px qui s'ouvre par-dessus la carte.

### Données d'exemple (région Bourgogne-Franche-Comté)
Ce sont des données d'illustration pour la maquette, pas des horaires réels.
- **Position** : Talant, près de Dijon. **Gare** : Dijon-Ville.
- **À deux pas** : Jardin de l'Arquebuse (parcs), Musée des Beaux-Arts de Dijon (patrimoine), Parc de la Colombière (parcs, aire de jeux), Lac Kir (nature).
- **En train direct** : Beaune (22 min), Nuits-Saint-Georges (15 min), Dole (30 min), Montbard (45 min), Besançon (1 h 05), Mâcon (1 h 10).
- **Lieux à Beaune** : Hospices de Beaune (patrimoine, 12 min à pied), Parc de la Bouzaise (parcs et enfants, 15 min à pied).
- **Sur place à Beaune** : ligne de bus urbaine, station de vélos près de la gare.

---

## Écran 2 : page « L'âme du produit » (présentation)

C'est une page de présentation, accessible depuis « À propos ». Elle sert aussi de support pour la soutenance. Même design system, même ton, narration verticale, mobile et desktop.

### Sections et textes (à utiliser tels quels)

**1. Accroche (hero)**
Titre : **« Trouvez votre sortie en 30 secondes. Allez-y en train. »**
Sous-titre : « Une seule application. Vous l'ouvrez, tout est déjà là. »
Bouton `action` : « Ouvrir l'application ». Visuel : un téléphone qui montre l'écran Explorer.

**2. Le constat**
« Vous êtes parent. Vous voulez organiser une sortie, un week-end en famille, ou même une semaine de vacances. Et pour une fois, vous aimeriez laisser la voiture au garage : les bouchons, le parking, l'essence, la fatigue au volant, les enfants qui s'impatientent à l'arrière.
Alors vous cherchez. Un site pour les châteaux. Un autre pour les aires de jeux. Un autre pour la nature. Puis les horaires de train. Puis les bus sur place. **Chaque site ne répond qu'à une seule question.**
Et le pire : **vous ne savez même pas ce qui existe**, ni près de chez vous, ni ailleurs.
Résultat : une à deux heures perdues, du stress… et on reprend la voiture. »

Visuel : une pile d'onglets de navigateur éparpillés (Châteaux, Aires de jeux, Nature, Horaires, Bus…) qui se rassemblent en un seul écran.

**3. Pourquoi c'est important** : trois grandes cartes de chiffres.
- **69 %** : « Dans le tourisme, 69 % de la pollution vient des transports. Et le premier coupable, c'est la voiture : plus de la moitié de ces émissions. » (source : ADEME)
- **14 kg / 2,8 kg / 0,3 kg** : « Pour 100 km : environ 14 kg de CO₂ en voiture, moins de 3 kg en TER, moins de 0,5 kg en TGV. » Sous forme de trois barres comparatives. (source : ADEME, Impact CO2)
- **10 / jour** : « Sur les routes françaises, c'est près de 10 morts par jour. Le train est l'un des moyens de transport les plus sûrs. » (source : ONISR 2025)

Phrase de conclusion, en grand : **« Le train existe. Ce qui manque, c'est l'information. »**

**4. Notre solution, en 3 étapes**, chacune avec une capture d'écran de l'application :
1. **Autour de vous, tout de suite.** « L'app vous localise et affiche les sorties, les lieux à visiter et les trains disponibles près de vous. »
2. **Vous choisissez en un geste.** « Une distance, une autre ville, et vos envies : enfants, nature, patrimoine, espaces verts. »
3. **Vous avez tout.** « Le train aller et retour, ce qu'on peut visiter à pied depuis la gare, les bus, trams et vélos sur place, un prix estimé et le CO₂ économisé. »

Conclusion : « **En 30 secondes, vous savez quoi faire et comment y aller.** Il ne reste plus qu'à acheter votre billet. »

**5. Pour qui ?** : quatre cartes de personas, illustrées de façon simple et inclusive.
La famille · Le célibataire qui veut s'évader · Le touriste perdu dans une ville inconnue · Celui qui prépare un séjour loin de chez lui.

**6. Ce que ça change** : quatre bénéfices, chacun avec une icône.
- **Moins de stress** : deux heures deviennent trente secondes.
- **Plus de découvertes** : des lieux que vous ne soupçonniez pas.
- **Moins de pollution et plus de sécurité** à chaque trajet.
- **Des territoires plus visités**, sans voitures en plus.

**7. Conclusion**
« **Wagoo : trouvez votre sortie en 30 secondes, allez-y en train.** » + bouton `action` « Ouvrir l'application ».

**8. Pied de page**
Sources des données (SNCF, DATAtourisme, OpenStreetMap, transport.data.gouv.fr, ADEME, ONISR) et mention : « Projet réalisé dans le cadre du défi « Tourisme en train » de data.gouv.fr ».

---

## Livrables attendus
1. Écran **Explorer** en mobile, avec ses 5 états et la fiche destination (3 onglets).
2. Écran **Explorer** en desktop.
3. Page **« L'âme du produit »** en mobile et en desktop.
4. Une **planche de composants** : puce de catégorie (active, inactive), carte de lieu, carte de destination, ligne de train, ligne de transport urbain, bloc CO₂, boutons (principal, secondaire, fantôme), épingles de carte, bottom sheet.
5. La liste des **tokens ajoutés** au fichier `globals.css`, s'il y en a.
