#!/bin/bash

set -euo pipefail
set -x

mkdir -p "${MEDIA_ROOT_PATH:-/app/media}"&&
mkdir -p "${AUDIO_CONTENT_PATH:-/app/media/audio}"

source /app/.venv/bin/activate

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
  echo "Waiting for postgres..."
  sleep 2
done

uv run python manage.py check --deploy &&
uv run python manage.py makemigrations &&
uv run python manage.py migrate &&
uv run python manage.py collectstatic --noinput &&
daphne -b 0.0.0.0 -p ${DJANGO_PORT} musikk.asgi:application