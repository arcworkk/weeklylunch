#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /path/to/weeklylunch-backup.db" >&2
  exit 1
fi

BACKUP_FILE="$(realpath "$1")"

if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Backup not found: ${BACKUP_FILE}" >&2
  exit 1
fi

read -r -p "Replace the production database with ${BACKUP_FILE}? Type RESTORE to continue: " confirmation

if [[ "${confirmation}" != "RESTORE" ]]; then
  echo "Restore cancelled."
  exit 0
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.prod.yml"
RESTART_BACKEND=false

cd "${PROJECT_ROOT}"

restart_backend() {
  if [[ "${RESTART_BACKEND}" == "true" ]]; then
    docker compose -f "${COMPOSE_FILE}" start backend >/dev/null
  fi
}

trap restart_backend EXIT

if docker compose -f "${COMPOSE_FILE}" ps --status running --services | grep -qx backend; then
  docker compose -f "${COMPOSE_FILE}" stop backend >/dev/null
  RESTART_BACKEND=true
fi
docker compose -f "${COMPOSE_FILE}" cp "${BACKUP_FILE}" backend:/data/weeklylunch.db
docker compose -f "${COMPOSE_FILE}" run --rm --no-deps backend \
  sh -c "rm -f /data/weeklylunch.db-wal /data/weeklylunch.db-shm /data/weeklylunch.db-journal"

echo "Database restored from: ${BACKUP_FILE}"
