# À faire, à valider, reporté

> **Rôle :** un seul endroit pour tout ce qui n'est pas en cours de construction.
> **Règle :** chaque élément dit **quoi**, **pourquoi** il est là, et **ce qui déclenchera** sa réalisation. Un élément réalisé est **supprimé** (sa trace va dans `JOURNAL.md`).
> Mis à jour à chaque « garde le contexte ».

---

## 1. À valider par Hardy

| Quoi | Contexte | Déclencheur |
|---|---|---|
| Relire l'ensemble de la documentation (docs 00 → 08, fiches) | Rédigée le 30/09 | Avant de lancer E00 |
| Design System (UI Kit) dans Claude Design | Prompt fourni le 30/09 | Avant ~09/11 (E10) |
| Variantes de la maquette Explorer : carte avec ~20 destinations, lieu sans description, destination sans prix, trains sans statut, bascule Samedi/Dimanche, station sans nombre de vélos ; retirer le transport à la demande | Décisions D017 → D021 | Avant ~09/11 (E11–E12) |
| Maquettes fiche lieu, feuille Filtres, choix de ville (si non couvertes) — prompts dans `design/prompts-ecrans.md` | — | Avant ~09/11 (E11–E12) |
| Maquettes « L'âme du produit » + Sources | — | Avant ~16/11 (E13) |
| Mettre les captures des maquettes dans `design/maquettes/` et les liens dans `design/README.md` | Trace hors MCP | Dès qu'une maquette est validée |
| **Plusieurs gares dans une même ville** : depuis Dijon, Paris apparaît en deux destinations (Paris Gare de Lyon : 14 trains, 1 h 36 ; Paris Bercy : 6 trains, 2 h 52, dont le premier départ à 05:35). SNCF Connect les regroupe sous « Paris ». Choix d'affichage : une carte par commune (via `gare.code_insee` → `commune`, arrondissements déjà rattachés à « Paris ») avec ses gares, ou une carte par gare | Relevé le 01/11 en comparant les liaisons E04 avec SNCF Connect ; les liaisons restent calculées par gare (aucun changement en E04) | **Avant E08** (forme de `/api/destinations`) |
| **Photos des lieux, au-delà d'OpenStreetMap** : en v1, photo OSM (`image`, `wikimedia_commons`) quand elle existe, sinon illustration par catégorie (D041). Pour en avoir plus : le **flux complet de la « plateforme diffuseur » DATAtourisme** (photos comprises, téléchargé la nuit comme le CSV ; compte gratuit, adresse du flux à garder secrète, JSON plus lourd). Dans tous les cas : **crédit et licence de chaque photo** à afficher | Le CSV régional n'a aucune photo ; Hardy juge les photos importantes. L'API seule pour les images a été écartée (clé, fiche plus lente, rien hors ligne) | Hardy crée le compte diffuseur s'il le souhaite ; évaluation au plus tard avec E12 (fiche) |
| **Légende des temps de trajet sur la carte** : `design/prompts-ecrans.md` (prompt 1, § 4) demande « ≤ 30 min, ≤ 1 h, ≤ 1 h 30, > 1 h 30 » alors que `parametres.json` (`durees.tranchesTempsMin` = 30, 60, 120) et `05` donnent `<30`, `<60`, `<120`, `≥120` | Contradiction relevée le 09/10 ; aucun des deux corrigé | **Avant E11** |
| Copie de la page « Audit des gares Wagoo » dans le dépôt (`docs/` ou `design/`) ou seulement dans les Téléchargements | Page explicative mise à jour hors dépôt (prompt donné le 23/10 : table `commune`, codes UIC, schéma des tables) | Quand la page est à jour |
| Lien de billetterie : où le ranger (`marque.ts`, `parametres.json` ou `sources.json`) | Fiche E12 | Avant E12 |
| Licence du code (ex. MIT) | Dépôt public depuis le 07/10 sans licence (« tous droits réservés ») ; décision reportée volontairement | E18 |

## 2. Actions humaines de Hardy (comptes, clés, fichiers)

