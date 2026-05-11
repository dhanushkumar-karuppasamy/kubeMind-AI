# start-all.ps1 — Start full local stack for KubeMind AI (PowerShell)
# Usage: Right-click -> "Run with PowerShell" or run from PowerShell as admin
param(
  [switch] $SkipBuild,
  [switch] $SkipMinikube
)

Write-Host "Starting KubeMind AI local stack..." -ForegroundColor Cyan

if (-not $SkipMinikube) {
  Write-Host "Starting Minikube..." -ForegroundColor Yellow
  Start-Process powershell -ArgumentList "-NoExit","-Command","minikube start --driver=docker" -WindowStyle Normal
  Start-Sleep -Seconds 6
  Write-Host "Pointing Docker at Minikube daemon..." -ForegroundColor Yellow
  & minikube docker-env | Invoke-Expression
}

if (-not $SkipBuild) {
  Write-Host "Building Docker images (student-portal, face-recognition)..." -ForegroundColor Yellow
  Start-Process powershell -ArgumentList "-NoExit","-Command","cd \"$PWD\docker\student-portal\"; docker build -f DockerFile -t kubemind/student-portal:latest ." -WindowStyle Normal
  Start-Process powershell -ArgumentList "-NoExit","-Command","cd \"$PWD\docker\face-recognition\"; docker build -f DockerFile -t kubemind/face-recognition:latest ." -WindowStyle Normal
}

Write-Host "Deploying Kubernetes manifests..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit","-Command","kubectl create namespace kubemind-demo --dry-run=client -o yaml | kubectl apply -f -" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit","-Command","kubectl apply -f \"$PWD\k8s\student-portal.yaml\" -n kubemind-demo; kubectl apply -f \"$PWD\k8s\face-recognition.yaml\" -n kubemind-demo; kubectl apply -f \"$PWD\k8s\database.yaml\" -n kubemind-demo" -WindowStyle Normal

Write-Host "Starting backend, frontend, and Ollama (each in new terminal)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit","-Command","cd \"$PWD\backend\"; python main.py" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit","-Command","cd \"$PWD\frontend\"; npm start" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit","-Command","ollama serve" -WindowStyle Normal

Write-Host "Starting port-forwards in new terminals (Prometheus and face-recognition)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit","-Command","kubectl port-forward svc/prometheus-server 9090:80 -n monitoring" -WindowStyle Normal
Start-Process powershell -ArgumentList "-NoExit","-Command","kubectl port-forward svc/face-recognition 5002:5000 -n kubemind-demo" -WindowStyle Normal

Write-Host "All start commands issued. Check the new terminal windows for progress and logs." -ForegroundColor Green
Write-Host "If you already have services running, you can pass -SkipMinikube or -SkipBuild to skip those steps." -ForegroundColor Cyan
