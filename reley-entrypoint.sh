#!/bin/sh
set -eu

CONFIG_DIR="${RELAY_CONFIG_DIR:-/etc/iroh-relay}"
CONFIG_PATH="${CONFIG_DIR}/config.toml"
mkdir -p "${CONFIG_DIR}"

HTTP_PORT="${RELAY_HTTP_PORT:-${PORT:-3340}}"
HTTP_BIND="${RELAY_HTTP_BIND_ADDR:-0.0.0.0:${HTTP_PORT}}"

{
    echo "http_bind_addr = \"${HTTP_BIND}\""
    echo "enable_metrics = false"

    if [ -n "${RELAY_HOSTNAME:-}" ]; then
        CERT_MODE="${RELAY_CERT_MODE:-LetsEncrypt}"
        if [ "${CERT_MODE}" = "LetsEncrypt" ] && [ -z "${RELAY_CONTACT:-}" ]; then
            echo "RELAY_CONTACT is required for Let's Encrypt" >&2
            exit 1
        fi

        echo ""
        echo "[tls]"
        echo "https_bind_addr = \"0.0.0.0:${RELAY_HTTPS_PORT:-443}\""
        echo "hostname = \"${RELAY_HOSTNAME}\""
        echo "cert_mode = \"${CERT_MODE}\""
        echo "cert_dir = \"${RELAY_CERT_DIR:-/var/lib/iroh-relay/certs}\""
        if [ -n "${RELAY_CONTACT:-}" ]; then
            echo "contact = \"${RELAY_CONTACT}\""
        fi
    fi
} > "${CONFIG_PATH}"

echo "Starting iroh-relay with config:"
cat "${CONFIG_PATH}"

exec /iroh-relay --config-path "${CONFIG_PATH}"
