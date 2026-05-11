# quick-start.ps1 — Fast local-only demo (no K8s/Minikube)
# Usage: .\scripts\quick-start.ps1
# Starts: backend, frontend, Ollama — logs to screen (streaming)

Write-Host "Starting KubeMind AI fast local demo (Ctrl+C to stop)..." -ForegroundColor Cyan

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $RepoRoot "scripts\logs"
$PidDir = Join-Path $RepoRoot "scripts\pids"
New-Item -Path $LogDir -ItemType Directory -Force | Out-Null
New-Item -Path $PidDir -ItemType Directory -Force | Out-Null

function Save-Pid($name, $pid) {
  Set-Content -Path (Join-Path $PidDir "$name.pid") -Value $pid -Force
}

# kill any stray processes from previous run
Get-Process -Name python, node, ollama -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -match 'python|node|ollama' } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

Write-Host "Starting backend (FastAPI)..." -ForegroundColor Yellow
$backendLog = Join-Path $LogDir "backend.log"
$p = Start-Process -FilePath python -ArgumentList 'main.py' -WorkingDirectory (Join-Path $RepoRoot 'backend') -NoNewWindow -RedirectStandardOutput $backendLog -PassThru
Save-Pid "backend" $p.Id
Write-Host "  Backend PID: $($p.Id)" -ForegroundColor Green

Write-Host "Starting frontend (React dev server)..." -ForegroundColor Yellow
$frontendLog = Join-Path $LogDir "frontend.log"
$p = Start-Process -FilePath npm -ArgumentList 'start' -WorkingDirectory (Join-Path $RepoRoot 'frontend') -NoNewWindow -RedirectStandardOutput $frontendLog -PassThru
Save-Pid "frontend" $p.Id
Write-Host "  Frontend PID: $($p.Id)" -ForegroundColor Green

Write-Host "Starting Ollama..." -ForegroundColor Yellow
$ollamaLog = Join-Path $LogDir "ollama.log"
$p = Start-Process -FilePath ollama -ArgumentList 'serve' -NoNewWindow -RedirectStandardOutput $ollamaLog -PassThru
Save-Pid "ollama" $p.Id
Write-Host "  Ollama PID: $($p.Id)" -ForegroundColor Green

Write-Host ""
Write-Host "Services starting in background. Streaming logs..." -ForegroundColor Cyan
Write-Host ""

$services = @{
  "BACKEND" = $backendLog
  "FRONTEND" = $frontendLog
  "OLLAMA" = $ollamaLog
}

$readers = @{}
$services.GetEnumerator() | ForEach-Object {
  $name = $_.Name
  $logFile = $_.Value
  if (Test-Path $logFile) {
    Write-Host "[$name]" -ForegroundColor Yellow
    Get-Content $logFile -Tail 5
  }
}

Write-Host ""
Write-Host "Ready to demo! Open:" -ForegroundColor Green
Write-Host "  - Frontend: http://localhost:3000/" -ForegroundColor Cyan
Write-Host "  - Backend API: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "To see live logs, run:" -ForegroundColor Yellow
Write-Host "  Get-Content `$LogDir\<backend|frontend|ollama>.log -Wait -Tail 50" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to continue. Run '.\scripts\stop-all.ps1' when done." -ForegroundColor Cyan
Read-Host "Press Enter to continue"
