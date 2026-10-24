#!/usr/bin/env bash
#
# RepsIn one-command launcher.
# Starts the Python pose server and the Expo dev server together.
#
# Usage:
#   ./start.sh            # direct LAN connection (default) — works on home Wi-Fi / hotspot
#   ./start.sh --tunnel   # also expose the pose server via a public tunnel
#                         # (use on campus/corporate Wi-Fi that blocks phone<->laptop)
#
# Stop everything with Ctrl-C.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$ROOT/squat-tracker/server"
APP_DIR="$ROOT/mobile-app"
VENV_PY="$ROOT/.venv/bin/python"
PORT=8000

USE_TUNNEL=0
[[ "${1:-}" == "--tunnel" ]] && USE_TUNNEL=1

# --- sanity checks ---------------------------------------------------------
if [[ ! -x "$VENV_PY" ]]; then
  echo "ERROR: Python venv not found at $VENV_PY"
  echo "Create it and install deps: python3 -m venv .venv && .venv/bin/pip install -r squat-tracker/server/requirements.txt"
  exit 1
fi

# Load nvm so 'npx expo' uses the right Node, if nvm is present.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1091
[[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1 && nvm use default >/dev/null 2>&1 || true

PIDS=()
cleanup() {
  echo ""
  echo "Shutting down…"
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  exit 0
}
trap cleanup INT TERM

# --- LAN IP for convenience ------------------------------------------------
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo '')"

echo "======================================================"
echo "  RepsIn — starting server + app"
echo "======================================================"

# --- 1) pose server --------------------------------------------------------
echo "→ Starting pose server on port $PORT …"
( cd "$SERVER_DIR" && "$VENV_PY" -m uvicorn app:app --host 0.0.0.0 --port "$PORT" ) &
PIDS+=($!)
sleep 2

# --- 2) optional tunnel ----------------------------------------------------
if [[ "$USE_TUNNEL" -eq 1 ]]; then
  if command -v cloudflared >/dev/null 2>&1; then
    echo "→ Opening public tunnel to the pose server (cloudflared) …"
    echo "   Watch below for a https://...trycloudflare.com URL —"
    echo "   type THAT into the app's Laptop server field."
    ( cloudflared tunnel --url "http://localhost:$PORT" 2>&1 | sed 's/^/[tunnel] /' ) &
    PIDS+=($!)
  else
    echo "!! --tunnel requested but 'cloudflared' is not installed."
    echo "   Install it with:  brew install cloudflared"
    echo "   Continuing with LAN connection only."
  fi
fi

# --- 3) Expo ---------------------------------------------------------------
echo ""
echo "→ Starting Expo …"
if [[ -n "$LAN_IP" && "$USE_TUNNEL" -eq 0 ]]; then
  echo "   The app should auto-detect the server at http://$LAN_IP:$PORT"
fi
echo "   (In the app's Form tab the server URL fills in automatically.)"
echo ""
( cd "$APP_DIR" && npx expo start ) &
PIDS+=($!)

# Keep the launcher alive until Ctrl-C.
wait
