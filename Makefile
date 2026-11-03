.PHONY: help setup-tools setup-ffmpeg setup-shaka check-tools check-ffmpeg check-shaka clean-tools run-local-docker run-local-docker-down run-local-docker-seed run-local-docker-clear run-local-dev run-local-dev-seed run-local-dev-clear diagrams text

UNAME := $(shell uname -s)
ARCH := $(shell uname -m)

LOCAL_BINARY_DIR_PREFIX := .tools
SHAKA_VERSION := v3.4.2

ifeq ($(UNAME),Darwin)
  FFMPEG_SCRIPT := src/backend/setup/build-ffmpeg-macos.sh
  SHAKA_BINARY := packager-osx-arm64
else
  FFMPEG_SCRIPT := src/backend/setup/build-ffmpeg-linux.sh
  SHAKA_BINARY := packager-linux-x64
endif

SHAKA_URL := https://github.com/shaka-project/shaka-packager/releases/download/$(SHAKA_VERSION)/$(SHAKA_BINARY)

.DEFAULT_GOAL := help

help: ## Show this list of commands
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z0-9_-]+:.*## / {printf "  %-24s %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@echo
	@echo 'The seed commands pass ARGS on to initmodels, e.g. make run-local-dev-seed ARGS="--generate-audio"'

setup-tools: setup-ffmpeg setup-shaka ## Install ffmpeg and shaka-packager into .tools

setup-ffmpeg: ## Build ffmpeg into .tools
	@if [ -x "$(LOCAL_BINARY_DIR_PREFIX)/bin/ffmpeg" ]; then \
		echo "ffmpeg already installed at $(LOCAL_BINARY_DIR_PREFIX)/bin/ffmpeg, run 'make clean-tools' to rebuild"; \
		exit 0; \
	fi; \
	if command -v ffmpeg >/dev/null 2>&1; then \
		echo "note: system ffmpeg found at $$(command -v ffmpeg);"; \
		echo "to use the system one instead, point FFMPEG_BIN/FFPROBE_BIN at it in .env."; \
	fi; \
	bash $(FFMPEG_SCRIPT)

setup-shaka: ## Download shaka-packager into .tools
	@if [ -x "$(LOCAL_BINARY_DIR_PREFIX)/bin/packager" ]; then \
		echo "shaka-packager already installed at $(LOCAL_BINARY_DIR_PREFIX)/bin/packager, run 'make clean-tools' to rebuild"; \
		exit 0; \
	fi; \
	if command -v packager >/dev/null 2>&1; then \
		echo "note: system packager found at $$(command -v packager); "; \
		echo "to use the system one instead, point SHAKA_PACKAGER_BIN at it in .env."; \
	fi; \
	mkdir -p $(LOCAL_BINARY_DIR_PREFIX)/bin; \
	curl -fsSL "$(SHAKA_URL)" -o $(LOCAL_BINARY_DIR_PREFIX)/bin/packager; \
	chmod +x $(LOCAL_BINARY_DIR_PREFIX)/bin/packager; \
	echo "shaka-packager $(SHAKA_VERSION) installed to $(LOCAL_BINARY_DIR_PREFIX)/bin/packager"

check-tools: check-ffmpeg check-shaka ## Print the ffmpeg and shaka-packager versions

check-ffmpeg: ## Print the ffmpeg and ffprobe versions
	@$(LOCAL_BINARY_DIR_PREFIX)/bin/ffmpeg -version | head -1
	@$(LOCAL_BINARY_DIR_PREFIX)/bin/ffprobe -version | head -1

check-shaka: ## Print the shaka-packager version
	@$(LOCAL_BINARY_DIR_PREFIX)/bin/packager --version

clean-tools: ## Delete the ffmpeg and shaka-packager binaries in .tools
	rm -rf $(LOCAL_BINARY_DIR_PREFIX)

run-local-docker: ## Build and start the whole app in Docker
	docker compose --env-file .env.prod -f docker-compose-prod.yml up --build

run-local-docker-down: ## Stop the whole app in Docker
	docker compose --env-file .env.prod -f docker-compose-prod.yml down

run-local-docker-seed: ## Fill the Docker database with sample data
	docker compose --env-file .env.prod -f docker-compose-prod.yml exec server uv run python manage.py initmodels $(ARGS)

run-local-docker-clear: ## Delete the sample data from the Docker database
	docker compose --env-file .env.prod -f docker-compose-prod.yml exec server uv run python manage.py clearmodels

# needs the variables from .env in the shell, e.g. through direnv.
# The servers run in the background of one shell, where they may ignore Ctrl+C,
# so the trap stops the whole process group
run-local-dev: ## Start Postgres and Redis in Docker, run the backend, Celery and frontend locally
	docker compose -f docker-compose-local.yml up -d
	@until docker compose -f docker-compose-local.yml exec -T database sh -c 'pg_isready -q -h localhost -U "$$POSTGRES_USER"'; do \
		echo "Waiting for postgres..."; \
		sleep 1; \
	done
	uv run --directory src/backend/musikk python manage.py migrate
	@trap 'trap - INT TERM; kill 0' INT TERM; \
	uv run --directory src/backend/musikk python manage.py runserver $${DJANGO_PORT:-8005} & \
	uv run --directory src/backend/musikk celery -A musikk worker -l INFO & \
	npm --prefix src/frontend/musikk run dev & \
	wait

run-local-dev-seed: ## Fill the local database with sample data
	uv run --directory src/backend/musikk python manage.py initmodels $(ARGS)

run-local-dev-clear: ## Delete the sample data from the local database
	uv run --directory src/backend/musikk python manage.py clearmodels

diagrams: ## Render the PlantUML diagrams into text/diagrams
	plantuml -tpng --output-dir $(abspath text/diagrams) --exclude "**/_style.puml" "specification/**.puml"

text: ## Build the thesis PDF into text/out
	mkdir -p text/out
	cd text && uv run --no-project --python 3.13 -- latexmk -pdf -outdir=out thesis.tex