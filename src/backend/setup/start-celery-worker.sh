#!/bin/bash
set -euo pipefail

# -B == celery beat
exec celery -A musikk worker -B -l INFO
