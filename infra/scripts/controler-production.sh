#!/usr/bin/env bash
# Contrôle la production depuis l'extérieur, en lecture seule (infra/README.md).
# Usage : infra/scripts/controler-production.sh https://wagoo.hardylino.com
# Code retour 0 si tout est bon. Les coordonnées sont celles de la gare de Dijon, jamais celles d'un visiteur.
set -u

url="${1:?Usage : controler-production.sh <adresse https>}"
hote="${url#https://}"
echecs=0

verifier() {
  if [ "$2" = "$3" ]; then
    echo "ok     $1"
  else
    echo "ÉCHEC  $1 : attendu $3, obtenu $2"
    echecs=$((echecs + 1))
  fi
}

code() { curl -s -o /dev/null -m 15 -w '%{http_code}' "$url$1"; }

# Une erreur de certificat donne 000 : ces lignes vérifient donc aussi le HTTPS.
for chemin in / /lieux /sources /a-propos /mentions-legales /manifest.webmanifest /serwist/sw.js /api/sources; do
  verifier "$chemin" "$(code "$chemin")" 200
done

sante="$(curl -s -m 15 "$url/api/sante")"
verifier 'santé : statut' "$(echo "$sante" | grep -c '"statut":"ok"')" 1
verifier 'santé : base' "$(echo "$sante" | grep -c '"base":"ok"')" 1
echo "       $sante"

gares="$(curl -s -m 15 "$url/api/gares/proches?lat=47.3236&lon=5.0272")"
verifier 'données : Dijon trouvée' "$(echo "$gares" | grep -c 'Dijon')" 1

verifier 'HTTP renvoie vers HTTPS' \
  "$(curl -s -o /dev/null -m 15 -w '%{redirect_url}' "http://$hote/")" "$url/"

port_ouvert() { timeout 5 bash -c "</dev/tcp/$hote/$1" 2>/dev/null && echo ouvert || echo ferme; }

for port in 22 80 443; do
  verifier "port $port" "$(port_ouvert "$port")" ouvert
done
for port in 3000 5432 6001 6002 8000 8080; do
  verifier "port $port" "$(port_ouvert "$port")" ferme
done

if [ "$echecs" -gt 0 ]; then
  echo "$echecs contrôle(s) en échec."
  exit 1
fi
echo 'Tous les contrôles sont bons.'
