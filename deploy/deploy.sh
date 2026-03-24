#!/usr/bin/env bash
# Deploy ItalSempione to production
# Run this on the GCP VPS after cloning the repo
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${PROJECT_DIR}/docker/docker-compose.prod.yml"

echo "==> ItalSempione Production Deployment"
echo ""

# ── Check Docker is installed ─────────────────────────────────────
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed. Run gcp-startup.sh first or install Docker manually."
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "ERROR: Docker Compose v2 is not available."
    exit 1
fi

echo "    Docker:  $(docker --version)"
echo "    Compose: $(docker compose version)"
echo ""

# ── Ensure .env exists ────────────────────────────────────────────
if [ ! -f "${PROJECT_DIR}/.env" ]; then
    echo "==> No .env file found. Copying from .env.example..."
    cp "${PROJECT_DIR}/.env.example" "${PROJECT_DIR}/.env"
    echo ""
    echo "    IMPORTANT: Edit ${PROJECT_DIR}/.env with production values before continuing."
    echo "    Then re-run this script."
    echo ""
    read -rp "    Press Enter to open .env in nano, or Ctrl+C to abort... "
    nano "${PROJECT_DIR}/.env"
fi

# ── Export .env for docker compose ────────────────────────────────
set -a
source "${PROJECT_DIR}/.env"
set +a

# ── Build images ──────────────────────────────────────────────────
echo "==> Building Docker images..."
docker compose -f "${COMPOSE_FILE}" --project-directory "${PROJECT_DIR}" build

# ── Start services ────────────────────────────────────────────────
echo "==> Starting services..."
docker compose -f "${COMPOSE_FILE}" --project-directory "${PROJECT_DIR}" up -d

# ── Wait for health checks ───────────────────────────────────────
echo "==> Waiting for PostgreSQL to be healthy..."
RETRIES=30
until docker compose -f "${COMPOSE_FILE}" --project-directory "${PROJECT_DIR}" \
    exec -T postgres pg_isready -U "${POSTGRES_USER:-italsempione}" > /dev/null 2>&1; do
    RETRIES=$((RETRIES - 1))
    if [ "$RETRIES" -le 0 ]; then
        echo "ERROR: PostgreSQL did not become healthy in time."
        docker compose -f "${COMPOSE_FILE}" --project-directory "${PROJECT_DIR}" logs postgres
        exit 1
    fi
    echo "    Waiting... (${RETRIES} retries left)"
    sleep 2
done
echo "    PostgreSQL is ready."

# ── Run database migrations ───────────────────────────────────────
echo "==> Running database migrations..."
docker compose -f "${COMPOSE_FILE}" --project-directory "${PROJECT_DIR}" \
    exec -T backend npx knex migrate:latest --knexfile dist/knexfile.js

# ── Run database seeds ───────────────────────────────────────────
echo "==> Running database seeds..."
docker compose -f "${COMPOSE_FILE}" --project-directory "${PROJECT_DIR}" \
    exec -T backend npx knex seed:run --knexfile dist/knexfile.js

# ── Print status ─────────────────────────────────────────────────
echo ""
echo "==> Deployment complete! Service status:"
echo ""
docker compose -f "${COMPOSE_FILE}" --project-directory "${PROJECT_DIR}" ps
echo ""
echo "=============================================="
echo "  URLs:"
echo "    Frontend:  https://$(hostname -f)"
echo "    API:       https://$(hostname -f)/api"
echo "    n8n:       https://$(hostname -f)/n8n"
echo "=============================================="
