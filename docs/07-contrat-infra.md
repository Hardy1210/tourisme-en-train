# 07 — Contrat entre l'application et l'infrastructure

> **Version** 2.0 · **Date** 06/11/2026
> **Dépend de :** `01-architecture.md`, `03-base-de-donnees.md` (rôles), `05-api.md` (route de santé)
> **Utilisé par :** fiches E00, E01, E16, E17 ; `infra/README.md` ; tout travail dans `infra/`
> **Document de référence pour :** ce que l'application fournit à l'infrastructure et ce qu'elle en attend.
> **Rôles (D076) :** responsable application : Hardy · responsable infrastructure : Hardy. Écrits comme des rôles, pour qu'un coéquipier puisse reprendre l'un d'eux.
> **Règle :** tant que ce contrat est respecté, chaque rôle avance sans attendre l'autre. **Toute modification passe par une pull request** et est notée dans `DECISIONS.md`.

---

## 1. Ce que l'application fournit

| Élément | Emplacement | Responsable |
|---|---|---|
| Image de l'application | `apps/web/Dockerfile` (Next.js `standalone`, utilisateur non-root, port 3000) | Responsable application |
| Image du traitement des données | `etl/Dockerfile` (Node 24, pnpm, TypeScript exécuté avec `tsx`, utilisateur `node`) ; `.dockerignore` à la racine (aucun `.env` dans le contexte de construction) | Responsable application |
| Migrations | `db/migrations/` + commande `pnpm db:migrer` (et équivalent dans l'image web : `node scripts/migrer.ts`, exécuté par Node 24 sans `tsx`, D033) ; la commande crée d'abord les rôles avec leurs mots de passe, puis applique les migrations (D031) | Responsable application |
| Route de santé | `GET /api/sante` (voir `05-api.md` § 3.1) | Responsable application |
| Commande ETL | `pnpm etl <source|all> [--force] [--hors-ligne]` (dans Docker : `docker compose run --rm etl <source|all>`) ; code retour 0 = succès | Responsable application |
| Journaux | Sortie standard, **une ligne JSON par événement** : `{ "niveau", "message", "horodatage", "contexte" }` ; jamais de position utilisateur | Responsable application |
| Fichier d'exemple des variables | `.env.example` | Responsable application |
| Environnement local complet | `docker-compose.yml` à la racine | Responsable application |

## 2. Ce que l'infrastructure fournit (production)

Le responsable infrastructure fournit, sur un VPS géré par Coolify :

| Élément | Emplacement | Phase d'E17 |
|---|---|---|
| Serveur, pare-feu (22, 80, 443), accès SSH par clé | VPS | 1 |
| DNS, HTTPS, proxy | Coolify, enregistrement A du domaine | 1 |
| Compose de production, secrets, déploiement | `infra/compose.prod.yml`, Coolify | 1 |
| Base PostgreSQL + PostGIS de production, volume, chargement depuis un export | `infra/` | 1 |
| Planification de l'ETL + alerte si code retour ≠ 0 | Coolify | 2 |
| Sauvegardes, restauration testée | Coolify | 2 |
| En-têtes de sécurité, limitation d'appels | `next.config.ts`, proxy | 2 |

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
| `DOSSIER_DONNEES` | etl | `/data` (en local hors Docker : `./data`, lu depuis la racine du dépôt) | oui |
| `SNCF_CLE_API` | web (temps réel, P1) | *(secret)* | non |
| `NODE_ENV` | web | `production` | oui |
| `BDD_PORT_HOTE` | compose **local** uniquement (port de `db` sur le poste) | `5432` (défaut) | non |
| `ADMINER_PORT_HOTE` | compose **local** uniquement (port d'`adminer` sur le poste) | `8080` (défaut) | non |

- Validées au démarrage par Zod : `apps/web/src/lib/env.ts` (application) et `etl/src/config.ts` (traitement des données). **Variable manquante = refus de démarrer avec un message clair.**
- **Adresses de la base :** dans `.env.example`, les `BDD_URL_*` désignent le **poste** (`localhost:<BDD_PORT_HOTE>`), pour `pnpm dev`, `pnpm etl` et `pnpm db:migrer` lancés sur la machine. Les conteneurs reçoivent leurs propres adresses (`db:5432`) du compose (D030).
- **Pas de `TZ`** dans les conteneurs (voir `CLAUDE.md` § 3).
- Aucune valeur secrète dans le dépôt.

---

## 4. Services Docker Compose (environnement local)

| Service | Image | Ports (hôte) | Profil | Rôle |
|---|---|---|---|---|
| `db` | `postgis/postgis:16-3.4` | `127.0.0.1:${BDD_PORT_HOTE}` (défaut 5432) → 5432 dans le conteneur | *(toujours)* | Base de données |
| `adminer` | `adminer:5.5.1` | `127.0.0.1:${ADMINER_PORT_HOTE}` (défaut 8080) → 8080 dans le conteneur | `outils` | Consulter la base |
| `etl` | construite depuis `etl/Dockerfile` | — | `etl` | `docker compose run --rm etl all` |
| `web` | construite depuis `apps/web/Dockerfile` | `127.0.0.1:3000` | `demo` | Application complète (soutenance) |

- **Planification de l'ETL (E17 phase 2) : ne pas lancer `all` chaque nuit.** Chaque nuit, les commandes une par une **sauf `osm`** ; **`osm` une fois par semaine au plus** : le service public Overpass n'est pas fait pour un usage automatique fréquent. Entre deux extractions, le fichier `data/brut/osm/overpass.json` est gardé, et `docker compose run --rm etl osm --hors-ligne` recharge depuis lui (D041).
- Volumes : `donnees_db` (base), `./data` monté dans `etl` sur `/data`.
- Réseau interne unique ; seuls les ports ci-dessus sont exposés, **et uniquement sur 127.0.0.1**.
- Les ports côté hôte de `db` et d'`adminer` sont réglables (`BDD_PORT_HOTE`, `ADMINER_PORT_HOTE`) pour éviter un conflit avec un autre projet sur le poste ; **cela ne concerne que l'environnement local** : en production, la base n'expose aucun port (§ 6) — D030.
- Démarrage développement : `docker compose up -d` (db) puis `pnpm dev`.
- Démarrage soutenance : `docker compose --profile demo up -d`.

---

## 5. Ordre de démarrage et vérifications

1. `db` en bonne santé (`pg_isready`).
2. Migrations appliquées (idempotentes).
3. Données présentes (ETL déjà exécuté, ou restauration d'un export figé pour la démo — E16).
4. `web` démarre ; `GET /api/sante` → `200`.

## 6. Exigences pour la production (E17)

- HTTPS obligatoire ; en-têtes : `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: geolocation=(self)` ; CSP validée avec Hardy.
- La base n'est **jamais** exposée sur Internet (phase 1).
- Journaux du proxy **sans adresse IP complète** (anonymisation), conservation limitée. **Le journal d'accès reste coupé** : la position passe dans l'adresse de `/api/autour` (phase 1, règle 5).
- Sauvegarde quotidienne + **restauration testée** au moins une fois avant la soutenance.
- Limitation d'appels sur `/api/geocodage`, et sur `/api/trains/temps-reel` quand il existera.
- Répartition en phases et conséquences : fiche E17.

## 7. Ce qui peut changer sans casser le contrat

- Côté infrastructure : hébergeur, proxy, méthode de sauvegarde, outil de supervision.
- Côté application : tout le code interne, tant que les images, variables, route de santé, commandes et formats de journaux ci-dessus restent identiques.

---

## Historique

| Date | Version | Modification |
|---|---|---|
| 30/09/2026 | 1.0 | Création |
| 05/10/2026 | 1.1 | Image et commande du traitement des données en TypeScript (Node 22) au lieu de Python — D024. Pour les SR : seule la commande de planification change (I15). |
| 05/10/2026 | 1.2 | Exception `.github/workflows/deploiement*.yml` pour le déploiement automatique ; renvoi vers `infra/CLAUDE.md` — D026 |
| 07/10/2026 | 1.3 | Images Docker en Node 24 au lieu de 22 — D028 |
| 09/10/2026 | 1.4 | Local uniquement : port de `db` côté hôte réglable (`BDD_PORT_HOTE`), adresses de `.env.example` côté poste — D030 ; rôles créés par la commande de migration — D031 ; historique remis dans l'ordre |
| 11/10/2026 | 1.5 | Commande de migration dans l'image web : `node scripts/migrer.ts` au lieu de `.mjs` ; version d'Adminer fixée — D033. Pour les SR : rien ne change dans leur travail |
| 11/10/2026 | 1.6 | Local uniquement : port d'Adminer côté hôte réglable (`ADMINER_PORT_HOTE`, 8080 par défaut), sur le modèle de D030 |
| 22/10/2026 | 1.7 | `etl/Dockerfile` créé (utilisateur `node`), `.dockerignore`, `DOSSIER_DONNEES` relatif — D035. Pour les SR : `docker compose run --rm etl <source|all>` fonctionne (sources disponibles : `sources`, `gares`) |
| 01/11/2026 | 1.8 | § 5 : `osm` une fois par semaine au plus, jamais `all` chaque nuit — D041. Pour les SR : à respecter dans la planification (I15) |
| 06/11/2026 | 2.0 | Rôles au lieu de noms ; § 2 et § 6 : Coolify et phases d'E17 ; journal d'accès coupé — D076 |
