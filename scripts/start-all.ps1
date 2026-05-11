# start-all.ps1 — Start full local stack for KubeMind AI (PowerShell)
# This version starts services as background processes and streams their logs
param(
  [switch] $SkipBuild,
  [switch] $SkipMinikube
)

Write-Host "Starting KubeMind AI local stack (inline mode)..." -ForegroundColor Cyan

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$LogDir = Join-Path $RepoRoot "scripts\logs"
$PidDir = Join-Path $RepoRoot "scripts\pids"
New-Item -Path $LogDir -ItemType Directory -Force | Out-Null
New-Item -Path $PidDir -ItemType Directory -Force | Out-Null

function Save-Pid($name, $pid) {
  $path = Join-Path $PidDir ("$name.pid")
  Set-Content -Path $path -Value $pid -Force
}

if (-not $SkipMinikube) {
  Write-Host "Starting Minikube (blocking)..." -ForegroundColor Yellow
  & minikube start --driver=docker
  Write-Host "Pointing Docker at Minikube daemon..." -ForegroundColor Yellow
  & minikube docker-env | Invoke-Expression
}

if (-not $SkipBuild) {
  Write-Host "Building Docker images (student-portal, face-recognition)..." -ForegroundColor Yellow
  Push-Location (Join-Path $RepoRoot "docker\student-portal")
  docker build -f DockerFile -t kubemind/student-portal:latest .
  Pop-Location
  Push-Location (Join-Path $RepoRoot "docker\face-recognition")
  docker build -f DockerFile -t kubemind/face-recognition:latest .
  Pop-Location
}

Write-Host "Applying Kubernetes manifests (blocking)..." -ForegroundColor Yellow
kubectl create namespace kubemind-demo --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f (Join-Path $RepoRoot "k8s\student-portal.yaml") -n kubemind-demo
kubectl apply -f (Join-Path $RepoRoot "k8s\face-recognition.yaml") -n kubemind-demo
kubectl apply -f (Join-Path $RepoRoot "k8s\database.yaml") -n kubemind-demo

Write-Host "Starting backend, frontend, Ollama, and port-forwards as background processes..." -ForegroundColor Yellow

# start backend
$backendLog = Join-Path $LogDir "backend.log"
$backendErr = Join-Path $LogDir "backend.err"
$p = Start-Process -FilePath python -ArgumentList 'main.py' -WorkingDirectory (Join-Path $RepoRoot 'backend') -NoNewWindow -RedirectStandardOutput $backendLog -RedirectStandardError $backendErr -PassThru
Save-Pid -name "backend" -pid $p.Id
Write-Host "Backend PID: $($p.Id) -> $backendLog"

# start frontend (npm start)
$frontendLog = Join-Path $LogDir "frontend.log"
$frontendErr = Join-Path $LogDir "frontend.err"
$p = Start-Process -FilePath npm -ArgumentList 'start' -WorkingDirectory (Join-Path $RepoRoot 'frontend') -NoNewWindow -RedirectStandardOutput $frontendLog -RedirectStandardError $frontendErr -PassThru
Save-Pid -name "frontend" -pid $p.Id
Write-Host "Frontend PID: $($p.Id) -> $frontendLog"

# start Ollama
$ollamaLog = Join-Path $LogDir "ollama.log"
$ollamaErr = Join-Path $LogDir "ollama.err"
$p = Start-Process -FilePath ollama -ArgumentList 'serve' -NoNewWindow -RedirectStandardOutput $ollamaLog -RedirectStandardError $ollamaErr -PassThru
Save-Pid -name "ollama" -pid $p.Id
Write-Host "Ollama PID: $($p.Id) -> $ollamaLog"

# start kubectl port-forwards
$pf1Log = Join-Path $LogDir "portforward_prometheus.log"
$pf1Err = Join-Path $LogDir "portforward_prometheus.err"
$p = Start-Process -FilePath kubectl -ArgumentList 'port-forward svc/prometheus-server 9090:80 -n monitoring' -NoNewWindow -RedirectStandardOutput $pf1Log -RedirectStandardError $pf1Err -PassThru
Save-Pid -name "pf_prometheus" -pid $p.Id
Write-Host "Prometheus port-forward PID: $($p.Id) -> $pf1Log"

$pf2Log = Join-Path $LogDir "portforward_face.log"
$pf2Err = Join-Path $LogDir "portforward_face.err"
$p = Start-Process -FilePath kubectl -ArgumentList 'port-forward svc/face-recognition 5002:5000 -n kubemind-demo' -NoNewWindow -RedirectStandardOutput $pf2Log -RedirectStandardError $pf2Err -PassThru
Save-Pid -name "pf_face" -pid $p.Id
Write-Host "Face port-forward PID: $($p.Id) -> $pf2Log"

Write-Host "All background processes started. Streaming logs from $LogDir (Ctrl+C to stop streaming)." -ForegroundColor Green
Get-ChildItem -Path $LogDir -Filter *.log | ForEach-Object { $_.FullName } | Get-Content -Wait -Tail 10

Write-Host "Log streaming ended." -ForegroundColor Cyan
