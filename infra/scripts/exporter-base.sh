#!/bin/sh
# Exporte la base locale vers un fichier, à garder hors de Git (infra/README.md).
# Usage, depuis la racine du dépôt : infra/scripts/exporter-base.sh tourisme.dump
set -eu

fichier="${1:?Usage : exporter-base.sh <fichier>}"
conteneur="${CONTENEUR_DB:-tourisme-en-train-db-1}"

docker exec "$conteneur" sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$fichier"
echo "Export écrit : $fichier ($(wc -c < "$fichier") octets)"
