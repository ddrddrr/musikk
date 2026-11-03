#!/bin/bash
set -euo pipefail

source /app/.venv/bin/activate

# -B runs the beat scheduler inside this worker. Keep one worker, or the periodic tasks run twice.
exec uv run celery -A musikk worker -B -l INFO
