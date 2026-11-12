# Leçons réutilisables

> **Version** 1.13 · **Date** 11/11/2026
> **Dépend de :** `DECISIONS.md`, `JOURNAL.md`
> **Utilisé par :** Hardy (révision, soutenance, futurs projets) ; aucun document ni code n'en dépend
> **Rôle :** ce que le projet nous a appris **et qui servira ailleurs** : problème → cause → solution → comment l'éviter. `DECISIONS.md` dit ce qu'on a choisi **pour ce projet** ; ici, on garde ce qui est **transposable**.
> **Règle :** une leçon par entrée, en langage simple, avec un renvoi vers la décision ou l'étape d'origine. Complété quand une session apporte une leçon nouvelle ; ce n'est jamais une étape obligatoire du développement.

---

## Dates et heures

### L01 — « Aujourd'hui » dépend du fuseau horaire
- **Problème :** entre minuit et 1 h–2 h, l'application aurait affiché les trains de la veille.
- **Cause :** les serveurs et Docker sont à l'heure UTC ; « aujourd'hui » en UTC n'est pas « aujourd'hui » à Paris.
- **Solution :** calculer la date du jour une seule fois, explicitement à Paris, puis la passer en paramètre aux fonctions.
- **À retenir :** une fonction qui lit l'horloge elle-même n'est ni fiable ni testable. Tester une date d'été **et** une date d'hiver. Ne jamais « corriger » en changeant le fuseau du serveur : ça cache le défaut au lieu de le régler.
- **Origine :** `CLAUDE.md` § 3, D031.

### L02 — Un train peut partir à « 25 h 10 »
- **Problème :** les horaires SNCF (GTFS) dépassent 24 h pour les trains de nuit.
- **Cause :** un horaire GTFS se compte depuis minuit **du jour de service**, pas du jour calendaire.
- **Solution :** garder les horaires en secondes depuis minuit + la date de service, sans jamais les convertir en date-heure.
- **À retenir :** lire la spécification d'un format avant de le convertir vers « le format habituel ».
- **Origine :** `CLAUDE.md` § 3, E03.

## Données ouvertes

### L03 — Fichier complet ou API : tout dépend de l'usage
- **Problème :** choisir entre télécharger le CSV DATAtourisme ou interroger son API.
- **Cause :** l'application doit **croiser tous les lieux avec toutes les gares** ; une API répond à une question à la fois.
- **Solution :** fichier complet téléchargé et chargé en base ; API seulement pour ce qui doit être frais à la minute (temps réel).
- **À retenir :** une API convient pour peu de résultats très frais ; un fichier complet convient pour croiser, trier, compter. L'API n'est pas lente en soi : elle le devient quand chaque écran lui pose des dizaines de questions.
- **Origine :** D002, session du 01/11.

### L04 — Un identifiant de source peut changer sans prévenir
- **Problème :** Paris Gare de Lyon a été recréée en double après une mise à jour du fichier des gares.
- **Cause :** le fichier SNCF avait inversé l'ordre des codes UIC de la gare ; on la reconnaissait par son premier code.
- **Solution :** reconnaître une gare par **n'importe lequel** de ses codes, et bloquer le chargement si une ligne correspond à plusieurs gares.
- **À retenir :** ne jamais supposer qu'un identifiant fourni par un tiers est stable ; ajouter un contrôle qui bloque plutôt qu'une donnée fausse en silence.
- **Origine :** D039.

