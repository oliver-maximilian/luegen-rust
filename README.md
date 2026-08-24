# Lügen

Web-Version des Kartenspiels **Lügen** (auch bekannt als "Cheat" / "BS"): Karten verdeckt ablegen, den Wert behaupten, bluffen und andere anzweifeln.

Das Projekt besteht aus einem Rust-Backend (Axum, REST + WebSocket) und einem React/Vite-Frontend. Das fertig gebaute Frontend wird zur Kompilierzeit in die Rust-Binary eingebettet – am Ende gibt es eine einzige ausführbare Datei, die sowohl die Web-Oberfläche als auch die API ausliefert.

> Spielregeln stehen in [`rules.md`](rules.md).

---

## Voraussetzungen

* **Rust** (stable, über [rustup](https://rustup.rs))
* **Node.js** 18+ mit npm

---

## 🚀 Start

Das Repo ist als npm-Workspace organisiert (Root-`package.json` + `frontend/`). Ein `npm install` installiert alles – Root- und Frontend-Abhängigkeiten.

```bash
npm install
npm run dev
```

* Startet Backend (`cargo run -- --debug`, Port `3000`) und Frontend-Devserver (Vite, Port `5173`, Live-Reload, proxyt `/api` automatisch zum Backend) gemeinsam in einem Terminal.
* App danach unter **http://localhost:5173** öffnen.
* `Strg+C` beendet beide Prozesse zusammen.

Funktioniert identisch unter Windows, macOS und Linux.

---

## Production-Build

```bash
npm start
```

Baut das Frontend, kompiliert die Rust-Release-Binary und startet sie direkt. Web-Oberfläche und API sind danach unter **http://localhost:3000** erreichbar.

Nur das Frontend neu bauen (nötig nach Änderungen in `frontend/src`, bevor `cargo build`/`cargo run` es wieder einbettet):

```bash
npm run build --workspace frontend
```

---

## 🗂️ Struktur

* **`src/`** – Rust-Backend (Axum-Server, Spiellogik, WebSocket-/REST-API)
* **`frontend/`** – React + Vite Frontend
* **`frontend/dist/`** – Gebautes Frontend, wird in die Binary eingebettet
* **`rules.md`** – Spielregeln
