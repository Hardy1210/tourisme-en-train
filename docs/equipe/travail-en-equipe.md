# Guide du travail en équipe

> **Pour :** Hardy (développeur) — à partager avec l'équipe et le tuteur.
> **But :** démarrer le projet, configurer GitHub, accueillir un ou deux membres Systèmes & Réseaux (SR) et travailler ensemble jusqu'au rendu du 3 décembre, sans que personne n'attende personne.
> **Version** 1.5 · 09/10/2026
> **Liés :** `docs/07-contrat-infra.md` (contrat app ↔ infra) · `docs/equipe/guide-SR.md` (tâches des SR) · `docs/equipe/demarrage-SR.md` (premier jour des SR) · `.github/CODEOWNERS`

---

## 1. Le principe en une image

```
             Un seul dépôt GitHub : tourisme-en-train
┌──────────────────────────────────────────────┬─────────────────────────────┐
│ Hardy                                        │ SR1 + SR2                   │
│ apps/ (application) · etl/ (données)         │ infra/ (production)         │
│ db/ · config/ · docs/ · design/              │ serveur, HTTPS, sauvegardes,│
│                                              │ déploiement, supervision    │
└──────────────────────────────────────────────┴─────────────────────────────┘
                  ▲ relié par un seul document : docs/07-contrat-infra.md ▲
```

- **Chacun son dossier.** Hardy ne modifie pas `infra/` ; les SR ne modifient rien en dehors. Deux personnes ne travaillent donc jamais sur le même fichier : presque aucun conflit possible.
- **Personne n'attend personne.** L'application complète tourne en local avec Docker, sans le travail des SR (soutenance garantie). Le travail des SR permet la **mise en ligne** et constitue **leur partie évaluée**.
- **Rien n'arrive dans la version principale (`main`) sans relecture.** Tout passe par une *pull request* (voir § 5).

### Le vocabulaire minimum

| Mot | Sens simple |
|---|---|
| **Dépôt** (repository) | Le dossier du projet stocké sur GitHub, partagé par toute l'équipe |
| **`main`** | La version officielle du projet, toujours fonctionnelle |
| **Branche** | Une copie de travail, le temps d'une tâche ; on la fusionne dans `main` quand c'est prêt |
| **Commit** | Une sauvegarde avec un message (« ajout du proxy HTTPS ») |
| **Push / Pull** | Envoyer ses commits sur GitHub / récupérer ceux des autres |
| **Pull request (PR)** | Une demande de fusion : « voici mon travail, relis-le avant qu'il entre dans `main` » |
| **Relecture** (review) | Vérifier une PR, puis l'approuver ou demander des corrections |
| **Contrat d'infra** | Le document qui fixe ce que l'application fournit et ce que l'infrastructure attend |

---

## 2. Démarrer le projet (Hardy, semaine 1)

| # | Action | Résultat |
|---|---|---|
| 1 | Créer le dépôt sur GitHub (§ 3.1) | Un dépôt vide `tourisme-en-train` |
| 2 | Dans le dossier du projet sur l'ordinateur, envoyer la documentation sur GitHub (commandes ci-dessous) | La doc est en ligne, `main` existe |
| 3 | Configurer GitHub (§ 3.2 à 3.6) | `main` protégée, SR invités, tableau des tâches prêt |
| 4 | Réaliser l'étape **E00** (initialisation) puis **E01** (Docker + base) | Le projet se lance avec `docker compose up` |
| 5 | Organiser la réunion de démarrage avec les SR (§ 4) | Chacun sait quoi faire |

Commandes de l'étape 2 (une seule fois) :
```
cd tourisme-en-train
git init
git add .
git commit -m "docs: documentation initiale du projet"
git branch -M main
git remote add origin git@github.com:Hardy1210/tourisme-en-train.git
git push -u origin main
```
Adresse **SSH** (clé SSH déjà reliée au compte GitHub : aucun mot de passe à chaque envoi). Sans clé SSH, l'adresse HTTPS `https://github.com/Hardy1210/tourisme-en-train.git` fonctionne aussi (GitHub demande alors un jeton d'accès). Le choix n'a aucun effet sur le travail en équipe : chacun choisit pour son propre poste.

> Les SR peuvent commencer **avant** que le code existe : choisir le serveur, le nom de domaine, le pare-feu (tâches I02, I03, I04, I08). Ils lanceront le projet en local (I01) dès que l'étape E01 est fusionnée.

---

## 3. Configurer GitHub (Hardy, environ 30 minutes)

