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
| **Données des cartes de destination** : l'interface (`06` § 3.4) affiche dernier retour, prochain train, CO₂, prix et « Faisable dans la journée », que `/api/destinations` ne fournit pas ; `liaison_directe` n'a ni heures d'arrivée ni retours (et aucun retour pour une destination hors région). Choisir : enrichir `liaison_directe` / la réponse de `/api/destinations`, ou des appels séparés par carte | Audit du 09/10 ; `liaison_directe` retirée du schéma initial de E01 pour ne rien figer | **Avant E04** (19/10) |
| **Légende des temps de trajet sur la carte** : `design/prompts-ecrans.md` (prompt 1, § 4) demande « ≤ 30 min, ≤ 1 h, ≤ 1 h 30, > 1 h 30 » alors que `parametres.json` (`durees.tranchesTempsMin` = 30, 60, 120) et `05` donnent `<30`, `<60`, `<120`, `≥120` | Contradiction relevée le 09/10 ; aucun des deux corrigé | **Avant E11** |
| Lien de billetterie : où le ranger (`marque.ts`, `parametres.json` ou `sources.json`) | Fiche E12 | Avant E12 |
| Licence du code (ex. MIT) | Dépôt public depuis le 07/10 sans licence (« tous droits réservés ») ; décision reportée volontairement | E18 |

## 2. Actions humaines de Hardy (comptes, clés, fichiers)

| Quoi | Pour quelle étape | Déclencheur |
|---|---|---|
| Dépôt créé (public) et `main` protégée le 07/10. Vérifier que les SR sont invités et que le tableau `tourisme-en-train` existe — `equipe/travail-en-equipe.md` § 3.2, § 3.6 | E00 | Fin de E00 |
| Prévenir les SR que I01 démarre après la fusion de E01 (la date « vers le 11/10 » a été retirée des guides) | E01 | Au prochain point d'équipe |
| Créer les 41 tickets GitHub (E00 → E18, I01 → I22) avec le script préparé, puis le tableau `tourisme-en-train` | E00 | Semaine du 05/10, après la création du dépôt |
| Vérifier l'URL du CSV DATAtourisme de la région | E05 | Début E05 |
| Tester une extraction GéoDataMine pour les aires de jeux et parcs | E05 | Début E05 |
| Relire `categories_non_classees_*.csv` et compléter `categories.csv` | E05–E06 | Après chaque chargement de lieux |
| Choisir les réseaux urbains (GTFS/GBFS) sur transport.data.gouv.fr, et relever les URL `station_status.json` des vélos | E07 | Début E07 |
| Demander une clé API SNCF (gratuite) | E09 (P1) | Si le temps réel est lancé |
| Relever les facteurs CO₂ manquants et une source de prix au km | E09 | Début E09 |
| Vérifier la marque « Wagoo » (INPI, nom de domaine) | Avant publication | Avant E17/E18 |
| Envoyer `equipe/demarrage-SR.md` et `equipe/guide-SR.md` aux SR ; organiser la réunion de démarrage (`travail-en-equipe.md` § 4) | E00 | Dès la fin de la documentation |

## 2 bis. Seuils écrits en dur dans la documentation (règle 3)

Relevés par l'audit du 09/10. Chacun entre dans `config/parametres.json` (et son schéma) **à l'étape qui l'utilise**, puis la documentation cite la clé au lieu de la valeur.

| Seuil | Où dans la doc | Étape |
|---|---|---|
| Contrôles du nombre de gares (> 2 500 en France, > 100 dans la région) | `04` § 4.1, E02 | E02 |
| Distance de rapprochement arrêt GTFS ↔ gare (300 m) | `02` § 2.2, `04` § 4.2 | E03 |
| Longueur maximale d'une description (500 caractères) | `04` § 4.4, E05 | E05 |
| Similarité de nom Qualité Tourisme (0,6, zone incertaine 0,5–0,6) | `04` § 4.6 | E06 |
| Regroupement des quais de même nom (100 m) | `04` § 4.7, E07 | E07 |
| Bornes de position France métropolitaine (lat 41–51,5, lon −5,5–10) | `05` § 1.6 | E08 |
| Fenêtre du temps réel (3 prochaines heures) | `05` § A.2, `06` § 4, D021, E09 | E09 |
| Arrondi de position du cache de géocodage inverse (~100 m) | `05` § 3.11 bis | E09 |
| Nombre d'étiquettes sur la carte (5) | `06` § 3, D021 | E11 |

## 3. Reporté volontairement (après la soutenance ou si le temps le permet)

| Quoi | Pourquoi reporté | Déclencheur |
|---|---|---|
| **Plusieurs régions / plusieurs clients** : un dossier de configuration par région (`config/regions/<code>/` : paramètres, sources, marque, couleurs, logo, choisi par une variable `REGION`) et une instance par client (application + base séparées) | Intérêt commercial non encore validé ; déjà préparé à moindre coût (D027) : il resterait environ 1 jour de travail | Une autre région ou un client intéressé, ou retours positifs après le défi |
| Favoris (F27) | Non essentiel au parcours | P0 et P1 terminés |
| Badge « pépite méconnue » (F22) | Données Insee à croiser | Après la soutenance |
| Places MAX JEUNE / SENIOR (F23) | Public ciblé | Après la soutenance |
| Connexion Google (F24) | Promesse « sans inscription » | Besoin de synchroniser des favoris |
| Transport à la demande | Données quasi inexistantes (D020) | Un réseau le publie en GTFS-Flex |
| Itinéraire piéton réel | Moteur de routage nécessaire | Après la soutenance |
| Extension nationale | Volume et temps | P0 + P1 terminés avant le gel (27/11) |
| Carte hors ligne (PMTiles régional) | Optionnel pour la démo | E16, si réseau incertain le jour J |
| Skills Claude Code (voir D016) | Garder une seule méthode au départ | Si un besoin précis apparaît (ex. tests navigateur en E15) |

## 4. Idées d'évolution

| Idée | Intérêt |
|---|---|
| Mode « Surprends-moi » : une destination au hasard à moins d'une heure | Découverte, ludique |
| Espace pour les offices de tourisme (mise en avant de lieux) | Objectif « collectivités » du défi |
| Accidents évités (statistique indicative) | Bénéfice cité par le défi |
| Notifications de retard pour une sortie enregistrée | Utile avec comptes |
