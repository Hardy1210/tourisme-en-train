# Journal des sessions

> **Rôle :** une entrée par session de travail, ajoutée par le protocole « garde le contexte ».
> **Règle :** les entrées ne sont jamais modifiées après coup ; la plus récente est **en haut**.

---

## Modèle d'entrée

```
## JJ/MM/AAAA — Étape Exx — titre court
**Fait :**
-
**Décisions :** Dxxx, Dyyy (voir DECISIONS.md)
**Problèmes rencontrés :**
-
**À valider par Hardy :**
-
**Prochaine action :**
-
**Vérifications :** typecheck ✅/❌ · lint ✅/❌ · tests ✅/❌
**Commit :** <hash court>
```

---

## 09/10/2026 — Étape E00 — audit de la documentation, initialisation du code
**Fait :**
- Audit complet de la documentation (44 fichiers `.md`) : contradictions corrigées (versions de Node, navigation basse, historiques, date de I01, dépôt déjà public dans E18, message « hors région » écrit en dur), écarts reportés dans `A-FAIRE` (données des cartes de destination, seuils écrits en dur, légende de la carte, licence, lien de billetterie).
- Essai Serwist + Next.js 16 réussi (construction Turbopack, service worker actif et page hors ligne vérifiés par Hardy) : Next.js 16 retenu.
- E00 : espace de travail pnpm 11 ; `@tourisme/commun` (schéma unique et strict de `parametres.json`, `dateDuJour()`, `maintenantParis()`, journal JSON, catégories) ; `apps/web` (Next.js 16, `marque.ts`, variables validées au démarrage, `secondesVersHeure`) ; `etl` (`pnpm etl` avec arguments et variables validés). PR #43 fusionnée, ticket #2 fermé.
- Commits dans `main` : documentation et code de E00 regroupés par la fusion « squash » de la PR #43 (`49cb17b`).

**Décisions :** D029 (versions : Next.js 16, Zod 4, TypeScript 5.9.3, pnpm 11.24), D030 (port de la base côté poste, `BDD_PORT_HOTE`), D031 (exceptions `server-only` et `export default`, `maintenantParis()`, rôles créés par script, journal commun, `marque.ts` sans URL, règle des `null`).

**Problèmes rencontrés :**
- `@next/env` gardait en cache le premier chargement : le `.env` de la racine est chargé par `process.loadEnvFile` (Node 24) dans `next.config.ts`.
- Une page statique calcule ses métadonnées à la construction : `URL_APP` retirée du layout (elle serait figée dans l'image) ; à lire à l'exécution en E14.
- `next dev` crée un `AGENTS.md` en anglais : désactivé (`agentRules: false`), `CLAUDE.md` reste le seul fichier maître.
- pnpm 11 bloque les scripts d'installation : `allowBuilds` dans `pnpm-workspace.yaml` (esbuild autorisé, unrs-resolver refusé).
- Le Chromium de Playwright ne démarre pas dans WSL (`libnspr4` manquant) : vérification du navigateur faite par Hardy sous Windows. À régler avant les tests Playwright (E11) : `sudo npx playwright install-deps`.
- Le port 5432 du poste est occupé par un autre projet : `BDD_PORT_HOTE=5433` dans le `.env` de Hardy.

**À valider par Hardy :**
- Données des cartes de destination (avant E04) ; légende de la carte (avant E11).

**Prochaine action :**
- Lire `docs/etapes/E01-docker-base.md`, phase d'audit, plan.

**Vérifications :** typecheck ✅ · lint ✅ · format ✅ · tests ✅ (31)
**Commit :** `49cb17b` (fusion de E00) ; sauvegarde sur `etape/E01-docker-base`

---

## 30/09/2026 — Préparation — documentation d'architecture
**Fait :**
- Analyse du défi, choix des sources, pitch, répartition DEV / SR.
- Rédaction de `CLAUDE.md`, du glossaire, des documents 00 → 08, de `DECISIONS.md`, `A-FAIRE.md`, des fiches E00 → E18 et du guide SR.
- Design system `globals.css` et prompt Claude Design préparés (hors dépôt pour l'instant).

**Décisions :** D001 → D016.
**À valider par Hardy :** relecture de la documentation.
**Prochaine action :** créer le dépôt et lancer E00.
