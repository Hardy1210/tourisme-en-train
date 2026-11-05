# À faire, à valider, reporté

> **Rôle :** un seul endroit pour tout ce qui n'est pas en cours de construction.
> **Règle :** chaque élément dit **quoi**, **pourquoi** il est là, et **ce qui déclenchera** sa réalisation. Un élément réalisé est **supprimé** (sa trace va dans `JOURNAL.md`).
> Mis à jour à chaque « garde le contexte ».

---

## 1. À valider par Hardy

| Quoi | Contexte | Déclencheur |
|---|---|---|
| Relire l'ensemble de la documentation (docs 00 → 08, fiches) | Rédigée le 30/09 | Avant de lancer E00 |
| Variantes de la maquette Explorer : carte avec ~20 destinations, lieu sans description, destination sans prix, trains sans statut, bascule Samedi/Dimanche, station sans nombre de vélos ; retirer le transport à la demande | Décisions D017 → D021 | Avant ~09/11 (E11–E12) |
| Maquettes fiche lieu, feuille Filtres, choix de ville (si non couvertes) — prompts dans `design/prompts-ecrans.md` | — | Avant ~09/11 (E11–E12) |
| Maquettes « L'âme du produit » + Sources | — | Avant ~16/11 (E13) |
| Mettre les captures des maquettes dans `design/maquettes/` et les liens dans `design/README.md` | Trace hors MCP | Dès qu'une maquette est validée |
| **Photos des lieux, après les objectifs principaux (choix de Hardy le 05/11)** : aujourd'hui, 126 lieux sur 12 242 ont une image en base (mesuré le 05/11, `image` et `wikimedia_commons` d'OpenStreetMap, D041), et les cartes montrent l'illustration de catégorie (D067). À étudier : (1) plus de photos Wikimedia par OpenStreetMap ; (2) DATAtourisme juste pour les images : l'API, écartée jusqu'ici (clé, fiche plus lente, rien hors ligne), ou le flux complet de la « plateforme diffuseur » (compte gratuit, adresse à garder secrète, JSON plus lourd). Dans tous les cas : **crédit et licence de chaque photo** à afficher | Le CSV régional n'a aucune photo ; Hardy juge les photos importantes | Objectifs principaux terminés |
| Copie de la page « Audit des gares Wagoo » dans le dépôt (`docs/` ou `design/`) ou seulement dans les Téléchargements | Page explicative mise à jour hors dépôt (prompt donné le 23/10 : table `commune`, codes UIC, schéma des tables) | Quand la page est à jour |
| Licence du code (ex. MIT) | Dépôt public depuis le 07/10 sans licence (« tous droits réservés ») ; décision reportée volontairement | E18 |

| **Badge de label sur la carte de destination** (Plus Beaux Villages, Petites cités de caractère, Art et histoire…) : chercher une liste officielle et vérifier Besançon, absente de DATAtourisme alors qu'elle aurait, de mémoire, le label Art et histoire | DATAtourisme ne couvre que quelques communes (mesure du 04/11, D057) ; laissé de côté par Hardy | Après le P0 (22/11) |

| **Le Klube (Ahuy)** : classé « centre aquatique » sans description, à vérifier | Pourrait être une salle de sport | Prochaine session sur les données |



