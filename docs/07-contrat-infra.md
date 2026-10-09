# 07 — Contrat entre l'application et l'infrastructure

> **Version** 1.4 · **Date** 09/10/2026
> **Dépend de :** `01-architecture.md`, `03-base-de-donnees.md` (rôles), `05-api.md` (route de santé)
> **Utilisé par :** fiches E00, E01, E16, E17 ; `docs/equipe/guide-SR.md` ; `infra/CLAUDE.md` (résumé) ; tout travail dans `infra/`
> **Document de référence pour :** ce que l'application fournit à l'infrastructure et ce qu'elle en attend.
> **Règle :** tant que ce contrat est respecté, le développeur et les SR avancent sans s'attendre. **Toute modification passe par une pull request relue par Hardy et par les SR**, et est notée dans `DECISIONS.md`.

---

## 1. Ce que l'application fournit

| Élément | Emplacement | Responsable |
|---|---|---|
| Image de l'application | `apps/web/Dockerfile` (Next.js `standalone`, utilisateur non-root, port 3000) | Hardy |
| Image du traitement des données | `etl/Dockerfile` (Node 24, pnpm, TypeScript exécuté avec `tsx`) | Hardy |
| Migrations | `db/migrations/` + commande `pnpm db:migrer` (et équivalent dans l'image web : `node scripts/migrer.mjs`) ; la commande crée d'abord les rôles avec leurs mots de passe, puis applique les migrations (D031) | Hardy |
| Route de santé | `GET /api/sante` (voir `05-api.md` § 3.1) | Hardy |
| Commande ETL | `pnpm etl <source|all> [--force] [--hors-ligne]` (dans Docker : `docker compose run --rm etl <source|all>`) ; code retour 0 = succès | Hardy |
| Journaux | Sortie standard, **une ligne JSON par événement** : `{ "niveau", "message", "horodatage", "contexte" }` ; jamais de position utilisateur | Hardy |
| Fichier d'exemple des variables | `.env.example` | Hardy |
| Environnement local complet | `docker-compose.yml` à la racine | Hardy |

## 2. Ce que l'infrastructure fournit (production / pré-production)

| Élément | Emplacement | Responsable |
|---|---|---|
| Serveur, pare-feu, accès SSH | — | SR1 |
| Base PostgreSQL + PostGIS de production, volumes, sauvegardes, restauration testée | `infra/` | SR1 |
| Planification de l'ETL (cron) + alerte si code retour ≠ 0 | `infra/` | SR1 |
| Supervision (disponibilité, `/api/sante`, certificat, disque) | `infra/` | SR1 |
| DNS, HTTPS, proxy, en-têtes de sécurité, limitation d'appels | `infra/` | SR2 |
| Compose de production, secrets, déploiement automatique, retour arrière | `infra/` + `.github/workflows/deploiement*.yml` (seul fichier hors `infra/` autorisé aux SR) | SR2 |

---

## 3. Variables d'environnement

| Variable | Utilisée par | Exemple | Obligatoire |
|---|---|---|---|
| `POSTGRES_DB` | image db | `tourisme` | oui |
| `POSTGRES_USER` | image db, migrations | `proprietaire` | oui |
| `POSTGRES_PASSWORD` | image db, migrations | *(secret)* | oui |
| `MDP_APP_LECTURE` | script de création des rôles (lancé par la commande de migration) | *(secret)* | oui |
| `MDP_ETL_ECRITURE` | script de création des rôles (lancé par la commande de migration) | *(secret)* | oui |
| `BDD_URL_MIGRATIONS` | migrations | `postgres://proprietaire:***@db:5432/tourisme` | oui |
| `BDD_URL_APP` | web | `postgres://app_lecture:***@db:5432/tourisme` | oui |
| `BDD_URL_ETL` | etl | `postgres://etl_ecriture:***@db:5432/tourisme` | oui |
| `URL_APP` | web (métadonnées, partage) | `http://localhost:3000` | oui |
| `DOSSIER_DONNEES` | etl | `/data` | oui |
| `SNCF_CLE_API` | web (temps réel, P1) | *(secret)* | non |
| `NODE_ENV` | web | `production` | oui |
| `BDD_PORT_HOTE` | compose **local** uniquement (port de `db` sur le poste) | `5432` (défaut) | non |

- Validées au démarrage par Zod : `apps/web/src/lib/env.ts` (application) et `etl/src/config.ts` (traitement des données). **Variable manquante = refus de démarrer avec un message clair.**
- **Adresses de la base :** dans `.env.example`, les `BDD_URL_*` désignent le **poste** (`localhost:<BDD_PORT_HOTE>`), pour `pnpm dev`, `pnpm etl` et `pnpm db:migrer` lancés sur la machine. Les conteneurs reçoivent leurs propres adresses (`db:5432`) du compose (D030).
- **Pas de `TZ`** dans les conteneurs (voir `CLAUDE.md` § 3).
- Aucune valeur secrète dans le dépôt.

---

## 4. Services Docker Compose (environnement local)

| Service | Image | Ports (hôte) | Profil | Rôle |
|---|---|---|---|---|
| `db` | `postgis/postgis:16-3.4` | `127.0.0.1:${BDD_PORT_HOTE}` (défaut 5432) → 5432 dans le conteneur | *(toujours)* | Base de données |
| `adminer` | `adminer` | `127.0.0.1:8080` | `outils` | Consulter la base |
| `etl` | construite depuis `etl/Dockerfile` | — | `etl` | `docker compose run --rm etl all` |
| `web` | construite depuis `apps/web/Dockerfile` | `127.0.0.1:3000` | `demo` | Application complète (soutenance) |

- Volumes : `donnees_db` (base), `./data` monté dans `etl` sur `/data`.
- Réseau interne unique ; seuls les ports ci-dessus sont exposés, **et uniquement sur 127.0.0.1**.
- Le port côté hôte de `db` est réglable (`BDD_PORT_HOTE`) pour éviter un conflit avec une autre base sur le poste ; **cela ne concerne que l'environnement local** : en production, la base n'expose aucun port (§ 6) — D030.
- Démarrage développement : `docker compose up -d` (db) puis `pnpm dev`.
- Démarrage soutenance : `docker compose --profile demo up -d`.

---

## 5. Ordre de démarrage et vérifications

1. `db` en bonne santé (`pg_isready`).
2. Migrations appliquées (idempotentes).
3. Données présentes (ETL déjà exécuté, ou restauration d'un export figé pour la démo — E16).
4. `web` démarre ; `GET /api/sante` → `200`.

## 6. Exigences pour la production (E17, optionnel)

- HTTPS obligatoire ; en-têtes : `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self)` ; CSP validée avec Hardy.
- La base n'est **jamais** exposée sur Internet.
- Journaux du proxy **sans adresse IP complète** (anonymisation), conservation limitée.
- Sauvegarde quotidienne + **restauration testée** au moins une fois avant la soutenance.
- Limitation d'appels sur `/api/trains/temps-reel` et `/api/geocodage`.

## 7. Ce qui peut changer sans casser le contrat

- Côté SR : hébergeur, proxy (Caddy ou autre), méthode de sauvegarde, outil de supervision.
- Côté Hardy : tout le code interne, tant que les images, variables, route de santé, commandes et formats de journaux ci-dessus restent identiques.

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 30/09/2026 | 1.0 | Création |
| 05/10/2026 | 1.1 | Image et commande du traitement des données en TypeScript (Node 22) au lieu de Python — D024. Pour les SR : seule la commande de planification change (I15). |
| 05/10/2026 | 1.2 | Exception `.github/workflows/deploiement*.yml` pour le déploiement automatique ; renvoi vers `infra/CLAUDE.md` — D026 |
| 07/10/2026 | 1.3 | Images Docker en Node 24 au lieu de 22 — D028 |
| 09/10/2026 | 1.4 | Local uniquement : port de `db` côté hôte réglable (`BDD_PORT_HOTE`), adresses de `.env.example` côté poste — D030 ; rôles créés par la commande de migration — D031 ; historique remis dans l'ordre |
