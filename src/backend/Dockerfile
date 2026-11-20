FROM debian:trixie-slim AS ffmpeg-builder
COPY setup/build-ffmpeg-linux.sh setup/ffmpeg.sh ./
RUN chmod +x build-ffmpeg-linux.sh
RUN ./build-ffmpeg-linux.sh --prefix=/opt/ffmpeg


FROM python:3.14-slim-trixie AS python-builder

ENV UV_LINK_MODE=copy
ENV UV_PROJECT_ENVIRONMENT=/opt/venv
# the venv links to this image's Python, which the runtime stage has at the same path
ENV UV_PYTHON_DOWNLOADS=never
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    libffi-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.11.7 /uv /bin/

WORKDIR /app
COPY pyproject.toml uv.lock ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked --no-dev --group seed


FROM python:3.14-slim-trixie AS backend

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/opt/venv/bin:/opt/ffmpeg/bin:$PATH"
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    # gnutls needed for ffmpeg to work
    # (technically curl installs it itself, but this is clearer, just in case)
    libgnutls30t64 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ffmpeg-builder /opt/ffmpeg/bin /opt/ffmpeg/bin
COPY --from=python-builder /opt/venv /opt/venv

ARG TARGETARCH
ARG SHAKA_VERSION=v3.4.2
RUN case "$TARGETARCH" in \
    amd64) SHAKA_BINARY=packager-linux-x64 ;; \
    arm64) SHAKA_BINARY=packager-linux-arm64 ;; \
    *) echo "Shaka Packager has no Linux binary for the '$TARGETARCH'" >&2; exit 1 ;; \
    esac \
    && curl -fsSL "https://github.com/shaka-project/shaka-packager/releases/download/${SHAKA_VERSION}/${SHAKA_BINARY}" -o /opt/ffmpeg/bin/packager \
    && chmod +x /opt/ffmpeg/bin/packager \
    && ln -sf /opt/ffmpeg/bin/packager /opt/ffmpeg/bin/shaka-packager

RUN ffmpeg -version && ffprobe -version && packager --version

WORKDIR /app
COPY setup/entrypoint.sh ./
RUN chmod +x entrypoint.sh

COPY musikk ./

ENTRYPOINT ["./entrypoint.sh"]
