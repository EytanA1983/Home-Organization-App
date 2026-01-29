# Simple script to run frontend only
$scriptDir = $PSScriptRoot
$frontendDir = Join-Path $scriptDir "frontend"

Write-Host "Starting Frontend..." -ForegroundColor Green
Write-Host "Directory: $frontendDir" -ForegroundColor Gray

Set-Location $frontendDir

Write-Host "Starting Vite on http://localhost:5178" -ForegroundColor Cyan
npm run dev
