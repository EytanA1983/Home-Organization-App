# Start App - Frontend and Backend
$ErrorActionPreference = "Continue"

$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = Get-Location
}

Write-Host "=== Starting App ===" -ForegroundColor Green
Write-Host "Project root: $projectRoot" -ForegroundColor Gray

# Start Backend
Write-Host "`nStarting Backend..." -ForegroundColor Cyan
$backendPath = Join-Path $projectRoot "backend"
if (Test-Path $backendPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
    Write-Host "Backend starting on http://localhost:8000" -ForegroundColor Green
} else {
    Write-Host "Backend directory not found!" -ForegroundColor Red
}

# Wait a bit
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "`nStarting Frontend..." -ForegroundColor Cyan
$frontendPath = Join-Path $projectRoot "frontend"
if (Test-Path $frontendPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev"
    Write-Host "Frontend starting on http://localhost:5178 (development)" -ForegroundColor Green
} else {
    Write-Host "Frontend directory not found!" -ForegroundColor Red
}

# Wait for servers to start
Write-Host "`nWaiting for servers to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Open browser
Write-Host "`nOpening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5178"

Write-Host "`n=== Done ===" -ForegroundColor Green
Write-Host "Frontend (Development): http://localhost:5178" -ForegroundColor Cyan
Write-Host "Frontend (Production/Docker): http://localhost:3000" -ForegroundColor Gray
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
