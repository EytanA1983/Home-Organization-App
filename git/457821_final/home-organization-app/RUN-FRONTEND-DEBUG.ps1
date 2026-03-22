# Debug Frontend Build
$ProjectRoot = $PSScriptRoot
$FrontendDir = Join-Path $ProjectRoot "frontend"

Write-Host "📁 Project Root: $ProjectRoot" -ForegroundColor Cyan
Write-Host "📁 Frontend Dir: $FrontendDir" -ForegroundColor Cyan

if (!(Test-Path $FrontendDir)) {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    exit 1
}

Push-Location $FrontendDir

Write-Host ""
Write-Host "🔍 Checking vite.config.ts..." -ForegroundColor Yellow
if (Test-Path "vite.config.ts") {
    Write-Host "✅ vite.config.ts found" -ForegroundColor Green
} else {
    Write-Host "❌ vite.config.ts not found!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host ""
Write-Host "🔍 Checking node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules found" -ForegroundColor Green
} else {
    Write-Host "⚠️  node_modules not found, running npm install..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "🚀 Starting Vite dev server..." -ForegroundColor Cyan
Write-Host ""

# Run with full error output
npm run dev

Pop-Location
