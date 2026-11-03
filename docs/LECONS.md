# Leçons réutilisables

> **Version** 1.6 · **Date** 03/11/2026
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
