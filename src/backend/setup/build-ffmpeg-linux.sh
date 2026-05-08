#!/bin/bash
# Builds FFmpeg from source on Linux
# Partially taken and adapted from https://trac.ffmpeg.org/wiki/CompilationGuide/Ubuntu
# Reads version and feature flags from ffmpeg.sh
#
#   ./build-ffmpeg-linux.sh                        # installs to <repo>/.tools/
#   ./build-ffmpeg-linux.sh --prefix=/opt/ffmpeg    # installs to /opt/ffmpeg/
#   ./build-ffmpeg-linux.sh --extras                # include optional codecs (opus, mp3)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONF_FILE="${SCRIPT_DIR:-.}/ffmpeg.sh"

if [ ! -f "$CONF_FILE" ]; then
  echo "Error: $CONF_FILE not found."
  exit 1
fi

# shellcheck source=ffmpeg.sh
source "$CONF_FILE"

PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
PREFIX="$PROJECT_ROOT/.tools"
EXTRAS=0

for arg in "$@"; do
  case $arg in
    --prefix=*) PREFIX="${arg#*=}" ;;
    --extras) EXTRAS=1 ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

NJOBS="$(nproc)"
SUDO=""
[ "$(id -u)" -ne 0 ] && SUDO="sudo"

FEATURE_FLAGS="$FFMPEG_FLAGS"

echo "FFmpeg $FFMPEG_VERSION | Linux | Prefix: $PREFIX | Extras: $EXTRAS"
echo "Feature flags: $FEATURE_FLAGS"

mkdir -p "$PREFIX/src" "$PREFIX/bin"

$SUDO apt-get update -qq
$SUDO apt-get install -y --no-install-recommends \
  ca-certificates \
  autoconf \
  automake \
  build-essential \
  curl \
  git-core \
  libgnutls28-dev \
  libtool \
  nasm \
  pkg-config \
  zlib1g-dev

EXTRA_FLAGS=""
if [ "$EXTRAS" -eq 1 ]; then
  $SUDO apt-get install -y --no-install-recommends libopus-dev libmp3lame-dev
  EXTRA_FLAGS="$FFMPEG_EXTRA_FLAGS"
fi

echo "Building fdk-aac from source..."
cd "$PREFIX/src"
git -C fdk-aac pull 2>/dev/null || git clone --depth 1 https://github.com/mstorsjo/fdk-aac
cd fdk-aac
autoreconf -fiv
./configure --prefix="$PREFIX" --disable-shared
make -j"$NJOBS"
make install

cd "$PREFIX/src"
ARCHIVE="ffmpeg-${FFMPEG_VERSION}.tar.bz2"
[ -f "$ARCHIVE" ] || curl -L -o "$ARCHIVE" "https://ffmpeg.org/releases/$ARCHIVE"

rm -rf "ffmpeg-$FFMPEG_VERSION"
tar xjf "$ARCHIVE"
cd "ffmpeg-$FFMPEG_VERSION"

PKG_CONFIG_PATH="$PREFIX/lib/pkgconfig" ./configure \
  --prefix="$PREFIX" \
  --bindir="$PREFIX/bin" \
  --extra-cflags="-I$PREFIX/include" \
  --extra-ldflags="-L$PREFIX/lib" \
  --extra-libs="-lpthread -lm" \
  $FEATURE_FLAGS \
  $EXTRA_FLAGS

make -j"$NJOBS"
make install

echo ""
echo "Done. FFmpeg installed to $PREFIX/bin/"
"$PREFIX/bin/ffmpeg" -version | head -1
"$PREFIX/bin/ffprobe" -version | head -1
echo ""
echo "Set in your .env:"
echo "  FFMPEG_BIN=$PREFIX/bin/ffmpeg"
echo "  FFPROBE_BIN=$PREFIX/bin/ffprobe"
