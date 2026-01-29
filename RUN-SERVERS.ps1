# Script to run both servers
Write-Host "=== Starting Servers ===" -ForegroundColor Green

# Get project root
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend
Write-Host "`n[1/2] Starting Backend..." -ForegroundColor Yellow
$backendPath = Join-Path $projectRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host 'Backend Server' -ForegroundColor Green; if (-not (Test-Path .env)) { 'SECRET_KEY=dev-secret-key-change-in-production' | Out-File -FilePath .env -Encoding utf8 }; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000" -WindowStyle Normal

# Wait a bit
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[2/2] Starting Frontend..." -ForegroundColor Yellow
$frontendPath = Join-Path $projectRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Frontend Server' -ForegroundColor Green; npm run dev" -WindowStyle Normal

# Wait for servers to start
Write-Host "`nWaiting for servers to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 8

# Open browser
Write-Host "`nOpening browser..." -ForegroundColor Green
Start-Process "http://localhost:5178"
Start-Sleep -Seconds 2
Start-Process "http://localhost:8000/docs"

Write-Host "`n=== Servers Started ===" -ForegroundColor Green
Write-Host "  Frontend: http://localhost:5178" -ForegroundColor Cyan
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
