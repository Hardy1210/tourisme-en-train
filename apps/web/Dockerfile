# Image de l'application (docs/07-contrat-infra.md § 1, D033, D076). Construite depuis la racine du dépôt.
# Sert à la production (infra/compose.prod.yml) et à la démo locale (E16). Aucun TZ (CLAUDE.md § 3).
FROM node:24-bookworm-slim AS construction

# pnpm à la version fixée par `packageManager` dans package.json (D029).
RUN corepack enable

WORKDIR /app

# 1. Dépendances seules : cette couche n'est reconstruite que si un manifeste ou le verrou change.
#    Tous les package.json de l'espace de travail sont copiés pour que le verrou corresponde.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY etl/package.json etl/
COPY packages/commun/package.json packages/commun/
RUN pnpm install --frozen-lockfile --filter "@tourisme/web..."

# 2. Code : application, code commun, configuration et migrations.
COPY tsconfig.base.json ./
COPY config config
COPY db db
COPY packages/commun packages/commun
COPY apps/web apps/web

# 3. Construction. `lib/env.ts` est lu à la collecte des pages : ces valeurs factices, limitées à cette
#    commande, ne servent qu'à passer ce contrôle. Aucune page n'interroge la base à la construction, et
#    les vraies valeurs arrivent au démarrage du conteneur (D076).
RUN NEXT_TELEMETRY_DISABLED=1 SORTIE_NEXT=standalone \
    BDD_URL_APP=postgres://construction:construction@127.0.0.1:1/construction \
    URL_APP=http://construction.invalid \
    pnpm --filter @tourisme/web build

FROM node:24-bookworm-slim AS application

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Sinon le serveur n'écoute que sur le nom du conteneur, et le proxy ne l'atteint pas.
ENV HOSTNAME=0.0.0.0

WORKDIR /app

# La sortie `standalone` contient le serveur, et, via `outputFileTracingIncludes` de next.config.ts,
# tout ce qu'il faut pour `node apps/web/scripts/migrer.ts` (D033). Ni `static` ni `public` n'y sont copiés.
COPY --from=construction --chown=node:node /app/apps/web/.next/standalone ./
COPY --from=construction --chown=node:node /app/apps/web/.next/static apps/web/.next/static
COPY --from=construction --chown=node:node /app/apps/web/public apps/web/public

# Utilisateur sans droits d'administration (fourni par l'image node).
USER node

EXPOSE 3000

# Migrations : `node apps/web/scripts/migrer.ts`, service à part dans le compose.
CMD ["node", "apps/web/server.js"]
