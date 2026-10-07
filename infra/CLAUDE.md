# infra/CLAUDE.md — infrastructure de production (SR)

> Fichier maître **du dossier `infra/`**, pour les membres Systèmes & Réseaux (SR1, SR2) et leur assistant de code.
> **Pour tout travail d'infrastructure, ce fichier prime sur le `CLAUDE.md` racine.** Le `CLAUDE.md` racine décrit le travail de Hardy (application, étapes E00 → E18) : ses sections 8, 9, 10 et 14 **ne vous concernent pas**. Ses règles absolues (§ 2), dates et heures (§ 3) et interdits (§ 12) restent valables.
> Tout est **en français** : fichiers, commentaires, messages de commit.
> **Version** 1.0 · 05/10/2026

---

## 1. Le projet en bref

**Wagoo** (nom de code `tourisme-en-train`) : application web installable qui montre ce qu'on peut faire autour de soi et comment y aller en train direct. Défi data.gouv.fr « Tourisme en train ». Soutenance le **jeudi 3 décembre 2026**.

- **Hardy** développe l'application (tout le dépôt sauf `infra/`).
- **Vous (SR1, SR2)** préparez tout ce qui permet de la **mettre en ligne de façon sûre** : serveur, réseau, HTTPS, base de production, sauvegardes, déploiement, supervision.
- **La soutenance ne dépend pas de vous** (elle peut se faire en local) ; votre travail permet la **mise en ligne v1** et constitue **votre partie évaluée**.

---

## 2. Votre périmètre (règle n° 1)

| Vous pouvez… | Où |
|---|---|
| **Créer et modifier** | `infra/` uniquement |
| **Exception** (tâche I16) | `.github/workflows/deploiement*.yml` — le fichier de déploiement automatique, qui ne peut vivre qu'à cet endroit |
| **Lire** (jamais modifier) | Tout le reste du dépôt : `apps/web/Dockerfile`, `etl/Dockerfile`, `docker-compose.yml`, `.env.example`, `docs/` |

**Besoin d'un changement en dehors de `infra/`** (un port, une variable, un Dockerfile) : **ne pas le faire**. Ouvrir une *Issue* GitHub pour Hardy, ou en parler au point du lundi.
*Pourquoi : deux personnes qui modifient le même fichier créent des conflits ; chaque dossier a un seul responsable.*

---

## 3. Règles absolues de l'infrastructure

Chaque règle dit **pourquoi**.

1. **Aucun secret dans le dépôt** (mot de passe, clé, jeton). Seuls des fichiers d'exemple (`*.example`) sont versionnés. *Un secret poussé une fois reste dans l'historique : il faut le changer immédiatement.*
2. **La base de données n'est jamais exposée sur Internet.** Elle n'écoute que sur le réseau interne Docker. *Une base ouverte est la première cible des robots.*
3. **Un seul serveur.** Pas de Kubernetes, Terraform, Prometheus/Grafana, multi-serveurs sans décision d'équipe. *Le projet n'en a pas besoin et le temps est compté.*
4. **HTTPS obligatoire**, redirection HTTP → HTTPS, en-têtes de sécurité de `docs/07-contrat-infra.md` § 6.
5. **Ports ouverts : 22 (SSH par clé, sans root), 80, 443. Rien d'autre.**
6. **Jamais `TZ` fixé dans un conteneur** pour corriger un décalage horaire. *L'application calcule elle-même l'heure de Paris ; fixer TZ masquerait un défaut.*
7. **Vie privée :** journaux du proxy **sans adresse IP complète**, conservation limitée ; la position des utilisateurs n'est jamais stockée.
8. **Restauration testée** : une sauvegarde qui n'a jamais été restaurée n'est pas une sauvegarde.
9. **Tout passe par une pull request** relue par Hardy ; `main` est protégée.
10. **Le contrat (`docs/07-contrat-infra.md`) ne change qu'avec l'accord de toute l'équipe** (pull request relue par Hardy et les SR + ligne dans `docs/DECISIONS.md`).

---

## 4. Le contrat avec l'application (résumé)

Référence complète : **`docs/07-contrat-infra.md`**. En cas de doute, c'est lui qui fait foi.

