#!/bin/bash
# Pull changes from Umbrel back to local
# Usage: ./pull.sh          → auto-detect (home network or Tailscale)
#        ./pull.sh --home   → force umbrel.local (home network)
#        ./pull.sh --ts     → force Tailscale IP 100.79.4.107
set -e
cd "$(dirname "$0")"

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
  # Auto-detect: try umbrel.local first (home), fall back to Tailscale
  if ping -c 1 -W 1 umbrel.local &>/dev/null; then
    TARGET="$HOME_HOST"
    echo "→ Home network detected, using umbrel.local"
  else
    TARGET="$TAILSCALE_HOST"
    echo "→ Not on home network, using Tailscale (${TAILSCALE_IP})"
  fi
fi

rsync -avz \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='api/target' \
  --exclude='data/raw' \
  --exclude='.venv' \
  "${TARGET}:~/furalle/furalle/" ./

echo ""
echo "✓ Pull done."
