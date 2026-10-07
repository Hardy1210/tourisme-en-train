# 00 — Vision, utilisateurs et périmètre

> **Version** 1.1 · **Date** 30/09/2026
> **Dépend de :** `GLOSSAIRE.md`
> **Utilisé par :** tous les documents ; en particulier `05-api.md`, `06-interface.md`, fiches E08 → E13
> **Document de référence pour :** le produit, les fonctionnalités, les priorités, le périmètre.

---

## 1. Le problème

Organiser une sortie, un week-end ou des vacances **sans voiture** oblige aujourd'hui à passer d'un site à l'autre : un pour les châteaux, un pour les aires de jeux, un pour la nature, un pour les horaires de train, un pour les bus sur place. Chaque site ne répond qu'à une question. Et surtout, **on ne sait pas ce qui existe**, ni près de chez soi, ni ailleurs.

Résultat : une à deux heures d'organisation, du stress, et souvent on reprend la voiture.

## 2. Pourquoi c'est important (chiffres du pitch)

| Constat | Chiffre | Source |
|---|---|---|
| Émissions du tourisme en France (2022) | 97 Mt CO₂e | ADEME |
| Part des transports | 69 %, dont plus de la moitié due à la voiture | ADEME |
| CO₂ pour 100 km, par personne | voiture thermique ≈ 14 kg · TER ≈ 2,8 kg · TGV ≈ 0,3 kg | ADEME — Impact CO2 |
| Sécurité routière 2025 | 3 515 morts, près de 10 par jour | ONISR |

Limite à connaître : pour 4 personnes dans une voiture, le CO₂ par personne de la voiture se rapproche de celui du TER. L'app montre donc aussi la voiture partagée (règle d'honnêteté, voir `04-traitement-donnees.md` § Impact).

## 3. La promesse

> **Trouver une sortie en 30 secondes, et y aller en train.**

L'application répond à deux questions :
1. **« Qu'est-ce que je peux faire autour de moi ? »**
2. **« Où puis-je aller aujourd'hui en train direct, et qu'y a-t-il à voir ? »**

Ordre d'importance des transports : **1. le train** · **2. les transports en ville** à l'arrivée · **3. la marche** depuis la gare.

## 4. Lien avec le défi « Tourisme en train »

| Frein identifié par le défi | Réponse |
|---|---|
| Méconnaissance des destinations accessibles en train | Destinations en train direct depuis sa gare, triées par durée, colorées par tranche de temps sur la carte |
| Manque d'information sur l'offre touristique près des gares | Lieux catégorisés à distance de marche des gares ; mode « Autour de moi » |
| Difficulté à se déplacer sans voiture sur place | Arrêts de bus/tram, stations de vélos proches de la gare ; aménagements cyclables (P1) |
| Bénéfices du train peu visibles | CO₂ comparé : train, voiture seule, voiture partagée, avion |
| Objectif « destinations moins connues » (collectivités) | Mise en avant de toutes les gares desservies, pas seulement les grandes villes ; badge « pépite méconnue » (P2) |

## 5. Utilisateurs

| Persona | Situation | Besoin principal |
|---|---|---|
| **Famille périurbaine** (cible principale) | 2 enfants, vit à 10–25 km d'une ville, samedi sans plan | Sortie avec aire de jeux, faisable dans la journée, retour avant le soir |
| **Célibataire** | Week-end libre, pas de voiture | Idée rapide, sans organisation |
| **Touriste de passage** | Dans une ville inconnue, parfois bloqué par un train supprimé | Ce qu'il y a à pied depuis la gare |
| **Voyageur qui prépare un séjour** | Veut savoir comment se déplacer une fois arrivé | Transports sur place, lieux près de la gare |

Pas de compte, pas d'inscription en v1.

## 6. Fonctionnalités

Priorités : **P0** indispensable au rendu · **P1** prévu, abandonné seulement en cas de retard · **P2** bonus, après la soutenance si besoin.

