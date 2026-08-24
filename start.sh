#!/usr/bin/env bash
# Startet Backend (cargo run --debug) und Frontend (vite dev server) im Hintergrund (detached).
# Terminal kann danach geschlossen werden. Beenden mit ./stop.sh
set -euo pipefail
set -m  # Job-Control an: jeder Hintergrund-Job bekommt seine eigene Prozessgruppe -> stop.sh kann Kindprozesse mit beenden

cd "$(dirname "${BASH_SOURCE[0]}")"

if [ -f .run/backend.pid ] || [ -f .run/frontend.pid ]; then
  echo "Es läuft bereits etwas (.run/*.pid vorhanden). Erst ./stop.sh ausführen." >&2
  exit 1
fi

mkdir -p .run

if [ ! -d node_modules ]; then
  echo "Installiere Abhängigkeiten (npm install)..."
  npm install
fi

echo "Starte Backend (cargo run -- --debug)..."
cargo run -- --debug > .run/backend.log 2>&1 &
echo $! > .run/backend.pid

echo "Starte Frontend (vite dev server)..."
npm run dev --workspace frontend > .run/frontend.log 2>&1 &
echo $! > .run/frontend.pid

echo
echo "Backend:  http://localhost:3000   (Log: .run/backend.log)"
echo "Frontend: http://localhost:5173   (Log: .run/frontend.log)"
echo
echo "Läuft im Hintergrund. Beenden mit: ./stop.sh"
