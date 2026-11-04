# E10 — Socle de l'interface : design system, mise en page, composants

> **Semaine :** S6 (09/11 → 15/11) · **Priorité :** P0 (mode sombre P1) · **Branche :** `etape/E10-socle-interface`
> **Étapes préalables :** E00 (peut commencer en parallèle de E08–E09) · **État :** ✅ terminée, P1 du mode sombre à part
> **Version de la fiche** 1.0 · **Date** 30/09/2026

## Contexte minimal
L'API est prête ou presque. Avant de construire les écrans, on installe le design system centralisé (`globals.css`), les polices, les composants de base et la mise en page commune (en-tête, navigation basse), pour que tous les écrans partagent le même langage visuel.

## Documents à lire
- `CLAUDE.md` (§ 2 règles 1–2, § 11 Design)
- `docs/06-interface.md` (§ 1, § 2, § 8, § 9, § 10)
- `apps/web/src/styles/globals.css`
- Maquettes Claude Design validées par Hardy (si disponibles)

## Objectif
Un socle visuel complet et centralisé : changer une ligne de `globals.css` change toute l'app.

## Actions de Hardy
- [x] Fournir le fichier `globals.css` préparé et les maquettes Claude Design (écran Explorer, fiche destination, planche de composants).
- [x] Valider visuellement la planche de composants avant E11.

## Phase d'audit
1. Comparer `globals.css` fourni et `06` § 2 ; lister les tokens manquants.
2. Relire les maquettes : lister les composants nécessaires ; distinguer **aspect** (à copier) et **comportement** (à vérifier).
3. Proposer le plan ; attendre la validation.

## Tâches
- [x] Intégrer `globals.css` dans `src/styles/` ; remplacer toute mention « Pas Loin » par une référence neutre ; vérifier la compilation Tailwind 4.
- [x] Polices via `next/font` : Bricolage Grotesque (titres), Inter (texte), JetBrains Mono ; reliées aux variables `--font-*-family`.
- [x] shadcn/ui initialisé **sur les tokens** (aucune couleur shadcn par défaut restante).
- [x] Composants `components/ui/` : `Bouton` (principal/secondaire/fantôme), `Puce` (catégorie active/inactive, avec icône), `Feuille` (bottom sheet glissante, accessible), `Onglets`, `Carte`, `Badge`, `Squelette`, `Bandeau`, `ChampRecherche`, `Interrupteur`, `Selecteur`.
- [x] `features/lieux/ui/icone-categorie.tsx` : correspondance catégorie → icône Lucide + token.
- [x] Mise en page `(app)/layout.tsx` : en-tête collant (marque), navigation basse (Explorer, Menu : À propos · Sources des données) — pas de bouton « Mes sorties » en v1 (favoris = P2), zones sûres (`safe-top`, `safe-bottom`).
- [x] Fournisseur TanStack Query.
- [ ] (P1) Mode sombre : bascule par classe `.dark` (décision de dépendance si `next-themes`).
- [x] Page `/design` **en développement uniquement** : planche de tous les composants et états.

## Critères d'acceptation
- [x] Recherche dans le code : aucune couleur hexadécimale/oklch, aucun `rounded-[…]` arbitraire hors `globals.css`.
- [x] Modifier `--brand-hue` dans `globals.css` change la couleur principale partout (test manuel, puis retour à la valeur).
- [x] Composants utilisables au clavier ; focus visible.
- [x] Cibles tactiles ≥ 44 px.

## Vérifications manuelles
- Planche `/design` en 390 px et 1440 px, clair (et sombre si P1).

## À ne pas toucher
- API, données.

## Fin d'étape
Voir `_MODELE.md`. Mettre à jour `06` § 2 (composants réels).

## Notes et modifications après coup
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
- 05/10/2026 : bouton « Mes sorties » retiré de la navigation (favoris en P2, voir `06` § 4 bis).
- 09/10/2026 : la mention « Pas Loin » n'existe plus dans `design/globals.css` : la tâche de remplacement est sans objet (vérifier seulement à l'intégration). `06` § 3 et `design/prompts-ecrans.md` alignés sur la navigation de cette fiche.
- 04/11/2026 : audit fait (phase d'audit 1 et 2) ; plan, écarts du kit et dépendances dans `A-FAIRE` § 1. Hardy refait les maquettes : l'aspect des composants et de la mise en page attend la nouvelle version.
- 04/11/2026 : D053 : pas d'installateur shadcn, composants écrits à la main sur Radix. La tâche « shadcn/ui initialisé » devient : installer les dépendances de D053.
- 04/11/2026 : D054 : maquette `Explorer Mobile v3`. Navigation à 4 onglets (Explorer, Lieux, Mon espace, Menu), à la place de « Explorer, Menu ». Critère d'acceptation « `--brand-hue` » remplacé par : modifier `--primary` dans `globals.css` change la couleur principale partout. Ajouter le composant `Logo`, seul endroit du logo provisoire. `globals.css`, polices, fournisseur et icônes de catégorie faits le 04/11.
- 04/11/2026 : composants, `Logo`, `EtatVide`, navigation à 4 onglets et planche `/design` faits, en attente de la validation visuelle de Hardy. `Fenetre` attend la maquette desktop ; `Toast` reste reporté (P1). Lieux et Mon espace sont des pages provisoires ; À propos et Sources restent « Bientôt » dans le Menu jusqu'à E13. Critères vérifiés dans un navigateur (390 et 1440 px, clair et sombre). Les interrupteurs font 30 px de haut, mais leur rangée entière (56 px) est cliquable.
- 04/11/2026 : maquette `Explorer Desktop v3` reçue, mêmes tokens que la version mobile. À partir de 1024 px : rail de navigation à gauche et Menu en panneau flottant. Puces et onglets gardent 44 px sur grand écran (40 px dans la maquette), pour les écrans tactiles. Panneau de 440 px et fenêtres de filtres : E11 ; fiche latérale : E12 ; `Fenetre` n'a donc plus lieu d'être en E10.
- 04/11/2026 : planche et adaptation desktop validées par Hardy (« pour le moment ça va » ; des retouches restent possibles). Mode sombre (F20, P1) : la palette et la planche sont prêtes, la bascule pour l'utilisateur reste à faire.
