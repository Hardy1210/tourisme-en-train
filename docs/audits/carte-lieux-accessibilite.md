# Audit — Tous les lieux sur la carte, accès à pied et à vélo

> **Version** 1.0 · **Date** 13/11/2026 · **Statut :** audit, aucune décision prise (D090)
> **Dépend de :** `03-base-de-donnees.md`, `04-traitement-donnees.md` § 4.6, `05-api.md`, `06-interface.md`, D043, D056, D057, D088, D089
> **Utilisé par :** la nouvelle partie c2 de la carte v6 (à décider par Hardy)
> Chiffres mesurés le 13/11/2026 sur la base locale (mêmes données que la production 0.1.0), requêtes en lecture seule. Ce qui n'a pas été mesuré est dit.

---

## 0. En bref (pour Hardy)

- **Les lieux éloignés sont déjà en base.** L'import ne les écarte pas : il n'écarte que ce qui est hors de la région. C'est **l'affichage** qui les cache, parce qu'un lieu n'est montré que s'il est relié à une gare à 1,5 km à pied.
- **81 % des lieux sont cachés aujourd'hui** : 8 678 sur 10 749. Le château de Mâlain en fait partie.
- **Tout montrer est techniquement facile** : toute la région, c'est environ 10 700 points. MapLibre sait les regrouper en bulles qui se divisent au zoom, et la base répond en 17 ms pour la zone de Dijon.
- **Ce que verrait l'utilisateur :**
  - de loin, des bulles « 48 » qui se divisent en zoomant, puis les icônes ;
  - autour de la gare choisie, deux cercles discrets, « ≈ 20 min à pied » et « ≈ 20 min à vélo » ;
  - chaque lieu dit comment y aller : « 12 min à pied », « 4 km · 15 min à vélo », « 9 km de la gare · bus ou voiture ».
- **Rien n'est caché**, mais tout n'est pas mis au même niveau. Un filtre « Accès depuis la gare » permet de revenir à « à pied ».
- **Le vrai risque, c'est la qualité, pas la technique.** 2 091 aires de jeux, dont 1 574 à plus de 2 km d'une gare, envahiraient la carte. Il faut une règle de tri (§ 2.3).

---

## 1. Ce que dit le code aujourd'hui

