# Wagoo — tourisme-en-train

Application web installable, gratuite et sans inscription : elle montre ce qu'on peut faire autour de soi et **comment y aller en train direct** — lieux à visiter, trains aller et retour, transports sur place, CO₂ économisé.

Projet réalisé dans le cadre du défi data.gouv.fr **« Tourisme en train »** (Fondation SNCF / Open Data University). Région pilote : Bourgogne-Franche-Comté.

> 🚧 Projet en cours de construction (rendu le 3 décembre 2026). Ce fichier sera complété à chaque étape.

## Documentation
- `CLAUDE.md` — cap, règles et état actuel du projet
- `docs/` — vision, architecture, sources de données, base, API, interface, contrat d'infrastructure
- `docs/etapes/` — les étapes de construction E00 → E18
- `docs/equipe/` — organisation de l'équipe

## Prérequis
- Node.js 24 (`.nvmrc`) et pnpm 11 (`corepack enable`, version fixée dans `package.json`)
- Docker (base de données, à partir de l'étape E01)
- Git

## Démarrage (développement)
```
pnpm install
cp .env.example .env      # puis remplir les mots de passe
pnpm dev                  # application sur http://localhost:3000
```

| Action | Commande |
|---|---|
| Tout vérifier (types, lint, format, tests) | `pnpm verifier` |
| Tests | `pnpm test` |
| Traitement des données | `pnpm etl <source\|all> [--force] [--hors-ligne]` (`pnpm etl --help`) |

## Organisation
Espace de travail pnpm : `apps/web` (application Next.js) · `etl` (traitement des données, TypeScript + SQL) · `packages/commun` (paramètres, dates, journal partagés) · `config/` (paramètres métier). Détail : `docs/01-architecture.md`.

## Données
Uniquement des données publiques ouvertes : SNCF (gares, horaires), DATAtourisme, OpenStreetMap, transport.data.gouv.fr, ADEME. Licences et attributions détaillées dans `docs/02-sources-donnees.md`.
