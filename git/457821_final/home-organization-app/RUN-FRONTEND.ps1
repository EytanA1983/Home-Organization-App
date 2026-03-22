# Run Frontend Server
$ErrorActionPreference = "Stop"

# Get the script directory (project root)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $scriptPath "frontend"

Write-Host "Script path: $scriptPath" -ForegroundColor Gray
Write-Host "Looking for frontend at: $frontendPath" -ForegroundColor Gray

if (-not (Test-Path $frontendPath)) {
    Write-Host "Error: frontend directory not found at $frontendPath" -ForegroundColor Red
    Write-Host "`nCurrent directory: $(Get-Location)" -ForegroundColor Yellow
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    Write-Host "Expected location: C:\Users\maore\git\סידור וארגון הבית - אלי מאור\" -ForegroundColor Yellow
    exit 1
}

Write-Host "=== Starting Frontend Server ===" -ForegroundColor Green
Write-Host "Path: $frontendPath" -ForegroundColor Gray

Set-Location $frontendPath
Write-Host "Changed to: $(Get-Location)" -ForegroundColor Gray

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "`nStarting Vite dev server on port 5173 (development)..." -ForegroundColor Cyan
Write-Host "Open: http://localhost:5173" -ForegroundColor Green
Write-Host "Note: Production (Docker) uses port 3000" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

npm run dev
