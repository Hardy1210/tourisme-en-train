# Prompts Claude Design — écrans complémentaires

> **Version** 1.1 · **Date** 09/10/2026
> **Dépend de :** maquette Explorer v2 (`Explorer_Desktop_v2`), `docs/06-interface.md`, `docs/05-api.md`
> **Usage :** à coller dans Claude Design, **dans le même projet que la maquette Explorer v2**, pour qu'il réutilise `tokens.css` et les composants existants.

## Mode d'emploi

1. Coller d'abord le **prompt 0** (contexte + règles). Il n'est à coller qu'une fois par conversation.
2. Puis **un prompt par écran**, dans l'ordre. Vérifier le résultat en **mobile (390 px) et desktop (1440 px)** avant de passer au suivant.
3. Terminer par le **prompt 10** (navigation) pour relier tous les écrans dans le prototype cliquable.
4. Exporter : **PDF** pour le tuteur, **Project HTML → standalone** pour la démo sur ton ordinateur.

| # | Écran | Priorité |
|---|---|---|
| 0 | Contexte et règles communes | — |
| 1 | Corrections de la v2 | Indispensable |
| 2 | Fiche lieu | Indispensable |
| 3 | Calendrier « Choisir une date » | Indispensable |
| 4 | Utilisateur hors région | Indispensable |
| 5 | Destination hors région | Indispensable |
| 6 | Écran Sources + menu | Indispensable |
| 7 | Erreur et lien introuvable | Indispensable |
| 8 | Détail « Comparer » (CO₂) | Utile |
| 9 | Avant la demande de localisation + installation de l'app | Utile |
| 10 | Navigation : relier tous les écrans | Indispensable |

---

## Prompt 0 — Contexte et règles communes

```
Contexte : tu continues le prototype de Wagoo, une application web installable (PWA), gratuite et sans inscription. Elle localise l'utilisateur et lui montre ce qu'il peut faire autour de lui et où il peut aller en TRAIN DIRECT (sans correspondance) pour une sortie : lieux (enfants, nature, parcs, patrimoine, culture), trains aller et retour, lieux à pied depuis la gare d'arrivée, transports sur place (bus, tram, vélos), CO₂ économisé, prix estimé.
Région couverte en v1 : Bourgogne-Franche-Comté uniquement (Dijon, Beaune, Besançon, Dole, Chalon-sur-Saône, Belfort…). Les trains peuvent aller hors région (Lyon, Paris), mais les lieux et transports sur place ne sont connus que dans la région.

L'écran Explorer et la fiche destination existent déjà dans ce projet (maquette Explorer v2). Je vais te demander des écrans complémentaires, un par un.

Règles pour TOUS les écrans :
1. Réutilise strictement le design system existant : tokens.css (couleurs, rayons, ombres, espacements, typographie), composants déjà présents (puces, cartes, feuilles, onglets, boutons, toasts). Aucune nouvelle couleur en dur. Si un token manque, dis-le au lieu de l'inventer.
2. Chaque écran en deux versions : mobile 390 px (feuilles qui montent du bas, plein écran) et desktop 1440 px (panneau gauche 440 px + carte, ou fenêtre centrée).
3. Tous les textes en français, ton simple et chaleureux, tutoiement interdit (vouvoiement). Le nom « Wagoo » est la marque.
4. Données réalistes de Bourgogne-Franche-Comté (gares, lieux, horaires plausibles). Départ par défaut : Dijon-Ville. Destination d'exemple : Beaune.
5. Honnêteté des données : le prix est toujours marqué « estimation » et peut être absent ; un lieu peut n'avoir ni photo, ni description, ni horaires ; aucun itinéraire avec correspondance ; aucun transport à la demande.
6. Accessibilité : zones tactiles d'au moins 44 px, contraste AA, focus visible, toute information de la carte existe aussi en liste.
7. Ne modifie pas l'écran Explorer ni la fiche destination, sauf si je le demande explicitement.
8. Chaque nouvel écran doit être CLIQUABLE dans le prototype : indique d'où on y arrive et où mènent ses boutons (je te donne ces liens dans chaque demande).

Réponds seulement « Compris » ; j'envoie le premier écran ensuite.
```

---

## Prompt 1 — Corrections de la v2

