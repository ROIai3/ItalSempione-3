#!/usr/bin/env bash
# Creates a GCE instance for ItalSempione
# Usage: ./setup-gcp.sh [project-id] [zone]
set -euo pipefail

# ── Configuration ─────────────────────────────────────────────────
PROJECT_ID="${1:?Usage: $0 <project-id> [zone]}"
ZONE="${2:-europe-west1-b}"
INSTANCE_NAME="italsempione-prod"
MACHINE_TYPE="e2-medium"
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
BOOT_DISK_SIZE="30GB"
STARTUP_SCRIPT="$(dirname "$0")/gcp-startup.sh"

echo "==> Setting project to ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

# ── Create firewall rules ────────────────────────────────────────
echo "==> Creating firewall rules for HTTP/HTTPS"
gcloud compute firewall-rules create allow-http \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:80 \
    --target-tags=http-server \
    --description="Allow HTTP traffic" \
    2>/dev/null || echo "    Firewall rule allow-http already exists, skipping."

gcloud compute firewall-rules create allow-https \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:443 \
    --target-tags=https-server \
    --description="Allow HTTPS traffic" \
    2>/dev/null || echo "    Firewall rule allow-https already exists, skipping."

# ── Create GCE instance ──────────────────────────────────────────
echo "==> Creating GCE instance: ${INSTANCE_NAME}"
gcloud compute instances create "${INSTANCE_NAME}" \
    --zone="${ZONE}" \
    --machine-type="${MACHINE_TYPE}" \
    --image-family="${IMAGE_FAMILY}" \
    --image-project="${IMAGE_PROJECT}" \
    --boot-disk-size="${BOOT_DISK_SIZE}" \
    --boot-disk-type=pd-balanced \
    --tags=http-server,https-server \
    --metadata-from-file=startup-script="${STARTUP_SCRIPT}" \
    --scopes=default

# ── Get external IP ──────────────────────────────────────────────
EXTERNAL_IP=$(gcloud compute instances describe "${INSTANCE_NAME}" \
    --zone="${ZONE}" \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "=============================================="
echo "  Instance created successfully!"
echo "=============================================="
echo ""
echo "  Instance:  ${INSTANCE_NAME}"
echo "  Zone:      ${ZONE}"
echo "  IP:        ${EXTERNAL_IP}"
echo ""
echo "  SSH into the instance:"
echo "    gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE}"
echo ""
echo "  Next steps:"
echo "    1. Point your domain DNS A record to ${EXTERNAL_IP}"
echo "    2. SSH into the instance"
echo "    3. Clone the repo: git clone <repo-url> /opt/italsempione"
echo "    4. cd /opt/italsempione && cp .env.example .env"
echo "    5. Edit .env with production values"
echo "    6. Run: bash deploy/ssl-setup.sh yourdomain.com"
echo "    7. Run: bash deploy/deploy.sh"
echo "=============================================="
