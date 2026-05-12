.PHONY: setup setup-ffmpeg setup-shaka check check-ffmpeg check-shaka clean run-local-full run-local-full-down run-local-full-seed run-local-full-clear diagrams text

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

setup: setup-ffmpeg setup-shaka

setup-ffmpeg:
	@if [ -x "$(LOCAL_BINARY_DIR_PREFIX)/bin/ffmpeg" ]; then \
		echo "ffmpeg already installed at $(LOCAL_BINARY_DIR_PREFIX)/bin/ffmpeg, run 'make clean' to rebuild"; \
		exit 0; \
	fi; \
	if command -v ffmpeg >/dev/null 2>&1; then \
		echo "note: system ffmpeg found at $$(command -v ffmpeg);"; \
		echo "to use the system one instead, point FFMPEG_BIN/FFPROBE_BIN at it in .env."; \
	fi; \
	bash $(FFMPEG_SCRIPT)

setup-shaka:
	@if [ -x "$(LOCAL_BINARY_DIR_PREFIX)/bin/packager" ]; then \
		echo "shaka-packager already installed at $(LOCAL_BINARY_DIR_PREFIX)/bin/packager, run 'make clean' to rebuild"; \
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

check: check-ffmpeg check-shaka

check-ffmpeg:
	@$(LOCAL_BINARY_DIR_PREFIX)/bin/ffmpeg -version | head -1
	@$(LOCAL_BINARY_DIR_PREFIX)/bin/ffprobe -version | head -1

check-shaka:
	@$(LOCAL_BINARY_DIR_PREFIX)/bin/packager --version

clean:
	rm -rf $(LOCAL_BINARY_DIR_PREFIX)

run-local-full:
	docker compose --env-file .env.prod -f docker-compose-prod.yml up --build

run-local-full-down:
	docker compose --env-file .env.prod -f docker-compose-prod.yml down

run-local-full-seed:
	docker compose --env-file .env.prod -f docker-compose-prod.yml exec server uv run python manage.py initmodels

run-local-full-clear:
	docker compose --env-file .env.prod -f docker-compose-prod.yml exec server uv run python manage.py clearmodels

diagrams:
	plantuml -tpng --output-dir $(abspath text/diagrams) --exclude "**/_style.puml" "specification/**.puml"

text:
	mkdir -p text/out
	cd text && uv run --no-project --python 3.13 -- latexmk -pdf -outdir=out thesis.tex