# Infrastructure : dossier d'exploitation

> **Version** 1.6 · **Date** 10/11/2026
> **Dépend de :** `docs/07-contrat-infra.md`, `docs/etapes/E17-mise-en-ligne-v1.md`
> **Utilisé par :** responsable infrastructure
> **Document de référence pour :** comment exploiter la production. Comment mettre en ligne chaque mise à jour : section dédiée ci-dessous.

**Responsable infrastructure : Hardy.** Le rôle peut être repris par un coéquipier : tout ce qu'il faut savoir est ici et dans `docs/07-contrat-infra.md`.

## Variables (dans Coolify, jamais dans Git)
- **Secrets :** `POSTGRES_PASSWORD`, `MDP_APP_LECTURE`, `MDP_ETL_ECRITURE`. Lettres, chiffres et `. _ ~ -` uniquement, car ils sont insérés tels quels dans les adresses `postgres://`.
- **Réglages :** `URL_APP` (sans port), `POSTGRES_DB`, `POSTGRES_USER` ; `SNCF_CLE_API` reste vide.
- **Ne pas saisir `NODE_ENV` :** le compose le fixe déjà à `production`.
- **Dans Coolify, pour chaque variable :** Build time = *Not available during build*, Runtime = *Available in the container*. La construction n'en a pas besoin (`apps/web/Dockerfile`), et Coolify 4.6 les fournit quand même à `docker compose build` pour les `:?` (lu dans son code le 07/11).
- **Le domaine** ne dépend que d'`URL_APP` et du réglage Coolify.

## Ce qui est déployé
`compose.prod.yml`, depuis la racine du dépôt : `docker compose --project-directory . -f infra/compose.prod.yml …`. Coolify lance aussi `--project-directory` à la racine (lu dans son code le 06/11).

| Service | Rôle | Vers l'extérieur |
|---|---|---|
| `db` | PostgreSQL + PostGIS, volume `donnees_db` | Aucun port |
| `migrer` | Crée les rôles, applique les migrations, puis s'arrête (`restart: 'no'`) | Aucun |
| `web` | Application, port 3000, sans droits d'administration | Par le proxy de Coolify |

**Réglages Coolify :** type Docker Compose, dossier de base `/`, fichier `/infra/compose.prod.yml` (*Resolved file* : `/infra/compose.prod.yml`), variables de `infra/.env.prod.example`, sans importer `.env.example` que propose le Smart Scan.

**Domaine, sur le service `web` uniquement :** protocole `https`, hôte `wagoo.hardylino.com`, port `3000`, soit `https://wagoo.hardylino.com:3000` dans Coolify. Ce port est celui du conteneur : le public passe par le 443, et `URL_APP` s'écrit sans port.

**`migrer` à l'état `Exited (0)` est normal :** `restart: 'no'` l'exclut déjà du calcul de santé de Coolify. Ne pas ajouter `exclude_from_hc`, que `docker compose` refuse en local.

## Mettre en ligne une mise à jour
**Déclencheur :** Hardy écrit **« mets en ligne »**. Claude Code déroule cette procédure dans l'ordre, une étape à la fois, et donne à Hardy la commande ou le clic exact au moment voulu. Cette phrase vaut accord pour la branche, le commit, le push et la pull request. **Jamais de mot de passe dans une conversation.**

| Qui | Fait quoi |
|---|---|
| **Claude Code** | Branche, vérifications, commit, push, pull request, contrôles depuis l'extérieur, documents |
| **Hardy** | Fusion sur GitHub, clics dans Coolify, secrets, commandes SSH sur le VPS, essai sur iPhone |

