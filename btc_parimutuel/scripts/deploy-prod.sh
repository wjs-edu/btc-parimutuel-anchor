#!/usr/bin/env bash
set -euo pipefail

: "${PROD_HOST:?set PROD_HOST like root@165.232.137.182}"
: "${PROD_REPO:?set PROD_REPO like /opt/commitclose/btc_parimutuel}"
: "${PROD_BRANCH:=proof-ui-v1}"

ssh "$PROD_HOST" "set -euo pipefail
cd '$PROD_REPO'

echo '--- FETCH + RESET ---'
git fetch --all --prune
git checkout '$PROD_BRANCH'
git reset --hard 'origin/$PROD_BRANCH'
git status -sb
echo 'HEAD=' \$(git rev-parse HEAD)

echo '--- BUILD + RUN ---'
# Adjust if you use docker compose; this is plain docker.
docker rm -f commitclose-proof >/dev/null 2>&1 || true
docker build -t commitclose-proof:latest .
docker run -d --name commitclose-proof -p 8080:8080 --restart unless-stopped commitclose-proof:latest

echo '--- SMOKE ---'
curl -fsS http://127.0.0.1:8080/ >/dev/null || true
echo 'OK'
"
