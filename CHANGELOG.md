# Journal des versions

> **Rôle :** la liste des nouveautés **visibles**, version par version, écrite pour un utilisateur ou un financeur, pas pour un développeur. Le pourquoi technique est dans `docs/DECISIONS.md`, le détail des sessions dans `docs/JOURNAL.md`.
> **Règle (D080) :** chaque pull request qui change ce que voit ou vit l'utilisateur ajoute **une ligne** sous « Non publié ». À chaque mise en ligne, Hardy relit cette rubrique, choisit le numéro, et la rubrique devient une version datée.
> **Numéros :** MAJEUR.MINEUR.CORRECTIF. **0.x** = concept en test ; un **correctif** (0.1.1) répare sans rien ajouter ; un **mineur** (0.2.0) ajoute des fonctionnalités ; **1.0.0** = le jour du premier client (Région ou autre).
> **Rubriques :** Ajouté · Modifié · Corrigé · Retiré.

## [Non publié]

### Ajouté
- Dans la page « Trajet », un bouton ⇅ échange le départ et la destination (Beaune → Dijon au lieu de Dijon → Beaune) ; s'il n'y a pas de train direct dans l'autre sens, l'application le dit.
- Dans la page « Trajet », on choisit aussi la date : une ligne dit pour quand on cherche, trois pastilles (Aujourd'hui, Demain, Ce week-end) apparaissent avec la destination, et la ligne ouvre le calendrier. C'est la même date que dans « Filtres ».
- Après le choix du départ, l'accueil montre la gare de départ et le temps pour y aller (« La plus proche de vous », ou « La mieux desservie près de vous »), avec « Changer », un champ « Destination » facultatif et « Voir les sorties ».
- À la première ouverture, un écran de bienvenue explique l'application avant toute demande de position : « Utiliser ma position » (la fenêtre du téléphone n'apparaît qu'à ce moment), une ville ou une gare à taper, ou une grande gare de la région à toucher. Les fois suivantes, on arrive directement sur Explorer, et la position n'est demandée qu'une fois le logo parti.
- Un écran de lancement à chaque ouverture : le logo et « Allez-y en train. Bourgogne-Franche-Comté » sur le fond violet, qui s'efface en fondu pendant que l'application démarre. Sur Android, l'écran de démarrage du téléphone a la même couleur : plus de flash blanc.

### Corrigé
- Une fiche destination restée ouverte après minuit passe d'elle-même de « Demain » à « Aujourd'hui ».
- Sources des données : deux licences trop longues dépassaient de leur carte et la page défilait en largeur sur le téléphone ; elles passent maintenant à la ligne.

### Modifié
- La feuille d'Explorer montre les 10 destinations les plus proches, puis « Voir plus » en ajoute 10 : elle glisse sans à-coup sur l'iPhone, et le nombre total reste affiché.
- Sur le téléphone, la feuille des résultats se glisse avec le doigt n'importe où sur elle et suit le doigt ; lâchée, elle va à la position la plus proche, ou plus loin si on la lance vite.
- La page Lieux montre une rangée par gare où l'on va en train direct, celles qui ont des photos d'abord, puis la plus proche : ses premiers lieux défilent de côté, en grandes photos, et « Voir tout » ouvre la fiche de la destination.
- Sur les cartes, les lieux sont des épingles en forme de goutte dont la pointe tombe sur le lieu ; le lieu touché a une épingle plus grande, pleine.
- Sur la carte, les gares deviennent des icônes de train quand on zoome (de loin, les points colorés restent) ; la destination choisie a un bord jaune ; les bulles du nombre de lieux sont décalées pour ne plus être cachées.
- Avec une destination choisie, la barre en haut d'Explorer passe sur deux lignes : « Départ  Dijon », puis « Arrivée  Beaune ».
- La feuille « Filtres » montre aussi les catégories, avec leurs icônes, dans le même état que sur la carte ; « Réinitialiser » remet à zéro tout ce qu'on y voit, et seulement ça.
- « Dans quelle ville êtes-vous ? » (position refusée ou introuvable) prend le dessin de l'accueil : fond violet, photo, grandes gares en un toucher ; en plein écran dans Explorer, dans la page avec le menu dans Lieux.
- Le logo devient le nom écrit, sa dernière lettre en jaune (provisoire, il changera après la soutenance).
- Sources, À propos et Mentions légales ont le même bouton Retour que les fiches : un rond sombre en haut à gauche, qui reste en place pendant la lecture.
- La fiche d'un lieu prend le nouveau dessin : fond violet, photo en haut découpée en arc bordé de jaune, qui monte jusque derrière l'heure dans l'app installée ; horaires et adresse dans un seul bloc. Le bouton Retour est un rond sombre, exactement au même endroit sur toutes les fiches, et le bas des fiches (« Y aller en train », « Acheter mon billet ») a un haut arrondi.

## [0.5.0] — 20/11/2026

### Ajouté
- La fiche d'un lieu montre la description complète de DATAtourisme, avec ses paragraphes, au lieu d'un court résumé : 3 668 lieux y gagnent, dont 1 390 qui n'en avaient pas. Les textes très longs s'arrêtent à la fin d'une phrase. La source est écrite juste en dessous.
- Les horaires d'un lieu sont écrits en français, une ligne par saison ou par jour (« 16 nov. – 31 mars : 9 h – 12 h, 14 h – 18 h 30 »), au lieu du format technique en anglais ; en haut, un résumé dit les heures du jour (« Aujourd'hui, ven. 20 nov. », puis une plage par ligne), tenu à jour même si la fiche reste ouverte après minuit. 385 lieux sur 399 en profitent ; les autres gardent leur texte d'origine.

