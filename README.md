# Lügen

Kartenspiel "Lügen" (Cheat/BS). Rust/Axum-Backend + React/Vite-Frontend, als eine Binary ausgeliefert. Regeln: [`rules.md`](rules.md).

## Voraussetzungen

Rust (stable) und Node.js 18+.

## Start

```bash
npm install
npm run dev      # Backend + Frontend zusammen -> http://localhost:5173
```

Detached (Hintergrund, Terminal kann zu):

```bash
./scripts/start.sh   # macOS/Linux
./scripts/stop.sh

.\scripts\start.ps1  # Windows
.\scripts\stop.ps1
```

Production-Build (eine Binary, http://localhost:3000):

```bash
npm start
```
