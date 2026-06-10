#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.prod.yml"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_FILE="${BACKUP_DIR}/weeklylunch-${TIMESTAMP}.db"
MEDIA_BACKUP_DIR="${BACKUP_DIR}/weeklylunch-${TIMESTAMP}-uploads"
RESTART_BACKEND=false
HAS_UPLOADS=false

mkdir -p "${BACKUP_DIR}"
cd "${PROJECT_ROOT}"

restart_backend() {
  if [[ "${RESTART_BACKEND}" == "true" ]]; then
    docker compose -f "${COMPOSE_FILE}" start backend >/dev/null
  fi
}

trap restart_backend EXIT

if docker compose -f "${COMPOSE_FILE}" ps --status running --services | grep -qx backend; then
  if docker compose -f "${COMPOSE_FILE}" exec -T backend test -d /data/uploads; then
    HAS_UPLOADS=true
  fi
  docker compose -f "${COMPOSE_FILE}" stop backend >/dev/null
  RESTART_BACKEND=true
fi
docker compose -f "${COMPOSE_FILE}" cp backend:/data/weeklylunch.db "${BACKUP_FILE}"

if [[ "${HAS_UPLOADS}" == "true" ]]; then
  docker compose -f "${COMPOSE_FILE}" cp backend:/data/uploads "${MEDIA_BACKUP_DIR}"
fi

echo "Backup created: ${BACKUP_FILE}"
if [[ -d "${MEDIA_BACKUP_DIR}" ]]; then
  echo "Media backup created: ${MEDIA_BACKUP_DIR}"
fi
