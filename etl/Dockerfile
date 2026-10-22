# Image du traitement des données (docs/07-contrat-infra.md § 1, D024, D028).
# Construite depuis la racine du dépôt : `docker compose run --rm etl <source|all> [--force] [--hors-ligne]`.
# Les fichiers téléchargés et les rapports vont dans /data (volume ./data). Aucun TZ (CLAUDE.md § 3).
FROM node:24-bookworm-slim

# pnpm à la version fixée par `packageManager` dans package.json (D029).
RUN corepack enable

WORKDIR /app

# 1. Dépendances seules : cette couche n'est reconstruite que si un manifeste ou le verrou change.
#    Tous les package.json de l'espace de travail sont copiés pour que le verrou corresponde.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY etl/package.json etl/
COPY packages/commun/package.json packages/commun/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile --filter "@tourisme/etl..."

# 2. Code : traitement, code commun et configuration (parametres.json, sources.json).
COPY tsconfig.base.json ./
COPY config config
COPY packages/commun packages/commun
COPY etl etl

# Utilisateur sans droits d'administration (fourni par l'image node).
USER node
WORKDIR /app/etl

# tsx directement, sans `pnpm start` : la sortie reste une ligne JSON par événement (07 § 1).
ENTRYPOINT ["node_modules/.bin/tsx", "src/run.ts"]
CMD ["--help"]
