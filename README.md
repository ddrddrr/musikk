# musikk

A music streaming app with focus on social features.

## For reviewers

The easiest way to run the app is the full Docker stack. It needs only Docker and git.

1. **Install Docker**

   - macOS on Apple Silicon: [Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/).
   - Windows: WSL2 with Ubuntu, and either Docker Desktop with WSL integration turned on or Docker Engine installed
     inside WSL. Read [Supported platforms](#supported-platforms) before you clone the repository.
   - Debian and Ubuntu: Docker Engine with the Compose plugin from
     [Docker's own repository](https://docs.docker.com/engine/install/). If `docker` needs `sudo` on your machine, put
     `sudo` before the commands below.

2. **Create the env file**

   In the project folder, run:

   ```
   cp .env-docker-example .env.prod
   ```

   The example works without changes. If you change `SECRET_KEY` or a password in it, do not use `$`, because Docker
   Compose reads `$` in this file as the start of a variable name. This command prints a random key without `$`:

   ```
   python3 -c "import secrets; print(secrets.token_urlsafe(50))"
   ```

3. **Start the app**

   ```
   make run-local-docker
   ```

   Without `make`: `docker compose --env-file .env.prod -f docker-compose-prod.yml up --build`.

   The first start builds the images and compiles FFmpeg from source. On an Apple Silicon Mac with 2 CPUs for Docker,
   this took about 9 minutes. Later starts take a few seconds. Keep this terminal open and run the next commands in a
   second terminal.

4. **Fill the app with sample data**

   ```
   make run-local-docker-seed
   ```

   Without `make`: `docker compose --env-file .env.prod -f docker-compose-prod.yml exec server python manage.py initmodels`.

   The command creates users, artists, songs with audio, albums, playlists, posts and chats. It takes a few minutes.
   Near the start of its output it prints one line for each account, for example `artist: <email> / <password>`.

5. **Open** `http://localhost` and log in with one of the printed accounts. You can also sign up. The app sends no
   emails in this setup, so a new account works right away.

6. **Stop the app** with Ctrl+C in the first terminal, or with `make run-local-docker-down`. The data stays, and
   `make run-local-docker` starts the app again. To delete the database and the uploaded files, run
   `make run-local-docker-reset` (`docker compose --env-file .env.prod -f docker-compose-prod.yml down -v`).

If port 80 or 443 is already taken on your machine, set another port in `.env.prod`, for example `HTTP_PORT=8080` or
`HTTPS_PORT=8443`. With `HTTP_PORT=8080`, the app is at `http://localhost:8080`.

## Supported platforms

- Debian and Ubuntu, on x86_64 and arm64
- macOS on Apple Silicon
- Windows through WSL2 only

On Windows, clone the repository with the git inside WSL into the Linux file system, for example into `~/musikk`, not
into a folder under `/mnt/c`. Run every command in the WSL shell. PowerShell and cmd are not supported.

Other Linux distributions may work with Docker Engine, but nobody has tested them. Podman is not supported.

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

- **Full Docker stack**: everything runs in containers. This is the way for reviewers.
- **Dev mode**: the backend and the frontend run on the host as dev servers. Only Postgres and Redis run in Docker.

The `make` targets are short forms of the commands in the [`Makefile`](Makefile), so `make` is optional.

### Option A: full Docker stack

[For reviewers](#for-reviewers) lists the steps. A few more details:

- `.env-docker-example` is for your own machine. The production server copies `.env-server-example` to `.env.prod`
  instead and replaces every `!!!SET ...!!!` value in it.
- `.env-docker-example` uses Django's console email backend. Registration and password-reset emails are printed to the
  server log instead of being sent. To send real mail, set `EMAIL_DELIVERY_BACKEND` to the mail provider of your
  choice and fill in the variables it needs (see `django-anymail`).
- `ACCOUNT_EMAIL_VERIFICATION` (django-allauth) controls the email confirmation on signup. `.env-docker-example` sets
  it to `none`, so a new account is active right away.
- The server runs `migrate` and `collectstatic` on every start.

### Option B: dev mode

The backend and the frontend run on the host with auto-reload. Postgres and Redis run in Docker. Celery tasks run inside
the backend process, so there is no Celery worker, and an upload request waits until the song is processed.

Requirements:

- Python 3.14
- [uv](https://docs.astral.sh/uv/) for the backend packages
- Node 22.12 or newer and npm for the frontend packages. Vite 7.3 needs this Node version.
- [direnv](https://direnv.net/), which loads the variables from `.env` into the shell. See [direnv](#direnv) below.
- FFmpeg and Shaka Packager for audio uploads and sample audio. See [Native binaries](#native-binaries) below.

Steps:

1. **Create the env file**

   ```
   cp .env-local-example .env
   direnv allow
   ```

   Edit `.env` to fill in `SECRET_KEY` and the passwords, if you want.

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
   uv run python manage.py runserver 8005
   ```

   The frontend dev server sends API requests to `DJANGO_PORT` from `.env`, which is 8005 in the example.

4. **Frontend**

   ```
   cd src/frontend/musikk
   npm install
   npm run dev
   ```

   The dev server listens on `VITE_PORT` from `.env`, which is 5175 in the example.

5. **Open** `http://localhost:5175`.

After step 1, `make run-local-dev` does steps 2 to 4 in one terminal. It starts Postgres and Redis, runs `migrate`, and
starts the backend and the frontend. Ctrl+C stops both. It needs the packages from `uv sync` and `npm install`.
`make run-local-dev-down` stops Postgres and Redis.

## Native binaries

Audio uploads and sample audio need FFmpeg and Shaka Packager. This section only matters in dev mode, because the
Docker image has its own copies.

By default, Django uses `ffmpeg`, `ffprobe` and `packager` from `.tools/bin/` in the project folder. To use other
copies, set `FFMPEG_BIN`, `FFPROBE_BIN` and `SHAKA_PACKAGER_BIN` in `.env`.

### Automated install

```
make setup-tools
```

This builds FFmpeg from source and downloads Shaka Packager into `.tools/bin/`. When the binaries are already there, it
does nothing.

It works on macOS on Apple Silicon and on Debian-based Linux, because the FFmpeg script uses Homebrew on macOS and
`apt-get` on Linux. On other platforms, install the binaries yourself and point the variables above at them.

Other useful targets:

- `make setup-ffmpeg` and `make setup-shaka` install only one of them.
- `make check-tools` prints the versions of the binaries that Django uses.
- `make clean-tools` removes `.tools/`, so the next `make setup-tools` builds everything again.

## direnv

Dev mode needs direnv. It loads the variables from `.env` when you enter the project folder, and unloads them when you
leave.

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

direnv picks up changes in `.env` on the next command you run in the terminal (for example `ls`).

## Sample data

The `initmodels` command fills the database with users, artists, songs, albums, playlists, follows, publications,
chats, messages and notifications. It prints the email and password of every account it creates.

The songs get real audio. On the first run, the command generates sample audio files with FFmpeg and processes them
like uploaded songs. Later runs reuse these files. In dev mode they are in `src/backend/musikk/samples/generated/`.

The `clearmodels` command deletes the sample data again.

In the Docker stack:

```
make run-local-docker-seed
make run-local-docker-clear
```

In dev mode, with Postgres running, for example through `make run-local-dev`:

```
make run-local-dev-seed
make run-local-dev-clear
```

`ARGS` passes options to `initmodels`, for example:

```
make run-local-docker-seed ARGS="--songs 10 --skip-audio"
```

`--skip-audio` creates songs without audio, `--generate-audio` makes new audio files even when some exist, and
`--help` lists all options.

## License

See [LICENCE.txt](LICENCE.txt).
