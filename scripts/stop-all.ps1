# stop-all.ps1 — Stop local KubeMind AI processes and Minikube (PowerShell)
# This version stops processes started by `start-all.ps1` (by PID files) and falls back to name-based stopping.
Write-Host "Stopping KubeMind AI local stack..." -ForegroundColor Cyan

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$PidDir = Join-Path $RepoRoot "scripts\pids"

function Stop-By-PidFile($name) {
	$path = Join-Path $PidDir ("$name.pid")
	if (Test-Path $path) {
		try {
			$pid = Get-Content $path | ForEach-Object { [int]$_ }
			Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
			Remove-Item $path -ErrorAction SilentlyContinue
			Write-Host "Stopped $name (PID $pid)" -ForegroundColor Green
		} catch {
			Write-Host "Failed to stop $name by PID: $_" -ForegroundColor Yellow
		}
	}
}

Write-Host "Stopping known background processes (backend, frontend, ollama, port-forwards)..." -ForegroundColor Yellow
Stop-By-PidFile -name "backend"
Stop-By-PidFile -name "frontend"
Stop-By-PidFile -name "ollama"
Stop-By-PidFile -name "pf_prometheus"
Stop-By-PidFile -name "pf_face"

Write-Host "Fallback: stopping by process name (node, python, kubectl, ollama) if any remain..." -ForegroundColor Yellow
Get-Process -Name node, python, kubectl, ollama -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Stopping Minikube..." -ForegroundColor Yellow
minikube stop

Write-Host "Done." -ForegroundColor Green