**À quoi ça sert :** aligner la maquette existante sur ce que l'application fera vraiment en v1.

```
Corrections à apporter à la maquette Explorer v2 (mobile et desktop) :

1. Retire « Mes sorties » (les favoris arrivent plus tard). La navigation basse ne contient plus que deux entrées : « Explorer » et « Menu » (icône trois traits). « Menu » ouvrira un petit menu : « À propos » et « Sources des données » (écran 6, à venir).
2. Les destinations hors région (Lyon Part-Dieu, Paris Gare de Lyon, Mulhouse) ne doivent afficher AUCUN nombre de lieux par catégorie. Remplace les pastilles par une mention discrète « Hors région · trains seulement ». Leur durée, nombre de trains et prix restent affichés.
3. Vérifie qu'il ne reste aucune mention de transport à la demande (onglet Sur place de toutes les destinations).
4. Vérifie que la légende des temps de trajet (≤ 30 min, ≤ 1 h, ≤ 1 h 30, > 1 h 30) utilise les tokens --map-time-1 à --map-time-4 et que ces tokens existent bien dans tokens.css ; liste-moi leurs valeurs.
5. Montre-moi la version mobile complète : Explorer (feuille de résultats repliée et dépliée) et fiche destination (onglets Lieux, Trains, Sur place, pied avec CO₂ et bouton billet).

Ne change rien d'autre.
```

---

## Prompt 2 — Fiche lieu

**À quoi ça sert :** le détail d'un lieu (musée, parc, aire de jeux…). Aujourd'hui, cliquer sur un lieu n'ouvre rien.
**Lien avec l'app :** données de la route `/api/lieux/[id]` (nom, catégorie, sous-catégorie, description, adresse, commune, site officiel, image, horaires, période, label Qualité Tourisme, source et attribution, gares proches avec durée à pied).

```
Crée l'écran « Fiche lieu » (mobile + desktop).

À quoi il sert : montrer le détail d'un lieu et comment y aller en train.

D'où on y arrive (liens à créer dans le prototype) :
- clic sur un lieu dans l'onglet « Lieux » de la fiche destination ;
- clic sur une épingle de lieu sur la carte puis « Voir le lieu » dans la mini-fiche ;
- clic sur un lieu de la section « À deux pas de vous » de l'Explorer.

Présentation :
- Mobile : feuille plein écran qui s'ouvre par-dessus la fiche destination, flèche « Retour » en haut à gauche (revient à l'écran d'origine).
- Desktop : remplace le contenu du panneau gauche, avec « ← Retour à Beaune » en haut ; la carte à droite se centre sur le lieu et met son épingle en évidence.

Contenu, de haut en bas :
1. Photo (si disponible), sinon un bandeau sobre avec l'icône de la catégorie sur sa couleur (tokens cat-*).
2. Nom, catégorie + sous-catégorie (ex. « Patrimoine · Monument historique »), badge « Qualité Tourisme » si labellisé.
3. Bloc « Depuis la gare » : « Gare de Beaune · 12 min à pied (950 m) ». Si le lieu est proche de deux gares, les lister.
4. Description (3 à 5 lignes, « Lire la suite » si plus longue).
5. Horaires (texte tel que fourni, ex. « Tous les jours 9 h – 18 h 30 ») ; période pour un festival (« juin – juillet »).
6. Adresse + commune.
7. Boutons : « Site officiel » (lien externe, icône flèche sortante), « Voir sur la carte », et bouton principal « Y aller en train » qui ouvre la fiche destination de la gare la plus proche (onglet Trains).
8. Pied discret : « Source : DATAtourisme » ou « © les contributeurs d'OpenStreetMap ».

Deux variantes à montrer côte à côte :
A. Lieu complet : Hospices de Beaune (patrimoine, Qualité Tourisme, photo, description, horaires 9 h – 18 h 30, source DATAtourisme, 12 min à pied de la gare de Beaune).
B. Lieu minimal : « Aire de jeux » (enfants, source OpenStreetMap) — sans photo, sans description, sans horaires, sans site. L'écran doit rester propre : on masque les blocs vides, pas de « Non renseigné ». Garder « Depuis la gare », « Voir sur la carte » et « Y aller en train ».
```

---

