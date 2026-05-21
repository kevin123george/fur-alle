#!/bin/bash
# Run once on Umbrel to set up Cloudflare tunnel
# Usage: ssh umbrel@100.79.4.107 'bash -s' < setup-tunnel.sh
set -e

TUNNEL_ID="98cec2c3-6b0d-4130-97aa-b828784daf68"

echo "→ Writing tunnel config..."
cat > ~/.cloudflared/config.yml << EOF
tunnel: ${TUNNEL_ID}
credentials-file: /home/umbrel/.cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: byastra.de
    service: http://localhost:3001
  - hostname: regiohub.byastra.de
    service: http://localhost:3001
  - service: http_status:404
EOF

echo "→ Creating DNS routes..."
cloudflared tunnel route dns byastra byastra.de
cloudflared tunnel route dns byastra regiohub.byastra.de

echo "→ Installing as system service..."
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared

echo ""
echo "✓ Tunnel setup complete"
echo "  byastra.de         → localhost:3001"
echo "  regiohub.byastra.de → localhost:3001"
