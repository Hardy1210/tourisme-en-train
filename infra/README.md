# Infrastructure : dossier d'exploitation

> **Version** 1.3 · **Date** 07/11/2026
> **Dépend de :** `docs/07-contrat-infra.md`, `docs/etapes/E17-mise-en-ligne-v1.md`
> **Utilisé par :** responsable infrastructure
> **Document de référence pour :** comment exploiter la production. Complété à chaque lot d'E17.

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