## Prompt 3 — Calendrier « Choisir une date »

**À quoi ça sert :** choisir un autre jour que les raccourcis. **Lien avec l'app :** les horaires sont chargés sur 60 jours (`fenetreJoursHoraires`) ; au-delà, l'application n'a pas les trains.

```
Crée l'écran « Choisir une date » (mobile + desktop).

D'où on y arrive : dans la fenêtre « Quand ? », l'option « Choisir une date » (aujourd'hui elle ne fait rien).
Où il mène : après validation, la fenêtre se ferme, la puce de date de l'en-tête affiche la date choisie (ex. « Sam. 17 oct. ») et la liste des destinations se met à jour (montre l'état chargement puis résultats).

Présentation :
- Mobile : feuille qui monte du bas, dans la continuité de « Quand ? », avec « ← Retour » vers les raccourcis.
- Desktop : calendrier dans la même fenêtre centrée que « Quand ? ».

Contenu :
- Calendrier mensuel en français, semaine commençant le lundi, navigation mois précédent / suivant.
- Aujourd'hui marqué ; samedis et dimanches légèrement distingués.
- Dates passées désactivées.
- Dates au-delà de la fenêtre des horaires désactivées, avec une ligne d'explication sous le calendrier : « Horaires disponibles jusqu'au dim. 29 nov. ».
- Bouton principal « Voir les sorties du [date] », désactivé tant qu'aucune date n'est choisie.

Données d'exemple : aujourd'hui = mercredi 30 septembre 2026 ; horaires disponibles jusqu'au 29 novembre 2026.
```

---

## Prompt 4 — Utilisateur hors région

**À quoi ça sert :** gérer quelqu'un qui ouvre Wagoo depuis Lyon ou Paris. **Lien avec l'app :** la route `/api/gares/proches` renvoie `dansRegion: false` ; l'app ne connaît les lieux que dans la région pilote.

```
Crée l'état « Hors région » de l'écran Explorer (mobile + desktop).

Quand il apparaît : la position de l'utilisateur est hors de Bourgogne-Franche-Comté (exemple : il est à Lyon).

Contenu :
- Carte centrée sur la Bourgogne-Franche-Comté (région légèrement mise en valeur), avec le point de l'utilisateur hors du cadre ou au bord.
- Message dans la feuille de résultats : titre « Wagoo arrive bientôt près de chez vous », texte « Pour l'instant, Wagoo couvre la Bourgogne-Franche-Comté. Choisissez une gare de départ dans la région pour explorer les sorties en train. »
- Bouton principal « Partir de Dijon ».
- Liste « Grandes gares de la région » : Dijon-Ville, Besançon-Viotte, Dole-Ville, Chalon-sur-Saône, Belfort, Auxerre-Saint-Gervais — chacune cliquable.
- Lien secondaire « Rechercher une ville ou une gare » qui ouvre la fenêtre « D'où partez-vous ? ».

Liens : « Partir de Dijon » et chaque gare → Explorer normal avec la puce « Autour de Dijon » (ou de la gare choisie) et ses résultats.

Ajoute cet état à la liste des états de démonstration (à côté de Chargement, Localisation refusée, Aucun résultat, Hors ligne).
```

---

## Prompt 5 — Destination hors région

**À quoi ça sert :** ouvrir une destination comme Lyon, qui a des trains directs mais pas de lieux chargés. **Lien avec l'app :** `lieuxCharges: false` dans `/api/destinations` ; les trains (`/api/trains`) et le CO₂ (`/api/impact`) fonctionnent quand même.

```
Crée la variante « Destination hors région » de la fiche destination (mobile + desktop).

D'où on y arrive : clic sur la carte « Lyon Part-Dieu » (mention « Hors région · trains seulement ») dans la liste des destinations depuis Dijon-Ville.

Contenu :
- En-tête identique aux autres destinations : nom, durée (ex. 1 h 50), nombre de trains par jour, date.
- Onglet « Trains » : complet et identique aux autres (aller, retour, dernier retour mis en évidence). C'est l'onglet ouvert par défaut pour cette destination.
- Onglet « Lieux » : état vide soigné — icône, titre « Les lieux de Lyon ne sont pas encore dans Wagoo », texte « Wagoo couvre pour l'instant la Bourgogne-Franche-Comté. Les trains, eux, sont bien réels. » Pas de lien externe inventé.
- Onglet « Sur place » : même principe — « Les transports de Lyon ne sont pas encore dans Wagoo ».
- Pied : bloc CO₂ et bouton « Acheter mon billet » identiques aux autres destinations (le prix peut être présent ou absent).
```

