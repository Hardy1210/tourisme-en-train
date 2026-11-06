# E13 — Page « L'âme du produit » et écran Sources

> **Semaine :** S7 (16/11 → 22/11) · **Priorité :** P0 · **Branche :** `etape/E13-ame-sources`
> **Étapes préalables :** E10 (E09 pour `/api/sources`) · **État :** 🟡 en cours : écrans faits, textes du pitch à finir à la fin du projet
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
Le jury doit comprendre en une page pourquoi le projet existe (le pitch) et d'où viennent les données (obligation de licence). Ces deux écrans sont accessibles depuis « À propos ».

## Documents à lire
- `CLAUDE.md`
- `docs/06-interface.md` (§ 5, § 9)
- `docs/00-vision.md` (§ 1 → 3)
- `docs/05-api.md` (§ 3.12)

## Objectif
Page de présentation narrative + écran Sources complet.

## Actions de Hardy
- [ ] Fournir le texte **final** du pitch → `docs/equipe/pitch.md` (source unique des textes de la page).
- [ ] Fournir ou valider les captures d'écran de l'app pour la section « 3 étapes ».

## Phase d'audit
1. Vérifier que `docs/equipe/pitch.md` existe et que ses chiffres correspondent à `00` § 2 (sources citées).
2. Proposer la structure de la page ; attendre la validation.

## Tâches
- [x] `features/presentation/` : textes issus de `pitch.md` (copiés dans un fichier de contenu typé, pas dispersés dans le JSX).
- [ ] Sections : accroche, constat, 3 chiffres sourcés, solution en 3 étapes (captures), pour qui, ce que ça change, conclusion + « Ouvrir l'application ». **Fait :** accroche, constat, chiffre vérifié, solution, conclusion. **À la fin du projet :** 97 Mt et 69 %, 3 étapes et captures, pour qui, ce que ça change.
- [x] Écran Sources : `/api/sources` + attributions carte + mention du défi data.gouv.fr.
- [x] Le nom de la marque vient de `marque.ts` partout.
- [x] Page « Mentions légales et confidentialité » : éditeur, ce qui arrive à la position, pas de bandeau cookies.
- [ ] Mentions légales : nom de l'hébergeur, quand Hardy l'aura choisi (E17 lot 4). Éditeur et contact : faits.

## Critères d'acceptation
- [x] Chaque chiffre affiché a sa source visible.
- [x] Toutes les sources marquées `affichee` dans `config/sources.json` apparaissent avec leur licence (D051, D075).
- [x] Lisible en 390 px et 1440 px ; aucun texte en dur hors du fichier de contenu.

## À ne pas toucher
- Écrans Explorer et fiche destination.

## Fin d'étape
Voir `_MODELE.md`.

## Notes et modifications après coup
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
- 06/11/2026 : critère des sources aligné sur D051 (26 affichées sur 33) ; écran Sources par thème, licence des facteurs CO₂ corrigée, brouillon de `docs/equipe/pitch.md` — D075.
- 06/11/2026 : Hardy optimisera le pitch à la fin du projet : la page est construite sans les sections sans texte validé, et un chiffre non confirmé reste masqué (`confirme` dans `contenu-a-propos.ts`) — D075.
- 06/11/2026 : page « Mentions légales et confidentialité » ajoutée à l'étape, à la demande de Hardy, avant la mise en ligne (E17, D076).
