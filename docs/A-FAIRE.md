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

## 2. Actions humaines de Hardy (comptes, clés, fichiers)

| Quoi | Pour quelle étape | Déclencheur |
|---|---|---|
| Créer le dépôt GitHub `tourisme-en-train` (public conseillé), inviter les SR, protéger `main`, créer le tableau `tourisme-en-train` — pas-à-pas : `equipe/travail-en-equipe.md` § 2–3 | E00 | Début E00 |
| Installer Docker Desktop (moteur WSL2), Node 24, pnpm, Git | E00 | Début E00 |
| Créer les 41 tickets GitHub (E00 → E18, I01 → I22) avec le script préparé, puis le tableau `tourisme-en-train` | E00 | Semaine du 05/10, après la création du dépôt |
| Vérifier l'URL du CSV DATAtourisme de la région | E05 | Début E05 |
| Tester une extraction GéoDataMine pour les aires de jeux et parcs | E05 | Début E05 |
| Relire `categories_non_classees_*.csv` et compléter `categories.csv` | E05–E06 | Après chaque chargement de lieux |
| Choisir les réseaux urbains (GTFS/GBFS) sur transport.data.gouv.fr, et relever les URL `station_status.json` des vélos | E07 | Début E07 |
| Demander une clé API SNCF (gratuite) | E09 (P1) | Si le temps réel est lancé |
| Relever les facteurs CO₂ manquants et une source de prix au km | E09 | Début E09 |
| Vérifier la marque « Wagoo » (INPI, nom de domaine) | Avant publication | Avant E17/E18 |
| Envoyer `equipe/demarrage-SR.md` et `equipe/guide-SR.md` aux SR ; organiser la réunion de démarrage (`travail-en-equipe.md` § 4) | E00 | Dès la fin de la documentation |

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
