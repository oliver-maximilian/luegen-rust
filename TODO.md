# TODO

## Frontend

- [ ] Backend-Fehlermeldungen (API + WS) sind englisch/Rust-Debug-Output, landen roh im deutschen UI -> übersetzen/mappen
- [ ] "Debug"-Navpunkt sichtbar auch ohne `--debug` -> Fehler dabei ist kryptisch (HTML statt JSON)
- [ ] Tote CSS-Klassen ohne Styles: `room-grid--ended`, `table-grid__tile--stack`
- [ ] Ladezustand in RoomPage zeigt eigenen Namen als "Am Zug" bevor Daten da sind
- [ ] `handleStart`/`handleStop` in RoomPage ohne try/catch, Fehler verschwinden unhandled
- [ ] Kein Favicon
- [ ] DebugPage-Status-Pill immer gold, `statusToTone()` aus RoomPage nicht wiederverwendet
- [ ] "Aktualisieren" in DebugPage macht `location.reload()` statt `load()` erneut aufzurufen
- [ ] Hint-Text "Wert wird an das Backend gesendet." wirkt wie Dev-Platzhalter
- [ ] Drag-and-Drop-Handsortierung funktioniert nicht auf Touch/Mobile
- [ ] Card-Tile-Breakpoint bei 640px: nur Breite schrumpft, Höhe fix -> Karten wirken gestreckt
- [ ] End-Popup (Modal) ohne Fokus-Handling/Escape-to-close

## Docker

- [ ] Multi-Stage-Dockerfile (Node-Build fürs Frontend -> Rust-Build -> schlankes Runtime-Image)
- [ ] Image-Größe/Base-Image (distroless/alpine) prüfen

## CI/CD (GitHub Actions)

- [ ] Workflow: `cargo build`/`cargo test` + Frontend-Build bei Push/PR
- [ ] Automatisches Changelog (z. B. release-please / conventional commits)
- [ ] Release-Workflow für Binaries (Windows/macOS/Linux)

## Tests

- [ ] Rust: Unit-Tests für Spiellogik (`game.rs`, Doubt/Lüge, Ass-Regel)
- [ ] Rust: Integrationstests für API-Endpunkte
- [ ] Frontend: Komponententests (Vitest/RTL)
- [ ] E2E-Test für kompletten Spielablauf

## Linting/Formatting

- [ ] `cargo clippy` in CI
- [ ] `cargo fmt --check` in CI
- [ ] ESLint fürs Frontend (aktuell keins vorhanden)
- [ ] Prettier o. ä. fürs Frontend