### L05 — Des doublons qui n'en sont pas : les trains en jumelage
- **Problème :** un même train était compté deux fois (deux numéros, mêmes horaires).
- **Cause :** deux trains attachés roulent ensemble puis se séparent ; le fichier les décrit comme deux trajets.
- **Solution :** compter les couples (heure de départ, heure d'arrivée), pas les trajets, et afficher les deux numéros.
- **À retenir :** avant de dédoublonner ou de compter, comprendre **pourquoi** une donnée apparaît deux fois dans le monde réel.
- **Origine :** D040.

### L06 — Comparer avec un service de référence avant de « corriger »
- **Problème :** SNCF Connect affichait un premier train Dijon → Paris à 5 h 35, absent de nos résultats pour Paris Gare de Lyon.
- **Cause :** ce train arrive à Paris Bercy ; SNCF Connect regroupe les gares d'une même ville. Nos données étaient justes.
- **Solution :** aucune correction du calcul ; le regroupement par ville devient un choix d'affichage.
- **À retenir :** un écart avec la référence n'est pas forcément un bug. Retrouver le cas précis (numéro du train, gare) avant de modifier quoi que ce soit.
- **Origine :** E04, `A-FAIRE` § 1.

### L07 — Tester la couverture d'une source avant de l'adopter
- **Problème :** GéoDataMine, recommandé par le défi, semblait couvrir tous les lieux OpenStreetMap utiles.
- **Cause :** il ne propose que 2 de nos 5 familles de lieux (aires de jeux, patrimoine).
- **Solution :** Overpass pour tout, avec une seule requête construite à partir de nos règles de catégories.
- **À retenir :** une petite extraction réelle et quelques comptages valent mieux qu'une description de site web.
- **Origine :** audit E05, D041.

### L08 — Une même information, trois formats selon la source
- **Problème :** la commune d'un lieu arrive en code INSEE (GéoDataMine), en « code postal#nom » (DATAtourisme) ou pas du tout (Overpass).
- **Cause :** chaque producteur publie à sa façon ; le croisement code postal + nom échoue pour 8 % des lieux (communes fusionnées ou déléguées).
- **Solution :** une méthode unique pour toutes les sources : le point du lieu tombe dans le contour d'une commune.
- **À retenir :** quand plusieurs sources se contredisent, chercher une méthode qui ne dépend d'aucune d'elles (ici, la géographie).
- **Origine :** audit E05, D041.

### L13 — Plusieurs petites requêtes plutôt qu'une grosse vers un service partagé
- **Problème :** une seule requête Overpass pour toute la région échouait (délai dépassé à 306 s), sur le serveur principal comme sur deux miroirs.
- **Cause :** un service gratuit et partagé limite le temps de chaque requête, et il était saturé ce jour-là ; Node coupe aussi une réponse qui ne commence pas en 300 s.
- **Solution :** une requête par famille de lieux, chacune avec son délai et ses nouvelles tentatives (attente doublée), puis réunion des résultats.
- **À retenir :** découper un gros téléchargement en morceaux qu'on peut refaire un par un ; ne jamais charger une réponse marquée incomplète.
- **Origine :** E05, D041.

### L14 — Zéro résultat n'est pas une erreur… mais c'est suspect
- **Problème :** aucune cascade OpenStreetMap trouvée dans toute la région, sans aucun message d'erreur.
- **Cause :** la règle cherchait `natural=waterfall`, alors que les cascades sont décrites par `waterway=waterfall`.
- **Solution :** règle corrigée ; le journal affiche le nombre d'éléments reçus pour chaque requête.
- **À retenir :** compter les résultats de chaque règle ; un total à zéro dans une région entière se vérifie toujours dans la documentation de la source.
- **Origine :** E05, D041.

### L15 — Un service public gratuit a des règles d'usage
- **Problème :** Overpass répondait « serveur saturé » ; sa page précise qu'il n'est pas fait pour un usage automatique fréquent.
- **Cause :** service partagé par tout le monde, financé par des bénévoles.
- **Solution :** extraction une fois par semaine au plus, fichier gardé entre-temps (`--hors-ligne`), requêtes une par une, programme identifié par son nom et l'adresse du dépôt.
- **À retenir :** lire les conditions d'usage d'un service avant de le programmer chaque nuit, et prévoir de travailler sur une copie locale.
- **Origine :** E05, D041 point 10.

### L16 — Le même objet peut arriver deux fois dans un fichier officiel
- **Problème :** 16 lieux DATAtourisme avaient deux lignes identiques.
- **Cause :** le même lieu était publié par deux diffuseurs (un office de tourisme et une plateforme régionale).
- **Solution :** le contrôle d'unicité a bloqué le chargement ; on garde la première ligne et on compte les autres dans le rapport.
- **À retenir :** un contrôle bloquant qui échoue est une bonne nouvelle : il montre un défaut de la source avant qu'il n'arrive en base.
- **Origine :** E05.

## Traitement des données

### L17 — Des règles dans un tableau, pas dans le code
- **Problème :** classer 269 classes DATAtourisme et des dizaines de tags OSM en 5 catégories, et pouvoir corriger sans programmer.
- **Solution :** un fichier `categories.csv` éditable, une règle par valeur, avec une priorité : **exclusion forte** (un hôtel installé dans un château reste un hôtel), **exclusion faible** (un circuit qui passe par un sommet reste un site naturel). Les tests vérifient le vrai fichier.
- **À retenir :** séparer les connaissances métier (les règles) du mécanisme (le code) ; la personne qui connaît le métier peut alors corriger seule.
- **Origine :** E05, `04` § 4.5.

### L18 — Garder le fichier brut pour retraiter sans retélécharger
- **Problème :** corriger une règle ne devait pas obliger à réinterroger Overpass (17 minutes, service saturé).
- **Solution :** fichier brut gardé dans `data/brut/` ; empreinte = fichier **+ règles**, donc une règle modifiée suffit à relancer le classement ; `--hors-ligne` relit le fichier.
- **À retenir :** séparer « télécharger » et « traiter » ; le traitement doit pouvoir se rejouer à volonté sur la même copie.
- **Origine :** E05, D041 point 8.

### L22 — Une donnée ouverte brute n'est pas une donnée utile
- **Problème :** le fichier régional DATAtourisme compte 34 033 lignes, mais beaucoup ne sont pas des sorties.
- **Cause :** une source publique sert de nombreux usages (hébergement, commerce, agenda) ; aucune n'est faite pour notre question.
- **Solution :** trier par règles (événements, hébergements, commerces, puis cinémas et bibliothèques écartés) : 4 045 lieux gardés, soit 12 % ; compléter avec OpenStreetMap, qui apporte ce que DATAtourisme n'a pas (8 310 lieux : aires de jeux, grottes, sommets, Monuments historiques).
- **À retenir :** aucune source ouverte n'est pertinente telle quelle pour un projet précis : trier une source, puis la compléter avec une autre.
- **Origine :** E05, D041, D042.

### L23 — Essayer une règle sur les vraies données avant de l'ajouter
- **Problème :** la règle « attraction » OSM semblait utile ; l'exclusion faible des bibliothèques semblait suffire.
- **Cause :** l'étiquette `tourism=attraction` se validait elle-même (la condition « signe de sortie » acceptait toute étiquette `tourism`) ; et toutes les bibliothèques portaient aussi « site culturel », qui l'emportait sur l'exclusion faible.
- **Solution :** simulation avant / après sur l'extraction réelle : la règle « attraction » aurait renommé 102 Monuments historiques et réintégré 5 éléments de petit patrimoine, elle n'est pas ajoutée ; les bibliothèques reçoivent une exclusion plus forte (priorité 40).
- **À retenir :** compter l'avant et l'après sur les données réelles, et écrire les chiffres dans la décision : c'est aussi un argument prêt pour le jury.
- **Origine :** D042.

### L24 — Distinguer le but de sortie et le service utile
- **Problème :** caves, aires de pique-nique, cinémas, bibliothèques auraient été affichés au même niveau qu'un château.
- **Solution :** écartés des destinations ; gardés comme idée de « compléments de destination » (« caves de dégustation à proximité ») dans une table séparée, après le P0.
- **À retenir :** avant de classer un élément, se demander quel rôle il joue pour l'utilisateur : le but du déplacement, ou un service autour.
- **Origine :** D042, `A-FAIRE` § 3.

### L25 — Regrouper « de proche en proche » enchaîne tout un centre-ville
- **Problème :** regrouper les lieux voisins en « sites » semblait simple : tout ce qui est à moins de 150 m.
- **Cause :** le regroupement de proche en proche (DBSCAN) relie A à B, B à C… : 92 monuments du centre de Dijon formaient un seul « site ».
- **Solution :** une liste fermée de sous-catégories, chacune avec sa distance (grottes 500 m, sites archéologiques 300 m, aires de jeux 50 m) ; jamais tout le patrimoine.
- **À retenir :** un seuil de distance ne suffit pas à définir « le même endroit » ; mesurer le plus gros groupe obtenu avant d'adopter une règle.
- **Origine :** D043.

### L26 — Quand l'algorithme hésite, une décision humaine versionnée
- **Problème :** entre 0,5 et 0,6 de similarité, les paires mêlent vrais doublons (« Atelier Courbet » / « Atelier de Gustave Courbet ») et faux (« Escape game au Château » / le château) ; aucun seuil ne les sépare.
- **Solution :** un fichier `doublons_manuels.csv` (oui / non), versionné et relu à chaque chargement ; les paires sont repérées par **identifiant**, jamais par le nom ; le rapport à relire a les mêmes colonnes, une ligne se recopie telle quelle. 193 décisions ont ramené la liste à relire de 201 à 8 paires.
- **À retenir :** garder l'automatique pour les cas sûrs, et rendre la décision humaine reproductible (fichier, pas modification à la main dans la base).
- **Origine :** D044.

### L27 — Dans un catalogue national, filtrer par territoire, pas par nom
- **Problème :** chercher les réseaux de la région par mots-clés ramenait « Tanéo » de Nouméa, « TCL » de Limoges, « SITAC » de Châlons-en-Champagne, « Sablons Bus » dans l'Oise.
- **Cause :** un même nom de réseau existe dans plusieurs régions ; le texte ne dit pas où est le réseau.
- **Solution :** filtrer sur la zone couverte (région, département, commune) déclarée par le jeu, puis vérifier le résultat sur les vraies données (arrêts à pied d'une gare : « ça roule » à Autun n'en a aucun).
- **À retenir :** un nom n'est pas un lieu ; s'appuyer sur un code géographique, puis mesurer.
- **Origine :** audit E07, D046.

### L28 — Un lien de téléchargement stable plutôt qu'un fichier daté
- **Problème :** les fichiers GTFS sont publiés à des adresses datées (`…/20261029-152009/gtfs.zip`), remplacées à chaque mise à jour.
- **Solution :** garder dans `sources.json` le lien stable qui redirige vers la dernière version (`data.gouv.fr/api/1/datasets/r/<identifiant>`).
- **À retenir :** une adresse de source doit survivre aux mises à jour de la source ; sinon le traitement casse en silence quelques semaines plus tard.
- **Origine :** E07, D046.

### L33 — Appeler l'API réelle avant de coder contre sa documentation
- **Problème :** l'adresse de l'API Adresse prévue dans la documentation était **obsolète** (redirection, en-têtes `deprecation` et `sunset` au 31/01/2026), et la recherche inverse filtrée par « commune » renvoyait une **liste vide** pour Talant.
- **Solution :** un appel réel pendant l'audit, en lisant les en-têtes de la réponse : nouvelle adresse (Géoplateforme) rangée dans `sources.json`, recherche inverse sans filtre (commune de l'adresse la plus proche).
- **À retenir :** une API publique déménage et ses filtres se comportent parfois autrement que documenté ; dix secondes de `curl` avant de coder évitent une panne le jour de la démo. Garder l'adresse dans la configuration, pas dans le code.
- **Origine :** audit E09, D051.

