FROM debian:bullseye-slim AS ffmpeg-builder
COPY build_ffmpeg.sh .
RUN chmod +x build_ffmpeg.sh
RUN ./build_ffmpeg.sh


FROM python:3.13-slim AS backend-builder

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PATH="/opt/bin:$PATH"
ENV LD_LIBRARY_PATH="/opt/ffmpeg_build/lib:$LD_LIBRARY_PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ffmpeg-builder /opt/bin /opt/bin
COPY --from=ffmpeg-builder /opt/ffmpeg_build /opt/ffmpeg_build

WORKDIR /app

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

COPY musikk/requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
COPY musikk .


ENTRYPOINT ["./entrypoint.sh"]