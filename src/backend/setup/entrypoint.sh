#!/bin/bash

set -euo pipefail
# set -x

python manage.py check --deploy
python manage.py migrate
python manage.py collectstatic --noinput

# exec instead of raw for graceful shutdown
exec daphne -b 0.0.0.0 -p 8000 \
  --ping-interval 5 --ping-timeout 5 \
  musikk.asgi:application
