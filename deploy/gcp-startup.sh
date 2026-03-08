#!/usr/bin/env bash
# GCE startup script (passed as instance metadata)
# Installs Docker, Docker Compose v2, git, nginx, certbot, and creates a deploy user.
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "==> ItalSempione GCE startup script"

# ── System updates ────────────────────────────────────────────────
apt-get update -qq
apt-get upgrade -y -qq

# ── Install prerequisites ─────────────────────────────────────────
apt-get install -y -qq \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw

# ── Install Docker CE ─────────────────────────────────────────────
if ! command -v docker &> /dev/null; then
    echo "==> Installing Docker CE..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
        https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# ── Enable Docker on boot ─────────────────────────────────────────
systemctl enable docker
systemctl start docker

# ── Verify Docker Compose v2 ──────────────────────────────────────
docker compose version

# ── Create deploy user ────────────────────────────────────────────
if ! id "deploy" &>/dev/null; then
    echo "==> Creating deploy user..."
    useradd -m -s /bin/bash -G docker,sudo deploy
    echo "deploy ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/deploy
fi

# ── Create project directory ──────────────────────────────────────
mkdir -p /opt/italsempione
chown deploy:deploy /opt/italsempione

# ── Create backup directory ───────────────────────────────────────
mkdir -p /backups/italsempione
chown deploy:deploy /backups/italsempione

# ── Basic firewall setup ──────────────────────────────────────────
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Startup script complete. Instance is ready for deployment."
