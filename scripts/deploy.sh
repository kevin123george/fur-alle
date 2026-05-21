#!/bin/bash
# Deploy local changes to Umbrel and rebuild
# Usage: ./deploy.sh          → auto-detect (home network or Tailscale)
#        ./deploy.sh --home   → force umbrel.local (home network)
#        ./deploy.sh --ts     → force Tailscale IP 100.79.4.107
set -e
cd "$(dirname "$0")/.."

TAILSCALE_IP="100.79.4.107"
TAILSCALE_HOST="umbrel@${TAILSCALE_IP}"
HOME_HOST="umbrel@umbrel.local"

# Determine target
if [[ "$1" == "--ts" ]]; then
  TARGET="$TAILSCALE_HOST"
  echo "→ Using Tailscale (${TAILSCALE_IP})"
elif [[ "$1" == "--home" ]]; then
  TARGET="$HOME_HOST"
  echo "→ Using home network (umbrel.local)"
else
  if ping -c 1 -W 1 umbrel.local &>/dev/null; then
    TARGET="$HOME_HOST"
    echo "→ Home network detected, using umbrel.local"
  else
    TARGET="$TAILSCALE_HOST"
    echo "→ Not on home network, using Tailscale (${TAILSCALE_IP})"
  fi
fi

echo ""
echo "📦 Syncing files..."
rsync -avz \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='api/target' \
  --exclude='data/raw' \
  --exclude='.venv' \
  ./ "${TARGET}:~/furalle/furalle/"

echo ""
echo "🐳 Rebuilding Docker containers..."
ssh "${TARGET}" "cd ~/furalle/furalle && docker compose up -d --build"

echo ""
echo "🔗 Ensuring DNS routes exist..."
TUNNEL_ID="98cec2c3-6b0d-4130-97aa-b828784daf68"
ssh "${TARGET}" "cloudflared tunnel route dns --overwrite-dns ${TUNNEL_ID} regiohub.byastra.de 2>/dev/null || true"
ssh "${TARGET}" "cloudflared tunnel route dns --overwrite-dns ${TUNNEL_ID} fueralle.byastra.de 2>/dev/null || true"

echo ""
echo "✓ Deploy complete"
echo "  → https://regiohub.byastra.de"
echo "  → https://fueralle.byastra.de"