| **Explorer et fiche destination, à vérifier point par point (E11 et E12 ⏸)** :<br>☐ comparer l'écran aux maquettes `Explorer Mobile v3` et `Explorer Desktop v3`, noter ce qui semble bizarre, puis retoucher<br>☐ étiquettes de carte coupées par les épingles (ex. « Beaune » en 390 px)<br>☐ essai au doigt sur téléphone en HTTPS, surtout la feuille (essayée seulement à la souris)<br>☐ chronomètre sur téléphone : ouverture → liste < 3 s (un essai à 3,4 s sur ordinateur)<br>☐ changement de gare → titre de la nouvelle gare : mesuré de 1,1 à 3,6 s sur ordinateur, à mesurer sur téléphone avant de corriger<br>☐ lisibilité de la carte avec beaucoup de destinations (101 depuis Dijon) et étiquette de la destination sélectionnée<br>☐ fiche destination et fiche lieu : comparer aux maquettes, surtout la hauteur du pied sur mobile et les épingles serrées de la mini-carte<br>☐ tout essayer sur téléphone : onglets, Comparer, Voir sur la carte, billetterie | Hardy préfère juger le design une fois la fiche destination en place : certaines retouches pourraient devenir inutiles. Détail : fiche E11 | Maintenant que E12 est en place ; au plus tard avant le jalon P0 du 22/11 |
| **Autres jeux et escape games classés « enfants » à relire** (Megaloisirs Laser Game, Fug Game, Games Factory, Les Souterrains du Commando Games, La Clé du Bastion, 10 55…) | Règle de D061 : « enfants » seulement si une source le justifie ; la classe `LeisureComplex` seule ne le prouve pas | Avant E12, avec la même méthode de lignes validées |

## 2. Actions humaines de Hardy (comptes, clés, fichiers)

