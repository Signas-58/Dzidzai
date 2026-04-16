$ErrorActionPreference = 'Stop'

function Stop-Port([int]$Port) {
  try {
    $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if (-not $conns) {
      Write-Host "Port $Port is free"
      return
    }

    $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
      if ($procId -and $procId -ne 0) {
        Write-Host "Stopping PID $procId on port $Port"
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      }
    }
  } catch {
    Write-Host "Failed to stop processes on port ${Port}: $($_.Exception.Message)"
  }
}

Stop-Port 5000
Stop-Port 3000

$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host "Starting backend on http://localhost:5000"
Start-Process powershell -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-NoExit',
  '-Command',
  "`$env:PORT=5000; cd '$repoRoot\backend'; npm run dev"
)

Write-Host "Starting frontend on http://localhost:3000"
Start-Process powershell -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-NoExit',
  '-Command',
  "`$env:PORT=3000; cd '$repoRoot\frontend'; npm run dev"
)