## Base de données

### L09 — Une valeur calculée peut rester stockée, à condition d'être contrôlée
- **Problème :** `gare.dans_region` se déduit du département de la commune ; la garder est une entorse à la normalisation.
- **Cause :** presque toutes les requêtes en ont besoin ; la recalculer obligerait chacune à faire une jointure et à recevoir la liste des départements.
- **Solution :** la garder, avec un contrôle bloquant au chargement qui vérifie qu'elle correspond au département.
- **À retenir :** une dénormalisation se défend si elle est **assumée, documentée et vérifiée automatiquement**.
- **Origine :** D040, point 6.

### L10 — Une requête lente se mesure avant de se corriger
- **Problème :** le chargement des gares est passé de 4 s à 60 s.
- **Cause :** une condition `id IN (colonne_a, colonne_b)` empêchait PostgreSQL d'utiliser un index : il lisait toute la table de 268 000 liaisons pour chaque gare.
- **Solution :** deux conditions `EXISTS` séparées et un index sur la seconde colonne → 4,5 s.
- **À retenir :** comparer le temps avant et après chaque étape ; une régression se remarque tout de suite ou jamais. `EXPLAIN` montre ce que la base fait vraiment.
- **Origine :** E04, migration `0007`.

### L19 — Une information vit dans la table de ce qu'elle décrit
- **Problème :** où ranger le contour d'une commune, qui sert à trouver la commune d'un lieu ?
- **Solution :** dans `commune`, pas dans `lieu` : le contour décrit la commune. Il est stocké une fois et sert aux lieux, et plus tard aux gares ou aux arrêts.
- **À retenir :** se demander « de quoi cette donnée parle-t-elle ? » avant de choisir sa table (normalisation).
- **Origine :** D041, point 2.

