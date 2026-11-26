# E19 — Lieux ajoutés à la main : sites hors du périmètre, accès particulier, fiche enrichie

> **Semaine :** après la soutenance · **Priorité :** P2 (F28) · **Branche :** `etape/E19-lieux-ajoutes`
> **Étapes préalables :** E05, E06, E12, D123 · **État :** ⬜ à faire — **architecture proposée le 26/11, à valider par Hardy**
> **Version de la fiche** 1.0 · **Date** 26/11/2026

## Contexte minimal
Un lieu est montré près d'une gare s'il est « à pied » (`acces.rayonPiedM`, 2 km, calculé pour toutes les gares, D091). Des sites très touristiques sont plus loin, mais faisables dans la journée : navette depuis la gare, bus, fête qui attire du monde tous les deux ans, randonnée. Les laisser de côté pénalise l'application (Hardy, 26/11). Besoin : **choisir un lieu à la main, dire comment y aller depuis la gare, lui donner une fiche plus riche que les autres**, sans élargir le périmètre pour tous ni casser l'existant.

## Principes : pourquoi rien d'existant ne casse
1. **Uniquement des ajouts.** Aucune table existante ne change de sens : `lieu_gare` reste « à pied, calculé » (D091) ; `gare_stats`, les destinations, la carte, les rayons et la règle des trains directs (règle 6) ne bougent pas.
2. **Des fichiers du dépôt, relus en PR**, validés par **un seul schéma Zod** (`packages/commun`), chargés par une étape du traitement. **Jamais de saisie directe en base** (règle 10 : la démo doit rester reproductible). Plus tard, un écran d'administration écrira les mêmes tables.
3. **Rangé par la clé du lieu** (D052), jamais par son nom. Les lieux gardent leur identifiant d'un chargement à l'autre (`ON CONFLICT (source, id_source)`, `etl/src/chargement/lieux.ts`) : un enrichissement tient dans la durée.
4. **Chaque ligne dit son origine** (`wagoo`), comme `description_lieu` (D123) : chaque traitement ne remplace que ses propres lignes.
5. **Les écrans choisissent par des fonctions pures** (priorité, dates de visibilité avec `dateDuJour`) et s'ouvrent à la nouveauté un par un.
6. **Rien n'est calculé** pour aller de la gare au lieu : on décrit l'accès (mode, durée, lien officiel), on ne calcule pas d'itinéraire. Le train reste direct.

## Architecture proposée

### 1. Le lieu
| Cas | Ce qu'on fait |
|---|---|
| Le lieu existe déjà (OSM, DATAtourisme), mais loin des gares | **On ne le recrée pas** : le fichier le désigne par sa clé (`osm-way-…`, `datatourisme-…`) et l'enrichit |
| Il n'existe dans aucune source | Créé dans `lieu` avec la **source `wagoo`** (nouvelle entrée de `config/sources.json`, citée dans l'écran « Sources », règle 8) ; `id_source` = un nom court choisi (`chateau-de-x`), donc la clé `wagoo-chateau-de-x`, stable |

Un lieu `wagoo` est un lieu comme les autres : fiche, recherche, « Près de vous », photo et texte Wikipédia s'il a un article, **sans toucher aux écrans**. Contrôle bloquant : un lieu créé à moins de `dedoublonnage.distanceM` d'un lieu au nom proche → « ce lieu existe déjà : utilisez sa clé ». `wagoo` passe en tête de `dedoublonnage.prioriteSources`, par sécurité.

### 2. Comment y aller depuis la gare : table `acces_lieu` (nouvelle)
| Colonne | Type | Rôle |
|---|---|---|
| `lieu_id` | bigint, FK → lieu, cascade | |
| `gare_id` | integer, FK → gare | Gare d'arrivée du train direct |
| `mode` | text, CHECK in (`navette`, `bus`, `car`, `velo`, `taxi`, `pied`) | Dernier bout du trajet |
| `duree_min` | smallint, nul permis | Durée annoncée par l'exploitant, affichée « selon l'exploitant » |
| `detail` | text NN | « Navette gratuite les jours de fête, toutes les 30 min » |
| `lien` | text | Horaires officiels |
| `debut`, `fin` | date, nulles = toute l'année | Navette saisonnière : montrée seulement entre les deux (`dateDuJour`, comme les droits des photos, D100) |
| `origine` | text, CHECK in (`wagoo`) | Plus tard `gtfs` (bus trouvés dans les données ouvertes, sans nouvelle table) |

PK (`lieu_id`, `gare_id`, `mode`).

**Pourquoi pas des lignes de plus dans `lieu_gare` :** presque tous les écrans lisent `lieu_gare` comme « à pied » (minutes à pied, bulles de la carte, `gare_stats`, rangées de Lieux). Y mettre des navettes obligerait chaque requête à les distinguer ; une seule oubliée afficherait « 52 min à pied » pour une navette. Une table à part ne change rien à l'existant : chaque écran choisit de la lire.

