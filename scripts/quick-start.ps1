# quick-start.ps1 — Fast local-only demo (no K8s/Minikube)
# Usage: .\scripts\quick-start.ps1
# Starts: backend, frontend, Ollama

Write-Host "Starting KubeMind AI fast local demo..." -ForegroundColor Cyan

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $RepoRoot "scripts\logs"
$PidDir = Join-Path $RepoRoot "scripts\pids"
New-Item -Path $LogDir -ItemType Directory -Force | Out-Null
New-Item -Path $PidDir -ItemType Directory -Force | Out-Null

function Save-PidFile($name, $processId) {
  Set-Content -Path (Join-Path $PidDir "$name.pid") -Value $processId -Force
}

# Kill any stray processes from previous run
Write-Host "Cleaning up stray processes..." -ForegroundColor Yellow
Get-Process -Name python, node, ollama -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

# Start backend
Write-Host "Starting backend (FastAPI on port 8000)..." -ForegroundColor Yellow
$backendLog = Join-Path $LogDir "backend.log"
$backendErr = Join-Path $LogDir "backend.err"
$p = Start-Process -FilePath python -ArgumentList 'main.py' -WorkingDirectory (Join-Path $RepoRoot 'backend') -NoNewWindow -RedirectStandardOutput $backendLog -RedirectStandardError $backendErr -PassThru
if ($p) {
  Save-PidFile "backend" $p.Id
  Write-Host "  [OK] Backend running (PID: $($p.Id))" -ForegroundColor Green
} else {
  Write-Host "  [ERROR] Backend failed to start" -ForegroundColor Red
}

# Start frontend using cmd /c to ensure npm is found
Write-Host "Starting frontend (React on port 3000)..." -ForegroundColor Yellow
$frontendLog = Join-Path $LogDir "frontend.log"
$frontendErr = Join-Path $LogDir "frontend.err"
$p = Start-Process -FilePath cmd -ArgumentList "/c npm start" -WorkingDirectory (Join-Path $RepoRoot 'frontend') -NoNewWindow -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendErr -PassThru
if ($p) {
  Save-PidFile "frontend" $p.Id
  Write-Host "  [OK] Frontend running (PID: $($p.Id))" -ForegroundColor Green
} else {
  Write-Host "  [ERROR] Frontend failed to start" -ForegroundColor Red
}

# Start Ollama using cmd /c
Write-Host "Starting Ollama (LLM service)..." -ForegroundColor Yellow
$ollamaLog = Join-Path $LogDir "ollama.log"
$ollamaErr = Join-Path $LogDir "ollama.err"
$p = Start-Process -FilePath cmd -ArgumentList "/c ollama serve" -NoNewWindow -RedirectStandardOutput $ollamaLog -RedirectStandardError $ollamaErr -PassThru
if ($p) {
  Save-PidFile "ollama" $p.Id
  Write-Host "  [OK] Ollama running (PID: $($p.Id))" -ForegroundColor Green
} else {
  Write-Host "  [ERROR] Ollama failed to start (install Ollama from ollama.ai)" -ForegroundColor Yellow
}

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEMO READY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Open in your browser:" -ForegroundColor Green
Write-Host "  Frontend:    http://localhost:3000/" -ForegroundColor Cyan
Write-Host "  Backend API: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Logs are saved to:" -ForegroundColor Yellow
Write-Host "  Backend:  $backendLog" -ForegroundColor Gray
Write-Host "  Frontend: $frontendLog" -ForegroundColor Gray
Write-Host "  Ollama:   $ollamaLog" -ForegroundColor Gray
Write-Host ""
Write-Host "To stop all services, run:" -ForegroundColor Yellow
Write-Host "  .\scripts\stop-all.ps1" -ForegroundColor Cyan
Write-Host ""
