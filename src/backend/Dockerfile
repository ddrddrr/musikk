FROM debian:bookworm-slim AS ffmpeg-builder
COPY setup/build-ffmpeg-linux.sh setup/ffmpeg.sh ./
RUN chmod +x build-ffmpeg-linux.sh
RUN ./build-ffmpeg-linux.sh --prefix=/opt/ffmpeg


FROM python:3.14-slim AS backend-builder

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PATH="/opt/ffmpeg/bin:$PATH"
ENV UV_LINK_MODE=copy
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    libffi-dev \
    curl \
    libpq-dev \
    libmagic1 \
    libgnutls30 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ffmpeg-builder /opt/ffmpeg/bin /opt/ffmpeg/bin
COPY --from=ghcr.io/astral-sh/uv:0.7.11 /uv /uvx /bin/

ARG SHAKA_VERSION=v3.4.2
RUN curl -fsSL "https://github.com/shaka-project/shaka-packager/releases/download/${SHAKA_VERSION}/packager-linux-x64" -o /opt/ffmpeg/bin/packager \
    && chmod +x /opt/ffmpeg/bin/packager \
    && ln -sf /opt/ffmpeg/bin/packager /opt/ffmpeg/bin/shaka-packager

RUN ffmpeg -version && ffprobe -version && packager --version

WORKDIR /app
COPY setup/entrypoint.sh setup/start-celery-worker.sh ./
RUN chmod +x entrypoint.sh start-celery-worker.sh

COPY pyproject.toml ./
COPY uv.lock ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

COPY musikk ./

ENTRYPOINT ["./entrypoint.sh"]
