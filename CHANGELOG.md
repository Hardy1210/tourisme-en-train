# Journal des versions

> **Rôle :** la liste des nouveautés **visibles**, version par version, écrite pour un utilisateur ou un financeur, pas pour un développeur. Le pourquoi technique est dans `docs/DECISIONS.md`, le détail des sessions dans `docs/JOURNAL.md`.
> **Règle (D080) :** chaque pull request qui change ce que voit ou vit l'utilisateur ajoute **une ligne** sous « Non publié ». À chaque mise en ligne, Hardy relit cette rubrique, choisit le numéro, et la rubrique devient une version datée.
> **Numéros :** MAJEUR.MINEUR.CORRECTIF. **0.x** = concept en test ; un **correctif** (0.1.1) répare sans rien ajouter ; un **mineur** (0.2.0) ajoute des fonctionnalités ; **1.0.0** = le jour du premier client (Région ou autre).
> **Rubriques :** Ajouté · Modifié · Corrigé · Retiré.

## [Non publié]

### Ajouté
- Recherche de destination : en haut d'Explorer, « Autour de Dijon → Où aller ? » : touchez « Où aller ? » pour chercher. Tapez « beau » ou « besancon », et la liste comme la carte ne montrent plus que ces destinations, sans changer la gare de départ. Sur téléphone, départ et destination se choisissent dans une page plein écran, clavier prêt, avec les destinations les plus proches en train.
- Lieux, sur téléphone : « Autour de… » ouvre une page plein écran, clavier prêt, pour choisir sa position, une gare proche ou une autre ville, comme dans Explorer.
- Dans les feuilles de recherche, un trait fin sur le côté signale qu'il reste des résultats plus bas, cachés par le clavier.
- Sur la carte d'Explorer, chaque gare de destination affiche dans une bulle le nombre de lieux à voir à pied depuis la gare, recompté selon les catégories choisies. Touchez une gare : le détail par catégorie s'affiche.
- Position refusée : un guide « Comment autoriser la localisation ? » donne les étapes exactes pour iPhone, Android ou ordinateur. Il s'ouvre tout seul si la position est encore bloquée.

### Modifié
- La carte d'Explorer s'ouvre plus près de votre gare (depuis Dijon, de Mâlain à Genlis). Choisir une destination centre la carte sur sa gare ; effacer la recherche ramène aux environs de votre gare.
- En haut d'Explorer et de Lieux, sur téléphone, il ne reste que le trajet et les catégories : la date se choisit maintenant dans « Filtres » (« Quand ? »). Si ce n'est pas aujourd'hui, une pastille « Demain ✕ » le rappelle devant les catégories, et la date s'ajoute au titre de la liste.
- Dans la fiche destination, les TER qui partent et arrivent en Bourgogne-Franche-Comté s'appellent « TER Mobigo », comme sur SNCF Connect. Les autres restent « TER ».

### Corrigé
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
