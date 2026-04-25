#!/usr/bin/env bash
set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────────────
SERVER="${1:-}"               # SSH host alias or user@host
REMOTE_DIR="~/dealtracker/"
TAG="${TAG:-latest}"

IMAGES=(
  "dealtracker-harvester"
  "dealtracker-parser"
  "dealtracker-webapp"
)

# ── Validation ────────────────────────────────────────────────────────────────
if [[ -z "$SERVER" ]]; then
  echo "Usage: ./deploy.sh <ssh-host>"
  echo "  ./deploy.sh myserver"
  exit 1
fi

# ── Build ────────────────────────────────────────────────────────────────────
echo "==> Building JARs..."
mvn package -DskipTests

echo "==> Building images..."
docker build -t dealtracker-harvester:$TAG deal-tracker-harvester
docker build -t dealtracker-parser:$TAG     deal-tracker-parser
docker build -t dealtracker-webapp:$TAG     deal-tracker-webapp

# ── Save & transfer ───────────────────────────────────────────────────────────
ARCHIVE=$(mktemp /tmp/dealtracker-XXXXXX.tar.gz)
trap "rm -f $ARCHIVE" EXIT

echo "==> Saving images to archive..."
docker save "${IMAGES[@]/%/:$TAG}" | gzip > "$ARCHIVE"

echo "==> Transferring to $SERVER:$REMOTE_DIR ..."
scp "$ARCHIVE" "$SERVER:$REMOTE_DIR/images.tar.gz"

# ── Load & restart ────────────────────────────────────────────────────────────
echo "==> Loading images on server..."
ssh "$SERVER" bash <<EOF
  cd $REMOTE_DIR
  docker load < images.tar.gz
  rm images.tar.gz
  docker compose up -d --no-build
EOF

echo "==> Done."
