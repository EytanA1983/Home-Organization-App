# Start both servers
$ErrorActionPreference = "Stop"

Write-Host "=== Starting Servers ===" -ForegroundColor Green

# Get script directory (project root)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"
$frontendPath = Join-Path $scriptPath "frontend"

# Check paths
if (-not (Test-Path $backendPath)) {
    Write-Host "Error: backend directory not found at $backendPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "Error: frontend directory not found at $frontendPath" -ForegroundColor Red
    exit 1
}

# Create .env for backend if needed
$backendEnv = Join-Path $backendPath ".env"
if (-not (Test-Path $backendEnv)) {
    Write-Host "Creating .env file for backend..." -ForegroundColor Yellow
    "SECRET_KEY=dev-secret-key-change-in-production" | Out-File -FilePath $backendEnv -Encoding utf8
}

# Start Backend
Write-Host "`n[1/2] Starting Backend on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$backendPath'; Write-Host '=== Backend Server (Port 8000) ===' -ForegroundColor Green; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
) -WindowStyle Normal

# Wait
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "[2/2] Starting Frontend on port 5173 (development)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "cd '$frontendPath'; Write-Host '=== Frontend Server (Port 5173 - Development) ===' -ForegroundColor Green; npm run dev"
) -WindowStyle Normal

# Wait for servers
Write-Host "`nWaiting for servers to start (15 seconds)..." -ForegroundColor Cyan
Start-Sleep -Seconds 15

# Check servers
Write-Host "`nChecking servers..." -ForegroundColor Cyan
$backendOk = $false
$frontendOk = $false

try {
    $r = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 3 -UseBasicParsing
    $backendOk = $true
    Write-Host "✓ Backend: http://localhost:8000 - OK" -ForegroundColor Green
} catch {
    Write-Host "✗ Backend: Not responding" -ForegroundColor Red
}

try {
    $r2 = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 3 -UseBasicParsing
    $frontendOk = $true
    Write-Host "✓ Frontend: http://localhost:5173 - OK" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend: Not responding (may need more time)" -ForegroundColor Yellow
}

# Open browser
Write-Host "`nOpening browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"
Start-Sleep -Seconds 2
Start-Process "http://localhost:8000/docs"

Write-Host "`n=== Summary ===" -ForegroundColor Green
Write-Host "Frontend (Development): http://localhost:5173" -ForegroundColor Cyan
Write-Host "Frontend (Production/Docker): http://localhost:3000" -ForegroundColor Gray
Write-Host "Backend:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "`nServers are running in separate PowerShell windows." -ForegroundColor Gray
Write-Host "Close those windows to stop the servers." -ForegroundColor Gray

if (-not $backendOk -or -not $frontendOk) {
    Write-Host "`n⚠ Some servers may still be starting. Wait 10-15 seconds and refresh the browser (F5)." -ForegroundColor Yellow
}
