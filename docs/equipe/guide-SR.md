# Guide pour l'équipe Systèmes & Réseaux

> **Pour :** les deux membres SR du projet `tourisme-en-train`.
> **But :** savoir quoi faire, quand, et comment travailler avec Hardy **sans que personne n'attende personne**.
> **Version** 1.3 · 05/10/2026
> **Premier jour :** `docs/equipe/demarrage-SR.md` · **Organisation de l'équipe :** `docs/equipe/travail-en-equipe.md`

---

## 1. Le projet en deux phrases
Une application web (PWA) qui montre ce qu'on peut faire autour de soi et comment y aller en train. Hardy développe l'application ; vous préparez **tout ce qui permet de la faire tourner de façon sûre et fiable** : serveur, réseau, sécurité, sauvegardes, déploiement, supervision.

## 2. Comment on travaille ensemble
- **Votre espace : le dossier `infra/` du dépôt GitHub.** Vous y travaillez par branches (`infra/Ixx-description`) et **pull requests** ; Hardy relit avant fusion (relecture obligatoire, `main` protégée). Le pas-à-pas est dans `demarrage-SR.md`.
- **Votre fichier maître : `infra/CLAUDE.md`** : périmètre, règles, contrat résumé, **état de vos tâches**, et la façon de reprendre une séance (avec `infra/JOURNAL.md`). Il est aussi lu automatiquement par les assistants de code.
- **Le document qui nous relie : `docs/07-contrat-infra.md`.** Il dit ce que l'application fournit (images Docker, variables, route de santé `/api/sante`, commandes, format des journaux) et ce qu'elle attend de vous. **Tant qu'il est respecté, chacun avance à son rythme.** Pour le modifier : une pull request relue par tous.
- **La soutenance ne dépend pas de votre travail** : l'application tourne aussi en local. Votre travail permet la **mise en ligne v1** et constitue **votre partie évaluée** du projet.
- Point d'équipe : 30 minutes par semaine.

## 3. Répartition proposée
| Rôle | Périmètre |
|---|---|
| **SR1 — Système & données** | Serveur, base de production, sauvegardes, restauration, planification des mises à jour de données, supervision |
| **SR2 — Réseau, sécurité & déploiement** | DNS, HTTPS, proxy, pare-feu, secrets, compose de production, déploiement automatique, audits |

## 4. Vos tâches

Priorités : **P0** indispensable à la mise en ligne · **P1** souhaitable · **P2** bonus.

### Hébergement et serveur
| ID | Tâche | Livrable | Qui | Prio |
|---|---|---|---|---|
| I01 | Lancer l'environnement local du projet (`docker compose up`) pour le connaître — **dès la fin de l'étape E01 (vers le 11/10)** | Retour à Hardy si quelque chose ne marche pas | SR1 + SR2 | P0 |
| I02 | Choisir et préparer un serveur Linux (petit VPS, ou autre solution gratuite/école) | Fiche serveur | SR1 | P0 |
| I03 | Accès administrateur sécurisé : SSH par clé, pas de root, mises à jour de sécurité automatiques | Procédure d'accès | SR1 | P0 |