### L20 — Un identifiant qui ne change pas à chaque chargement
- **Problème :** supprimer puis réinsérer tous les lieux à chaque chargement change leur identifiant, ce qui casse les liens et les favoris.
- **Solution :** mettre à jour chaque lieu par son identifiant dans la source (`source`, `id_source`), puis supprimer seulement ceux qui ont disparu.
- **À retenir :** un identifiant exposé à l'extérieur (adresse web, favori) doit rester stable.
- **Origine :** D041, point 8.

### L32 — L'identifiant interne de la base n'est pas un identifiant public
- **Problème :** même stable d'un chargement à l'autre (L20), le numéro interne d'un lieu ou d'une gare change dès que la base est **recréée** : production, données figées de la soutenance, base remise à zéro. Les liens partagés et les favoris pointeraient alors vers un autre lieu, ou nulle part.
- **Solution :** exposer l'identifiant **du monde réel** : le code UIC d'une gare (cherché parmi tous ses codes, car le code principal peut changer), la clé de la source d'un lieu (`osm-way-123456`). La clé est une **colonne générée** par la base, avec un **index unique** : une seule règle, et toute collision est refusée au chargement.
- **À retenir :** se demander « ce lien marchera-t-il encore sur une autre base ? ». Prévoir aussi l'objet qui change de statut : un lien vers un lieu devenu doublon mène au lieu gardé au lieu d'un « introuvable ».
- **Origine :** D052, question de Hardy en E09.

## Méthode de travail

### L11 — Les commandes Git qui « annulent » effacent le travail non enregistré
- **Problème :** `git checkout`, `git restore`, `git stash` ou `git reset --hard` font perdre le travail en cours.
- **Cause :** elles reviennent au dernier commit, pas à « l'état d'avant ».
- **Solution :** copier le fichier ailleurs avant de le casser pour tester, puis restaurer depuis la copie ; `git status` avant toute commande qui jette des changements.
- **Origine :** leçon reprise du projet Lexio, `CLAUDE.md` § 11.

### L21 — Ne pas coder un plan de secours pour un risque déjà couvert
- **Problème :** fallait-il prévoir le fichier Geofabrik au cas où Overpass resterait en panne ?
- **Solution :** non : il aurait fallu une nouvelle bibliothèque et un deuxième programme pour la même source, alors que le fichier gardé couvre déjà le risque. La solution est seulement notée comme écartée, avec la condition qui la rendrait utile.
- **À retenir :** noter les alternatives écartées et pourquoi ; coder seulement ce qui répond à un risque réel. C'est aussi une réponse prête pour le jury.
- **Origine :** D041, rubrique « Écarté ».

### L12 — Un seuil écrit à deux endroits finit par diverger
- **Problème :** un rayon ou une durée copiés dans l'application et dans le traitement des données ne restent pas égaux.
- **Solution :** un seul fichier de paramètres, lu par les deux à travers un seul schéma de validation.
- **À retenir :** même règle pour les adresses des sources et le nom de marque.
- **Origine :** D012, D027.

### L29 — Le framework peut écrire des données personnelles dans ses journaux
- **Problème :** notre journal ne contenait aucune position, mais le serveur Next.js écrivait chaque URL demandée (`GET /api/autour?lat=…&lon=…`) dans le sien.
- **Cause :** les outils journalisent par défaut les requêtes entrantes ; la position voyage dans l'URL.
- **Solution :** désactiver ce journal (`logging.incomingRequests: false`), puis appeler les routes et **chercher la position dans les journaux** pour le vérifier.
- **À retenir :** « aucune donnée personnelle dans les journaux » se vérifie sur la sortie réelle de **tous** les composants (framework, proxy, base), pas seulement sur son propre code.
- **Origine :** E08, D047 (point 10).

### L30 — Mesurer un seuil sur les vraies données avant de le choisir
- **Problème :** quelle durée minimale, quel nombre de lieux pour reléguer une destination ?
- **Solution :** compter ce que chaque valeur retire (5, 10, 15 min ; 1, 3, 5 lieux) et donner des exemples nommés. La durée minimale a été abandonnée (même 5 min coupait Arc-et-Senans) ; le seuil de 3 lieux a été choisi parce qu'il relègue les gares TGV sans reléguer la moitié de la région.
- **À retenir :** un seuil se choisit sur des exemples concrets ; la mesure devient la raison écrite dans la décision.
- **Origine :** D047, D050.

