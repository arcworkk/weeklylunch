#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.prod.yml"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="${BACKUP_DIR}/weeklylunch-${TIMESTAMP}.db"
RESTART_BACKEND=false

mkdir -p "${BACKUP_DIR}"
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
docker compose -f "${COMPOSE_FILE}" cp backend:/data/weeklylunch.db "${BACKUP_FILE}"

echo "Backup created: ${BACKUP_FILE}"
