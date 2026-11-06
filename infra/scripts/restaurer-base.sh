#!/bin/sh
# Remplace le contenu de la base par un export (infra/README.md). Les migrations doivent être passées :
# elles créent les rôles, que l'export ne contient pas.
# Usage : infra/scripts/restaurer-base.sh <conteneur-db> <fichier> --oui
set -eu

conteneur="${1:?Usage : restaurer-base.sh <conteneur-db> <fichier> --oui}"
fichier="${2:?Usage : restaurer-base.sh <conteneur-db> <fichier> --oui}"
if [ "${3:-}" != "--oui" ]; then
  echo "Les tables de la base seront remplacées. Relancer avec --oui pour confirmer." >&2
  exit 1
fi
[ -f "$fichier" ] || { echo "Fichier introuvable : $fichier" >&2; exit 1; }

docker cp "$fichier" "$conteneur:/tmp/tourisme.dump"
trap 'docker exec "$conteneur" rm -f /tmp/tourisme.dump /tmp/liste' EXIT

# Sans les lignes EXTENSION : `--clean` essaierait de supprimer `postgis`, dont dépendent d'autres
# extensions de l'image, et s'arrêterait après avoir supprimé les tables (D076).
docker exec "$conteneur" sh -c '
  pg_restore -l /tmp/tourisme.dump | grep -v " EXTENSION " > /tmp/liste
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --exit-on-error -L /tmp/liste /tmp/tourisme.dump
'
echo "Base restaurée. Relancer les migrations, puis vérifier /api/sante."
