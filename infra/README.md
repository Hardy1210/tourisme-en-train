# Infrastructure : dossier d'exploitation

> **Version** 1.0 · **Date** 06/11/2026
> **Dépend de :** `docs/07-contrat-infra.md`, `docs/etapes/E17-mise-en-ligne-v1.md`
> **Utilisé par :** responsable infrastructure
> **Document de référence pour :** comment exploiter la production. Complété à chaque lot d'E17.

**Responsable infrastructure : Hardy.** Le rôle peut être repris par un coéquipier : tout ce qu'il faut savoir est ici et dans `docs/07-contrat-infra.md`.

## Variables (dans Coolify, jamais dans Git)
- **Secrets :** `POSTGRES_PASSWORD`, `MDP_APP_LECTURE`, `MDP_ETL_ECRITURE`. Lettres, chiffres et `. _ ~ -` uniquement, car ils sont insérés tels quels dans les adresses `postgres://`.
- **Réglages :** `URL_APP`, `POSTGRES_DB`, `POSTGRES_USER`, `NODE_ENV=production`.
- **Le domaine** ne dépend que d'`URL_APP` et du réglage Coolify.

## Premier chargement : export et restauration
**Essayé le 06/11/2026** sur une base PostGIS neuve (`postgis/postgis:16-3.4`), hors image web : export de 18 Mo, restauration en 5 s, 12 242 lieux et 268 025 liaisons retrouvés, `app_lecture` sans droit d'écriture, et les migrations ne changent plus rien ensuite. Les noms de conteneurs ci-dessous sont à adapter ; des scripts remplaceront ces commandes au lot 1.

⚠️ **Ne pas lancer `pg_restore --clean` sans la liste ci-dessous.** Il essaie de supprimer l'extension `postgis`, dont dépendent `postgis_topology` et `postgis_tiger_geocoder` dans l'image, et s'arrête **après avoir supprimé les tables**.

1. **Exporter depuis le poste.** Le fichier reste hors de Git :
   ```bash
   docker exec tourisme-en-train-db-1 sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > tourisme.dump
   ```
2. **Sur le serveur, lancer les migrations.** Elles créent les rôles et les tables : `node scripts/migrer.ts` dans l'image web.
3. **Restaurer sans les lignes `EXTENSION` :**
   ```bash
   docker cp tourisme.dump <conteneur-db>:/tmp/tourisme.dump
   docker exec <conteneur-db> sh -c 'pg_restore -l /tmp/tourisme.dump | grep -v " EXTENSION " > /tmp/liste && pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --exit-on-error -L /tmp/liste /tmp/tourisme.dump'
   ```
4. **Relancer les migrations**, qui ne doivent plus rien changer, puis vérifier `GET /api/sante` : `{"statut":"ok","base":"ok",…}`.
5. **Supprimer le fichier temporaire :** `docker exec <conteneur-db> rm /tmp/tourisme.dump /tmp/liste`.

## Vie privée
- **Ne pas activer les statistiques de trafic du proxy Coolify** : d'après son code, elles activent un journal d'accès, et `/api/autour` reçoit la position dans l'adresse (règle 5).
- **Contrôle sur le VPS :** `docker inspect coolify-proxy | grep -i accesslog` ne doit rien renvoyer. Le nom du conteneur et ce comportement sont à confirmer sur la version installée.

## Historique
| Date | Version | Modification |
|---|---|---|
| 06/11/2026 | 1.0 | Création : variables, procédure de restauration essayée, vie privée — D076 |
