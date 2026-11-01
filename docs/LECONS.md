# Leçons réutilisables

> **Version** 1.1 · **Date** 01/11/2026
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

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 01/11/2026 | 1.0 | Création : L01 → L13 |
| 01/11/2026 | 1.1 | L14 → L21 (E05 : résultat à zéro, règles d'usage d'Overpass, doublons de diffuseurs, règles dans un tableau, fichier brut gardé, table d'une information, identifiant stable, plan de secours écarté) |
