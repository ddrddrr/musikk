#!/bin/bash
# Builds FFmpeg from source on macOS
# Partially taken and adapted from https://trac.ffmpeg.org/wiki/CompilationGuide/Ubuntu
# Reads version and feature flags from ffmpeg.sh
#
#   ./build-ffmpeg-macos.sh                        # installs to <repo>/.tools/
#   ./build-ffmpeg-macos.sh --prefix=/opt/ffmpeg    # installs to /opt/ffmpeg/
#   ./build-ffmpeg-macos.sh --extras                # include optional codecs (opus, mp3)
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

NJOBS="$(sysctl -n hw.ncpu)"

FEATURE_FLAGS="$FFMPEG_FLAGS"

echo "FFmpeg $FFMPEG_VERSION | macOS | Prefix: $PREFIX | Extras: $EXTRAS"
echo "Feature flags: $FEATURE_FLAGS"

mkdir -p "$PREFIX/src" "$PREFIX/bin"

command -v brew >/dev/null 2>&1 || { echo "Homebrew is required. Install from https://brew.sh"; exit 1; }
brew install fdk-aac pkg-config nasm gnutls automake libtool

EXTRA_FLAGS=""
if [ "$EXTRAS" -eq 1 ]; then
  brew install opus lame
  EXTRA_FLAGS="$FFMPEG_EXTRA_FLAGS"
fi

BREW_PREFIX="$(brew --prefix)"

PKG_DIRS="$BREW_PREFIX/lib/pkgconfig"
for keg in gnutls fdk-aac opus lame; do
  keg_path="$BREW_PREFIX/opt/$keg/lib/pkgconfig"
  [ -d "$keg_path" ] && PKG_DIRS="$keg_path:$PKG_DIRS"
done

cd "$PREFIX/src"
ARCHIVE="ffmpeg-${FFMPEG_VERSION}.tar.bz2"
[ -f "$ARCHIVE" ] || curl -L -o "$ARCHIVE" "https://ffmpeg.org/releases/$ARCHIVE"

rm -rf "ffmpeg-$FFMPEG_VERSION"
tar xjf "$ARCHIVE"
cd "ffmpeg-$FFMPEG_VERSION"

PKG_CONFIG_PATH="$PKG_DIRS" ./configure \
  --prefix="$PREFIX" \
  --bindir="$PREFIX/bin" \
  --extra-cflags="-I$BREW_PREFIX/include" \
  --extra-ldflags="-L$BREW_PREFIX/lib" \
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