### L31 — Un test doit pouvoir échouer : casser le code exprès
- **Problème :** un test qui passe ne prouve rien s'il passerait aussi avec un code faux.
- **Cas réel :** le test « la gare qui a le plus de trains en tête » passait encore une fois la règle retirée, car Gare de Lyon était aussi la plus rapide ; il a fallu un cas où les deux critères divergent (Belfort et la halte de Danjoutin).
- **À retenir :** casser volontairement la règle (sur une copie du fichier) et vérifier que le test échoue ; choisir des exemples où la règle testée est la seule à décider.
- **Origine :** `08-conventions-qualite.md` § 7, E08.

### L34 — Tester la panne d'un service externe, sans réseau
- **Problème :** comment vérifier le repli hors ligne de la recherche de ville sans couper Internet, et sans que les tests dépendent du réseau ?
- **Solution :** remplacer `fetch` par une fausse version dans le test (une réponse préparée, ou un rejet « réseau coupé »), puis vérifier la réponse de repli **et** le contenu du journal (l'avertissement est là, la position n'y est pas).
- **À retenir :** un repli non testé n'existe pas ; un adaptateur unique par service externe rend ce test simple (un seul endroit à simuler).
- **Origine :** E09, `08-conventions-qualite.md` § 7 (pas de test dépendant du réseau).

### L35 — Deux écrans, un seul calcul
- **Problème :** la carte d'une destination et sa fiche affichent la même durée, le même CO₂ et le même prix ; calculés à deux endroits, ils finiraient par différer (un « ≈ 7–12 € » d'un côté, « ≈ 8–13 € » de l'autre).
- **Solution :** une seule fonction pure (`impactLiaison`) et la même règle (type de train le moins favorable) pour la carte, la fiche et `/api/impact` ; un test d'intégration compare la carte et la fiche.
- **À retenir :** quand deux écrans montrent la même valeur, tester qu'ils montrent **la même** valeur, pas seulement chacun « une » valeur.
- **Origine :** D047, D051.

### L36 — Une liste se conçoit depuis le moment du voyageur, pas depuis la table
- **Problème :** la liste des retours prenait « les 20 premiers » puis « les 20 derniers » trains du jour ; avec un départ à 16:00, elle proposait encore des retours à 14:37, avant même l'arrivée à 16:37.
- **Solution :** partir de la situation du voyageur : un retour n'est utile que s'il part **après l'arrivée** du premier aller proposé ; le dernier retour du jour reste toujours affiché (« jusqu'à quand puis-je rester ? »).
- **À retenir :** pour chaque liste, se demander « où en est la personne à ce moment-là ? » ; la vérification par un vrai utilisateur (Hardy, sur SNCF Connect) trouve ce que les tests ne cherchent pas.
- **Origine :** avis de Hardy sur E09, D051 (point 8 bis).

### L37 — Dire ce que mesure un chiffre, surtout quand deux conventions coexistent
- **Problème :** le CO₂ est calculé pour un aller-retour, le prix pour un aller simple ; rien ne le disait dans la réponse, et un seul champ « aller-retour » aurait été faux pour le prix.
- **Solution :** un champ explicite par chiffre (`trajet: { co2: "aller-retour", prix: "aller-simple" }`), écrit aussi dans le contrat de l'API.
- **À retenir :** un nombre sans unité ni périmètre finit mal affiché ; quand deux valeurs voisines suivent des conventions différentes, les nommer chacune.
- **Origine :** remarque de Hardy sur `/api/impact`, D051 (point 8 ter).

### L38 — Tester depuis l'endroit idéal cache les défauts des vrais utilisateurs
- **Problème :** tous les essais simulaient une position pile sur la gare de Dijon : 101 destinations. Chez Hardy, à quelques kilomètres, l'application partait d'une petite gare sans train vers le sud, et Beaune semblait avoir disparu.
- **Solution :** demander une capture de l'écran réel, vérifier dans les horaires bruts, puis corriger la règle de choix de la gare.
- **À retenir :** essayer aussi une position ordinaire, pas seulement le cas le plus favorable ; quand un utilisateur dit que ça manque, lire ce que son écran affiche avant de répondre que les données sont bonnes.
- **Origine :** remarque de Hardy du 05/11, D064.

### L39 — Une action sans réaction visible ressemble à une panne
- **Problème :** un filtre mettait environ 2 s à répondre, sans aucun signe. Hardy l'a cru cassé, et un test qui n'attendait que 2 s a aussi conclu à tort que le clic ne marchait pas.
- **Solution :** mesurer jusqu'à ce que l'état change avant de conclure, et prévoir une réaction dès le clic (à faire, `A-FAIRE` § 3).
- **À retenir :** un bouton doit réagir tout de suite, même si le résultat arrive après ; et un « ça ne marche pas » tiré d'un délai trop court n'est pas un résultat.
- **Origine :** diagnostic du 05/11.


### L40 — Simuler une règle sur toutes les données, pas sur le cas qui l'a fait naître
- **Problème :** la règle « la gare qui a le plus de trains » corrigeait Dijon, mais faisait perdre 26 destinations, dont Paris, à une gare TGV.
- **Solution :** appeler la vraie route sur chaque gare et autour, puis recalculer les pertes à part depuis la base.
- **À retenir :** un correctif peut recréer ailleurs le défaut qu'il corrige ; on le voit seulement en le passant sur toutes les données.
- **Origine :** D064.

### L41 — Un chiffre annoncé doit sortir d'une mesure, et dire ce qu'il compte
- **Problème :** une somme par destination a été présentée comme un nombre de trains (1 035 au lieu de 148 départs), et un pourcentage a été annoncé sans mesure.
- **Solution :** ne citer que ce qu'une requête ou un test vient de produire, et dire « non mesuré » sinon.
- **À retenir :** un chiffre faux dit avec assurance coûte plus cher que « je ne sais pas » : il finit dans les décisions.
- **Origine :** D064, demande de Hardy du 05/11.

