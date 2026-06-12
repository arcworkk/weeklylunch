#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.prod.yml"
ENV_FILE="${PROJECT_ROOT}/backend/.env"

exec 9>/var/lock/weeklylunch-deploy.lock
if ! flock -n 9; then
  echo "Another WeeklyLunch deployment is already running." >&2
  exit 1
fi

cd "${PROJECT_ROOT}"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Create it from backend/.env.production.example." >&2
  exit 1
fi

docker compose -f "${COMPOSE_FILE}" config --quiet

if docker compose -f "${COMPOSE_FILE}" ps -a --services | grep -qx backend; then
  "${SCRIPT_DIR}/backup-sqlite.sh"
fi

docker compose -f "${COMPOSE_FILE}" build --pull
docker compose -f "${COMPOSE_FILE}" run --rm --no-deps backend npm run prisma:migrate
docker compose -f "${COMPOSE_FILE}" up -d --remove-orphans
docker compose -f "${COMPOSE_FILE}" run --rm --no-deps backend npm run recipes:images

for attempt in {1..30}; do
  if curl --fail --silent http://127.0.0.1:3001/api/health >/dev/null && \
     curl --fail --silent http://127.0.0.1:8081 >/dev/null; then
    docker compose -f "${COMPOSE_FILE}" ps
    echo "WeeklyLunch deployment completed successfully."
    exit 0
  fi

  sleep 2
done

docker compose -f "${COMPOSE_FILE}" ps
docker compose -f "${COMPOSE_FILE}" logs --tail=100 backend frontend
echo "Deployment health check failed." >&2
exit 1
