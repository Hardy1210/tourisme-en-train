# Journal des versions

> **Rôle :** la liste des nouveautés **visibles**, version par version, écrite pour un utilisateur ou un financeur, pas pour un développeur. Le pourquoi technique est dans `docs/DECISIONS.md`, le détail des sessions dans `docs/JOURNAL.md`.
> **Règle (D080) :** chaque pull request qui change ce que voit ou vit l'utilisateur ajoute **une ligne** sous « Non publié ». À chaque mise en ligne, Hardy relit cette rubrique, choisit le numéro, et la rubrique devient une version datée.
> **Numéros :** MAJEUR.MINEUR.CORRECTIF. **0.x** = concept en test ; un **correctif** (0.1.1) répare sans rien ajouter ; un **mineur** (0.2.0) ajoute des fonctionnalités ; **1.0.0** = le jour du premier client (Région ou autre).
> **Rubriques :** Ajouté · Modifié · Corrigé · Retiré.

## [Non publié]

### Corrigé
- La recherche de ville ne propose plus que des communes : « Beaune » ne fait plus apparaître des rues ou des hameaux du même nom dans d'autres départements (Sornac, Eymoutiers…). Partir de Paris reste possible.

## [0.1.0] — 07/11/2026

Première mise en ligne, sur `wagoo.hardylino.com` (commit `d1f0206`).

### Ajouté
- Explorer : position de l'utilisateur ou recherche de ville, gare de départ proposée, sorties à pied, destinations en train direct sur une carte et dans une liste, filtres (date, catégories, rayon, durée de train).
- Lieux : toutes les sorties autour, par catégorie.
- Fiche destination : lieux à pied, trains aller et retour, transports sur place, CO₂ économisé, prix estimé, lien vers la billetterie.
- Fiche lieu.
- Pages Sources, À propos et Mentions légales.
- Application installable sur téléphone, utilisable hors ligne pour les écrans déjà vus.