### 1. Classer le changement
| Ce qui change | Vérifier | Après la fusion |
|---|---|---|
| Documents seuls (`*.md`, `docs/`) | Rien | **Pas de Redeploy** |
| Code, textes, `config/*.json`, dépendances | `verifier`, intégration, parcours (+ essai de l'image si dépendances) | Redeploy |
| Structure : dossiers, écrans, adresses des pages, parcours de l'utilisateur | **Plan court validé par Hardy d'abord (`CLAUDE.md` § 10).** Tout + essai sur téléphone avant la fusion. Adresse changée : renvoi depuis l'ancienne, car l'application installée et les liens partagés la gardent | Redeploy, puis le § 2 étape 10 sur la nouvelle et l'ancienne adresse |
| Migration dans `db/migrations/` | Tout + essai de l'image | Sauvegarde (§ 5), puis Redeploy |
| `Dockerfile`, `compose.prod.yml`, `next.config.ts` | Tout + essai de l'image | Redeploy, en regardant le journal de déploiement |
| Nouvelle variable | Tout + essai de l'image ; `infra/.env.prod.example` à jour | **Saisir la variable dans Coolify avant le Redeploy** (*Not available during build*, *Available in the container*) : un `:?` vide bloque le déploiement |
| Valeur d'une variable, sans code | Rien | Modifier dans Coolify, puis Redeploy. **Ne pas changer `POSTGRES_PASSWORD` :** PostgreSQL ne le lit qu'à la création du volume |
| Données (ETL) | Lignes comptées et échantillonnées en local | § 4, après le code dont elles dépendent |

### 2. Parcours normal
Essayé sur les PR #84 et #85, sans l'essai sur téléphone avant fusion. Le serveur de développement de Hardy n'est jamais touché : tout se passe dans une copie.

1. **Claude Code, créer la copie :**
   ```bash
   git fetch origin
   git worktree add -b etape/<sujet> ../tourisme-<sujet> origin/main
   cd ../tourisme-<sujet> && pnpm install --frozen-lockfile
   ```
2. **Claude Code, vérifier, depuis cette copie :** `pnpm verifier`, puis `pnpm test:integration`, puis `pnpm test:e2e`. Un échec arrête tout.
3. **Claude Code, essayer l'image si le tableau le demande :** § 3.
   **Hardy, regarder avant de fusionner tout changement visible :** dans le navigateur, et sur téléphone par le tunnel (`CLAUDE.md` § 16). Plusieurs petits changements validés peuvent partir ensemble dans la même PR. **Rien ne se fusionne ni ne se déploie avant cet accord.**
4. **Claude Code, publier :** commit en français, `git push -u origin etape/<sujet>`, pull request. Son texte dit le classement du § 1 et tout ce que Hardy devra faire.
5. **Hardy, variables éventuelles :** les saisir dans Coolify.
6. **Hardy, fusionner sur GitHub :** cocher *Merge without waiting for requirements to be met (bypass rules)*, puis *Squash and merge*, puis *Confirm*.
7. **Claude Code, mettre le poste à jour :**
   ```bash
   git switch main && git pull --ff-only --prune
   git worktree remove ../tourisme-<sujet> && git branch -D etape/<sujet>
   ```
7 bis. **Hardy, décider de la version :** relire la rubrique « Non publié » de `CHANGELOG.md`. Si on met en ligne, Claude Code propose le numéro (D080) et, dans une petite PR de documents, renomme la rubrique en `[0.x.0] — JJ/MM/AAAA`.
8. **Hardy, déployer :** Coolify → ressource de Wagoo → **Redeploy**. Attendre *Finished* (environ 3 min, mesuré le 07/11) et comparer le commit affiché à celui de la fusion. Advanced → Auto deploy est sur *Manual deployments only* (confirmé le 07/11) : une fusion seule ne change rien en ligne.
9. **Claude Code, contrôler :**
   ```bash
   infra/scripts/controler-production.sh https://wagoo.hardylino.com
   ```
   Le code retour doit être 0. Puis regarder la nouveauté elle-même dans un navigateur.
10. **Hardy, essayer sur l'iPhone :** fermer l'application installée, la rouvrir, regarder la nouveauté. Le service worker se met à jour seul : si l'ancienne version apparaît, fermer et rouvrir une fois de plus.
10 bis. **Claude Code, marquer la version :** `git tag -a v0.x.0 <commit déployé> -m "Version 0.x.0"` puis `git push origin v0.x.0`.
11. **Claude Code, noter :** les documents touchés, puis le journal au prochain « garde le contexte ».

### 3. Essayer l'image en local
Depuis la copie, avec un fichier de variables hors de Git, construit à partir de `infra/.env.prod.example`. Le projet `essai-prod` a son propre volume et ne touche pas à la base de développement.
```bash
docker compose -p essai-prod --project-directory . --env-file <fichier> -f infra/compose.prod.yml up -d --build
docker compose -p essai-prod --project-directory . --env-file <fichier> -f infra/compose.prod.yml ps -a
docker compose -p essai-prod --project-directory . --env-file <fichier> -f infra/compose.prod.yml down -v
```
Avant le `down -v`, il faut `db` et `web` en `healthy`, et `migrer` en `Exited (0)`. `down -v` supprime uniquement le volume d'essai.

### 4. Mettre à jour les données
Essayé le 07/11 pour le premier chargement. **Le code et les migrations dont dépendent ces données doivent déjà être en ligne.** Une extraction `osm` reste limitée à une fois par semaine (D041).

**Sur le poste, depuis la racine du dépôt :**
1. Lancer le traitement (`pnpm etl <source>`), compter et échantillonner les lignes.
2. Exporter, relever l'empreinte, compter, copier :
   ```bash
   infra/scripts/exporter-base.sh ~/tourisme.dump
   sha256sum ~/tourisme.dump
   docker exec -i tourisme-en-train-db-1 sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -x' < infra/scripts/compter-lignes.sql
   scp ~/tourisme.dump infra/scripts/restaurer-base.sh infra/scripts/compter-lignes.sql <utilisateur>@<serveur>:
   ```

**Sur le VPS (`ssh <utilisateur>@<serveur>`) :** `sudo` devant `docker` et `sh` si Docker répond `permission denied`.

3. Désigner la base, vérifier l'empreinte, sauvegarder (§ 5).
4. Restaurer, compter : les chiffres doivent être ceux du poste. La base est remplacée pendant quelques secondes (5 s mesurées le 06/11).
   ```bash
   sh restaurer-base.sh "$DB" tourisme.dump --oui
   docker exec -i "$DB" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -x' < compter-lignes.sql
   ```
5. **Hardy, Coolify :** Redeploy, qui relance les migrations sans rien changer.
6. **Claude Code :** contrôle du § 2 étape 9. `dateDonnees` donne la date du dernier chargement des horaires.
7. Une fois tout bon, sur le VPS : `rm tourisme.dump restaurer-base.sh compter-lignes.sql avant.dump`.

### 5. Sauvegarder avant une migration ou des données
Sur le VPS. Le premier `echo` doit afficher **un seul nom** : le filtre désigne la base de l'application, pas celle de Coolify.
```bash
DB=$(docker ps --filter ancestor=postgis/postgis:16-3.4 --format '{{.Names}}'); echo "$DB"
docker exec "$DB" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > avant.dump
ls -la avant.dump
```

### 6. Si quelque chose ne va pas
**Pas encore essayé en production : à dérouler calmement, une ligne à la fois, avec Claude Code.**

| Situation | Que faire |
|---|---|
| Déploiement en échec dans Coolify | Ne pas relancer à l'aveugle. Copier le journal de déploiement, sans secret, pour Claude Code |
| `migrer` n'est pas à `Exited (0)` | `docker ps -a --format 'table {{.Names}}\t{{.Status}}'`, puis `docker logs <conteneur-migrer>` |
| Code en ligne cassé, sans migration | Sur GitHub, bouton **Revert** de la PR, fusion de la PR créée, Redeploy, contrôle. Jamais de `push --force` sur `main` |
| Code en ligne cassé, avec migration | Fusionner le Revert, **puis** `sh restaurer-base.sh "$DB" avant.dump --oui`, **puis** Redeploy, contrôle. Un Revert seul ne défait pas une migration |
| Données fausses | `sh restaurer-base.sh "$DB" avant.dump --oui`, puis Redeploy |

Ne pas utiliser le bouton *Rollback* de Coolify, jamais essayé sur ce compose. **Le filet de la soutenance reste la démo locale (E16).**

### 7. À ne jamais faire
- Ne pas cliquer sur *Reset* dans la configuration du proxy (il remet le 8080), ni activer *Traffic analytics* (position dans le journal d'accès), ni activer *Preview deployments*.
- Ne pas supprimer la ressource avec ses volumes, ni ajouter un `ports:` à `db` ou `web`.
- Ne pas lancer `docker compose … config` sans `-q` : il imprime les secrets.
- Ne pas déployer le jour d'une démonstration sans raison. Aucune nouvelle fonctionnalité après le gel du 27/11 ; les corrections, les retouches de design et leurs déploiements continuent jusqu'à la soutenance (D078).
- Mises à jour automatiques de Coolify coupées le 07/11, jusqu'à la soutenance. Après toute mise à jour à la main : relancer le contrôle du § 2 étape 9.

## Premier chargement : export et restauration
**Essayé le 06/11/2026 avec le compose de production complet et l'image réelle :** export de 18 Mo, 12 242 lieux et 268 025 liaisons retrouvés, `/api/sante` à 200 ; les migrations relancées ne changent rien.

⚠️ **Ne pas lancer `pg_restore --clean` à la main sans la liste que construit le script.** Il essaie de supprimer l'extension `postgis`, dont dépendent `postgis_topology` et `postgis_tiger_geocoder` dans l'image, et s'arrête **après avoir supprimé les tables**.

1. **Exporter depuis le poste, depuis la racine du dépôt.** Le fichier reste hors de Git :
   ```bash
   infra/scripts/exporter-base.sh tourisme.dump
   ```
2. **Copier sur le serveur** le fichier et `infra/scripts/restaurer-base.sh` : `scp tourisme.dump infra/scripts/restaurer-base.sh <serveur>:`.
3. **Déployer** dans Coolify : `migrer` crée les rôles et les tables. `/api/sante` répond `{"statut":"degrade","base":"ok","dateDonnees":null,…}` : c'est attendu tant que la base est vide.
4. **Restaurer sur le serveur.** Le filtre désigne la base de l'application, pas celle de Coolify ; `echo` doit afficher un seul nom :
   ```bash
   DB=$(docker ps --filter ancestor=postgis/postgis:16-3.4 --format '{{.Names}}'); echo "$DB"
   sh restaurer-base.sh "$DB" tourisme.dump --oui
   ```
5. **Relancer les migrations**, qui ne doivent plus rien changer, en redéployant ; puis vérifier `GET /api/sante` : `{"statut":"ok","base":"ok",…}`.
6. **Supprimer l'export du serveur :** `rm tourisme.dump`.

## Vie privée
- **Ne pas activer les statistiques de trafic du proxy Coolify** : d'après son code, elles activent un journal d'accès, et `/api/autour` reçoit la position dans l'adresse (règle 5).
- **Contrôle sur le VPS :** `docker inspect --format '{{json .Config.Cmd}}' coolify-proxy | grep -ci accesslog` doit répondre `0`, et `docker exec coolify-proxy ls /traefik/access.log` ne doit trouver aucun fichier (fait le 07/11, Coolify 4.6.0).

## Panneau Coolify
- **Adresse :** `https://coolify.hardylino.com` (A `coolify` chez Vercel, Settings → General → URL). Le panneau, le temps réel et le terminal passent par le proxy.
- **Ports 8000, 6001 et 6002 limités à `localhost`** par `/data/coolify/source/docker-compose.custom.yml`, sur le VPS, hors de Git. Coolify le recharge seul et ses mises à jour ne le remplacent pas :
  ```yaml
  services:
    coolify:
      ports: !override
        - "127.0.0.1:${APP_PORT:-8000}:8080"
        - "127.0.0.1:${REVERB_PORT:-${SOKETI_PORT:-6001}}:6001"
        - "127.0.0.1:6002:6002"
  ```
- **Appliquer ou annuler :** `curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash -s 4.6.0`, après avoir modifié ou supprimé ce fichier. Sans `-s 4.6.0`, le script installe la dernière version.
- ⚠️ **Valider sans afficher les secrets :** `docker compose … config -q`. `config` seul imprime les secrets de Coolify.
- **Port 8080 retiré** de la configuration du proxy (Serveur → Proxy). C'est le tableau de bord Traefik, sans rien à l'écoute en production. **Réinitialiser cette configuration le remet.**
- **Secours :** `ssh -L 8000:localhost:8000 -L 6001:localhost:6001 -L 6002:localhost:6002 <utilisateur>@<ip>`, puis `http://localhost:8000`.
- **Contrôle du 07/11, depuis l'extérieur :** 22, 80 et 443 ouverts ; 3000, 5432, 6001, 6002, 8000 et 8080 refusent la connexion. Le résultat vient de ces réglages de ports : aucun pare-feu de l'hébergeur n'a été vérifié.

## Historique
| Date | Version | Modification |
|---|---|---|
| 06/11/2026 | 1.0 | Création : variables, procédure de restauration essayée, vie privée — D076 |
| 06/11/2026 | 1.1 | Compose de production, réglages Coolify, scripts, procédure essayée sur l'image réelle — D076 |
| 07/11/2026 | 1.2 | `NODE_ENV` à ne pas saisir, variables sans construction, forme du domaine, état de `migrer`, santé d'une base vide, choix du conteneur `db` — D076 |
| 07/11/2026 | 1.3 | Panneau Coolify en HTTPS, ports limités à `localhost`, 8080 retiré, contrôles du journal d'accès — D076 |
| 07/11/2026 | 1.4 | Procédure complète de mise en ligne, script de contrôle, comptage des lignes — D077 |
| 07/11/2026 | 1.5 | Changements de structure, essai avant fusion, réglages Coolify confirmés — D078 |
| 10/11/2026 | 1.6 | § 2 : relecture du CHANGELOG, numéro et étiquette de version — D080 |
