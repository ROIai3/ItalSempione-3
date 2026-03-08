#!/usr/bin/env bash
# PostgreSQL backup script for ItalSempione
# Dumps the database from the Docker container, compresses, and rotates old backups.
# Add to crontab: 0 2 * * * /opt/italsempione/deploy/backup.sh >> /var/log/italsempione-backup.log 2>&1
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${PROJECT_DIR}/docker/docker-compose.prod.yml"
BACKUP_DIR="/backups/italsempione"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Load environment variables
if [ -f "${PROJECT_DIR}/.env" ]; then
    set -a
    source "${PROJECT_DIR}/.env"
    set +a
fi

DB_NAME="${POSTGRES_DB:-italsempione}"
DB_USER="${POSTGRES_USER:-italsempione}"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

# ── Create backup directory ───────────────────────────────────────
mkdir -p "${BACKUP_DIR}"

# ── Dump database ─────────────────────────────────────────────────
echo "[$(date)] Starting backup of ${DB_NAME}..."

docker compose -f "${COMPOSE_FILE}" --project-directory "${PROJECT_DIR}" \
    exec -T postgres pg_dump -U "${DB_USER}" "${DB_NAME}" \
    | gzip > "${BACKUP_FILE}"

BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date)] Backup saved: ${BACKUP_FILE} (${BACKUP_SIZE})"

# ── Delete old backups ────────────────────────────────────────────
echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
DELETED=$(find "${BACKUP_DIR}" -name "*.sql.gz" -mtime +${RETENTION_DAYS} -print -delete | wc -l)
echo "[$(date)] Deleted ${DELETED} old backup(s)."

echo "[$(date)] Backup complete."
