# Run Backend Server
$ErrorActionPreference = "Stop"

# Get the script directory (project root)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = Join-Path $scriptPath "backend"

Write-Host "Script path: $scriptPath" -ForegroundColor Gray
Write-Host "Looking for backend at: $backendPath" -ForegroundColor Gray

if (-not (Test-Path $backendPath)) {
    Write-Host "Error: backend directory not found at $backendPath" -ForegroundColor Red
    Write-Host "`nCurrent directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    Write-Host "Expected location: C:\Users\maore\git\סידור וארגון הבית - אלי מאור\" -ForegroundColor Yellow
    exit 1
}

Write-Host "=== Starting Backend Server ===" -ForegroundColor Green
Write-Host "Path: $backendPath" -ForegroundColor Gray

Set-Location $backendPath
Write-Host "Changed to: $(Get-Location)" -ForegroundColor Gray

# Set PYTHONPATH so Python can find the 'app' module
$env:PYTHONPATH = $backendPath

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    "SECRET_KEY=dev-secret-key-change-in-production`nDATABASE_URL=sqlite:///./eli_maor.db" | Out-File -FilePath ".env" -Encoding utf8
}

Write-Host "`nStarting FastAPI server on port 8000..." -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "`nPress Ctrl+C to stop`n" -ForegroundColor Gray

# Try Poetry first, then Python
if (Get-Command poetry -ErrorAction SilentlyContinue) {
    Write-Host "Using Poetry..." -ForegroundColor Cyan
    poetry run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    Write-Host "Using Python directly..." -ForegroundColor Cyan
    python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
} else {
    Write-Host "Error: Neither Poetry nor Python found!" -ForegroundColor Red
    Write-Host "Please install Python: https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}