### L42 — Des tests verts ne prouvent pas qu'un écran est dessiné
- **Problème :** avec MapLibre 6, le fond de carte était vide, mais tous les parcours passaient : ils lisaient des épingles en HTML.
- **Solution :** un test qui regarde les pixels, et qu'on fait tourner contre la version cassée pour vérifier qu'il échoue.
- **À retenir :** tester ce que l'utilisateur voit, et prouver que le test peut échouer. Relire aussi les décisions : D062 connaissait déjà cette panne.
- **Origine :** D062, D065.

### L43 — Une donnée liée à l'heure se contrôle à l'affichage, pas seulement par la durée du cache
- **Problème :** le navigateur pouvait garder 15 min une liste de trains, donc montrer des trains partis.
- **Solution :** comparer chaque train à l'heure actuelle au moment d'afficher, quel que soit l'âge de la réponse, et distinguer « mise à jour » de « plus de train ».
- **À retenir :** un cache plus court réduit le risque, seul un contrôle à l'affichage le supprime.
- **Origine :** D068.


### L44 — Ne jamais reconstruire le dossier d'un serveur en marche
- **Problème :** un écran blanc sur iPhone semblait venir de l'ajout à l'écran d'accueil. En réalité, des tests avaient reconstruit `.next` pendant que le serveur le lisait : ses scripts répondaient en erreur 500.
- **Solution :** compter les scripts servis et comparer l'heure du build à celle du démarrage ; lancer ensuite tests et builds dans une copie (`git worktree`).
- **À retenir :** quand un seul morceau de la page s'affiche, se demander ce qui existe avant le JavaScript ; et se demander aussi si son propre outil n'a pas changé l'environnement de l'autre.
- **Origine :** essai du 05/11, D071.

### L45 — Hors ligne, prévoir la sortie : pas de cul-de-sac, et ne pas se fier à l'événement `online`
- **Problème :** une page jamais ouverte menait à la page d'erreur du navigateur, sans bouton dans une PWA. Et l'événement `online` part avant que la connexion soit prête : recharger à ce moment retombait sur le message.
- **Solution :** une page de secours avec une issue, qui interroge le serveur et se recharge quand il répond vraiment.
- **À retenir :** tester le chemin complet (coupure, navigation, retour du réseau) : c'est là qu'étaient les défauts, pas dans le cas nominal.
- **Origine :** D071.

### L46 — Le cache par défaut d'un outil peut garder ce qui ne doit jamais l'être
- **Problème :** le cache par défaut de Serwist garde tout `/api/*`, donc aussi les adresses contenant la position de l'utilisateur.
- **Solution :** une liste explicite de ce qui peut être gardé, testée en paires, et un parcours qui relit le cache réel.
- **À retenir :** lire ce que fait un réglage par défaut avant de l'adopter, surtout quand une règle de confidentialité est en jeu.
- **Origine :** D071, règle 5.

## Licences et chiffres à défendre

### L47 — Une licence se lit chez le producteur, pas dans sa propre configuration
- **Problème :** `sources.json` annonçait « Licence Ouverte 2.0 » pour Impact CO2, marquée « non vérifiée » ; l'écran allait l'afficher au jury.
- **Cause :** une valeur saisie en début de projet finit par ressembler à un fait.
- **Solution :** relire chaque licence sur la page ou l'API officielle ; 24 des 26 sources affichées ont pu être confirmées ainsi le 06/11, `facteurs_co2` a été corrigée et `contours` reste à confirmer.
- **À retenir :** un champ « vérifié » à faux est un travail à faire avant d'afficher la valeur, pas un détail.
- **Origine :** D075.

### L48 — Deux pages d'un même organisme peuvent se contredire : noter ce que chacune couvre
- **Problème :** l'ADEME écrit « réutilisation non commerciale et pédagogique » sur Impact CO2, et « Licence Ouverte Etalab » sur Datagir.
- **Solution :** pour chaque page, noter ce qu'elle nomme réellement, sa version et sa date. Datagir ne nomme pas Impact CO2 : elle ne suffit pas à le justifier. Une fiche qui nomme le jeu de données, sa version et sa licence vaut mieux.
- **À retenir :** « l'ADEME dit » ne suffit pas ; il faut pouvoir dire quelle page, sur quelles données, et à quelle date. Corriger trop vite dans un sens ou dans l'autre est aussi une erreur.
- **Origine :** D075.

### L49 — Un chiffre sans périmètre ne veut rien dire
- **Problème :** pour la même voiture, l'ADEME et la SNCF publient 142, 160, 256, 119 ou 108 g/km.
- **Cause :** motorisation, année, fabrication comptée ou non, et surtout nombre de personnes à bord. 256 g par véhicule ÷ 1,6 personne = 160 g par personne : diviser encore par le nombre d'occupants compterait deux fois le remplissage.
- **Solution :** écrire le chiffre avec ce qu'il mesure : « voiture thermique moyenne (diesel), une personne à bord, usage et fabrication ».
- **À retenir :** avant d'adopter ou de comparer un facteur, lire sa décomposition et son unité.
- **Origine :** D075, L37, L41.

