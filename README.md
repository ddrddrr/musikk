# musikk

A music streaming app with focus on social features.

## Supported platforms

- Debian and Ubuntu, on x86_64 and arm64
- macOS on Apple Silicon
- Windows through WSL2 only

On Windows, clone the repository with the git inside WSL into the Linux file system, for example into `~/musikk`, not
into a folder under `/mnt/c`. Run every command in the WSL shell. PowerShell and cmd are not supported.

Other Linux distributions or Podman were not tested.

## Running the app

There are two ways to run the app:

- **Docker stack**: everything runs in containers. It needs only Docker and git, so it is the easiest way to try the
  app.
- **Dev mode**: the backend and the frontend run on the host as dev servers. Only Postgres and Redis run in Docker.

The `make` targets are short forms of the commands in the [`Makefile`](Makefile), so `make` is optional.

### Docker stack

1. **Install Docker**

   - macOS on Apple Silicon: [Docker Desktop](https://docs.docker.com/desktop/setup/install/mac-install/).
   - Windows: WSL2 with Ubuntu, and either Docker Desktop with WSL integration turned on or Docker Engine installed
     inside WSL.
   - Debian and Ubuntu: Docker Engine with the Compose plugin from
     [Docker's own repository](https://docs.docker.com/engine/install/). If `docker` needs `sudo` on your machine, put
     `sudo` before the commands below.

2. **Create the env file**

   In the project folder, run:

   ```
   cp .env-docker-example .env.prod
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

   The command creates users, artists, songs with audio, albums, playlists, posts and chats.
   Near the start of its output it prints one line for each account created (and they could be used), for example `artist: <email> / <password>`.
   [Sample data](#sample-data) lists its options.

5. **Open** `http://localhost` and log in with one of the printed accounts. You can also sign up. The app sends no
   emails in this setup, so a new account works right away.

6. **Stop the app** with Ctrl+C in the first terminal, or with `make run-local-docker-down`. The data stays, and
   `make run-local-docker` starts the app again. To delete the database and the uploaded files, run
   `make run-local-docker-reset` (`docker compose --env-file .env.prod -f docker-compose-prod.yml down -v`).

If port 80 or 443 is already taken on your machine, set another port in `.env.prod`, for example `HTTP_PORT=8080` or
`HTTPS_PORT=8443`. With `HTTP_PORT=8080`, the app is at `http://localhost:8080`.

### Dev mode

The backend and the frontend run as dev servers on the host. Postgres and Redis run in Docker.
Celery tasks run synchronously inside the backend process, so there is no Celery worker.

Requirements:

- Docker, for Postgres and Redis
- Python 3.14
- [uv](https://docs.astral.sh/uv/) for the backend packages
- Node 22.12 or newer and npm for the frontend packages. Vite 7.3 needs this Node version.
- FFmpeg and Shaka Packager for audio uploads and sample audio. See [Native binaries](#native-binaries) below.

Steps:

1. **Create the env file**

   ```
   cp .env-local-example .env
   ```

   See [Environment variables](#environment-variables) for more details below.

2. **Start the app**

   ```
   make run-local-dev
   ```

   This starts Postgres and Redis in Docker, installs the backend and frontend packages, runs `migrate`, and starts
   the backend and the frontend dev servers in this terminal. Ctrl+C stops both dev servers.
   `make run-local-dev-down` stops Postgres and Redis.

3. **Open** `http://localhost:5175`.

#### Without make

Instead of step 2, run these commands. The backend and the frontend each need their own terminal.

1. **Infra (Postgres + Redis)**

   ```
   docker compose -f docker-compose-local.yml up -d
   ```

   Postgres listens on host port `5435`, Redis on `6375`.

2. **Backend**

   ```
   cd src/backend/musikk
   uv sync
   uv run python manage.py migrate
   uv run python manage.py runserver 8005
   ```

   The frontend dev server sends API requests to `DJANGO_PORT` from `.env`, which is 8005 in the example.

3. **Frontend**

   ```
   cd src/frontend/musikk
   npm install
   npm run dev
   ```

   The dev server listens on `VITE_PORT` from `.env`, which is 5175 in the example.

#### Environment variables

The backend and the frontend read their settings from environment variables. They do not read `.env` themselves, so
the variables from `.env` must be set in the shell where you start them. Any tool that loads a `.env` file into the
shell works, e.g. [direnv](https://direnv.net/). It loads the variables when you enter the project folder, and unloads
them when you leave. The `.envrc` in the project root tells direnv to load `.env`. Install direnv and hook it into
your shell as the direnv website describes, then run in the project root:

```
direnv allow
```

direnv picks up changes in `.env` on the next command you run in the terminal (for example `ls`).

#### Native binaries

Audio uploads and sample audio need FFmpeg and Shaka Packager. The Docker image has its own copies, so you need them
on the host only in dev mode.

By default, Django uses `ffmpeg`, `ffprobe` and `packager` from `.tools/bin/` in the project folder. To use other
copies, set `FFMPEG_BIN`, `FFPROBE_BIN` and `SHAKA_PACKAGER_BIN` in `.env`.

To install them into `.tools/bin/`, run:

```
make setup-tools
```

This builds FFmpeg from source and downloads Shaka Packager. When the binaries are already there, it does nothing.

It works on macOS on Apple Silicon and on Debian-based Linux, because the FFmpeg script uses Homebrew on macOS and
`apt-get` on Linux. On other platforms, install the binaries yourself and point the variables above at them.

Other useful targets:

- `make setup-ffmpeg` and `make setup-shaka` install only one of them.
- `make check-tools` prints the versions of the binaries that Django uses.
- `make clean-tools` removes `.tools/`, so the next `make setup-tools` builds everything again.

## Sample data

The `initmodels` django command fills the database with users, artists, songs, albums, playlists, follows, publications,
chats, messages and notifications. It prints the email and password of every account it creates.

The songs get real audio. On the first run, the command generates sample audio files with FFmpeg and processes them
like uploaded songs. Later runs reuse these files. In dev mode they are in `src/backend/musikk/samples/generated/`.
To get new files, delete this folder before the next run.

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

`--skip-audio` creates songs without audio, and `--help` lists all options.

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

## License

See [LICENCE.txt](LICENCE.txt).
