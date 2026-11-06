# Infrastructure : dossier d'exploitation

> **Version** 1.1 · **Date** 06/11/2026
> **Dépend de :** `docs/07-contrat-infra.md`, `docs/etapes/E17-mise-en-ligne-v1.md`
> **Utilisé par :** responsable infrastructure
> **Document de référence pour :** comment exploiter la production. Complété à chaque lot d'E17.

**Responsable infrastructure : Hardy.** Le rôle peut être repris par un coéquipier : tout ce qu'il faut savoir est ici et dans `docs/07-contrat-infra.md`.

## Variables (dans Coolify, jamais dans Git)
- **Secrets :** `POSTGRES_PASSWORD`, `MDP_APP_LECTURE`, `MDP_ETL_ECRITURE`. Lettres, chiffres et `. _ ~ -` uniquement, car ils sont insérés tels quels dans les adresses `postgres://`.
- **Réglages :** `URL_APP`, `POSTGRES_DB`, `POSTGRES_USER`, `NODE_ENV=production`.
- **Le domaine** ne dépend que d'`URL_APP` et du réglage Coolify.

## Ce qui est déployé
`compose.prod.yml`, depuis la racine du dépôt : `docker compose --project-directory . -f infra/compose.prod.yml …`. Coolify lance aussi `--project-directory` à la racine (lu dans son code le 06/11).

| Service | Rôle | Vers l'extérieur |
|---|---|---|
| `db` | PostgreSQL + PostGIS, volume `donnees_db` | Aucun port |
| `migrer` | Crée les rôles, applique les migrations, puis s'arrête (`restart: 'no'`) | Aucun |
| `web` | Application, port 3000, sans droits d'administration | Par le proxy de Coolify |

**Réglages Coolify :** type Docker Compose, dossier de base `/`, fichier `/infra/compose.prod.yml`, domaine `https://wagoo.hardylino.com` sur le service `web` (port 3000), variables de `infra/.env.prod.example`.

## Premier chargement : export et restauration
**Essayé le 06/11/2026 avec le compose de production complet et l'image réelle :** export de 18 Mo, 12 242 lieux et 268 025 liaisons retrouvés, `/api/sante` à 200 ; les migrations relancées ne changent rien.

⚠️ **Ne pas lancer `pg_restore --clean` à la main sans la liste que construit le script.** Il essaie de supprimer l'extension `postgis`, dont dépendent `postgis_topology` et `postgis_tiger_geocoder` dans l'image, et s'arrête **après avoir supprimé les tables**.

1. **Exporter depuis le poste, depuis la racine du dépôt.** Le fichier reste hors de Git :
   ```bash
   infra/scripts/exporter-base.sh tourisme.dump
   ```
2. **Copier sur le serveur** le fichier et `infra/scripts/restaurer-base.sh` : `scp tourisme.dump infra/scripts/restaurer-base.sh <serveur>:`.
3. **Déployer** dans Coolify : `migrer` crée les rôles et les tables. `/api/sante` répond, mais la base est vide.
4. **Restaurer sur le serveur.** Le nom du conteneur `db` se lit avec `docker ps` :
   ```bash
   sh restaurer-base.sh <conteneur-db> tourisme.dump --oui
   ```
5. **Relancer les migrations**, qui ne doivent plus rien changer, en redéployant ; puis vérifier `GET /api/sante` : `{"statut":"ok","base":"ok",…}`.
6. **Supprimer l'export du serveur :** `rm tourisme.dump`.

## Vie privée
- **Ne pas activer les statistiques de trafic du proxy Coolify** : d'après son code, elles activent un journal d'accès, et `/api/autour` reçoit la position dans l'adresse (règle 5).
- **Contrôle sur le VPS :** `docker inspect coolify-proxy | grep -i accesslog` ne doit rien renvoyer. Le nom du conteneur et ce comportement sont à confirmer sur la version installée.

## Historique
| Date | Version | Modification |
|---|---|---|
| 06/11/2026 | 1.0 | Création : variables, procédure de restauration essayée, vie privée — D076 |
| 06/11/2026 | 1.1 | Compose de production, réglages Coolify, scripts, procédure essayée sur l'image réelle — D076 |