| Quoi | Pour quelle étape | Déclencheur |
|---|---|---|
| Inviter le second membre SR, si l'équipe en compte deux (seul ethan21000 est collaborateur au 09/10) — `equipe/travail-en-equipe.md` § 3.2 | — | Dès que son identifiant GitHub est connu |
| Annoncer aux SR la fusion de E01 : c'est le signal de départ de leur tâche I01 | E01 | À la fusion de E01 |
| Fusionner la PR Dependabot `minimatch` quand elle arrivera (alerte n° 10, gravité moyenne, outils ESLint seulement) — accord de Hardy le 02/11 | — | À l'ouverture de la PR |
| Relancer `pnpm etl osm` (extraction Overpass, ≈ 17 min si le serveur est saturé) **une fois par semaine au plus** ; la prochaine ajoutera les cascades (`waterway=waterfall`, règle corrigée le 01/11) et les nouvelles règles du 02/11 (grottes, sommets, sources, canaux, barrages, lavoirs, D042) : **compter les éléments reçus par règle**, surtout les canaux (un canal = plusieurs tronçons dans OSM, traitement prévu dans l'audit E06) | E05 → E16 | Au plus tôt le 08/11 ; dernière extraction avant le gel des données (E16) |
| Choisir les réseaux urbains (GTFS/GBFS) sur transport.data.gouv.fr, et relever les URL `station_status.json` des vélos | E07 | Début E07 |
| Demander une clé API SNCF (gratuite) | E09 (P1) | Si le temps réel est lancé |
| Relever les facteurs CO₂ manquants et une source de prix au km | E09 | Début E09 |
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
| **1ʳᵉ piste après le P0 — Aménagements cyclables** (source `cyclable`, Geovelo, table `amenagement_cyclable`, F17) : voies vertes et pistes près de la gare d'arrivée. **En tête parce que le défi cite les voies vertes comme premier exemple de livrable.** Puis les **tracés des lignes de train** (source `lignes`, table `ligne_ferroviaire`, carte) | Fichier Geovelo France entière, volumineux ; jalon « API complète » déjà dépassé : le P0 passe d'abord (D046, décision de Hardy le 02/11) | P0 terminé (22/11) |
| **Plusieurs régions / plusieurs clients** : un dossier de configuration par région (`config/regions/<code>/` : paramètres, sources, marque, couleurs, logo, choisi par une variable `REGION`) et une instance par client (application + base séparées) | Intérêt commercial non encore validé ; déjà préparé à moindre coût (D027) : il resterait environ 1 jour de travail | Une autre région ou un client intéressé, ou retours positifs après le défi |
| Favoris (F27) | Non essentiel au parcours | P0 et P1 terminés |
| Badge « pépite méconnue » (F22) | Données Insee à croiser | Après la soutenance |
| Places MAX JEUNE / SENIOR (F23) | Public ciblé | Après la soutenance |
| Connexion Google (F24) | Promesse « sans inscription » | Besoin de synchroniser des favoris |
| Transport à la demande | Données quasi inexistantes (D020) | Un réseau le publie en GTFS-Flex |
| Itinéraire piéton réel | Moteur de routage nécessaire | Après la soutenance |
| Extension nationale | Volume et temps | P0 + P1 terminés avant le gel (27/11) |
| Carte hors ligne (PMTiles régional) | Optionnel pour la démo | E16, si réseau incertain le jour J |
| Faille esbuild 0.18.20 (GHSA-67mh-4wv8-2f99) amenée par drizzle-kit 0.31.11 : alerte Dependabot n° 2 fermée « code non utilisé » le 23/10 (fonction `serve` jamais lancée, outil de développement uniquement) | Aucune version corrigée de drizzle-kit ; forcer la version d'esbuild = risque sans gain | Prochaine mise à jour de drizzle-kit : vérifier `pnpm why esbuild -r` |
| **Compléments de destination** : services utiles autour d'une destination, sans en faire des destinations (« aire de pique-nique à 300 m », « 3 caves de dégustation à proximité », surtout le vin en Bourgogne). **Stockage** : table séparée `complement` (type, nom, position, source, lien) + migration + index géographique ; pas de 6ᵉ catégorie dans `lieu` (chaque requête d'Explorer devrait l'exclure : un oubli = des sites secondaires au niveau des principaux). **Sources** : caves DATAtourisme (`Winery`, 293 dans le fichier régional, aujourd'hui écartées comme commerces, rien à télécharger) + OSM (`craft=winery`, `tourism=wine_cellar`) ; pique-nique OSM seul (`tourism=picnic_site`, 0 dans DATAtourisme) ; cinémas (59) et bibliothèques (156) DATAtourisme, retirés des destinations le 02/11 (D042), à reprendre ici ; OSM `amenity=cinema`, `amenity=library` déjà écartés. **Traitement** : colonne « cible » (destination ou complément) dans `categories.csv` (aujourd’hui : exclusion à priorité 40 pour DATAtourisme, 900 pour OSM), étape de chargement. **Fiche destination** : bloc « À proximité » sous les lieux à pied (type, nom, distance calculée à la demande). **Coût** ≈ 1 jour (½ traitement + migration, ¼ API, ¼ interface) | Pas une destination : ne doit pas apparaître dans Explorer (Hardy, 02/11) ; le P0 passe d'abord | P0 terminé (22/11) et du temps avant le gel du 27/11 ; premier P1 proposé |
| **Garder la référence Monument historique (`ref:mhs`) et le lien Wikidata des lieux** (colonnes de `lieu`, migration) : (1) **doublons automatiques** : deux lieux OSM de même référence MH ou même Wikidata sont le même monument (ex. « Borne-colonne » et « Borne-colonne de Brienne », PA00113134, décidés à la main le 02/11) ; (2) **piste photos** : image principale Wikidata (propriété P18) quand OSM n'a pas de photo ; (3) lien « en savoir plus » | Pas indispensable au P0 ; une décision manuelle couvre le seul cas connu | Après le P0 (22/11), avec la piste photos (`A-FAIRE` § 1, avant E12) |
| **Lieux culturels et festivals** (sources P1 `lieux_culturels`, `festivals`) | Retard sur le calendrier ; le P0 passe d'abord (D041) | P0 terminé |
| Ligne « En clair » pour les décisions D001 → D040 (révision et soutenance) | Utile pour Hardy, sans effet sur le développement ; ≈ 1 h | Un moment calme, au plus tard avant E13 (pitch) |
| Skills Claude Code (voir D016) | Garder une seule méthode au départ | Si un besoin précis apparaît (ex. tests navigateur en E15) |

## 4. Idées d'évolution

| Idée | Intérêt |
|---|---|
| Mode « Surprends-moi » : une destination au hasard à moins d'une heure | Découverte, ludique |
| Espace pour les offices de tourisme (mise en avant de lieux) | Objectif « collectivités » du défi |
| Accidents évités (statistique indicative) | Bénéfice cité par le défi |
| Notifications de retard pour une sortie enregistrée | Utile avec comptes |
| « Où manger près de la gare d'arrivée » : restaurants, producteurs, dégustations, marchés de DATAtourisme (déjà dans le CSV chargé, écartés par `categories.csv`) | Compléter une sortie ; quelques lignes de règles + peut-être une catégorie (décision) |
