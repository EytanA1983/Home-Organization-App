# Simple script to run backend only
$scriptDir = $PSScriptRoot
$backendDir = Join-Path $scriptDir "backend"

Write-Host "Starting Backend..." -ForegroundColor Green
Write-Host "Directory: $backendDir" -ForegroundColor Gray

Set-Location $backendDir

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    "SECRET_KEY=dev-secret-key-change-in-production" | Out-File -FilePath ".env" -Encoding utf8
}

Write-Host "Starting uvicorn on http://127.0.0.1:8000" -ForegroundColor Cyan
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
