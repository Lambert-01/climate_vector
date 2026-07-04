#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_PORT="${API_PORT:-8000}"
WEB_PORT="${WEB_PORT:-5173}"
HOST="${HOST:-127.0.0.1}"
LOG_DIR="$ROOT_DIR/logs/dev"
PID_DIR="$ROOT_DIR/.pids"

mkdir -p "$LOG_DIR" "$PID_DIR"

check_port() {
  local port="$1"
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port $port is already in use."
    lsof -nP -iTCP:"$port" -sTCP:LISTEN
    echo "Run: bash scripts/stop_all.sh"
    echo "Or run with another port, for example: API_PORT=8010 WEB_PORT=5174 bash scripts/run_all.sh"
    exit 1
  fi
}

cleanup_old_pids() {
  for pid_file in "$PID_DIR"/api.pid "$PID_DIR"/web.pid; do
    [ -f "$pid_file" ] || continue
    local pid
    pid="$(cat "$pid_file")"
    if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
      echo "A previous process is still running with PID $pid. Stop it with scripts/stop_all.sh first."
      exit 1
    fi
    rm -f "$pid_file"
  done
}

cleanup_old_pids
check_port "$API_PORT"
check_port "$WEB_PORT"

echo "Starting Climate Vector Rwanda..."
echo "API: http://$HOST:$API_PORT"
echo "Web: http://$HOST:$WEB_PORT"
echo "Logs: $LOG_DIR"

nohup bash -lc "cd '$ROOT_DIR/apps/api' && '$ROOT_DIR/.venv/bin/uvicorn' app.main:app --host '$HOST' --port '$API_PORT'" \
  > "$LOG_DIR/api.log" 2>&1 &
echo "$!" > "$PID_DIR/api.pid"

nohup bash -lc "cd '$ROOT_DIR/apps/web' && VITE_API_BASE='http://$HOST:$API_PORT/api' npm run dev -- --host '$HOST' --port '$WEB_PORT'" \
  > "$LOG_DIR/web.log" 2>&1 &
echo "$!" > "$PID_DIR/web.pid"

echo "Started."
echo "API PID: $(cat "$PID_DIR/api.pid")"
echo "Web PID: $(cat "$PID_DIR/web.pid")"
echo
echo "Open: http://$HOST:$WEB_PORT"
echo "Stop: scripts/stop_all.sh"
