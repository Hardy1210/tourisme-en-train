# E10 — Socle de l'interface : design system, mise en page, composants

> **Semaine :** S6 (09/11 → 15/11) · **Priorité :** P0 (mode sombre P1) · **Branche :** `etape/E10-socle-interface`
> **Étapes préalables :** E00 (peut commencer en parallèle de E08–E09) · **État :** ⬜ à faire
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
- [ ] Fournir le fichier `globals.css` préparé et les maquettes Claude Design (écran Explorer, fiche destination, planche de composants).
- [ ] Valider visuellement la planche de composants avant E11.

## Phase d'audit
1. Comparer `globals.css` fourni et `06` § 2 ; lister les tokens manquants.
2. Relire les maquettes : lister les composants nécessaires ; distinguer **aspect** (à copier) et **comportement** (à vérifier).
3. Proposer le plan ; attendre la validation.

## Tâches
- [ ] Intégrer `globals.css` dans `src/styles/` ; remplacer toute mention « Pas Loin » par une référence neutre ; vérifier la compilation Tailwind 4.
- [ ] Polices via `next/font` : Bricolage Grotesque (titres), Inter (texte), JetBrains Mono ; reliées aux variables `--font-*-family`.
- [ ] shadcn/ui initialisé **sur les tokens** (aucune couleur shadcn par défaut restante).
- [ ] Composants `components/ui/` : `Bouton` (principal/secondaire/fantôme), `Puce` (catégorie active/inactive, avec icône), `Feuille` (bottom sheet glissante, accessible), `Onglets`, `Carte`, `Badge`, `Squelette`, `Bandeau`, `ChampRecherche`, `Interrupteur`, `Selecteur`.
- [ ] `features/lieux/ui/icone-categorie.tsx` : correspondance catégorie → icône Lucide + token.
- [ ] Mise en page `(app)/layout.tsx` : en-tête collant (marque), navigation basse (Explorer, Menu : À propos · Sources des données) — pas de bouton « Mes sorties » en v1 (favoris = P2), zones sûres (`safe-top`, `safe-bottom`).
- [ ] Fournisseur TanStack Query.
- [ ] (P1) Mode sombre : bascule par classe `.dark` (décision de dépendance si `next-themes`).
- [ ] Page `/design` **en développement uniquement** : planche de tous les composants et états.

## Critères d'acceptation
- [ ] Recherche dans le code : aucune couleur hexadécimale/oklch, aucun `rounded-[…]` arbitraire hors `globals.css`.
- [ ] Modifier `--brand-hue` dans `globals.css` change la couleur principale partout (test manuel, puis retour à la valeur).
- [ ] Composants utilisables au clavier ; focus visible.
- [ ] Cibles tactiles ≥ 44 px.

## Vérifications manuelles
- Planche `/design` en 390 px et 1440 px, clair (et sombre si P1).

## À ne pas toucher
- API, données.

## Fin d'étape
Voir `_MODELE.md`. Mettre à jour `06` § 2 (composants réels).

## Notes et modifications après coup
- 05/10/2026 : semaine recalée sur la feuille de route (démarrage réel le 05/10 ; P0 le 22/11) — D025.
- 05/10/2026 : bouton « Mes sorties » retiré de la navigation (favoris en P2, voir `06` § 4 bis).
