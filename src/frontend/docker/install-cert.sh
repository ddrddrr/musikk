#!/usr/bin/env bash
set -euo pipefail
# see https://caddyserver.com/docs/running#local-https-with-docker

# Usage: ./install_caddy_local_ca.sh <linux|macos>
if [ $# -ne 1 ]; then
  echo "Usage: $0 <linux|macos>"
  exit 1
fi

OS="$1"
CONTAINER="musikk-dev-proxy-1"
DEST_DIR="${HOME}/certs/caddy-local"

SRC_ROOT="/data/caddy/pki/authorities/local/root.crt"

mkdir -p "$DEST_DIR"

docker cp "$CONTAINER:$SRC_ROOT" "$DEST_DIR/"

case "$OS" in
  linux)
    sudo cp "$DEST_DIR/root.crt" /usr/local/share/ca-certificates/caddy-local.crt
    sudo update-ca-certificates
    ;;
  macos)
    sudo security add-trusted-cert -d \
      -r trustRoot \
      -k /Library/Keychains/System.keychain \
      "$DEST_DIR/root.crt"
    ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

echo "Installed Caddy Local Authority root certificate on $OS"
echo "
Many web browsers now use their own trust store (ignoring the system's trust store), so you may also need to install the certificate manually there as well, using the root.crt file copied from the container in the command above.
For Firefox, go to Preferences > Privacy & Security > Certificates > View Certificates > Authorities > Import, and select the root.crt file.
For Chrome, go to Settings > Privacy and security > Security > Manage certificates > Authorities > Import, and select the root.crt file.
"