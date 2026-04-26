.PHONY: setup setup-ffmpeg setup-shaka check check-ffmpeg check-shaka clean

UNAME := $(shell uname -s)
ARCH := $(shell uname -m)

PREFIX := .tools
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
	@if [ -x "$(PREFIX)/bin/ffmpeg" ]; then \
		echo "ffmpeg already installed at $(PREFIX)/bin/ffmpeg, run 'make clean' to rebuild"; \
		exit 0; \
	fi; \
	if command -v ffmpeg >/dev/null 2>&1; then \
		echo "note: system ffmpeg found at $$(command -v ffmpeg);"; \
		echo "to use the system one instead, point FFMPEG_BIN/FFPROBE_BIN at it in .env."; \
	fi; \
	bash $(FFMPEG_SCRIPT)

setup-shaka:
	@if [ -x "$(PREFIX)/bin/packager" ]; then \
		echo "shaka-packager already installed at $(PREFIX)/bin/packager, run 'make clean' to rebuild"; \
		exit 0; \
	fi; \
	if command -v packager >/dev/null 2>&1; then \
		echo "note: system packager found at $$(command -v packager); "; \
		echo "to use the system one instead, point SHAKA_PACKAGER_BIN at it in .env."; \
	fi; \
	mkdir -p $(PREFIX)/bin; \
	curl -fsSL "$(SHAKA_URL)" -o $(PREFIX)/bin/packager; \
	chmod +x $(PREFIX)/bin/packager; \
	echo "shaka-packager $(SHAKA_VERSION) installed to $(PREFIX)/bin/packager"

check: check-ffmpeg check-shaka

check-ffmpeg:
	@$(PREFIX)/bin/ffmpeg -version | head -1
	@$(PREFIX)/bin/ffprobe -version | head -1

check-shaka:
	@$(PREFIX)/bin/packager --version

clean:
	rm -rf $(PREFIX)