| Quoi | Pour quelle étape | Déclencheur |
|---|---|---|
| Inviter le second membre SR, si l'équipe en compte deux (seul ethan21000 est collaborateur au 09/10) — `equipe/travail-en-equipe.md` § 3.2 | — | Dès que son identifiant GitHub est connu |
| Annoncer aux SR la fusion de E01 : c'est le signal de départ de leur tâche I01 | E01 | À la fusion de E01 |
| **Alerte Dependabot n° 13 (`minimatch`, `CVE-2026-118764`, gravité moyenne) laissée ouverte, choix de Hardy le 05/11 :** déni de service sur les versions 7.0.0 à avant 11.0.1. Nous avons la 10.2.6, dernière 10.x (la 3.1.5 n'est pas touchée) : le correctif n'existe qu'en 11, version majeure. Ne rien forcer : un `override` pnpm vers la 11 sortirait de ce que déclarent les outils ESLint et n'a pas été essayé | Dépendance de développement selon Dependabot, et `pnpm why --prod` ne trouve aucun `minimatch`. Les dernières versions de `@eslint/config-array` et de `typescript-estree` demandent encore la 10 (mesuré le 05/11) | Quand les outils ESLint acceptent `minimatch` 11 : mettre à jour et vérifier que l'alerte se ferme |
| Vérification manuelle E07 : comparer les arrêts listés autour de Dijon-Ville (`mobilite_locale`, 22 arrêts au 02/11) avec le plan du réseau Divia | E07 | Quand Hardy a le plan sous la main (avant E12, fiche destination) |
| Relancer `pnpm etl osm` (extraction Overpass, ≈ 17 min si le serveur est saturé) **une fois par semaine au plus** ; la prochaine ajoutera les cascades (`waterway=waterfall`, règle corrigée le 01/11) et les nouvelles règles du 02/11 (grottes, sommets, sources, canaux, barrages, lavoirs, D042) : **compter les éléments reçus par règle**, surtout les canaux (un canal = plusieurs tronçons dans OSM, traitement prévu dans l'audit E06) | E05 → E16 | Au plus tôt le 08/11 ; dernière extraction avant le gel des données (E16) |
| Demander une clé API SNCF (gratuite) | E09 (P1) | Si le temps réel est lancé |
| Vérifier la marque « Wagoo » (INPI, nom de domaine) | Avant publication | Avant E17/E18 |
| Envoyer `equipe/demarrage-SR.md` et `equipe/guide-SR.md` aux SR ; organiser la réunion de démarrage (`travail-en-equipe.md` § 4) | E00 | Dès la fin de la documentation |

## 2 bis. Seuils écrits en dur dans la documentation (règle 3)

Relevés par l'audit du 09/10. Chacun entre dans `config/parametres.json` (et son schéma) **à l'étape qui l'utilise**, puis la documentation cite la clé au lieu de la valeur.

| Seuil | Où dans la doc | Étape |
|---|---|---|
| Bornes de position France métropolitaine (lat 41–51,5, lon −5,5–10) | `05` § 1.6 | E08 |
| Fenêtre du temps réel (3 prochaines heures) | `05` § A.2, `06` § 4, D021, E09 | E09 |
| Arrondi de position du cache de géocodage inverse (~100 m) | `05` § 3.11 bis | E09 |
| Nombre d'étiquettes sur la carte (5) | `06` § 3, D021 | E11 |

## 3. Reporté volontairement (après la soutenance ou si le temps le permet)

| Quoi | Pourquoi reporté | Déclencheur |
|---|---|---|
| **« Gare de Dijon » à l'affichage** au lieu de « Dijon » : seulement sur le front, sans renommer la gare en base (le nom vient de la SNCF) | Hardy préfère laisser « Dijon » pour le moment (05/11) | Si Hardy le redemande, par exemple pendant sa passe de design |
| **Recherche de destination dans Explorer** : taper « Beaune » la trouve dans les résultats, sans changer la gare de départ (la barre du haut choisit d'où l'on part) | Demandée par Hardy le 05/11, à faire plus tard | Après l'écran Lieux, avant le jalon P0 du 22/11 |
| **Écran Lieux, suite** : ☐ carte sur cet écran pour le P0 ou non (D067) ☐ essai au doigt sur téléphone | Mobile et grand écran faits le 05/11 ; Hardy décide de la carte plus tard, et le design sera affiné à la fin | Avant le P0 du 22/11 |
| **Filtres sans réaction immédiate** : le bouton met environ 2 s à changer (serveur de développement), et le rayon ne concerne que « À deux pas » | Trouvé le 05/11 | Avec l'écran Lieux |
| **Gare proposée qui n'est pas la plus proche : tout montrer** (condition de Hardy pour garder 3 km, D064) : sur « Votre gare », afficher le temps à pied jusqu'à la gare proposée, et la gare la plus proche avec « Changer de gare » en un geste. **Touche aussi l'API :** `/api/gares/proches` renvoie la distance et les durées vélo et voiture, pas la durée à pied (`05` § 3.2, `dureeMarcheMin` existe dans `lib/geo`) ; mettre à jour `06` § Explorer | Les retouches d'Explorer sont regroupées (E11 ⏸) | Lot de retouches d'Explorer (E11), avant le P0 du 22/11 |
| **Étape P1 temps réel : flux GTFS-RT de la SNCF** (open data, transport.data.gouv.fr) : retards, suppressions et alertes, mis à jour toutes les 2 minutes d'après Hardy (fréquence et adresse à vérifier à ce moment-là). Ajouter sa propre durée, très courte, dans `parametres.cache` (`tempsReelS`, D068), à côté des horaires prévus ; revoir aussi la ligne « clé API SNCF » du § 2, peut-être inutile. **Rien de codé pour l'instant** | Après le P0 (D051), choix de Hardy le 05/11 | P0 terminé (22/11) |
| **1ʳᵉ piste après le P0 — Aménagements cyclables** (source `cyclable`, Geovelo, table `amenagement_cyclable`, F17) : voies vertes et pistes près de la gare d'arrivée. **En tête parce que le défi cite les voies vertes comme premier exemple de livrable.** Puis les **tracés des lignes de train** (source `lignes`, table `ligne_ferroviaire`, carte) | Fichier Geovelo France entière, volumineux ; jalon « API complète » déjà dépassé : le P0 passe d'abord (D046, décision de Hardy le 02/11) | P0 terminé (22/11) |
| **Plusieurs régions / plusieurs clients** : un dossier de configuration par région (`config/regions/<code>/` : paramètres, sources, marque, couleurs, logo, choisi par une variable `REGION`) et une instance par client (application + base séparées) | Intérêt commercial non encore validé ; déjà préparé à moindre coût (D027) : il resterait environ 1 jour de travail | Une autre région ou un client intéressé, ou retours positifs après le défi |
| **Prix par trajet** tiré des grilles SNCF (tarifs TGV par couple de gares, tarifs TER si une licence claire est publiée) au lieu du prix au km calibré | Le prix au km (D048) suffit pour une estimation affichée « ≈ » ; deux sources de plus et un rapprochement des gares | P0 terminé, si le temps le permet (P1) |
| **Passer à MapLibre 6.4.1 ou plus pour corriger la faille XSS** (`CVE-2026-85061`, alertes Dependabot n° 11 et 12) : branche dédiée, en partant de la cause de D062 (le module de travail de MapLibre 6, que Next.js ne sert pas) ; validation par le parcours `carte.e2e.ts`, puis vérification à l'œil sur mobile et desktop ; vérifier aussi le hors ligne (E14). Retirer alors l'exclusion de `.github/dependabot.yml` et lever le risque accepté de D065 | Aucune 5.x n'est corrigée et la PR #58, fermée, vidait la carte : on reste en 5 jusqu'au P0, choix de Hardy le 05/11 (D065) | P0 terminé (22/11) |
| Favoris (F27) | Non essentiel au parcours | P0 et P1 terminés |
| Badge « pépite méconnue » (F22) | Données Insee à croiser | Après la soutenance |
| Places MAX JEUNE / SENIOR (F23) | Public ciblé | Après la soutenance |
| Connexion Google (F24) | Promesse « sans inscription » | Besoin de synchroniser des favoris |
| Transport à la demande | Données quasi inexistantes (D020) | Un réseau le publie en GTFS-Flex |
| Itinéraire piéton réel | Moteur de routage nécessaire | Après la soutenance |
| Extension nationale | Volume et temps | P0 + P1 terminés avant le gel (27/11) |
| Carte hors ligne (PMTiles régional) | Optionnel pour la démo | E16, si réseau incertain le jour J |
| Faille esbuild 0.18.20 (GHSA-67mh-4wv8-2f99) amenée par drizzle-kit 0.31.11 : alerte Dependabot n° 2 fermée « code non utilisé » le 23/10 (fonction `serve` jamais lancée, outil de développement uniquement) | Aucune version corrigée de drizzle-kit ; forcer la version d'esbuild = risque sans gain | Prochaine mise à jour de drizzle-kit : vérifier `pnpm why esbuild -r` |
| **Nom commercial des trains régionaux** : sur SNCF Connect, les TER de Bourgogne-Franche-Comté s'appellent « TER Mobigo ». Afficher ce nom (et non « TER ») sur les cartes, la fiche et la liste des trains, pour que le visiteur reconnaisse son train. Nom propre à la région : à ranger dans la configuration (ex. `parametres.region`), pas en dur, pour qu'une autre région ait le sien | Remarque de Hardy le 03/11 ; l'API renvoie le type `TER`, l'affichage relève de l'interface | E11 (écran Explorer) |
| **Recherche de ville sans lieux-dits** : la recherche « beaune » ou « dijon » remonte des lieux-dits homonymes d'autres départements (Sornac, Eymoutiers, Le Monteil…). Exclure le type **lieu-dit** de l'API Adresse (`locality`) ; **ne pas** filtrer par région (un visiteur peut partir de Paris) | Décision de Hardy le 03/11 (avis sur E09) | E11 (écran Explorer, choix de ville) |
| **Gevrey-Chambertin et Meursault n'ont qu'un lieu à pied de la gare** (03/11) : vérifier pourquoi — caves et domaines dans une catégorie non classée (`Winery` DATAtourisme, `craft=winery` OSM écartés), ou lieux à plus de 1,5 km de la gare ? Ces villages passent en fin de liste (D050) faute de lieux : problème de données, pas d'exception dans le classement | Relevé en mesurant le seuil de D050 | Avec les compléments vins (ligne suivante) |
| **Compléments de destination** : services utiles autour d'une destination, sans en faire des destinations (« aire de pique-nique à 300 m », « 3 caves de dégustation à proximité », surtout le vin en Bourgogne). **Stockage** : table séparée `complement` (type, nom, position, source, lien) + migration + index géographique ; pas de 6ᵉ catégorie dans `lieu` (chaque requête d'Explorer devrait l'exclure : un oubli = des sites secondaires au niveau des principaux). **Sources** : caves DATAtourisme (`Winery`, 293 dans le fichier régional, aujourd'hui écartées comme commerces, rien à télécharger) + OSM (`craft=winery`, `tourism=wine_cellar`) ; pique-nique OSM seul (`tourism=picnic_site`, 0 dans DATAtourisme) ; cinémas (59) et bibliothèques (156) DATAtourisme, retirés des destinations le 02/11 (D042), à reprendre ici ; OSM `amenity=cinema`, `amenity=library` déjà écartés. **Traitement** : colonne « cible » (destination ou complément) dans `categories.csv` (aujourd’hui : exclusion à priorité 40 pour DATAtourisme, 900 pour OSM), étape de chargement. **Fiche destination** : bloc « À proximité » sous les lieux à pied (type, nom, distance calculée à la demande). **Coût** ≈ 1 jour (½ traitement + migration, ¼ API, ¼ interface) | Pas une destination : ne doit pas apparaître dans Explorer (Hardy, 02/11) ; le P0 passe d'abord | P0 terminé (22/11) et du temps avant le gel du 27/11 ; premier P1 proposé |
| **Garder la référence Monument historique (`ref:mhs`) et le lien Wikidata des lieux** (colonnes de `lieu`, migration) : (1) **doublons automatiques** : deux lieux OSM de même référence MH ou même Wikidata sont le même monument (ex. « Borne-colonne » et « Borne-colonne de Brienne », PA00113134, décidés à la main le 02/11) ; (2) **piste photos** : image principale Wikidata (propriété P18) quand OSM n'a pas de photo ; (3) lien « en savoir plus » | Pas indispensable au P0 ; une décision manuelle couvre le seul cas connu | Après le P0 (22/11), avec la piste photos (`A-FAIRE` § 1, avant E12) |
| **Lieux culturels et festivals** (sources P1 `lieux_culturels`, `festivals`) | Retard sur le calendrier ; le P0 passe d'abord (D041) | P0 terminé |
| Ligne « En clair » pour les décisions D001 → D040 (révision et soutenance) | Utile pour Hardy, sans effet sur le développement ; ≈ 1 h | Un moment calme, au plus tard avant E13 (pitch) |
| Skills Claude Code (voir D016) | Garder une seule méthode au départ | Si un besoin précis apparaît (ex. tests navigateur en E15) |

## 4. Idées d'évolution

| Quoi | Pourquoi | Déclencheur |
|---|---|---|
| **Catégorie « bien-être / thermes »** (SPA Thermal Valvital, Luxeuil, Bourbon-Lancy, Salins…), utile pour tous les visiteurs | Aucune des 5 catégories ne convient : ces lieux restent écartés pour le P0 (D059) | Après le P0 |
| **Mention « accessible à vélo ou en bus »** pour les lieux entre 1,5 et 3 km d'une gare, séparée des lieux à pied | 68 sorties pour enfants à moins de 3 km, contre 29 à pied (mesure du 04/11) | Après le P0 |


| Idée | Intérêt |
|---|---|
| Mode « Surprends-moi » : une destination au hasard à moins d'une heure | Découverte, ludique |
| Espace pour les offices de tourisme (mise en avant de lieux) | Objectif « collectivités » du défi |
| Accidents évités (statistique indicative) | Bénéfice cité par le défi |
| Notifications de retard pour une sortie enregistrée | Utile avec comptes |
| « Où manger près de la gare d'arrivée » : restaurants, producteurs, dégustations, marchés de DATAtourisme (déjà dans le CSV chargé, écartés par `categories.csv`) | Compléter une sortie ; quelques lignes de règles + peut-être une catégorie (décision) |
