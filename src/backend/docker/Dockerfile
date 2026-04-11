FROM debian:bullseye-slim AS ffmpeg-builder
COPY ./docker/build-ffmpeg.sh .
RUN chmod +x build-ffmpeg.sh
RUN ./build-ffmpeg.sh


FROM python:3.13-slim AS backend-builder

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PATH="/opt/bin:$PATH"
ENV LD_LIBRARY_PATH="/opt/ffmpeg_build/lib:$LD_LIBRARY_PATH"
ENV UV_LINK_MODE=copy
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    libpq-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ffmpeg-builder /opt/bin /opt/bin
COPY --from=ffmpeg-builder /opt/ffmpeg_build /opt/ffmpeg_build
COPY --from=ghcr.io/astral-sh/uv:0.7.11 /uv /uvx /bin/

ARG SHAKA_VERSION=v3.4.2
RUN curl -fsSL "https://github.com/shaka-project/shaka-packager/releases/download/${SHAKA_VERSION}/packager-linux-x64" -o /opt/bin/packager \
    && chmod +x /opt/bin/packager \
    && ln -sf /opt/bin/packager /opt/bin/shaka-packager

RUN ffmpeg -version && ffprobe -version && packager --version

WORKDIR /app
COPY ./docker/entrypoint.sh ./
RUN chmod +x entrypoint.sh

COPY pyproject.toml ./
COPY uv.lock ./

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --locked

COPY musikk ./

ENTRYPOINT ["./entrypoint.sh"]