| Où | Ce qui se passe |
|---|---|
| `etl/src/sources/` (OSM par Overpass, zone `admin_level=4` de la région ; DATAtourisme : CSV régional) | Import des lieux de la région seulement |
| `etl/src/chargement/lieux.ts` | Commune par contour : **hors région = écarté** (seul écart géographique de l'import) |
| `etl/src/transformations/categories.ts`, `noms-exclus.ts`, `regles/` | Écarte ce qui n'est pas une sortie (règles par catégorie, noms exclus) : **aucune distance** |
| `etl/src/transformations/rattachements.sql` | Doublons → sites → **`lieu_gare` : seulement les lieux à ≤ `rayons.lieuxGareM` (1 500 m) à pied** d'une gare → `gare_stats` |
| Distance à pied | **À vol d'oiseau × `marche.coefDetour` (1,3)** ; durée = distance / `marche.vitesseKmH` (4,5 km/h). Le coefficient de détour existe déjà. `velo` (15 km/h, × 1,3) aussi, dans `parametres.json` |
| `/api/destinations/[uic]/lieux` (`useLieuxGare`) | Lieux de `lieu_gare` : plafond 1 500 m, **c'est lui qui cache** |
| `/api/lieux` (onglet Lieux, D056) | Lieux de `lieu_gare` des gares atteintes en train direct : même plafond |
| `/api/autour` (« Près de vous ») | Lieux autour d'un point, rayon jusqu'à 10 km (`autourDeMoiOptionsM`) : **pas limité par les gares** |
| `gare_stats` (bulles de D088, cartes de destination) | Nombres calculés sur `lieu_gare` : 1 500 m |
| Carte (`features/carte/ui/marqueurs-carte.tsx`) | Lieux en **marqueurs HTML** (un composant React par lieu) au-delà du zoom 10,5 : bien pour quelques dizaines, **impossible pour des milliers** |
| Base | Index spatial `lieu_geom_index` (GiST) présent ; `gare_geom_index` présent |

**Conclusion A.2 :** les lieux éloignés ne sont **jamais écartés à l'import**, seulement à l'affichage. On ne gagnerait **rien** en important davantage pour la Bourgogne-Franche-Comté : tout est déjà là.

---

## 2. Les données (A)

### 2.1 Combien

Lieux visibles = ni doublon (968), ni membre d'un site (525), sur 12 242 en base.

| Source | Catégorie | Total | Reliés à une gare (≤ 1,5 km) | Cachés |
|---|---|---|---|---|
| DATAtourisme | culture | 56 | 22 | 34 |
| | enfants | 397 | 65 | 332 |
| | nature | 793 | 86 | 707 |
| | parcs | 193 | 64 | 129 |
| | patrimoine | 2 492 | 476 | 2 016 |
| | **sous-total** | **3 931** | **713** | **3 218** |
| OpenStreetMap | culture | 212 | 84 | 128 |
| | enfants | 2 065 | 371 | 1 694 |
| | nature | 513 | 19 | 494 |
| | parcs | 768 | 229 | 539 |
| | patrimoine | 3 260 | 655 | 2 605 |
| | **sous-total** | **6 818** | **1 358** | **5 460** |
| **Total** | | **10 749** | **2 071 (19 %)** | **8 678 (81 %)** |

### 2.2 À quelle distance d'une gare

Distance à pied estimée (vol d'oiseau × 1,3) jusqu'à la **gare desservie la plus proche** (386 gares ont au moins un passage, sur 2 792 en base).

| Tranche | Lieux | Patrimoine | Nature | Enfants | Parcs | Culture | Cumul |
|---|---|---|---|---|---|---|---|
| ≤ 1,5 km (≈ 20 min à pied) | 2 085 | 1 145 | 105 | 436 | 293 | 106 | 19 % |
| 1,5 – 2 km | 502 | 212 | 34 | 165 | 66 | 25 | 24 % |
| 2 – 4 km | 1 333 | 457 | 138 | 480 | 209 | 49 | 36 % |
| 4 – 6 km | 938 | 424 | 140 | 274 | 80 | 20 | 45 % |
| 6 – 10 km | 1 488 | 783 | 227 | 361 | 99 | 18 | 59 % |
| > 10 km | 4 403 | 2 731 | 662 | 746 | 214 | 50 | 100 % |

- Médiane : **7,2 km** ; maximum : 50 km.
- **41 % des lieux sont à plus de 10 km d'une gare**, surtout du patrimoine et de la nature rurale. Pour une application de train, ceux-là demandent un bus ou une voiture.
- À 6 km ou moins d'une gare, il y a **4 858 lieux** (7 747 paires lieu–gare, calculées en 98 ms).

### 2.3 Le tri de qualité tient-il ?

Pas tel quel. Aujourd'hui, la règle D057 réserve les « piscines ordinaires et aires de jeux sans nom propre » à « Près de vous » et à la fiche : elles ne sont pas mises en avant dans l'onglet Lieux. Avec toute la région, voici les sous-catégories les plus nombreuses.

| Sous-catégorie | Lieux | À plus de 2 km | Avec description |
|---|---|---|---|
| aire de jeux | 2 091 | 1 574 | 55 |
| monument historique | 1 603 | 1 145 | 40 |
| château | 829 | 757 | 109 |
| parc | 657 | 405 | 4 |
| église | 610 | 527 | 330 |
| point de vue | 567 | 533 | 160 |
| musée | 467 | 300 | 284 |
| ruines | 241 | 215 | 6 |

- **Risque principal : les aires de jeux de village.** Elles feraient 1 lieu sur 5 de la carte, et ne valent pas un trajet en train si elles sont loin de la gare.
- **À trancher (Hardy)** : au-delà du périmètre à pied, n'afficher que les lieux qui « valent le trajet ». Par exemple : écarter les aires de jeux et les piscines ordinaires (règle D057 étendue), garder le reste. On peut aussi faire passer en premier ce qui a une description, une photo ou le label Qualité Tourisme. Ce n'est pas mesuré plus finement : il faudra relire un échantillon, comme pour D061.
- Signaux d'intérêt disponibles : description (1 937 sur 8 162 lieux à plus de 2 km), label Qualité Tourisme (28), source DATAtourisme (3 056), photo (126 lieux seulement, D041). **Il n'existe pas de note d'importance.**

### 2.4 Distance et temps pour chaque lieu

- **Oui, tout est calculable** : chaque lieu a un point (`lieu.geom`), chaque gare aussi, et les vitesses existent (`marche`, `velo` dans `parametres.json`).
- Les distances sont **à vol d'oiseau × 1,3** : c'est déjà un coefficient de détour. Le temps affiché reste une **estimation**, à présenter comme telle (« ≈ »).
- Seuils proposés, en **nouveaux paramètres** à créer, `acces.piedMaxM` et `acces.veloMaxM` :
  - **à pied ≤ 1 500 m** (aujourd'hui) **ou 2 000 m** (≈ 27 min). 2 000 m ajoutent 502 lieux. Mâlain (2 178 m) n'y entre toujours pas, mais il apparaîtrait « à vélo ».
  - **à vélo ≤ 6 000 m** : environ 24 min à 15 km/h. Au total, 4 858 lieux à pied ou à vélo.
  - **au-delà : « bus ou voiture »**, avec la distance et un lien d'itinéraire.

---

## 3. L'API et la base (B)

| Besoin | Existe ? | Mesure |
|---|---|---|
| Lieux d'une zone rectangulaire (zone affichée) | Non (`/api/autour` = cercle autour d'un point) | Zone de Dijon au zoom ~10 (≈ 45 × 30 km) : **821 lieux, 17 ms** (index GiST utilisé) |
| Tous les lieux de la région, version légère (clé, nom, catégorie, position, accès) | Non | 10 692 lieux ; **≈ 1 Mo de JSON brut estimé** (somme des champs) ; taille compressée **non mesurée** |
| Distance à la gare la plus proche, sans plafond | Non (`lieu_gare` plafonné à 1,5 km) | Calcul de la gare desservie la plus proche pour tous les lieux : **1,07 s** (à l'import, une fois) |
| Toutes les gares à 6 km ou moins d'un lieu | Non | 7 747 paires, **98 ms** |
| Index spatiaux | Oui : `lieu_geom_index`, `gare_geom_index` | Rien à ajouter pour ces requêtes |

**Ce qui manque :**
1. Un rattachement **sans plafond à pied**. Il faudrait **étendre `lieu_gare`** jusqu'au seuil vélo (≈ 7 700 lignes au lieu de ≈ 2 100), avec un niveau d'accès. Une **migration** est nécessaire (règle 10).
2. Une route **« lieux pour la carte »** : soit toute la région d'un coup (option 1), soit par zone affichée (option 2).

---

## 4. La carte (C)

**MapLibre GL 5.24 et react-map-gl 8.1 dans le dépôt.** Le regroupement natif existe dans cette version : source GeoJSON avec `cluster: true`, `clusterRadius`, `clusterMaxZoom`, `clusterProperties`, et `getClusterExpansionZoom` pour zoomer sur une bulle touchée. Il repose sur supercluster, qui est fait pour des centaines de milliers de points. 10 700 points restent donc petits pour lui. Les **performances sur iPhone n'ont pas été mesurées**.

Ce que ça change dans notre carte :
1. **Les lieux quittent les marqueurs HTML** pour des **couches MapLibre** : bulles = cercles avec un nombre, lieux = symboles. Les icônes de catégorie, aujourd'hui des composants React (lucide), doivent devenir des **images enregistrées dans la carte** (`addImage`). C'est la plus grosse partie du travail.
2. **Filtre par catégories :** les filtres de couche ne s'appliquent pas aux bulles. Il faut **filtrer les données** de la source (`setData`) à chaque changement de catégorie. Sur ~10 700 points côté navigateur, le coût n'est pas mesuré, mais il est attendu faible.
3. **Réglages proposés en paramètres** (`carte.regroupement.rayonPx`, `zoomMax`) : `clusterRadius` ≈ 50 px, `clusterMaxZoom` ≈ `zoomMinLieux` (10,5) pour que les icônes apparaissent au même zoom qu'aujourd'hui. À régler à l'œil sur iPhone.
4. **Bulles par gare (D088) et bulles géographiques : deux bulles avec des nombres, c'est confus.** Je recommande que **les bulles géographiques remplacent les bulles par gare**. Le nombre par gare passe dans la mini-fiche et la carte de destination (« 17 à pied · 31 à vélo »). Les points des gares ne changent pas. **À trancher par Hardy.**
5. **Cercles « ≈ 20 min à pied / à vélo »** : un polygone GeoJSON par cercle, autour de la gare au centre (départ, destination choisie ou gare touchée). C'est simple. Un vrai périmètre qui suit les rues (isochrone) est au § 6.

---

## 5. L'interface au-delà de la carte (D)

| Endroit | Changement |
|---|---|
| **Mini-fiche d'un lieu** | « 4,2 km de la gare de Beaune · ≈ 15 min à vélo » ; au-delà : « 9 km de la gare · bus ou voiture » + lien d'itinéraire |
| **Mini-fiche d'une gare** | « 17 lieux à pied · 31 à vélo » (remplace la bulle si elle disparaît) |
| **Fiche lieu** | La même ligne d'accès ; lien « Itinéraire » vers Google Maps (`https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&travelmode=transit`, sans clé : un lien, pas un appel d'API, la règle 9 est respectée) |
| **« Près de la gare de X »** (c1, D089) | Les lieux à pied d'abord, puis un groupe « Un peu plus loin · à vélo ». Au-delà du vélo : pas dans cette section, seulement sur la carte |
| **« Près de vous »** | Inchangée : elle suit déjà « Distance autour de vous », jusqu'à 10 km |
| **Cartes de destination** | « 17 à pied · 31 à vélo » au lieu des seuls nombres à pied |
| **Onglet Lieux** (D056) | Aujourd'hui : lieux à pied des gares atteintes. Avec le filtre « Accès » : à pied, puis à vélo. Tri : temps total train + accès |
| **Onglet Lieux de la fiche destination** | Comme « Près de la gare de X » |
| **« Filtres »** | Nouveau : « Accès depuis la gare : À pied · À pied ou à vélo · Tout ». **Valeur par défaut proposée : « À pied ou à vélo »**. Elle fait passer de 2 085 à 4 858 lieux sans demander de voiture ; « Tout » ajoute 5 891 lieux surtout ruraux. La carte, elle, peut montrer « ce qui existe » en couche de fond. En mode destination (D089), ce filtre reste visible : il s'applique encore |

**Gare de référence d'un lieu** (question à trancher) :
- **la plus proche** : calculée une fois à l'import. Simple, mais c'est parfois une gare sans train direct depuis ton départ ;
- **la plus proche atteinte en train direct depuis ton départ** : c'est la bonne réponse pour l'utilisateur. Coût : garder **toutes** les gares à 6 km ou moins de chaque lieu (≈ 7 700 lignes, déjà mesuré), puis choisir à la requête, comme le fait déjà l'onglet Lieux (« par la plus rapide », D056). **Recommandée** : le surcoût est faible, et le calcul existe déjà dans l'onglet Lieux.

---

## 6. Faisabilité et contraintes (E)

- **Licences :** aucune donnée nouvelle. On réutilise DATAtourisme (Licence Ouverte) et OSM (ODbL), déjà cités dans « Sources ». Le lien Google Maps est un lien sortant, pas une réutilisation de données.
- **Volume et chargement :** toute la région en une réponse légère, ≈ 1 Mo brut (compression non mesurée). Mise en cache (`cache.donneesStablesS`), elle est utilisable hors ligne (PWA). Pour une extension nationale, il faudra passer par zone affichée (option 2).
- **Vélo à bord des TER Mobigo** (source officielle TER BFC) : gratuit dans la limite des places. **Réservation gratuite obligatoire** sur Paris–Dijon–Lyon ; 1 € les week-ends et jours fériés sur Rémi Express (n° 5900 à 5925). Vélos pliants et démontés en housse acceptés sans réservation ; tandem, vélo-cargo, remorque et vélo couché refusés. La page ne donne pas de date de mise à jour : à recopier dans l'application avec la mention « à vérifier avant de partir », et le lien. Source : [TER BFC — voyager avec son vélo](https://www.ter.sncf.com/bourgogne-franche-comte/services-contacts/ter-velo/voyager-avec-son-velo).
- **Vélos en libre-service :** `mobilite_locale` a déjà des stations de type `VELO` (GBFS). On peut ajouter « vélos en libre-service près de la gare » dans le cercle vélo, sans nouvelle donnée.
- **Isochrones** (vrai périmètre qui suit les rues) : il faut un moteur d'itinéraire. Deux façons :
  - un service hébergé (openrouteservice : clé et quotas) ;
  - un moteur installé chez nous (Valhalla ou OSRM en Docker, sur l'extrait OSM de la région), avec le calcul des isochrones des 386 gares à l'import, une seule fois.

  Dans les deux cas, ce sont plusieurs jours de travail et un service de plus pour la soutenance (règle 11). **Le cercle est une étape acceptable**, présenté comme « ≈ ». Les isochrones viendront après la soutenance (déjà reportées dans nos documents).
- **Calendrier :** le P0 est attendu le 22/11 et le gel le 27/11. La recommandation (§ 7) tient en 4 à 5 PR. Le reste passe après le gel ou après la soutenance.

---

## 7. Options

| | Option 1 — Tout, regroupé, avec l'accès (recommandée) | Option 2 — Par zone affichée | Option 3 — Seulement élargir le périmètre |
|---|---|---|---|
| Ce que voit l'utilisateur | Tous les lieux de la région en bulles qui se divisent, puis icônes ; accès à pied / vélo / bus sur chaque lieu ; cercles autour de la gare | Pareil, mais les bulles se recalculent quand on déplace la carte | Plus de lieux à pied (ex. 2 km : + 502), le reste toujours caché |
| Données | Une réponse légère, toute la région, en cache, hors ligne | Une requête à chaque déplacement (17 ms en base) | Une ligne de paramètre + relancer `rattachements` |
| Avantages | Simple, rapide une fois chargé, marche hors ligne, bulles stables | Tient pour la France entière | Aucun code |
| Risques | ≈ 1 Mo au premier chargement (compression non mesurée) ; perf iPhone non mesurée | Bulles qui « sautent » au bord de l'écran, plus de requêtes, pas hors ligne | Ne règle pas le problème (Mâlain toujours caché à 2 km) |
| Coût | 4 à 5 PR | Option 1 + une route par zone | Une petite PR |

**Recommandation :** **option 1** pour la région pilote. L'option 2 n'est utile que pour l'extension nationale, après la soutenance. L'option 3 est écartée, comme le dit D090.

---

## 8. Découpage en PR (une PR = un sujet, D080)

1. **Données — accès de chaque lieu** : nouveaux paramètres `acces.piedMaxM`, `acces.veloMaxM` (`parametres.json` + schéma) ; `lieu_gare` étendu jusqu'au seuil vélo, avec la distance, la durée à pied et la durée à vélo (migration + `rattachements.sql`) ; `gare_stats` avec les nombres à pied et à vélo ; règle de qualité au-delà du périmètre à pied (§ 2.3). Contrôle : compter et échantillonner en base.
2. **API — lieux pour la carte** : route légère de toute la région (clé, nom, catégorie, position, gare la plus proche, distance, niveau), mise en cache ; documentée dans `05-api.md`.
3. **Carte — regroupement** : source GeoJSON regroupée, couches bulles et icônes (images de catégorie dans la carte), toucher une bulle = zoomer, toucher une icône = mini-fiche, catégories qui filtrent les données ; décision sur les bulles par gare (D088). Essai sur iPhone avant les tests.
4. **Accès affiché** : mini-fiche et fiche lieu (« 4,2 km · ≈ 15 min à vélo », « bus ou voiture » + lien d'itinéraire) ; cartes de destination « 17 à pied · 31 à vélo » ; cercles « ≈ 20 min à pied / à vélo » autour de la gare au centre.
5. **Filtre « Accès depuis la gare »** et listes groupées (« Près de la gare de X », onglet Lieux) ; gare de référence atteinte en train direct.
6. *(Après la soutenance)* isochrones ; route par zone pour la France ; règles du vélo à bord dans l'application.

---

## 9. Décisions à prendre (Hardy)

1. **Rayon à pied** : 1,5 km (aujourd'hui) ou 2 km ?
2. **Rayon à vélo** : 6 km (≈ 24 min) proposé ; plus, ou moins ?
3. **Vitesses** : 4,5 km/h à pied et 15 km/h à vélo (déjà dans `parametres.json`) : on les garde ?
4. **Bulles par gare (D088)** : les remplacer par les bulles géographiques (recommandé), ou garder les deux ?
5. **Tri de qualité au-delà du périmètre à pied** : écarter les aires de jeux et les piscines ordinaires (recommandé), autre chose ?
6. **Valeur par défaut du filtre « Accès »** : « À pied ou à vélo » (recommandé), « À pied » ou « Tout » ?
7. **Gare de référence** : la plus proche atteinte en train direct depuis le départ (recommandé), ou simplement la plus proche ?
8. **Lieux au-delà du vélo** : sur la carte seulement (recommandé), ou aussi dans les listes ?
9. **Ordre et calendrier** : PR 1 à 3 avant le gel du 27/11, puis 4 et 5 si le temps le permet ?

---

## Références

- MapLibre GL JS, regroupements : <https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/>, <https://maplibre.org/maplibre-gl-js/docs/examples/display-html-clusters-with-custom-properties/>
- supercluster : <https://github.com/mapbox/supercluster>
- Isochrones : openrouteservice <https://openrouteservice.org>, Valhalla <https://github.com/valhalla/valhalla>, OSRM <https://project-osrm.org>
- Liens d'itinéraire Google Maps (sans clé) : <https://developers.google.com/maps/documentation/urls>
- Vélo à bord TER BFC : <https://www.ter.sncf.com/bourgogne-franche-comte/services-contacts/ter-velo/voyager-avec-son-velo>
- Ces pages de référence n'ont pas été relues pendant cet audit, sauf la page TER BFC. Les fonctions MapLibre citées sont celles de la version 5 du dépôt.

## Historique

| Date | Version | Modification |
|---|---|---|
| 13/11/2026 | 1.0 | Création (D090) |
