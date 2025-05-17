#!/bin/bash

set -euo pipefail
set -x

apt-get update -qq && apt-get install -y --no-install-recommends \
  ca-certificates \
  autoconf \
  automake \
  build-essential \
  cmake \
  git-core \
  libass-dev \
  libfreetype6-dev \
  libgnutls28-dev \
  libmp3lame-dev \
  libtool \
  libvorbis-dev \
  meson \
  ninja-build \
  pkg-config \
  texinfo \
  wget \
  yasm \
  zlib1g-dev && \

apt-get install -y libunistring-dev libaom-dev libdav1d-dev libopus-dev && \

mkdir -p /opt/ffmpeg_sources /opt/bin && \
pushd /opt/ffmpeg_sources &&

cd /opt/ffmpeg_sources && \
git -C fdk-aac pull 2> /dev/null || git clone --depth 1 https://github.com/mstorsjo/fdk-aac && \
cd fdk-aac && \
autoreconf -fiv && \
./configure --prefix="/opt/ffmpeg_build" --disable-shared && \
make && \
make install &&
cd .. &&

wget -O ffmpeg-snapshot.tar.bz2 https://ffmpeg.org/releases/ffmpeg-snapshot.tar.bz2 && \
tar xjvf ffmpeg-snapshot.tar.bz2 && \
cd ffmpeg && \
PATH="/opt/bin:$PATH" PKG_CONFIG_PATH="/opt/ffmpeg_build/lib/pkgconfig" ./configure \
  --prefix="/opt/ffmpeg_build" \
  --extra-cflags="-I/opt/ffmpeg_build/include" \
  --extra-ldflags="-L/opt/ffmpeg_build/lib" \
  --extra-libs="-lpthread -lm" \
  --bindir="/opt/bin" \
  --enable-gpl \
  --enable-gnutls \
  --enable-libfdk-aac \
  --enable-libopus \
  --enable-nonfree && \
PATH="/opt/bin:$PATH" make -j$(nproc) && \
make install && \
hash -r &&
export PATH="/opt/bin:$PATH" &&
popd || exit