| ID | Fonctionnalité | Description | Prio | Étape |
|---|---|---|---|---|
| F01 | Localisation automatique | Position demandée à l'ouverture ; refus → recherche de ville/adresse | P0 | E11 |
| F02 | Autour de moi | Résultats immédiats : lieux à pied et gares proches de la position | P0 | E08, E11 |
| F03 | Gare de départ | Les gares les plus proches, avec distance ; changement possible | P0 | E08, E11 |
| F04 | Destinations en train direct | Gares atteignables sans correspondance à la date choisie : durée, fréquence, premier départ, dernier retour | P0 | E04, E08, E11 |
| F05 | Filtres | Rayon, durée de train maximale, autre ville, catégories, date | P0 | E11 |
| F06 | Fiche destination | Lieux à pied depuis la gare, description, image et horaires si disponibles, lien officiel | P0 | E09, E12 |
| F07 | Trains aller / retour | Trains directs de la date (horaires théoriques), dernier retour mis en avant | P0 | E09, E12 |
| F08 | Carte | Position, gares, lieux par catégorie ; gares colorées par tranche de temps (isochrone simplifiée) ; bascule liste/carte | P0 | E11 |
| F09 | Transports sur place | Arrêts de bus/tram, stations de vélos et trottinettes proches de la gare d'arrivée | P0 | E07, E09, E12 |
| F10 | Impact CO₂ | Train vs voiture seule vs voiture partagée (vs avion au-delà d'un seuil), source affichée | P0 | E09, E12 |
| F11 | Prix estimé | Fourchette au kilomètre, libellée « estimation », lien billetterie | P0 | E09, E12 |
| F12 | PWA | Installable, dernières recherches consultables hors ligne | P0 | E14 |
| F13 | Sources et licences | Écran listant sources, licences et attributions | P0 | E13 |
| F14 | Page « L'âme du produit » | Présentation narrative du projet (pitch) | P0 | E13 |
| F15 | Faisable dans la journée | Badge « Faisable dans la journée » ; sinon mention « Retour tôt, plutôt sur 2 jours » | P1 | E12 |
| F16 | Tracés des lignes | Lignes ferroviaires dessinées sur la carte | P1 | E07, E11 |
| F17 | Aménagements cyclables | Voies vertes et pistes à proximité de la gare d'arrivée | P1 | E07, E12 |
| F18 | Retards en temps réel | Statut des **prochains trains d'aujourd'hui uniquement** via l'API SNCF ; par défaut, horaires théoriques sans statut | P1 | E09, E12 |
| F19 | Accessibilité | WCAG 2.1 AA : contrastes, clavier, liste équivalente à la carte | P1 | E15 |
| F20 | Mode sombre | Via les tokens du design system | P1 | E10 |
| F21 | Partage d'une sortie | Bouton « Partager » : copie le lien (les filtres sont dans l'URL) ou ouvre le partage du téléphone | P1 | E11, E12 |
| F25 | Ce week-end | L'option « Ce week-end » ouvre le samedi ; la fiche propose de passer au dimanche | P1 | E11, E12 |
| F26 | Vélos disponibles | Nombre de vélos disponibles en direct dans les stations proches de la gare (villes publiant un flux GBFS) | P1 | E07, E09, E12 |
| F27 | Favoris | Favoris dans le navigateur | P2 | après |
| F22 | Pépite méconnue | Badge : beaucoup de lieux, peu de fréquentation (Insee) | P2 | après |
| F23 | Places MAX JEUNE / SENIOR | Badge de disponibilité | P2 | après |
| F24 | Connexion Google | Synchroniser les favoris (Auth.js) | P2 | après |

## 7. Parcours principal

```
Ouverture
 → localisation (F01)            refus → recherche de ville
 → Autour de moi (F02) + gare la plus proche (F03)
 → destinations en train direct (F04), filtrables (F05), sur carte (F08)
 → fiche destination (F06) : Lieux · Trains (F07) · Sur place (F09) · Impact (F10, F11)
 → lien vers l'achat du billet
```

Mesure de succès du parcours : **moins de 30 secondes** entre l'ouverture et l'affichage des trains d'une destination choisie.

## 8. Périmètre géographique

- **v1 : Bourgogne-Franche-Comté** (code région INSEE 27). Toutes les données sont filtrées sur cette région.
- Les destinations hors région atteignables en train direct apparaissent, mais **leurs lieux ne sont pas chargés** en v1 : la fiche l'indique honnêtement.
- **Extension nationale :** changer `region` dans `config/parametres.json` et relancer l'ETL. À tenter seulement si P0 et P1 sont terminés.

## 9. Hors périmètre (assumé)

| Exclu | Raison | Pourrait revenir si… |
|---|---|---|
| Itinéraire avec correspondances | Exigence de réalisme du défi | Un moteur dédié est intégré (après la v1) |
| Prix réels, réservation | Aucune source ouverte | Une API tarifaire ouverte existe |
| Comptes utilisateurs | Promesse « sans inscription » | Besoin de synchroniser des favoris (F24) |
| Itinéraire piéton réel | Complexité (moteur de routage) | Après la v1, via un moteur OSM |
| Outre-mer | Autres fuseaux, autres réseaux | Extension nationale réussie |
| Transport à la demande | Presque jamais publié en données ouvertes ; saisie manuelle non fiable | Un réseau le publie proprement (GTFS-Flex) |

## 10. Nom

Nom de code : `tourisme-en-train`. Marque : **Wagoo** (provisoire), définie uniquement dans `apps/web/src/config/marque.ts`.

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 30/09/2026 | 1.0 | Création |
| 30/09/2026 | 1.1 | Alignement sur la maquette Explorer : partage (P1), week-end (P1), vélos disponibles (P1), temps réel limité à aujourd'hui, transport à la demande exclu — D017 à D020 |
