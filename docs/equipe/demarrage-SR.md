# Démarrage — membres Systèmes & Réseaux

> **Pour :** SR1 et SR2. **But :** être opérationnel le premier jour.
> **Version** 1.1 · 05/10/2026
> **À lire ensuite :** `docs/equipe/guide-SR.md` (vos tâches I01 → I22) · `docs/07-contrat-infra.md` (le contrat avec l'application)

---

## 1. Votre place dans le projet

- **Votre dossier : `infra/`.** Vous y préparez tout ce qui permet de mettre l'application en ligne de façon sûre : serveur, pare-feu, HTTPS, proxy, base de production, sauvegardes, déploiement, supervision.
- **Vous ne modifiez rien en dehors de `infra/`.** Besoin d'un changement ailleurs (un port, une variable) ? Ouvrez une *Issue* sur GitHub ou posez la question au point d'équipe.
- **Le document qui vous relie à l'application : `docs/07-contrat-infra.md`.** Il dit ce que l'application fournit (images Docker, variables, route `/api/sante`, journaux) et ce qu'elle attend de vous. Tant qu'il est respecté, vous avancez sans attendre Hardy.
- **Votre travail est évalué** : schéma réseau, preuves de sécurité, démonstration de restauration, supervision.

---

## 2. Installer (une fois)

| Outil | Pourquoi |
|---|---|
| Compte **GitHub** | Accès au dépôt |
| **Git** | Récupérer et envoyer le travail |
| **Docker Desktop** (ou Docker Engine sous Linux) | Lancer le projet en local |
| Un éditeur (VS Code conseillé) | Lire et modifier les fichiers |

---

## 3. Premier jour : 5 étapes

| # | Action | Comment |
|---|---|---|
| 1 | Accepter l'invitation GitHub | Lien reçu par e-mail (ou github.com → Notifications) |
| 2 | Récupérer le projet | `git clone https://github.com/Hardy1210/tourisme-en-train.git` puis `cd tourisme-en-train` |
| 3 | Lire les 4 documents | Ce guide · `infra/CLAUDE.md` (vos règles et l'état de vos tâches) · `docs/equipe/guide-SR.md` · `docs/07-contrat-infra.md` |
| 4 | Ouvrir le tableau des tâches | Dépôt → **Projects → tourisme-en-train** ; prendre vos premières cartes |
| 5 | Lancer le projet en local (tâche I01) | Dès que Hardy annonce que l'étape E01 est terminée (vers le 11/10) : voir § 4 |

> Les tâches **I02, I03, I04, I08** (serveur, accès sécurisé, nom de domaine, pare-feu) ne demandent pas le code de l'application : commencez par elles.

---

## 4. Lancer le projet en local

```
cp .env.example .env              # puis remplir les mots de passe dans .env (jamais envoyé sur GitHub)
docker compose up -d              # démarre la base de données
docker compose ps                 # vérifier que « db » est « healthy »
```
Les autres commandes (charger les données, lancer l'application complète) sont listées dans `docs/07-contrat-infra.md` § 4 et seront disponibles au fur et à mesure de l'avancement.
**Quelque chose ne marche pas ?** C'est utile : signalez-le à Hardy (c'est le but de la tâche I01).

---

## 5. Le cycle de travail (à chaque tâche)

```
git switch main
git pull                                   # 1. récupérer la dernière version
git switch -c infra/I05-proxy-https        # 2. une branche par tâche : infra/Ixx-description
   … travailler uniquement dans infra/ …
git add infra/
git commit -m "feat(infra): proxy Caddy avec HTTPS"   # 3. sauvegarder (message en français)
git push -u origin infra/I05-proxy-https   # 4. envoyer la branche
```
5. Sur GitHub : bouton **Compare & pull request**. Le modèle de description s'affiche : remplissez *Quoi · Tâche · Comment vérifier* et cochez les cases.
6. Déplacez la carte du tableau dans **En relecture**.
7. Hardy relit. S'il demande des corrections : corrigez **sur la même branche**, puis `git add`, `git commit`, `git push` — la PR se met à jour toute seule.
8. Après la fusion : carte dans **Terminé**, puis `git switch main` et `git pull`.

**Messages de commit :** `feat(infra): …` (ajout) · `fix(infra): …` (correction) · `docs(infra): …` (documentation).

---

## 6. Aide-mémoire Git

| Je veux… | Commande |
|---|---|
| Voir où j'en suis | `git status` |
| Récupérer la dernière version | `git switch main` puis `git pull` |
| Créer une branche | `git switch -c infra/Ixx-description` |
| Voir mes modifications | `git diff` |
| Sauvegarder | `git add infra/` puis `git commit -m "…"` |
| Envoyer | `git push` (la première fois : `git push -u origin <branche>`) |
| Changer de branche | `git switch <branche>` |
| Voir l'historique | `git log --oneline` |

**Avant toute commande qui efface (`git reset --hard`, `git checkout -- …`, `git clean`) : `git status` d'abord, et en cas de doute, demander.** Ces commandes détruisent le travail non sauvegardé.

---

## 7. Les règles

1. Travailler **uniquement dans `infra/`** (seule exception : `.github/workflows/deploiement*.yml` pour le déploiement automatique, tâche I16).
2. **Jamais de mot de passe, de clé ou de jeton dans le dépôt.** Les secrets vont dans `.env` (ignoré par Git) ou dans le gestionnaire de secrets du serveur. Un secret envoyé par erreur : prévenir Hardy **immédiatement** et le changer.
3. **Une tâche = une branche = une pull request**, fusionnée en quelques jours.
4. `main` est protégée : impossible d'y envoyer directement, c'est normal.
5. Toute modification du contrat (`docs/07-contrat-infra.md`) : PR relue par toute l'équipe.
6. **Un seul serveur suffit.** Pas de Kubernetes, Terraform, Prometheus/Grafana ou multi-serveurs sans en parler d'abord.
7. Les questions précises vont **dans la PR concernée** ; le reste dans le canal d'équipe.

---

## 8. Le rythme

- **Point d'équipe hebdomadaire (30 min)** : chacun dit *fait · prévu · bloqué*.
- **25/11 : décision de mise en ligne** (oui si le déploiement est stable).
- **Semaine du 23/11 : intégration** — déploiement des images de l'application avec votre configuration, vérification `/api/sante` en HTTPS, démonstration de restauration, répétition de la soutenance.
- **03/12 : rendu.**

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 02/10/2026 | 1.0 | Création |