### Modifié
- La carte se dessine un peu moins finement sur les écrans très denses (iPhone) : moins de travail pour le téléphone, sans différence visible.
- Les minutes à pied sont précédées de « ≈ », partout, car ce sont des estimations (« ≈ 9 min · 648 m »). La distance d'une gare donnée seule est dite « à vol d'oiseau » (« 2,9 km à vol d'oiseau »).
- La fiche d'une destination passe sur le fond violet de Wagoo. Chaque lieu a sa carte, avec sa photo dans un quart de cercle bordé de jaune (ou l'icône de sa catégorie) et un bouton rond pour le voir sur la carte. Au-delà de 5 lieux, « Voir les N autres » déplie la catégorie. Sur la mini-carte, le lieu choisi s'affiche dans une pilule qui ouvre sa fiche.

## [0.4.0] — 18/11/2026

### Ajouté
- Des photos pour plus de 3 300 lieux (4 sur 10 près des gares), prises sur Wikimedia (Wikipédia, Wikidata, Commons) puis sur DATAtourisme : sur la fiche du lieu, sur les cartes de lieux et dans la mini-fiche de la carte. L'auteur et la licence de chaque photo sont toujours indiqués (une ligne sous la photo de la fiche, une icône ⓘ sur les cartes). Si une photo tarde à venir, l'icône de la catégorie reste à sa place.

### Modifié
- Dans « Près de vous », « Près de la gare de… » et l'écran Lieux, les lieux avec une photo s'affichent en premier ; dans chaque groupe, l'ordre reste le même (les plus proches, ou le trajet le plus court).

## [0.3.1] — 17/11/2026

### Corrigé
- « Votre gare » suit la même règle quand une gare plus proche existe : plus de « 50 min à pied » à 2,9 km. Le temps à vélo s'affiche si la gare a un parking vélo, sinon la distance ; la phrase « Gare la plus proche : … » suit la même règle.

## [0.3.0] — 17/11/2026

### Ajouté
- Dans la liste des gares proches et sur la carte « Votre gare », une gare avec un parking vélo juste devant affiche le temps à vélo pour y aller, avec la distance en dessous et « Parking vélo à la gare » sous son nom. Les autres gardent le temps à pied ou la distance.
- Un lien « Voir l’itinéraire » avec la gare pour destination : sur iPhone, il propose d’ouvrir Plans ou Google Maps ; ailleurs, il ouvre Google Maps. Il apparaît aussi quand vous choisissez votre gare vous-même, ou sans avoir partagé votre position : l’application de cartes du téléphone part de là où vous êtes.

### Modifié
- Plus de temps à vélo sans preuve pour aller à sa gare : la durée à pied si la gare est proche ; plus loin, le temps à vélo seulement si la gare a un parking vélo ; sinon la distance. Même règle dans « Votre gare » et dans les listes de gares proches.

### Corrigé
- Sécurité : Next.js passe en 16.4.5, qui corrige 7 failles publiées le 03/11 (aucune ne touchait Wagoo, D098).

## [0.2.0] — 16/11/2026