### Réseau et accès
| ID | Tâche | Livrable | Qui | Prio |
|---|---|---|---|---|
| I04 | Nom de domaine ou sous-domaine, DNS | Enregistrements configurés | SR2 | P0 |
| I05 | HTTPS automatique (ex. Caddy + Let's Encrypt), redirection HTTP → HTTPS | Site en HTTPS, bonne note SSL Labs | SR2 | P0 |
| I06 | Proxy : point d'entrée unique vers l'application, compression | Configuration du proxy | SR2 | P0 |
| I07 | Cache des fichiers statiques et des tuiles de carte | Mesure avant/après | SR2 | P2 |

### Sécurité
| ID | Tâche | Livrable | Qui | Prio |
|---|---|---|---|---|
| I08 | Pare-feu (22, 80, 443 uniquement), protection contre les connexions répétées | Rapport de scan des ports | SR2 | P0 |
| I09 | Base inaccessible depuis Internet ; rôles `app_lecture` / `etl_ecriture` (voir `07` § 3) | Vérification écrite | SR1 | P0 |
| I10 | Secrets hors du dépôt, stockés de façon sûre | Procédure de gestion des secrets | SR2 | P1 |
| I11 | En-têtes de sécurité (liste dans `07` § 6) | Bonne note securityheaders.com | SR2 | P1 |
| I12 | Limitation d'appels sur `/api/trains/temps-reel` et `/api/geocodage` | Règle en place | SR2 | P1 |

### Données et sauvegardes
| ID | Tâche | Livrable | Qui | Prio |
|---|---|---|---|---|
| I13 | Sauvegarde quotidienne de la base, rotation, copie hors serveur | Sauvegardes vérifiables | SR1 | P0 |
| I14 | **Restauration réelle** d'une sauvegarde, chronométrée | Procédure testée | SR1 | P0 |
| I15 | Lancer automatiquement la mise à jour des données (`docker compose run --rm etl all`) chaque semaine ; alerte si code retour ≠ 0 | Planification + journal | SR1 | P1 |

### Déploiement et exploitation
| ID | Tâche | Livrable | Qui | Prio |
|---|---|---|---|---|
| I16 | Déploiement automatique à chaque fusion sur `main` (GitHub Actions) | Déploiement sans intervention | SR2 | P1 |
| I17 | Supervision : site, `/api/sante`, certificat, disque ; alertes | Tableau de supervision | SR1 | P1 |
| I18 | Page de statut publique | Page en ligne | SR1 | P2 |
| I19 | Test de charge (50 utilisateurs simultanés) | Rapport d'une page | SR2 | P2 |

### Conformité et documentation
| ID | Tâche | Livrable | Qui | Prio |
|---|---|---|---|---|
| I20 | RGPD côté infrastructure : journaux sans IP complète, aucune position stockée, conservation limitée | Fiche RGPD technique | SR2 | P1 |
| I21 | Schéma d'architecture réseau (chemin d'une requête) | Schéma | SR1 + SR2 | P0 |
| I22 | Dossier d'exploitation : déploiement, restauration, rotation des secrets, incident | Dossier | SR1 + SR2 | P0 |

## 5. Calendrier indicatif
| Période | Objectif |
|---|---|
| S1 (05 → 11/10) | Réunion de démarrage ; I02, I03, I04 |
| S2 (12 → 18/10) | I01 (dès la fin de E01), I08, I09 |
| S3 (19 → 25/10) | I05, I06, I10 |
| S4 (26/10 → 01/11) | I13, I21 (début du schéma réseau) |
| S5 (02 → 08/11) | Premier déploiement manuel de l'application sur le serveur ; I14, I16 |
| S6 (09 → 15/11) | I11, I12, I17 (mer. 11/11 férié) |
| S7 (16 → 22/11) | I15, I20, I22 |
| S8 (23 → 29/11) | Intégration ; **décision de mise en ligne le 25/11** ; répétition |
| 30/11 → 02/12 | Mise en ligne v1 (si décision positive) ; I18, I19 en bonus |
| 03/12 | Soutenance |

## 6. Ce qu'il ne faut pas faire
- Modifier du code en dehors de `infra/` (passer par Hardy). Seule exception : le fichier de déploiement automatique `.github/workflows/deploiement*.yml` (I16).
- Mettre un mot de passe ou une clé dans le dépôt.
- Exposer la base de données sur Internet.
- Ajouter des outils lourds sans en parler (Kubernetes, plusieurs serveurs, Prometheus/Grafana, Terraform) : un seul serveur suffit.

## 7. Ce que vous pouvez présenter à l'oral
Le schéma réseau, les preuves de sécurité (scan de ports, notes SSL Labs et securityheaders.com), une démonstration de restauration de sauvegarde, la supervision, et le test de charge si réalisé.
