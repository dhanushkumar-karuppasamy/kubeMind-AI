# stop-all.ps1 — Stop local KubeMind AI processes and Minikube (PowerShell)
# Usage: Run in an elevated PowerShell if required
Write-Host "Stopping KubeMind AI local stack..." -ForegroundColor Cyan

Write-Host "Killing frontend (node), backend (python), Ollama, and kubectl port-forward processes..." -ForegroundColor Yellow
Get-Process -Name node, python, ollama -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Kill all kubectl port-forward instances
Get-Process -Name kubectl -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Stopping Minikube..." -ForegroundColor Yellow
minikube stop

Write-Host "Done."