### L50 — À la soutenance, le meilleur chiffre est celui que le jury peut vérifier
- **Problème :** la Base Carbone avait une meilleure licence, mais donnait 25,6 kg dans le pitch contre 14,2 kg sur le site public de l'ADEME.
- **Solution :** garder le chiffre vérifiable en une minute, le moins favorable à notre thèse, et noter ce qu'il faudra revoir si le cadre change.
- **À retenir :** comparer les options sur trois points : ce qu'on peut vérifier, ce qu'on peut dire sans s'exposer, ce que ça coûte à construire. Le mieux en théorie peut être le plus fragile en pratique.
- **Origine :** D075 (choix de Hardy).

### L51 — Regarder ce que fait le marché avant de construire son propre calcul
- **Problème :** on discutait de facteurs et de sélecteurs sans avoir regardé les vraies applications.
- **Solution :** comparer les méthodes publiées et un trajet concret. Résultat : même calcul partout, et un sélecteur à quatre choix n'aurait rien apporté à la démo.
- **À retenir :** cette recherche prend moins de temps qu'un calcul sur mesure, et elle fournit des arguments. Quand on se met à ajouter des options pour résoudre un doute, c'est le moment de s'arrêter et de comparer.
- **Origine :** D075 (demande de Hardy).

### L52 — Vérifier un conseil extérieur point par point, le sien comme le nôtre
- **Problème :** un avis extérieur et mes propres réponses mêlaient des faits justes et des erreurs : une option présentée comme existante alors qu'elle n'existait pas, 105 g au lieu de 108 g, et de mon côté 108 g utilisé pour un TER au lieu de 119 g.
- **Solution :** vérifier chaque affirmation à la source, séparément. Distinguer ce qui est lu directement de ce qui vient d'un extrait de moteur de recherche, et ne pas contourner un site qui refuse la lecture automatique : l'ouvrir soi-même.
- **À retenir :** un texte sûr de lui n'est pas une preuve, et une conclusion peut être fausse même si tous ses calculs sont justes. Un avis contraire se vérifie aussi : il a révélé que le 142 était un diesel moyen.
- **Origine :** D075.

### L53 — Un contrôle à zéro ne prouve rien sans témoin
- **Problème :** deux compteurs de position à 0 sur les journaux semblaient prouver l'absence de fuite, mais le déploiement venait de remplacer le conteneur, et avec lui le journal qui contenait les requêtes de test.
- **Solution :** envoyer le témoin sur le conteneur en place, vérifier qu'il a démarré avant le témoin, puis compter.
- **À retenir :** avant de croire un résultat vide, se demander ce qu'on aurait vu si le problème existait. Et dire ce que le test ne couvre pas : ici, une vraie panne serveur reste couverte par un test automatique, pas par ce contrôle.
- **Origine :** D077.

### L54 — Une donnée inventée pour un test peut fuir dans une maquette
- **Problème :** « Bligny-lès-Beaune », inventé pour un test de recherche, a été repris dans le prompt de la maquette ; la maquette l'a affiché comme une vraie destination, alors qu'aucune gare de ce nom n'existe.
- **Solution :** vérifier dans la base chaque exemple donné à un outil de maquette ou à une présentation.
- **À retenir :** un exemple écrit pour illustrer finit par passer pour un fait. Les exemples d'un prompt viennent de la base, pas des tests.
- **Origine :** D084.

### L55 — Un test qui échoue « parfois » : le lancer d'abord sans son changement
- **Problème :** un parcours a échoué pendant la recherche de destination ; il était tentant d'accuser le nouveau code, ou de relancer jusqu'au succès.
- **Solution :** le lancer plusieurs fois sur `main`, sans le changement : 3 échecs sur 20, l'instabilité existait déjà.
- **À retenir :** répéter le test (`--repeat-each`) sur la version d'avant dit si le défaut est nouveau. Un test instable se corrige à part, avec sa cause, sans allonger les délais au hasard.
- **Origine :** journal du 10–11/11.

## Dossier CO₂ pour la soutenance (relevé du 06/11/2026)

Lecture de pages, pas un avis juridique. À relire avant la soutenance : ces pages peuvent changer.

