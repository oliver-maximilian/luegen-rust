# Beendet, was start.ps1 im Hintergrund gestartet hat.
Set-Location -Path $PSScriptRoot

function Stop-One([string]$Name) {
    $pidFile = ".run/$Name.pid"
    if (Test-Path $pidFile) {
        $procId = Get-Content $pidFile
        if ($procId) {
            Write-Host "Stoppe $Name (PID $procId)..."
            # /T beendet auch alle Kindprozesse (z.B. node/vite unter cmd.exe, oder die kompilierte Server-Binary unter cargo)
            taskkill /PID $procId /T /F 2>$null | Out-Null
        }
        Remove-Item $pidFile -ErrorAction SilentlyContinue
    } else {
        Write-Host "$Name laeuft nicht (keine .run\$Name.pid gefunden)."
    }
}

Stop-One "backend"
Stop-One "frontend"

Write-Host "Fertig."
