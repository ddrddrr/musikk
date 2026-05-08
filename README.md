# musikk

A music streaming app with focus on social features.

## Features

- Albums, playlists, listening history
- Social feed, publications, threaded comments, real-time chat
- Audio uploads and normalization
- Adaptive streaming via DASH/HLS and Shaka Player (Frontend)
- Multi-tab/device synchronization of playback and volume. Device list and active device switching

## Tech stack

- **Backend**: Python 3.14, Django 5.2, Django REST Framework, Channels (WebSockets), Daphne (ASGI), Celery
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS 4, ShadCN/Radix UI, TanStack Query, Shaka Player
- **Audio processing**: FFmpeg, Shaka packager
- **Data**: PostgreSQL 17, Redis 8 (cache, Channels layer, Celery broker)
- **Infra**: Docker Compose, Caddy reverse proxy

## Components

- **server** — Django ASGI app (Daphne), serves REST + WebSockets on `:8000`
- **celery_worker** — async tasks (audio transcoding, packaging, etc.)
- **database** — PostgreSQL 17
- **redis** — cache, Channels layer, Celery broker
- **proxy** — Caddy: serves the built SPA, reverse-proxies `/api/*` and `/ws/*` to the server, serves `/static/*` and
  `/media/*`

## Prerequisites

- Python 3.14
- [uv](https://docs.astral.sh/uv/) for Python deps
- Node 22+ and npm
- Docker + Docker Compose
- macOS or Linux (FFmpeg build scripts only support these platforms)
- Strongly recommended for easier local setup: GNU Make and direnv

## Native binaries (FFmpeg + Shaka Packager)

In order for song uploads to work both FFmpeg and Shaka Packager have to be installed and paths to
the binaries have to be set in FFMPEG_BIN, FFPROBE_BIN (usually installed alongside FFmpeg)
and SHAKA_PACKAGER_BIN environment variables.

Native binaries are only needed for the development mode where you run your local django dev server.
The Docker images ship their own copies.

If you have them installed already and the versions/libraries are compatible, they can be reused.
Otherwise it is possible to install them via running this Make target:

```
make setup
```

This builds FFmpeg from source and downloads Shaka packager into `.tools/bin/` (project-local).
Re-running is a no-op if the binaries are already there, use `make clean` to rebuild.

Targets:

- `make setup-ffmpeg` / `make setup-shaka`
- `make check` — print versions of all three binaries
- `make clean` — remove `.tools/`

The default `.env.local.example` already points `FFMPEG_BIN`, `FFPROBE_BIN`, and `SHAKA_PACKAGER_BIN` at `.tools/bin/`.

## direnv

`direnv` is recommended for env var management. It auto-loads the variables from .env when you enter
the project directory and unloads them when you leave the directory.

Install direnv by following the instructions on the [direnv website](https://direnv.net/), then:

```
mkdir -p ~/.config/direnv
touch ~/.config/direnv/direnv.toml
```

Add to `~/.config/direnv/direnv.toml`:

```toml
[global]
load_dotenv = true
```

In the project root (where `.env` lives):

```
direnv allow
```

Env var changes will be picked up on any command run in the terminal (e.g., after `ls`).

## Run locally — dev mode

Backend and frontend run on the host with auto-reload, infra (Postgres + Redis) runs in Docker.

1. **Env file**

   ```
   cp .env.local.example .env
   ```

   Edit `.env` to fill in `SECRET_KEY` and any passwords, if desired.
   The local example already wires `POSTGRES_*`, `REDIS_*`, `FFMPEG_BIN`, etc.

2. **Native binaries**

   ```
   make setup
   ```

3. **Infra (Postgres + Redis)**

   ```
   docker compose -f docker-compose-local.yml up -d
   ```

   Postgres listens on host port `5435`, Redis on `6375`.

4. **Backend**

   ```
   cd src/backend/musikk
   uv sync
   uv run python manage.py migrate
   uv run python manage.py runserver
   ```

   No Celery worker is needed in dev — `CELERY_TASK_ALWAYS_EAGER` runs tasks inline.

5. **Frontend**

   ```
   cd src/frontend/musikk
   npm install
   npm run dev
   ```

   Defaults to `http://localhost:5173` (port via `VITE_PORT`).

6. **Open** `http://localhost:5173`.

## Run locally — full stack via Docker Compose

`docker-compose-prod.yml` brings up everything (server, celery, db, redis, proxy) in containers.
To run it locally we override the Caddy config and allowed hosts.

1. **Env file**

   ```
   cp .env.prod.example .env.prod
   ```

   The example uses Django's console email backend, so registration and password-reset emails
   are printed to the server log instead of being sent. To send real mail, set `EMAIL_BACKEND`
   to the mail provider of your choice and fill in the required vars (see `django-anymail`)

2. **Bring it up**

   ```
   make run-local-full
   ```

   First boot builds the backend image (compiles FFmpeg from source — slow), the frontend image (Vite build), then
   waits on health checks. The server entrypoint runs `migrate` and `collectstatic` automatically.

3. **Open** `http://localhost`.

4. **Tear down**

   ```
   make run-local-full-down
   ```

   Add `-v` (`docker compose -f docker-compose-prod.yml down -v`) to also wipe volumes.

## Sample data

There is a management command for creating sample app data, so its possible to see
how the app looks "populated":

- `initmodels` — seeds users, artists, songs, albums, playlists, follows, publications, chats,
  messages and notifications. Generated user/artist credentials are printed to stdout.
  Pass `--generate-audio` to also synthesize audio files with FFmpeg, or `--skip-audio` to skip
  audio entirely. See `--help` for explanation of params (`--users`, `--songs`, etc.).

The data can be cleared afterwards with the `clearmodels` command.

Run them against the dev backend:

```
cd src/backend/musikk
uv run python manage.py initmodels
uv run python manage.py clearmodels
```

Or against the running compose stack:

```
make run-local-full-seed
make run-local-full-clear
```

## License

See [LICENCE.txt](LICENCE.txt).