### Ajouté
- La carte d'Explorer montre les lieux à visiter autour de vous (à la distance choisie dans « Filtres ») et autour de chaque gare où vous pouvez aller en train direct : regroupés en bulles avec leur nombre, qui se divisent quand on zoome, jusqu'à l'icône de chaque lieu. Les catégories choisies filtrent la carte.
- Recherche de destination : en haut d'Explorer, « Autour de Dijon → Où aller ? » : touchez « Où aller ? » pour chercher. Tapez « beau » ou « besancon », et la liste comme la carte ne montrent plus que ces destinations, sans changer la gare de départ. Sur téléphone, départ et destination se choisissent dans une page plein écran, clavier prêt, avec les destinations les plus proches en train.
- Lieux, sur téléphone : « Autour de… » ouvre une page plein écran, clavier prêt, pour choisir sa position, une gare proche ou une autre ville, comme dans Explorer.
- Dans les feuilles de recherche, un trait fin sur le côté signale qu'il reste des résultats plus bas, cachés par le clavier.
- Sur la carte d'Explorer, toucher une gare de destination donne le nombre de lieux à voir à pied depuis la gare, recompté selon les catégories choisies, avec le détail par catégorie.
- Position refusée : un guide « Comment autoriser la localisation ? » donne les étapes exactes pour iPhone, Android ou ordinateur. Il s'ouvre tout seul si la position est encore bloquée.

### Modifié
- Un lieu compte comme « à pied » depuis la gare jusqu'à 2 km (au lieu de 1,5 km) : un peu plus de sorties autour de chaque gare. Les piscines n'apparaissent plus, et les aires de jeux seulement à 1 km au plus de la gare ou de votre position.
- « À deux pas de vous » devient « Près de vous », ou « Près de la gare de Beaune » si vous partez d'une autre gare. Quand vous choisissez une destination, cette section passe en bas, après les trains, et montre les lieux à pied autour de sa gare, aussi sur la carte. La carte « Votre gare » donne alors le prochain train vers cette destination, et « Filtres » ne garde que la date. Le filtre « Rayon autour de moi » s'appelle maintenant « Distance autour de vous ».
- La carte d'Explorer s'ouvre plus près de votre gare (depuis Dijon, de Mâlain à Genlis). Choisir une destination centre la carte sur sa gare ; effacer la recherche ramène aux environs de votre gare.
- En haut d'Explorer et de Lieux, sur téléphone, il ne reste que le trajet et les catégories : la date se choisit maintenant dans « Filtres » (« Quand ? »). Si ce n'est pas aujourd'hui, une pastille « Demain ✕ » le rappelle devant les catégories, et la date s'ajoute au titre de la liste.
- Dans la fiche destination, les TER qui partent et arrivent en Bourgogne-Franche-Comté s'appellent « TER Mobigo », comme sur SNCF Connect. Les autres restent « TER ».

### Corrigé
- La carte d'Explorer montre ses bulles bien plus vite : les lieux sont demandés pendant que la carte se charge, et la base les trouve en quelques dizaines de millisecondes au lieu d'environ une seconde.
- Sur la carte, le nombre d'une bulle part en même temps qu'elle quand on zoome, sans retard.
- Sur téléphone, quand le clavier monte dans une page plein écran, l'écran du dessous ne se voit plus, même un instant, à la place du clavier.
- En cherchant une destination, les résultats sont triés par temps de trajet : en tapant « b », Besançon Franche-Comté TGV (26 min) passe avant Paris (1 h 36).
- La recherche de ville ne propose plus que des communes : « Beaune » ne fait plus apparaître des rues ou des hameaux du même nom dans d'autres départements (Sornac, Eymoutiers…). Partir de Paris reste possible.

## [0.1.0] — 07/11/2026

Première mise en ligne, sur `wagoo.hardylino.com` (commit `d1f0206`).

### Ajouté
- Explorer : position de l'utilisateur ou recherche de ville, gare de départ proposée, sorties à pied, destinations en train direct sur une carte et dans une liste, filtres (date, catégories, rayon, durée de train).
- Lieux : toutes les sorties autour, par catégorie.
- Fiche destination : lieux à pied, trains aller et retour, transports sur place, CO₂ économisé, prix estimé, lien vers la billetterie.
- Fiche lieu.
- Pages Sources, À propos et Mentions légales.
- Application installable sur téléphone, utilisable hors ligne pour les écrans déjà vus.