| L'application **fournit** | Vous **fournissez** |
|---|---|
| Image Docker de l'application : `apps/web/Dockerfile` (port 3000, utilisateur non-root) | Serveur Linux sécurisé, accès SSH par clé |
| Image du traitement des données : `etl/Dockerfile` (Node 24) | Base PostgreSQL 16 + PostGIS de production, volume persistant, **non exposée** |
| Migrations de la base (commande dans l'image web) | Sauvegardes quotidiennes + **restauration testée** |
| Route de santé `GET /api/sante` : `200` = tout va bien, `503` = base inaccessible | Nom de domaine, HTTPS, proxy, en-têtes, limitation d'appels |
| Variables d'environnement : liste dans `.env.example` et `07` § 3 | Secrets stockés hors du dépôt |
| Traitement des données : `docker compose run --rm etl all` ; code retour 0 = succès | Planification hebdomadaire de ce traitement + alerte si code retour ≠ 0 |
| Journaux JSON sur la sortie standard | Supervision (site, `/api/sante`, certificat, disque), déploiement automatique, retour arrière |

---

## 5. Organisation conseillée du dossier

```
infra/
├─ CLAUDE.md                 ← ce fichier
├─ README.md                 ← dossier d'exploitation (I22) : déployer, restaurer, changer un secret, réagir à un incident
├─ JOURNAL.md                ← une entrée par séance de travail
├─ compose.prod.yml          ← services de production (web, db, etl, proxy)
├─ .env.prod.example         ← variables de production SANS valeurs secrètes
├─ caddy/Caddyfile           ← HTTPS, redirection, en-têtes, compression (I05, I06, I11)
├─ scripts/                  ← sauvegarde.sh, restauration.sh, deploiement.sh, mise-a-jour-donnees.sh
├─ supervision/              ← configuration de la surveillance et des alertes (I17)
└─ docs/                     ← schéma réseau (I21), fiche RGPD (I20), preuves (scans, notes SSL Labs…)
```
Cette organisation peut évoluer : la modifier = mettre à jour cette section.

---

## 6. Vos tâches et leur état

Détail de chaque tâche (livrable, priorité) : **`docs/equipe/guide-SR.md` § 4**.
⬜ à faire · 🟡 en cours · ✅ terminé · ⏸ en attente

| ID | Tâche | Qui | Sem. | État |
|---|---|---|---|---|
| I01 | Lancer le projet en local (après l'étape E01 de Hardy) | SR1 + SR2 | S2 | ⬜ |
| I02 | Choisir et préparer le serveur | SR1 | S1 | ⬜ |
| I03 | Accès sécurisé (SSH par clé, pas de root, mises à jour automatiques) | SR1 | S1 | ⬜ |
| I04 | Nom de domaine, DNS | SR2 | S1 | ⬜ |
| I05 | HTTPS automatique, redirection HTTP → HTTPS | SR2 | S3 | ⬜ |
| I06 | Proxy : point d'entrée unique, compression | SR2 | S3 | ⬜ |
| I07 | Cache des fichiers statiques et des tuiles (P2) | SR2 | — | ⬜ |
| I08 | Pare-feu (22, 80, 443), protection contre les connexions répétées | SR2 | S2 | ⬜ |
| I09 | Base inaccessible depuis Internet ; rôles de la base | SR1 | S2 | ⬜ |
| I10 | Gestion des secrets | SR2 | S3 | ⬜ |
| I11 | En-têtes de sécurité | SR2 | S6 | ⬜ |
| I12 | Limitation d'appels (`/api/trains/temps-reel`, `/api/geocodage`) | SR2 | S6 | ⬜ |
| I13 | Sauvegarde quotidienne, rotation, copie hors serveur | SR1 | S4 | ⬜ |
| I14 | Restauration réelle, chronométrée | SR1 | S5 | ⬜ |
| I15 | Mise à jour des données planifiée + alerte | SR1 | S7 | ⬜ |
| I16 | Déploiement automatique à chaque fusion sur `main` | SR2 | S5 | ⬜ |
| I17 | Supervision et alertes | SR1 | S6 | ⬜ |
| I18 | Page de statut publique (P2) | SR1 | Fin | ⬜ |
| I19 | Test de charge (P2) | SR2 | Fin | ⬜ |
| I20 | RGPD côté infrastructure | SR2 | S7 | ⬜ |
| I21 | Schéma d'architecture réseau | SR1 + SR2 | S4 | ⬜ |
| I22 | Dossier d'exploitation | SR1 + SR2 | S7 | ⬜ |

**Semaines :** S1 = 05 → 11/10 · S2 = 12 → 18/10 · S3 = 19 → 25/10 · S4 = 26/10 → 01/11 · S5 = 02 → 08/11 · S6 = 09 → 15/11 · S7 = 16 → 22/11 · S8 = 23 → 29/11 · Fin = 30/11 → 02/12.
**Jalons communs :** premier déploiement de l'application sur le serveur en **S5** · intégration en **S8** · **décision de mise en ligne le mercredi 25/11** · gel le 27/11 · soutenance le 03/12.

---

## 7. État actuel

> Mis à jour à chaque fin de séance (§ 10). On supprime ce qui est résolu.

- **Tâches en cours :** —
- **Dernière séance :** —
- **Bloquant :** —
- **En attente de Hardy :** —
- **Prochaine action précise :** lire `docs/equipe/demarrage-SR.md`, puis commencer I02 (SR1) et I04 (SR2)

---

## 8. Réaliser une tâche

1. **Lire** la tâche dans `docs/equipe/guide-SR.md` § 4, puis ce fichier et le contrat (`docs/07-contrat-infra.md`).
2. **Partir de `main` à jour** et créer une branche : `infra/Ixx-description` (ex. `infra/I05-https`).
3. **Proposer un plan court** (fichiers, commandes, risques) au membre SR concerné ; **attendre sa validation** avant d'agir sur le serveur.
4. **Travailler par petits incréments**, uniquement dans `infra/` (ou l'exception de § 2).
5. **Tester réellement** : la commande passe, le service répond, la sauvegarde se restaure. Garder une **preuve** (sortie de commande, capture, note SSL Labs) dans `infra/docs/`.
6. **Vérifier** : aucun secret dans les fichiers modifiés (`git diff` relu ligne par ligne).
7. **Commit** en français : `feat(infra): …`, `fix(infra): …`, `docs(infra): …` ; puis **pull request** avec le modèle (quoi · tâche · comment vérifier · cases à cocher).
8. Mettre à jour **§ 6 (état des tâches)** et le tableau GitHub Projects (carte « En relecture »).

Tâche floue ou en contradiction avec le contrat → **s'arrêter, le signaler, demander** (point du lundi ou Issue). Ne pas improviser une modification du contrat.

---

## 9. ❌ Ce qui n'existe pas dans `infra/`

```
❌ Modification hors de infra/ (sauf .github/workflows/deploiement*.yml)
❌ Mot de passe, clé, jeton ou fichier .env réel dans le dépôt
❌ Base de données exposée sur Internet ou port 5432 ouvert
❌ Port ouvert autre que 22, 80, 443
❌ Connexion SSH par mot de passe ou en root
❌ TZ fixé dans un conteneur
❌ Adresse IP complète conservée dans les journaux
❌ Kubernetes, Terraform, Prometheus/Grafana, plusieurs serveurs (sans décision d'équipe)
❌ Changement du contrat 07 sans l'accord de toute l'équipe
❌ Envoi direct dans main (toujours une pull request)
❌ git reset --hard / clean / checkout sur du travail non sauvegardé
❌ Co-Authored-By dans les commits
```

---

## 10. Fin de séance : « garde le contexte »

Quand un membre SR écrit **« garde le contexte »**, dans l'ordre :

1. **§ 7 « État actuel »** : tâches en cours, bloquant, attente de Hardy, **prochaine action précise**.
2. **§ 6** : état des tâches.
3. **`infra/JOURNAL.md`** : nouvelle entrée (date, qui, tâches, fait, problèmes, prochaine étape).
4. **Commit** `docs(infra): sauvegarde de séance du JJ/MM` sur la branche en cours, puis **push**.
5. **Résumé** en 4 lignes : ✅ fait · ⏸ en attente · ⬜ reste · ▶ prochaine action.

**Reprise :** lire § 7 et la dernière entrée de `infra/JOURNAL.md`, puis résumer la situation en 3 lignes avant toute action.
**Ne jamais modifier** `docs/JOURNAL.md`, `docs/DECISIONS.md` ou le `CLAUDE.md` racine : ils appartiennent à Hardy (une décision d'équipe y est notée par lui).

---

## 11. Documents à lire

| Pour… | Lire |
|---|---|
| Votre premier jour | `docs/equipe/demarrage-SR.md` |
| Vos tâches en détail | `docs/equipe/guide-SR.md` |
| Ce que l'application fournit et attend | `docs/07-contrat-infra.md` |
| Comment l'équipe travaille (GitHub, relecture, rythme) | `docs/equipe/travail-en-equipe.md` |
| L'architecture générale de l'application | `docs/01-architecture.md` § 1 et § 7 |
| La route de santé | `docs/05-api.md` § 3.1 |
| Les rôles de la base | `docs/03-base-de-donnees.md` § 4 |

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 05/10/2026 | 1.0 | Création — D026 |
