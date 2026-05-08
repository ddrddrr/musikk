#!/bin/bash
set -euo pipefail

source /app/.venv/bin/activate

exec uv run celery -A musikk worker -l INFO
