#!/usr/bin/env bash
set -euo pipefail

: "${PROD_HOST:?set PROD_HOST like root@165.232.137.182}"
: "${PROD_REPO:?set PROD_REPO like /opt/commitclose/btc_parimutuel}"
: "${PROD_BRANCH:=proof-ui-v1}"

ssh "$PROD_HOST" bash -s <<'REMOTE'
set -euo pipefail

cd "$PROD_REPO"

echo '--- FETCH + RESET ---'
git fetch --all --prune
git checkout "$PROD_BRANCH"
git reset --hard "origin/$PROD_BRANCH"
git clean -fd
git status -sb
echo "HEAD=$(git rev-parse HEAD)"

echo '--- BUILD + RUN ---'
docker rm -f commitclose-proof >/dev/null 2>&1 || true
docker build -t commitclose-proof:latest .
docker run -d --name commitclose-proof -p 8080:8080 --restart unless-stopped commitclose-proof:latest

echo '--- SMOKE ---'
# Retry health check against the canonical contract surface.
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS http://127.0.0.1:8080/status/1766716704.json >/dev/null 2>&1; then
    echo "OK: app responding"
    exit 0
  fi
  echo "waiting for app... ($i/10)"
  sleep 1
done

echo "FAIL: app not responding; dumping container status + logs"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker logs --tail 200 commitclose-proof || true
exit 1
REMOTE
