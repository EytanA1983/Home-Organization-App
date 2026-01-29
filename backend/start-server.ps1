# Start Backend Server
Write-Host "=== Starting Backend Server ===" -ForegroundColor Green

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Yellow
    Write-Host "Run: .\create-env.ps1 to create it" -ForegroundColor Cyan
}

# Check if Poetry is available
if (Get-Command poetry -ErrorAction SilentlyContinue) {
    Write-Host "Using Poetry..." -ForegroundColor Cyan
    Write-Host "Starting server on http://127.0.0.1:8000" -ForegroundColor Green
    Write-Host "`nPress Ctrl+C to stop`n" -ForegroundColor Gray
    poetry run uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
} else {
    Write-Host "Using Python directly..." -ForegroundColor Cyan
    Write-Host "Starting server on http://127.0.0.1:8000" -ForegroundColor Green
    Write-Host "`nPress Ctrl+C to stop`n" -ForegroundColor Gray
    python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
}
