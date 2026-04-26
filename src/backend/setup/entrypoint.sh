#!/bin/bash

set -euo pipefail
# set -x

mkdir -p "${MEDIA_ROOT_PATH:-/app/media}"
mkdir -p "${AUDIO_CONTENT_PATH:-/app/media/audio}"

source /app/.venv/bin/activate

MAX_RETRIES=30
RETRY_COUNT=0
until uv run python << END
import sys
import psycopg
import os

try:
    with psycopg.connect(
        dbname=os.environ["POSTGRES_DB"],
        user=os.environ["POSTGRES_USER"],
        password=os.environ["POSTGRES_PASSWORD"],
        host=os.environ["POSTGRES_HOST"],
        port=os.environ["POSTGRES_PORT"],
    ) as conn:
        pass
except psycopg.Error:
    sys.exit(1)
sys.exit(0)
END
do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
    echo "Failed to connect to postgres after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Waiting for postgres... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

uv run python manage.py check --deploy &&
uv run python manage.py migrate &&
uv run python manage.py collectstatic --noinput &&
daphne -b 0.0.0.0 -p ${DJANGO_PORT} musikk.asgi:application