### Ce qu'on affiche et pourquoi
- **Calcul :** distance × facteur par personne, en estimation. Pour 100 km : **voiture thermique moyenne (diesel), une personne à bord 14,2 kg** ; TER 2,77 kg. [Impact CO2, transport](https://impactco2.fr/outils/transport) · [TER](https://impactco2.fr/outils/transport/ter).
- **Honnêteté :** à quatre en voiture, 3,6 kg par personne, contre 2,8 kg en TER. L'application montre aussi la voiture partagée (D011).
- **Licence :** « réutilisation non commerciale et pédagogique », en citant l'ADEME : [mentions légales](https://impactco2.fr/mentions-legales), mises à jour le 29/05/2024. Convient à un projet d'école gratuit ; à revoir pour un usage commercial (`A-FAIRE`).

### Ce que font les autres
| Application | Train | Voiture, par personne | Remplissage | Source |
|---|---|---|---|---|
| Wagoo (Impact CO2) | TER 27,7 · TGV 2,93 | 142 | 1 personne | ADEME |
| [SNCF, méthode 2024](https://www.sncf-voyageurs.com/medias-publics/2025-01/sncf_voyageurs_methodologiegenerale-infoges_2024.pdf), parcours TER, usage seul | TER 19,4 | 119 | 1,6 personne | Base Empreinte 2018 |
| Même document, longue distance, avec fabrication et maintenance | TER 24,4 · TGV 2,9 | 108 | 2,2 personnes | SNCF, Base Empreinte, Carbone 4 |
| [SNCF Connect](https://www.sncf-connect.com/train/comparateurco2), page non datée | TER 30,4 · TGV 3,5 | 108 | 2,2 personnes | SNCF |
| [Google](https://support.google.com/travel/answer/13571996?hl=fr) | 19 | 148 | non précisé | Agence internationale de l'énergie |
| [Trainline](https://thetrainline.com/terms/sustainability-faqs) | 35,1 (Royaume-Uni) | 116 | 1,5 personne | Gouvernement britannique |

Valeurs en g CO₂e/km.

**Dijon → Beaune, aller simple, affiché par des sites :** [Mappy](https://fr.mappy.com/itineraire/21000-dijon/21200-beaune) : train 0 kg, voiture 5 kg ou 10 à 11 kg selon le tableau · [KelBillet](https://kelbillet.com/itineraire/dijon-beaune-v29955-31533.html) : voiture moyenne 8 à 9 kg · [Virail](https://www.virail.com/train-dijon-beaune) : train 2,38 kg, et 0 kg ailleurs sur la page. Wagoo : 1,2 kg en TER, 6,1 kg en voiture, sur 43,2 km.

### Questions probables
- **« Pourquoi pas la Base Carbone ? »** Étudiée (V23.6, [Licence Ouverte 2.0](https://www.data.gouv.fr/datasets/65bd0b310a81ca31f396a59a)). TER (43255, 27,7 g) et TGV (43256, 2,93 g) y sont identiques aux nôtres. Pour la voiture, elle donne 256 g par véhicule (43791) ou 160 g par passager à 1,6 personne (43809). On a gardé le calculateur public, vérifiable et moins favorable au train.
- **« Pourquoi 142 et pas 256 ? »** Ce ne sont pas les mêmes voitures : diesel moyen dans un modèle de 2025 d'un côté, moyenne du parc de l'autre. **Ne pas aller plus loin :** l'écart n'est pas entièrement expliqué, la note de méthode d'Impact CO2 n'a pas pu être lue.
- **« Pourquoi une personne seule, alors que la SNCF en compte 1,6 ou 2,2 ? »** C'est le cas par défaut d'Impact CO2, et l'application montre la voiture partagée. L'écart avec la SNCF vient surtout de là.
- **« Même méthode que la SNCF ? »** Même principe, pas les mêmes facteurs.
- **« Votre distance est-elle exacte ? »** C'est une estimation : vol d'oiseau × coefficient, soit 43,2 km pour Dijon → Beaune, contre 36 à 37 km en train selon Trainline et Rome2Rio, et 41,8 km par la route selon Rome2Rio. Le train y est un peu surestimé.

### Encore à confirmer
- **97 Mt et 69 % :** affichés le 07/11, lus dans le communiqué de l'ADEME, dont Hardy a copié le texte : ce site refuse la lecture automatique. **Question probable :** la page du ministère écrit « soit 11 % » juste après les 97 Mt. Le communiqué rapporte ces 11 % aux 46 Mt émises sur le territoire (`equipe/pitch.md`). Nous n'affichons pas ces 11 %.
- **Non vu :** les applications mobiles, et les pages Omio, Kombo, EcoPassenger, SNCF Voyageurs et le trajet sur SNCF Connect, inaccessibles. Aucune méthode trouvée pour Citymapper.
- **Licence de `contours` (IGN) :** non confirmée. C'est pourquoi l'écran dit « données publiques », et pas « données ouvertes ».

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 01/11/2026 | 1.0 | Création : L01 → L13 |
| 01/11/2026 | 1.1 | L14 → L21 (E05 : résultat à zéro, règles d'usage d'Overpass, doublons de diffuseurs, règles dans un tableau, fichier brut gardé, table d'une information, identifiant stable, plan de secours écarté) |
| 02/11/2026 | 1.2 | L22 → L24 (donnée brute triée et complétée, règle simulée avant ajout, but de sortie et service utile) |
| 02/11/2026 | 1.3 | L25, L26 (regroupement de proche en proche, décisions humaines versionnées) |
| 02/11/2026 | 1.4 | L27, L28 (catalogue national filtré par territoire, lien de téléchargement stable) |
| 03/11/2026 | 1.5 | L29 → L31 (journaux du framework, seuil mesuré avant d'être choisi, test qui doit pouvoir échouer) |
| 03/11/2026 | 1.6 | L32 → L35 (identifiant public, API réelle appelée avant de coder, panne d'un service externe testée, un seul calcul pour deux écrans) |
| 03/11/2026 | 1.7 | L36, L37 (liste pensée depuis le moment du voyageur, périmètre de chaque chiffre) |
| 05/11/2026 | 1.8 | L38, L39 (tester depuis une position ordinaire, action sans réaction visible) |
| 05/11/2026 | 1.9 | L40 → L43 (règle simulée sur toutes les données, chiffre mesuré, écran vraiment dessiné, donnée liée à l'heure) |
| 05/11/2026 | 1.10 | L44 → L46 (serveur en marche, sortie du hors-ligne, cache par défaut) |
| 06/11/2026 | 1.11 | L47 → L52 et dossier CO₂ (licence lue à la source, portée d'une page, périmètre d'un chiffre, chiffre vérifiable, marché d'abord, conseil vérifié point par point) |
| 07/11/2026 | 1.12 | L53 (contrôle à zéro et témoin) |
| 11/11/2026 | 1.13 | L54, L55 (exemple inventé qui fuit, test instable lancé sans son changement) |