---

## Prompt 6 — Écran Sources + menu

**À quoi ça sert :** obligation légale des licences ouvertes (citer chaque source). **Lien avec l'app :** route `/api/sources` (table `source_donnees`).

```
Crée le menu et l'écran « Sources des données » (mobile + desktop).

Menu : l'entrée « Menu » de la navigation basse (créée à l'étape de corrections) ouvre un petit menu avec « À propos » (affiche un toast « Bientôt disponible ») et « Sources des données ». Ajoute aussi un lien « Sources » cliquable dans l'attribution en bas de la carte.

Écran Sources :
- Mobile : page plein écran avec « ← Retour ». Desktop : dans le panneau gauche, avec « ← Retour ».
- Introduction courte : « Wagoo est construit uniquement avec des données publiques ouvertes. Merci à leurs producteurs. »
- Une carte par source : nom, producteur, licence (pastille), date de mise à jour, lien « Voir la source » (externe).
  1. Gares de voyageurs — SNCF — Licence Ouverte
  2. Horaires des trains (GTFS) — SNCF — ODbL
  3. DATAtourisme — ADN Tourisme — Licence Ouverte 2.0
  4. OpenStreetMap — contributeurs OpenStreetMap — ODbL
  5. Réseaux de bus, tram et vélos — transport.data.gouv.fr — selon le réseau
  6. Facteurs d'émission CO₂ — ADEME, Impact CO2 — valeurs publiées
  7. Recherche d'adresse — IGN, API Adresse
  8. Fond de carte — OpenFreeMap, © OpenStreetMap
- Encadré en bas : « Projet réalisé dans le cadre du défi data.gouv.fr "Tourisme en train" (Fondation SNCF / Open Data University). » + rappel « Wagoo n'enregistre jamais votre position. »
```

---

## Prompt 7 — Erreur et lien introuvable

**À quoi ça sert :** le partage crée des liens qui peuvent devenir invalides (date passée, destination supprimée), et une panne est toujours possible. **Lien avec l'app :** erreurs `404 INTROUVABLE`, `400` date hors fenêtre, `500`.

```
Crée trois écrans d'erreur (mobile + desktop), dans le même style sobre et rassurant, avec une illustration légère (icône ou dessin simple aux couleurs des tokens) :

1. « Cette sortie n'est plus disponible » — cas d'un lien partagé dont la date est passée.
   Texte : « Les trains de cette date ne sont plus affichés. Voici la même sortie pour aujourd'hui. »
   Bouton principal : « Voir Dijon → Beaune aujourd'hui » (→ fiche destination du jour). Lien secondaire : « Retour à l'accueil ».

2. « Page introuvable » (404) — lien erroné.
   Texte : « Cette page n'existe pas ou plus. » Bouton : « Explorer autour de moi » (→ Explorer).

3. « Un problème est survenu » — panne du serveur.
   Texte : « Ce n'est pas vous, c'est nous. Réessayez dans un instant. » Boutons : « Réessayer » et « Retour à l'accueil ». Aucun détail technique.
```

---

## Prompt 8 — Détail « Comparer » (CO₂)

**À quoi ça sert :** montrer honnêtement l'impact du train face aux autres modes. **Lien avec l'app :** route `/api/impact` (calcul local à partir des facteurs ADEME ; avion affiché seulement au-delà de 300 km).

