# Script to start frontend with clean cache
$ErrorActionPreference = "Stop"

Write-Host "`n=== Starting Frontend (Clean) ===" -ForegroundColor Cyan

# Navigate to frontend directory
$frontendPath = Join-Path $PSScriptRoot "frontend"
if (-not (Test-Path $frontendPath)) {
    Write-Host "Error: frontend directory not found!" -ForegroundColor Red
    exit 1
}

Set-Location $frontendPath
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Green

# Clear all caches
Write-Host "`nClearing caches..." -ForegroundColor Yellow
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite" -ErrorAction SilentlyContinue
    Write-Host "✓ Vite cache cleared" -ForegroundColor Green
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist" -ErrorAction SilentlyContinue
    Write-Host "✓ Dist folder cleared" -ForegroundColor Green
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: npm install failed!" -ForegroundColor Red
        exit 1
    }
}

# Start Vite
Write-Host "`n=== Starting Vite Dev Server ===" -ForegroundColor Cyan
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Green
Write-Host "`nPress Ctrl+C to stop the server`n" -ForegroundColor Yellow

npm run dev
