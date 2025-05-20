#!/bin/bash
set -euo pipefail

IMAGE_NAME=client
VOLUME_NAME=musikk_react_build
BUILD_CONTEXT=./src/frontend
COMPOSE_FILE=docker-compose-prod.yml

echo ">>> Building Docker images with compose..."
docker compose -f "$COMPOSE_FILE" build

echo ">>> Ensuring '$VOLUME_NAME' volume exists..."
docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1 || docker volume create "$VOLUME_NAME"

echo ">>> Building frontend image separately to extract build files..."
docker build -t "$IMAGE_NAME" "$BUILD_CONTEXT"

echo ">>> Copying built React files into '$VOLUME_NAME' volume..."
docker run --rm -v "$VOLUME_NAME":/dist "$IMAGE_NAME" sh -c "cp -r /export/* /dist"
echo ">>> Done."