### 3.1 Créer le dépôt
1. GitHub → **New repository**.
2. Nom : `tourisme-en-train`. Ne cocher **ni README, ni .gitignore, ni licence** (ils sont déjà dans le projet).
3. Visibilité : **Public conseillé**.
   - Le projet est un projet open data destiné à être publié sur data.gouv.fr ;
   - la protection de `main` (§ 3.4) est **gratuite pour un dépôt public**, mais payante pour un dépôt privé avec un compte gratuit ;
   - aucun secret n'est jamais dans le dépôt (règle 4 de `CLAUDE.md`), donc rien de sensible n'est exposé.
   - Si l'école impose un dépôt privé : activer le **GitHub Student Developer Pack** (GitHub Education), qui donne gratuitement l'offre Pro et donc la protection des branches.

### 3.2 Inviter les SR
1. Dépôt → **Settings → Collaborators → Add people**.
2. Saisir l'identifiant GitHub de chaque SR.
3. Chaque SR **accepte l'invitation** reçue par e-mail (sinon il ne peut rien envoyer).

### 3.3 Régler la fusion des pull requests
Dépôt → **Settings → General**, rubrique **Pull Requests** :

| Réglage | Valeur |
|---|---|
| Allow merge commits | ☐ décoché |
| Allow squash merging | ✅ — Default commit message : **Pull request title** |
| Allow rebase merging | ☐ décoché |
| Automatically delete head branches | ✅ |

**Pourquoi :** chaque PR devient **un seul commit** dans `main`, nommé d'après son titre (« E02 gares », « I05 proxy HTTPS ») : un historique lisible, une ligne par tâche. Une seule méthode = personne ne se trompe de bouton. Les branches fusionnées s'effacent toutes seules.

### 3.4 Protéger `main`
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
- une PR des SR ne peut être fusionnée **qu'avec l'accord de Hardy** ; si elle est modifiée après l'accord, il faut le redonner ;
- Hardy, administrateur, peut fusionner **ses propres** PR sans attendre personne (case « bypass » au moment de la fusion) : il n'est jamais bloqué.

### 3.5 Le fichier CODEOWNERS
Déjà présent dans `.github/CODEOWNERS`. Il dit à GitHub que **Hardy relit tout**. Avec le réglage « Require review from Code Owners », c'est ce qui rend son accord obligatoire.
→ Vérifier seulement que `@Hardy1210` est bien son identifiant GitHub.

Le modèle de PR (`.github/pull_request_template.md`) pré-remplit chaque PR avec : quoi, tâche, comment vérifier, cases à cocher (périmètre, secrets, contrat).

