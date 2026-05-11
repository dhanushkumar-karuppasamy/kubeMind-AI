# stop-all.ps1 — Stop local KubeMind AI processes and Minikube (PowerShell)
# This version stops processes started by scripts via PID files.
Write-Host "Stopping KubeMind AI local stack..." -ForegroundColor Cyan

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$PidDir = Join-Path $RepoRoot "scripts\pids"

function Stop-ByPidFile($name) {
  $path = Join-Path $PidDir ("$name.pid")
  if (Test-Path $path) {
    try {
      $procId = Get-Content $path | ForEach-Object { [int]$_ }
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      Remove-Item $path -ErrorAction SilentlyContinue
      Write-Host "  Stopped $name (PID $procId)" -ForegroundColor Green
    } catch {
      Write-Host "  Could not stop $name by PID" -ForegroundColor Yellow
    }
  }
}

Write-Host "Stopping known services..." -ForegroundColor Yellow
Stop-ByPidFile -name "backend"
Stop-ByPidFile -name "frontend"
Stop-ByPidFile -name "ollama"
Stop-ByPidFile -name "pf_prometheus"
Stop-ByPidFile -name "pf_face"

Write-Host "Fallback: stopping by process name..." -ForegroundColor Yellow
Get-Process -Name python, node, cmd, ollama -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Stopping Minikube..." -ForegroundColor Yellow
minikube stop -ErrorAction SilentlyContinue
Write-Host "Done." -ForegroundColor Green
