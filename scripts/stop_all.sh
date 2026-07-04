#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PID_DIR="$ROOT_DIR/.pids"
API_PORT="${API_PORT:-8000}"
WEB_PORT="${WEB_PORT:-5173}"

stop_pid_file() {
  local label="$1"
  local pid_file="$2"
  if [ ! -f "$pid_file" ]; then
    echo "$label is not running."
    return
  fi

  local pid
  pid="$(cat "$pid_file")"
  if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
    kill "$pid"
    echo "Stopped $label PID $pid."
  else
    echo "$label PID $pid was not running."
  fi
  rm -f "$pid_file"
}

stop_port() {
  local label="$1"
  local port="$2"
  local pids
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -z "$pids" ]; then
    echo "$label port $port is free."
    return
  fi

  for pid in $pids; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid"
      echo "Stopped $label listener PID $pid on port $port."
    fi
  done
}

stop_pid_file "API" "$PID_DIR/api.pid"
stop_pid_file "Web" "$PID_DIR/web.pid"
stop_port "API" "$API_PORT"
stop_port "Web" "$WEB_PORT"
