# Organisation GitHub

> **Pour :** Hardy, et tout futur coéquipier.
> **Version** 2.0 · 06/11/2026
> **Liés :** `docs/07-contrat-infra.md` · `infra/README.md` · `.github/CODEOWNERS`

Hardy porte seul l'application et l'infrastructure (D076). Les rôles restent écrits comme des rôles : un coéquipier peut reprendre celui de responsable infrastructure.

---

## 1. Régler la fusion des pull requests
Dépôt → **Settings → General**, rubrique **Pull Requests** :

| Réglage | Valeur |
|---|---|
| Allow merge commits | ☐ décoché |
| Allow squash merging | ✅ — Default commit message : **Pull request title** |
| Allow rebase merging | ☐ décoché |
| Automatically delete head branches | ✅ |

**Pourquoi :** chaque PR devient **un seul commit** dans `main`, nommé d'après son titre (« E02 gares », « E17 mise en ligne ») : un historique lisible, une ligne par tâche. Une seule méthode = personne ne se trompe de bouton. Les branches fusionnées s'effacent toutes seules.

## 2. Protéger `main`
Dépôt → **Settings → Rulesets** (menu de gauche, rubrique « Code, planning, and automation ») **→ New ruleset → New branch ruleset**.

| Réglage | Valeur |
|---|---|
| Ruleset name | `Protection de main` |
| Enforcement status | **Active** |
| Bypass list | **Add bypass → Repository admin** (c'est Hardy) |
| Target branches | **Add target → Include default branch** |
| Restrict deletions | ✅ |
| Block force pushes | ✅ |
| Require a pull request before merging | ✅ — Required approvals : **1** — **Dismiss stale pull request approvals when new commits are pushed** ✅ — **Require review from Code Owners** ✅ — Allowed merge methods : **Squash** uniquement |
| Require status checks to pass | ☐ pour l'instant (aucun test automatique) ; **à activer quand l'intégration continue existe** |
| Autres réglages | Laisser par défaut |

**Ce que ça donne :**
- personne ne peut envoyer directement dans `main` ni l'effacer ;
- une PR d'un coéquipier ne peut être fusionnée **qu'avec l'accord de Hardy** ; si elle est modifiée après l'accord, il faut le redonner ;
- Hardy, administrateur, peut fusionner **ses propres** PR sans attendre personne (case « bypass » au moment de la fusion) : il n'est jamais bloqué.

## 3. Le fichier CODEOWNERS
Déjà présent dans `.github/CODEOWNERS`. Il dit à GitHub que **Hardy relit tout**. Avec le réglage « Require review from Code Owners », c'est ce qui rend son accord obligatoire.
→ Vérifier seulement que `@Hardy1210` est bien son identifiant GitHub.

Le modèle de PR (`.github/pull_request_template.md`) pré-remplit chaque PR avec : quoi, tâche, comment vérifier, cases à cocher (périmètre, secrets, contrat).

## Historique
| Date | Version | Modification |
|---|---|---|
| 09/10/2026 | 1.5 | Guide complet pour une équipe avec les SR (voir l'historique Git) |
| 06/11/2026 | 2.0 | Réduit à la configuration GitHub : équipe d'une personne — D076 |
