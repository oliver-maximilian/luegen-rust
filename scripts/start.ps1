# Startet Backend (cargo run --debug) und Frontend (vite dev server) im Hintergrund (detached).
# Terminal kann danach geschlossen werden. Beenden mit .\scripts\stop.ps1
$ErrorActionPreference = "Stop"
Set-Location -Path (Split-Path $PSScriptRoot -Parent)

if ((Test-Path ".run/backend.pid") -or (Test-Path ".run/frontend.pid")) {
    Write-Error "Es läuft bereits etwas (.run\*.pid vorhanden). Erst .\scripts\stop.ps1 ausführen."
    exit 1
}

New-Item -ItemType Directory -Force -Path ".run" | Out-Null

if (-not (Test-Path "node_modules")) {
    Write-Host "Installiere Abhängigkeiten (npm install)..."
    npm install
}

Write-Host "Starte Backend (cargo run -- --debug)..."
$backend = Start-Process -FilePath "cargo" -ArgumentList @("run", "--", "--debug") `
    -RedirectStandardOutput ".run/backend.log" -RedirectStandardError ".run/backend.err.log" `
    -WindowStyle Hidden -PassThru
$backend.Id | Out-File -FilePath ".run/backend.pid" -Encoding ascii

Write-Host "Starte Frontend (vite dev server)..."
$frontend = Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "npm run dev --workspace frontend") `
    -RedirectStandardOutput ".run/frontend.log" -RedirectStandardError ".run/frontend.err.log" `
    -WindowStyle Hidden -PassThru
$frontend.Id | Out-File -FilePath ".run/frontend.pid" -Encoding ascii

Write-Host ""
Write-Host "Backend:  http://localhost:3000   (Log: .run\backend.log)"
Write-Host "Frontend: http://localhost:5173   (Log: .run\frontend.log)"
Write-Host ""
Write-Host "Laeuft im Hintergrund. Beenden mit: .\scripts\stop.ps1"