### 3.6 Le tableau des tâches
1. Dépôt → **Projects → New project → Board**. Nom : `tourisme-en-train` (le nom de code, qui ne change jamais ; un seul tableau pour toute l'équipe : tes étapes E00 → E18 et les tâches des SR I01 → I22).
2. Colonnes : **À faire · En cours · En relecture · Terminé**.
3. Champs **Semaine** (`S1` → `S8`, `Fin`) et **Priorité** (`P0`, `P1`, `P2`) : Settings du tableau → **Fields → + → Create a project field** (*Single select*).
4. Les **41 tickets** (E00 → E18 pour Hardy, I01 → I22 pour les SR, liste dans `docs/equipe/guide-SR.md` § 4) sont créés **une seule fois par un script** (`gh`), avec responsable, semaine et priorité. Ils arrivent tout seuls dans le tableau.
5. Règle : une carte passe en « En relecture » quand la PR est ouverte, en « Terminé » quand elle est fusionnée.

### 3.7 Le canal d'équipe
Un salon Discord ou Teams **dédié au projet**. Les questions techniques précises vont **dans la PR concernée** (elles restent attachées au travail) ; le salon sert au reste.

---

## 4. Accueillir les SR : la réunion de démarrage (1 h)

| Durée | Sujet | Support |
|---|---|---|
| 10 min | Le projet : problème, solution, maquette | Pitch + maquettes |
| 10 min | Le dépôt et les dossiers : qui travaille où | § 1 de ce guide |
| 15 min | **Le contrat d'infra** : ce que l'app fournit, ce qu'elle attend | `docs/07-contrat-infra.md` (§ 6 de ce guide) |
| 10 min | Leurs tâches, la répartition SR1 / SR2, le calendrier | `docs/equipe/guide-SR.md` |
| 10 min | La façon de travailler : branche → PR → relecture | `docs/equipe/demarrage-SR.md` |
| 5 min | Outils (tableau, canal), créneau du point hebdomadaire, questions | — |

**À la sortie de la réunion :** les SR ont accepté l'invitation GitHub, cloné le dépôt, et chacun a ses 2 ou 3 premières cartes dans « À faire ».

---

## 5. Le cycle de travail (le même pour tous)

```
1. Récupérer la dernière version    →  git pull
2. Créer une branche pour la tâche  →  git switch -c infra/I05-proxy-https
3. Travailler, sauvegarder          →  git add …  puis  git commit -m "…"
4. Envoyer la branche sur GitHub    →  git push -u origin infra/I05-proxy-https
5. Ouvrir une pull request          →  sur GitHub, bouton « Compare & pull request »
6. Relecture                        →  Hardy approuve ou demande des corrections
7. Fusion dans main                 →  « Squash and merge » (la branche s'efface seule sur GitHub, § 3.3)
8. Revenir sur main                 →  git switch main  puis  git pull
9. Ménage sur son ordinateur        →  git branch -D <branche>   (facultatif : rien ne casse si on l'oublie)
```

| Qui | Nom des branches | Exemple |
|---|---|---|
| Hardy | `etape/Exx-description` | `etape/E04-trains-directs` |
| SR | `infra/Ixx-description` | `infra/I13-sauvegardes` |

**Messages de commit**, en français : `type(portée): description` — ex. `feat(infra): sauvegarde quotidienne de la base`. Types : `feat` (ajout), `fix` (correction), `docs`, `chore` (entretien).

**Taille :** une tâche = une PR, fusionnée en quelques jours. Une branche ouverte depuis des semaines finit toujours mal.

### Le travail de Hardy
Il suit les étapes E00 → E18 : **une branche par étape, une seule PR en fin d'étape** (environ deux par semaine), fusionnée par « bypass » ; entre les deux, aucun passage par le site GitHub. Les PR des SR se relisent **uniquement sur le site** (§ 7) : rien à faire dans le terminal, leur travail arrive au prochain `git pull`. Rien ne change par rapport au travail seul, à part le point hebdomadaire et ces relectures.

---

## 6. Le contrat d'infra, expliqué simplement

**Analogie :** l'application est un appareil électrique, l'infrastructure est l'installation électrique de la maison. Le contrat, c'est **la norme de la prise** : tant que l'appareil a la bonne prise et que le mur fournit le bon courant, chacun peut changer ce qu'il veut de son côté.

Le document `docs/07-contrat-infra.md` fixe :

| L'application (Hardy) **fournit** | L'infrastructure (SR) **fournit** |
|---|---|
| Une image Docker de l'application (port 3000) | Un serveur sécurisé (SSH par clé, pare-feu) |
| Une image Docker du traitement des données | Une base PostgreSQL + PostGIS de production, jamais exposée sur Internet |
| Les migrations de la base et leur commande | Les sauvegardes quotidiennes **et une restauration testée** |
| Une route de santé `/api/sante` (200 = tout va bien) | Le nom de domaine, le HTTPS, le proxy, les en-têtes de sécurité |
| La liste des variables d'environnement (`.env.example`) | Les secrets stockés hors du dépôt |
| Des journaux au format JSON, sans position utilisateur | La planification de la mise à jour des données + alerte en cas d'échec |
| Un `docker-compose.yml` pour lancer tout en local | Le déploiement automatique, la supervision |

**Changer le contrat :** une PR qui modifie `docs/07-contrat-infra.md`, **relue par Hardy et par les SR**, plus une ligne dans `docs/DECISIONS.md`. Jamais par message privé ni « on verra ».

**Ce qui peut changer librement sans toucher au contrat :** côté SR, l'hébergeur, le proxy, l'outil de sauvegarde ou de supervision ; côté Hardy, tout le code interne.

---

## 7. Relire une pull request des SR (Hardy, 5 à 15 minutes)

Pas besoin d'être expert en infrastructure. La relecture vérifie surtout le **cadre** :

| # | Vérifier | Où |
|---|---|---|
| 1 | Seuls des fichiers de `infra/` sont modifiés (ou `.github/workflows/deploiement*.yml` pour la tâche I16) | Onglet **Files changed** |
| 2 | Aucun mot de passe, clé ou jeton visible | Onglet **Files changed** |
| 3 | La description dit quoi, quelle tâche, comment vérifier | Description de la PR |
| 4 | Ports, variables et noms respectent `07-contrat-infra.md` | Comparer avec le contrat |
| 5 | Ça a été testé (capture, sortie de commande, lien) | Description ou commentaires |

- **Tout est bon** → **Review changes → Approve**, puis **Squash and merge** (la branche s'efface seule).
- **Un point à corriger** → **Review changes → Request changes** avec un commentaire précis. Le SR corrige **sur la même branche** ; la PR se met à jour toute seule.
- **Une question** → commentaire sur la ligne concernée (clic sur le « + » à côté de la ligne).

> **Un secret envoyé par erreur ?** Le considérer comme compromis : **changer immédiatement** le mot de passe ou la clé concernés, puis le retirer du dépôt. Le supprimer du fichier ne suffit pas (il reste dans l'historique).

---

## 8. Le rythme de l'équipe

| Quand | Quoi | Durée |
|---|---|---|
| Semaine 1 | Réunion de démarrage (§ 4) | 1 h |
| Chaque semaine, même jour | **Point d'équipe** : chacun dit *fait · prévu · bloqué* ; on déplace les cartes du tableau | 30 min |
| Au fil de l'eau | Relecture des PR par Hardy | 1 à 2 jours maximum |
| 25/11 | **Décision de mise en ligne** : oui si le déploiement est stable, sinon soutenance en local | 30 min |
| Semaine 8 (23 → 29/11) | **Intégration** (§ 9) + répétition de la soutenance | 2 à 3 séances |
| 30/11 → 02/12 | Mise en ligne (si décision positive), dernière répétition | — |

Chaque décision prise en point d'équipe qui change le contrat ou l'organisation est notée dans `docs/DECISIONS.md`.

---

## 9. L'intégration finale (semaine 8 : 23 → 29/11)

| # | Qui | Quoi |
|---|---|---|
| 1 | Hardy | Étape E16 : images de production prêtes, données figées pour la démo, lancement local en une commande |
| 2 | SR | Déploiement de ces images sur le serveur avec leur configuration `infra/` |
| 3 | Tous | Vérification : `/api/sante` répond 200 en HTTPS, parcours complet sur téléphone |
| 4 | SR | Démonstration de restauration d'une sauvegarde |
| 5 | Tous | Répétition de la soutenance : démo en ligne **et** plan B en local |

---

## 10. Les situations fréquentes

| Situation | Que faire |
|---|---|
| Un SR ne donne pas de nouvelles | Hardy continue (il ne dépend pas des SR) ; le point est soulevé au point hebdomadaire ; si ça dure, en parler au tuteur |
| Un SR a besoin d'un changement dans l'application (un port, une variable) | Il ouvre une demande (Issue GitHub) ; Hardy décide ; si le contrat change → § 6 |
| Hardy a besoin d'un changement dans `infra/` | Même chose dans l'autre sens : il le demande aux SR |
| Une PR attend depuis plusieurs jours | La traiter au point hebdomadaire ; découper si elle est trop grosse |
| Conflit Git | Rare (dossiers séparés). Si ça arrive : ne rien forcer, demander de l'aide au point d'équipe |
| Désaccord technique | Celui qui est responsable du dossier décide ; si le contrat est touché, décision commune notée dans `DECISIONS.md` |

---

## 11. Les règles d'or

1. **Chacun son dossier.** Le dossier de l'autre se modifie par une demande, jamais directement.
2. **Rien dans `main` sans pull request.**
3. **Aucun secret dans le dépôt**, jamais.
4. **Une tâche = une branche = une PR**, fusionnée en quelques jours.
5. **Le contrat d'infra ne change qu'avec l'accord de tous.**
6. **Les questions vont dans la PR ou le canal d'équipe**, pas en messages privés dispersés.
7. **Hardy n'attend jamais les SR, les SR n'attendent jamais Hardy.**

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 02/10/2026 | 1.0 | Création |
| — | 1.1 → 1.2 | Modifications non tracées |
| 07/10/2026 | 1.3 | Réglages de fusion (§ 3.3, squash uniquement), approbation annulée si la PR change, adresse SSH, menu « Rulesets » ; sections 3.4 → 3.7 renumérotées |
| 07/10/2026 | 1.4 | Cycle de travail complété (retour sur `main`, ménage local), routine de Hardy précisée, suppression automatique des branches (§ 7), champs du tableau et création des tickets par script (§ 3.6) |
| 09/10/2026 | 1.5 | Date de I01 remplacée par « après la fusion de E01 » ; historique complété |
