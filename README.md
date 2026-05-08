# musikk

## Local dev setup

### 1. Native binaries (FFmpeg + Shaka packager)

```
make setup
```

Builds FFmpeg from source and downloads Shaka packager into `.tools/bin/` (project-local).
Re-running is a no-op if the binaries are already there, use `make clean` to rebuild.

Targets:

- `make setup-ffmpeg` / `make setup-shaka`
- `make check` — print versions of all three binaries
- `make clean` — remove `.tools/`

The default `.env.local.example` already points `FFMPEG_BIN`, `FFPROBE_BIN`,
and `SHAKA_PACKAGER_BIN` at `.tools/bin/`.

### 2. direnv

`direnv` is recommended for env var management. It auto-loads the variables from .env when you enter
the project directory and unloads them when you leave the directory.

Install direnv by following the instuctions on the [direnv website](https://direnv.net/), then:

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

Env var changes will be picked on any command ran in the terminal (e.g., after ls).