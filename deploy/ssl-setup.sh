#!/usr/bin/env bash
# Set up Let's Encrypt SSL certificates
# Usage: ./ssl-setup.sh <domain> [email]
set -euo pipefail

DOMAIN="${1:?Usage: $0 <domain> [email]}"
EMAIL="${2:-admin@${DOMAIN}}"

echo "==> SSL Setup for ${DOMAIN}"
echo ""

# ── Install certbot if needed ─────────────────────────────────────
if ! command -v certbot &> /dev/null; then
    echo "==> Installing certbot..."
    sudo apt-get update -qq
    sudo apt-get install -y -qq certbot python3-certbot-nginx
fi

# ── Create webroot directory ──────────────────────────────────────
sudo mkdir -p /var/www/certbot

# ── Obtain certificate ───────────────────────────────────────────
echo "==> Requesting certificate for ${DOMAIN}..."
sudo certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --domain "${DOMAIN}" \
    --email "${EMAIL}" \
    --agree-tos \
    --non-interactive

# ── Set up auto-renewal cron ─────────────────────────────────────
echo "==> Setting up auto-renewal..."
CRON_JOB="0 3 * * * certbot renew --quiet --deploy-hook 'docker exec \$(docker ps -qf name=nginx) nginx -s reload'"

# Add cron job if not already present
(crontab -l 2>/dev/null | grep -F "certbot renew" > /dev/null) || {
    (crontab -l 2>/dev/null; echo "${CRON_JOB}") | crontab -
    echo "    Auto-renewal cron job added (daily at 3 AM)."
}

# ── Reload nginx ──────────────────────────────────────────────────
echo "==> Reloading nginx to apply certificate..."
NGINX_CONTAINER=$(docker ps -qf "name=nginx" 2>/dev/null || true)
if [ -n "${NGINX_CONTAINER}" ]; then
    docker exec "${NGINX_CONTAINER}" nginx -s reload
    echo "    Nginx reloaded."
else
    echo "    WARNING: Nginx container not running. Start services first, then reload manually."
fi

echo ""
echo "=============================================="
echo "  SSL certificate installed for ${DOMAIN}"
echo "  Auto-renewal is configured."
echo "=============================================="
