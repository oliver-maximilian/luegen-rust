#!/usr/bin/env bash
# Beendet, was start.sh im Hintergrund gestartet hat.
cd "$(dirname "${BASH_SOURCE[0]}")"

stop_one() {
  local name="$1" pidfile=".run/$1.pid"
  if [ -f "$pidfile" ]; then
    local pid
    pid="$(cat "$pidfile")"
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      echo "Stoppe $name (PID $pid)..."
      # negative PID = ganze Prozessgruppe (fängt auch Kindprozesse wie den kompilierten Server oder vite)
      kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
    fi
    rm -f "$pidfile"
  else
    echo "$name läuft nicht (keine .run/$name.pid gefunden)."
  fi
}

stop_one backend
stop_one frontend

echo "Fertig."
