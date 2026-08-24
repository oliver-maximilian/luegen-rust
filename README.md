# Lügen

Web-Version des Kartenspiels **Lügen** (auch bekannt als "Cheat" / "BS"): Karten verdeckt ablegen, den Wert behaupten, bluffen und andere anzweifeln. Die genauen Spielregeln stehen in [`rules.md`](rules.md).

Das Projekt besteht aus einem Rust-Backend (Axum, REST + WebSocket) und einem React/Vite-Frontend. Das fertig gebaute Frontend (`frontend/dist`) wird zur Kompilierzeit in die Rust-Binary eingebettet – am Ende gibt es eine einzige ausführbare Datei, die sowohl die Web-Oberfläche als auch die API ausliefert.

## Voraussetzungen

- **Rust** (Edition 2024, aktueller stabiler Toolchain über [rustup](https://rustup.rs))
- **Node.js** (Version 18+) mit npm

Beides wird für den kombinierten Dev-Start unten gebraucht. Für den reinen Produktionsstart (`cargo run --release`, ohne Codeänderungen) reicht Rust allein, da `frontend/dist` bereits fertig gebaut im Repo liegt.

## Schnellstart: Backend + Frontend zusammen (ein Befehl, ein Terminal)

Das Repo ist als npm-Workspace organisiert (Root-`package.json` + `frontend/`), sodass Installation und Start komplett aus dem Projekt-Root laufen – kein `cd`, kein zweites Terminal nötig.

Einmalig installieren (installiert sowohl die Root- als auch die Frontend-Abhängigkeiten):

```bash
npm install
```

Danach mit einem Befehl starten – Backend (`cargo run -- --debug`, Port `3000`) und Frontend-Devserver mit Live-Reload (Vite, Port `5173`, proxyt `/api` automatisch zum Backend) laufen parallel im selben Terminal:

```bash
npm run dev
```

App dann unter **http://localhost:5173** öffnen. Mit `Strg+C` (Windows/Linux/macOS) werden beide Prozesse zusammen beendet.

Funktioniert identisch unter Windows (PowerShell/CMD) und macOS/Linux.

Weitere Root-Skripte:

```bash
npm run build   # baut das Frontend und kompiliert die Rust-Release-Binary
npm start       # wie build, startet danach zusätzlich die fertige Binary (http://localhost:3000)
```

## Detached starten/stoppen (Hintergrund, Terminal kann zu bleiben)

`npm run dev` läuft im Vordergrund – schließt du das Terminal, sterben beide Prozesse. Für den Hintergrundbetrieb gibt es ein Start-/Stop-Skriptpaar, das Backend und Frontend detached startet (PIDs unter `.run/*.pid`, Logs unter `.run/*.log`) und beim Stoppen komplett samt Kindprozessen wieder beendet.

### macOS / Linux

```bash
./start.sh   # startet beides im Hintergrund, Terminal danach frei nutzbar/schließbar
./stop.sh    # beendet beides wieder
```

### Windows (PowerShell)

```powershell
.\start.ps1   # startet beides im Hintergrund
.\stop.ps1    # beendet beides wieder
```

(Falls PowerShell das Ausführen von Skripten blockiert: einmalig `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` im selben Fenster ausführen.)

Danach wie gewohnt unter **http://localhost:5173** (Dev-Frontend) bzw. **http://localhost:3000** (Backend/API) erreichbar. Logs bei Bedarf einsehen mit `.run/backend.log` bzw. `.run/frontend.log`.

## Manueller Start (alternativ, ohne npm-Workspace-Skripte)

### Nur Backend starten

```bash
cargo run --release
```

Der Server lauscht danach auf `http://localhost:3000` – dort ist gleichzeitig die Web-Oberfläche (aus `frontend/dist`) und die API erreichbar.

Optional lässt sich ein Debug-Endpoint (`/api/debug/game`) aktivieren:

```bash
cargo run --release -- --debug
```

### Frontend selbst bauen

Nur nötig, wenn du Änderungen an `frontend/src` vorgenommen hast – das Backend bettet immer den aktuellen Stand von `frontend/dist` ein, dieser muss also vor `cargo build`/`cargo run` neu erzeugt werden.

```bash
cd frontend
npm install
npm run build
cd ..
cargo run --release
```

(Funktioniert gleich unter Windows und macOS/Linux.)

## Projektstruktur

```
main.rs, api.rs, api_model.rs, game.rs, model.rs   Rust-Backend (Axum-Server, Spiellogik, WS/REST-API)
frontend/                                          React + Vite Frontend
frontend/dist/                                     Gebautes Frontend, wird in die Binary eingebettet
package.json                                       Root-Workspace: Skripte für den kombinierten Start (npm run dev/build/start)
start.sh / stop.sh                                 Backend + Frontend detached starten/stoppen (macOS/Linux)
start.ps1 / stop.ps1                               Backend + Frontend detached starten/stoppen (Windows)
rules.md                                           Spielregeln
```