### 3. Fiche enrichie : table `bloc_lieu` (nouvelle)
Des **blocs** affichés dans la fiche du lieu, en plus de ce qu'ont toutes les fiches :

| Colonne | Type | Rôle |
|---|---|---|
| `lieu_id` | bigint, FK → lieu, cascade | |
| `ordre` | smallint | Ordre dans la fiche ; PK (`lieu_id`, `ordre`) |
| `type` | text, CHECK in (`texte`, `evenement`, `randonnee`, `conseil`, `lien`) | Chaque type a son composant |
| `titre` | text NN | « Fête de la sorcière » |
| `contenu` | jsonb NN | Validé par un schéma Zod **par type** (`packages/commun`, le même pour l'étape et l'application) |
| `debut`, `fin` | date, nulles = toujours | Fenêtre d'affichage : un événement n'est montré qu'à l'approche de ses dates |
| `credit` | text NN | « Wagoo », ou l'établissement qui a fourni l'information |
| `origine` | text, CHECK in (`wagoo`) | |

- **Événement qui revient tous les deux ans :** on n'invente pas de date. Le fichier donne **la prochaine édition**, avec ses dates. Une fois `fin` passée, le bloc disparaît, et le rapport de l'étape signale « événement à mettre à jour ».
- **Ajouter un type de bloc** = une valeur dans la contrainte (migration d'une ligne), un schéma Zod, un composant. Jamais une colonne de plus dans `lieu`.
- **Écarté :** des colonnes propres dans `lieu` (vides pour 99 % des lieux, une migration par sorte d'information) ; un seul JSON par lieu (ni dates par bloc, ni crédit par bloc, impossible à modifier bloc par bloc dans un futur écran d'administration).

**Description et photo**, déjà prévues ailleurs :
- description → `description_lieu`, origine `wagoo` (D123, **déjà prête**), qui passe avant toutes les autres ;
- photo → `photo_lieu`, origine `wagoo` (contrainte à étendre d'une valeur). Fichier dans `apps/web/public/lieux/` (quelques dizaines au plus, puis un stockage à part). **L'autorisation écrite** de l'établissement (qui, quand) est gardée dans le fichier du lieu, jamais affichée. L'étape `photos` remplace toute sa table : elle lit donc la photo `wagoo` comme **premier candidat**, au lieu d'une autre étape qui l'écraserait.

### 4. Le fichier d'un lieu
Un fichier par lieu : `etl/src/regles/lieux/<nom-court>.json`. Un fichier par lieu, c'est une PR lisible et pas de conflit entre deux lieux. Format JSON : pas de nouvelle dépendance. Le CSV des corrections ne convient pas à des paragraphes et des listes.
```json
{
  "cle": "osm-way-123456",
  "description": { "texte": "…", "credit": "Wagoo" },
  "photo": { "fichier": "chateau-de-x.webp", "credit": "Château de X", "autorisation": "courriel du 12/01/2027" },
  "acces": [
    { "gare": "87713040", "mode": "navette", "dureeMin": 20, "detail": "…", "lien": "https://…", "debut": "2027-06-01", "fin": "2027-09-30" }
  ],
  "blocs": [
    { "type": "evenement", "titre": "Fête de la sorcière", "debut": "2027-08-01", "fin": "2027-09-13",
      "contenu": { "dates": "12 et 13 septembre 2027", "texte": "…", "lien": "https://…" }, "credit": "Office de tourisme" }
  ]
}
```
Lieu à créer : `"cle"` remplacé par `"nouveau": { "nomCourt", "nom", "categorie", "lat", "lon", … }`.

### 5. Étape `pnpm etl lieux_wagoo`
- **Ordre :** après `datatourisme` et `osm` (les lieux à enrichir existent), **avant `rattachements`** (un lieu créé reçoit doublons, sites et gares à pied comme les autres). À relancer après chaque `datatourisme` ou `osm` (une clé peut disparaître).
- **Chargement**, dans une transaction : lieux `wagoo` mis à jour, ceux dont le fichier a été retiré supprimés ; lignes `wagoo` de `acces_lieu`, `bloc_lieu` et `description_lieu` remplacées.
- **Contrôles bloquants :** fichier qui ne respecte pas le schéma ; clé ou gare inconnue ; lieu créé en double d'un lieu existant ; dates incohérentes. **Avertissement :** événement passé. **Rapport :** un résumé par lieu, à relire par Hardy.

### 6. Écrans (une PR par écran)
1. **Fiche du lieu :** « Comment y aller » (gare, mode, durée « selon l'exploitant », lien), puis les blocs visibles à la date du jour ; description choisie par la priorité (D123).
2. **Fiche destination :** une section « Plus loin, avec une navette » sous les lieux à pied, avec les lieux de `acces_lieu` de cette gare.
3. **Sources :** la source `wagoo` et les crédits des établissements.
4. Plus tard : rangées de l'onglet Lieux, épingle sur la carte, bulles.

### 7. Écarté
- **Élargir le périmètre pour tous** : 3 km, c'est 472 lieux de plus et ≈ 40 min de marche ; 2,5 km, 230 de plus et ≈ 33 min (mesures du 26/11, `A-FAIRE` § 1). Ça ne règle pas les grands sites loin des gares.
- **Des lignes « navette » dans `lieu_gare`** (§ 2, D091).
- **Calculer un trajet en bus** depuis les horaires des réseaux locaux : presque un calcul d'itinéraire, et les navettes saisonnières manquent souvent dans les données ouvertes. Plus tard, cela remplira `acces_lieu` avec l'origine `gtfs`, sans nouvelle table.
- **Saisie directe en base** (principe 2).

## Documents à lire (et seulement ceux-là)
- `CLAUDE.md` (toujours)
- `docs/DECISIONS.md` D043, D052, D091, D093, D100, D123
- `docs/03-base-de-donnees.md` § 3.6 à 3.8 · `docs/04-traitement-donnees.md` § 4.5, 4.6, 4.6 bis, 4.6 quater
- `docs/06-interface.md` (fiche lieu, fiche destination) · `docs/05-api.md` (route de la fiche lieu)

## Objectif
Pouvoir ajouter à la main un lieu hors du périmètre, avec son accès depuis une gare et une fiche enrichie, sans rien changer à ce qui existe.

## Résultat attendu
Un ou deux lieux pilotes choisis par Hardy, ajoutés par un fichier relu en PR : visibles dans leur fiche (« Comment y aller », blocs) et dans la fiche destination de leur gare ; aucun écran existant changé pour les autres lieux.

## Actions de Hardy
- [ ] Valider l'architecture (ou la corriger) avant tout code ; elle deviendra une décision (D-numéro) à ce moment-là.
- [ ] Choisir 1 ou 2 lieux pilotes, et réunir leurs informations (accès, événements, liens officiels).
- [ ] Obtenir l'autorisation écrite d'un établissement avant d'utiliser ses textes ou ses photos.
- [ ] Décider la licence de nos propres contenus (publication sur data.gouv.fr, E18).

## Phase d'audit (obligatoire, avant tout code)
1. Relire cette architecture avec le code du moment (elle date du 26/11).
2. Lister toutes les requêtes qui lisent `lieu_gare` : vérifier qu'aucune n'a besoin de `acces_lieu` pour rester juste.
3. Proposer le plan des PR et **attendre la validation de Hardy**.

## Tâches (une PR chacune, dans cet ordre)
- [ ] Documents : `GLOSSAIRE` (lieu ajouté, accès particulier, bloc de fiche), `03` (tables), `04` (étape), `02` (source `wagoo`), décision.
- [ ] Migration : `acces_lieu`, `bloc_lieu`, origine `wagoo` de `photo_lieu`, source `wagoo` ; schéma Zod du fichier.
- [ ] Étape `lieux_wagoo` et ses rapports ; candidat `wagoo` dans `photos`.
- [ ] Fiche du lieu : « Comment y aller » et blocs.
- [ ] Fiche destination : « Plus loin, avec une navette ».
- [ ] Sources ; lieux pilotes.

## Critères d'acceptation (en paires)
- [ ] Un lieu à 4 km avec une navette apparaît dans la fiche destination de sa gare ; **limite :** il n'apparaît dans aucune liste « à pied », et aucune durée à pied n'est affichée pour lui.
- [ ] Une navette saisonnière est montrée pendant sa période ; **limite :** le lendemain de `fin`, elle ne l'est plus (date d'été et date d'hiver, CLAUDE.md § 3).
- [ ] Un événement est montré dans sa fenêtre ; **limite :** passé, il disparaît et le rapport le signale.
- [ ] Un lieu existant enrichi par sa clé garde ses données de source ; **limite :** une clé inconnue fait échouer l'étape.
- [ ] Notre description passe avant toutes les autres ; **limite :** retirée du fichier, la suivante revient.
- [ ] Recharger `osm` ne perd aucun enrichissement d'un lieu toujours présent.

## Vérifications manuelles
- Fiche du lieu pilote et fiche destination de sa gare sur l'iPhone.

## Estimation
Environ 4 jours (estimation, pas une mesure).

## À ne pas toucher
- `lieu_gare`, `gare_stats`, `acces.rayonPiedM`, la règle des trains directs (règle 6).

## Fin d'étape
- Définition de « terminé » : `08-conventions-qualite.md` § 10.
- Mettre à jour : documents de référence touchés, `CLAUDE.md` § 8, § 9 et § 16, `DECISIONS.md`, `A-FAIRE.md`.
- Pull request `etape/E19-…` → `main`.

## Notes et modifications après coup