```
Crée la feuille « Comparer l'impact » (mobile + desktop).

D'où on y arrive : le bouton « Comparer » du bloc CO₂, dans le pied de la fiche destination.
Présentation : mobile = feuille qui monte du bas ; desktop = fenêtre centrée. Bouton « Fermer ».

Contenu (exemple Dijon-Ville ↔ Beaune, aller-retour, par personne) — reprends les chiffres déjà affichés dans la fiche pour rester cohérent :
- Titre : « Aller-retour Dijon ↔ Beaune, par personne ».
- Barres horizontales comparées, du plus faible au plus fort : Train (TER) · Covoiturage (3 personnes) · Voiture seule. Train mis en valeur avec la couleur principale.
- Valeur en kg CO₂e au bout de chaque barre.
- Ligne mise en avant : « Vous économisez X kg de CO₂ par rapport à la voiture seule ».
- Avion : ligne grisée « Non pertinent sur cette distance » (l'avion n'apparaît qu'au-delà de 300 km).
- Pied : « Source : ADEME — Impact CO2, facteurs relevés le 30/09/2026. Distance ferroviaire estimée. »

Variante : même feuille pour Dijon → Paris (TGV) où la ligne Avion est affichée avec sa barre.
```

---

## Prompt 9 — Avant la demande de localisation + installation de l'app

**À quoi ça sert :** expliquer la demande de position avant que le navigateur ne la pose (plus de gens acceptent), et proposer l'installation de l'app (PWA).

```
Crée deux éléments (mobile + desktop) :

A. Écran « Avant la localisation » — premier lancement uniquement.
- Illustration simple (point de position + petit train), nom Wagoo, slogan.
- Titre : « Trouvez une sortie en train autour de vous ».
- Texte : « Wagoo a besoin de votre position pour vous montrer les lieux et les gares proches. Elle n'est jamais enregistrée. »
- Bouton principal « Utiliser ma position » → état Chargement de l'Explorer, puis Résultats.
- Bouton secondaire « Choisir une ville » → fenêtre « D'où partez-vous ? ».
- Desktop : carte centrée sur une grande fenêtre ou un encart au centre de l'écran, la carte floutée derrière.

B. Invitation à installer l'app — bannière discrète en bas de l'Explorer (au-dessus de la feuille de résultats sur mobile, en bas du panneau sur desktop).
- « Installez Wagoo sur votre écran d'accueil : accès en un geste, même hors ligne. » Boutons « Installer » et « Plus tard » (la bannière disparaît).
- Variante iPhone (pas de bouton d'installation automatique) : « Touchez Partager puis "Sur l'écran d'accueil" », avec les deux petites icônes.
```

---

## Prompt 10 — Navigation : relier tous les écrans

**À quoi ça sert :** transformer l'ensemble en un seul prototype cliquable pour la démonstration.

```
Relie maintenant tous les écrans dans un seul prototype cliquable (mobile et desktop), selon cette carte :

Premier lancement → « Avant la localisation »
  ├─ « Utiliser ma position » → Explorer (Chargement → Résultats)
  └─ « Choisir une ville » → « D'où partez-vous ? » → Explorer

Explorer
  ├─ puce position → « D'où partez-vous ? »
  ├─ puce date → « Quand ? » → « Choisir une date » → Explorer mis à jour
  ├─ « Filtres » → fenêtre Filtres → Explorer mis à jour
  ├─ lieu « À deux pas de vous » ou épingle → Fiche lieu
  ├─ carte de destination (région) → Fiche destination (onglet Lieux)
  ├─ carte de destination hors région → Destination hors région (onglet Trains)
  ├─ Menu → Sources des données · À propos (toast « Bientôt disponible »)
  └─ bannière → installation

Fiche destination
  ├─ lieu de l'onglet Lieux → Fiche lieu
  ├─ « Comparer » → Comparer l'impact
  ├─ « Partager » → toast « Lien de la sortie copié »
  ├─ « Acheter mon billet » → lien externe (nouvel onglet)
  └─ Retour → Explorer

Fiche lieu
  ├─ « Y aller en train » → Fiche destination de sa gare (onglet Trains)
  ├─ « Voir sur la carte » → Explorer centré sur le lieu
  └─ Retour → écran d'origine

Ajoute un sélecteur d'écrans de démonstration (discret, hors de l'interface) pour accéder directement à : états de l'Explorer (Résultats, Chargement, Localisation refusée, Aucun résultat, Hors ligne, Hors région), écrans d'erreur (sortie expirée, 404, panne), premier lancement.
```

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 30/09/2026 | 1.0 | Création |
| 09/10/2026 | 1.1 | « Menu » dans la navigation basse (Explorer · Menu), comme la fiche E10 et `06` § 3 |
