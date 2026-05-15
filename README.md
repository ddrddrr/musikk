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

## Running the app

There are two ways to run the app:

- **Full Docker stack** — everything in containers, one command. Good for a quick try.
- **Dev mode** — backend and frontend run on the host as dev servers, only Postgres and Redis run in Docker.

The `make` targets below are wrappers over the underlying commands (see [`Makefile`](Makefile)), so `make` itself
is not required, you can run the commands directly if preferred.

### Option A — Full Docker stack

Requirements: Docker + Docker Compose. Runs anywhere Docker can run `linux/amd64` containers.

1. **Create env file**

   ```
   cp .env.prod.example .env.prod
   ```

   The example uses Django's console email backend, so registration and password-reset emails
   are printed to the server log instead of being sent. To send real mail, set `EMAIL_BACKEND`
   to the mail provider of your choice and fill in the required vars (see `django-anymail`).

   Email confirmation on signup is controlled by `ACCOUNT_EMAIL_VERIFICATION` (django-allauth).
   The default env sets it to `none`: no confirmation email is sent and the account is active
   immediately, but the signup form still shows the "Confirmation email has been sent"
   message. You can just navigate to the home page after registering, there is no email to confirm,
   the account will be ready to use immediatelly.

2. **Run it**

   ```
   make run-local-full
   ```

   Equivalent to: `docker compose --env-file .env.prod -f docker-compose-prod.yml up --build`.

   First boot builds the backend image (compiles FFmpeg from source — slow) and the frontend
   image (Vite build), then waits on health checks. The server entrypoint runs `migrate` and
   `collectstatic` automatically.

3. **Open** `http://localhost`.

4. **Tear down**

   ```
   make run-local-full-down
   ```

   Add `-v` (`docker compose -f docker-compose-prod.yml down -v`) to also wipe volumes.

### Option B — Dev mode

Backend and frontend run on the host with auto-reload, infra (Postgres + Redis) runs in Docker.

Requirements:

- Python 3.14
- [uv](https://docs.astral.sh/uv/) for backend deps
- Node 22+ and npm for frontend deps
- FFmpeg and Shaka Packager binaries (MacOS/Debian-based systems only) — needed if you want audio uploads to work.
  See [Native binaries](#native-binaries) below.
- Optional: [direnv](https://direnv.net/) for env var loading. See [direnv](#direnv) below.

Steps:

1. **Create env file**

   ```
   cp .env.local.example .env
   ```

   Edit `.env` to fill in `SECRET_KEY` and any passwords, if desired.
   The local example already wires `POSTGRES_*`, `REDIS_*`, `FFMPEG_BIN`, etc.

2. **Infra (Postgres + Redis)**

   ```
   docker compose -f docker-compose-local.yml up -d
   ```

   Postgres listens on host port `5435`, Redis on `6375`.

3. **Backend**

   ```
   cd src/backend/musikk
   uv sync
   uv run python manage.py migrate
   uv run python manage.py runserver
   ```

4. **Frontend**

   ```
   cd src/frontend/musikk
   npm install
   npm run dev
   ```

   Defaults to `http://localhost:5175` (port via `VITE_PORT`).

5. **Open** `http://localhost:5175`.

## Native binaries

For audio uploads to work, FFmpeg and Shaka Packager must be installed and the env vars
`FFMPEG_BIN`, `FFPROBE_BIN` (usually installed alongside FFmpeg), and `SHAKA_PACKAGER_BIN`
must point to them.

This section only matters in dev mode, the Docker images ship their own copies.

### Automated install

```
make setup
```

This builds FFmpeg from source and downloads Shaka Packager into `.tools/bin/`
(project-local). Re-running is a no-op if the binaries are already there; use `make clean`
to rebuild.

The default `.env.local.example` already points `FFMPEG_BIN`, `FFPROBE_BIN`, and
`SHAKA_PACKAGER_BIN` at `.tools/bin/`, so no extra config is needed.

Only MacOS and Debian-based Linuxes are supported, since FFmpeg is built from source and
the script uses Homebrew on macOS and `apt-get`on Linux, in addition Makefile downloads
`packager-osx-arm64` or `packager-linux-x64`.
If you already have compatible FFmpeg/Shaka binaries installed system-wide, you can reuse them by
pointing the env vars at them instead of running `make setup`.

Other useful targets:

- `make setup-ffmpeg` / `make setup-shaka` — install just one of them
- `make check` — print versions of the installed binaries
- `make clean` — remove `.tools/`

On other platforms `make setup` doesn't work directly, but you can still run the dev backend,
install the binaries manually and point the env vars at them.

## direnv

`direnv` is recommended for env var management. It auto-loads the variables from `.env` when
you enter the project directory and unloads them when you leave.

Install direnv by following the instructions on the [direnv website](https://direnv.net/),
then:

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

## Sample data

There is a management command for creating sample app data, so it's possible to see
how the app looks "populated":

- `initmodels` — seeds users, artists, songs, albums, playlists, follows, publications, chats,
  messages and notifications. Generated user/artist credentials are printed to stdout.
  Pass `--generate-audio` to also synthesize audio files with FFmpeg, or `--skip-audio` to skip
  audio entirely. See `--help` for explanation of params (`--users`, `--songs`, etc.).

  Audio generation uses FFmpeg and Shaka Packager, so the same platform restrictions as in
  [Native binaries](#native-binaries) apply when running against the dev backend. Pass
  `--skip-audio` to bypass this, or run the seed against the full compose stack.

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
