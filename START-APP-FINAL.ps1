# Final working script to start both servers
# Works with Hebrew characters in path

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 סידור וארגון הבית - אלי מאור                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Define paths
$projectRoot = $PSScriptRoot
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

Write-Host "📁 Project: $projectRoot" -ForegroundColor Gray
Write-Host ""

# Check if directories exist
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    exit 1
}

# Start Backend in new window
Write-Host "🔧 [1/2] Starting Backend Server..." -ForegroundColor Yellow

$backendCommand = @"
Set-Location '$backendPath'
Write-Host ''
Write-Host '╔═══════════════════════════════════════╗' -ForegroundColor Green
Write-Host '║  🐍 Backend Server (FastAPI)          ║' -ForegroundColor Green
Write-Host '╚═══════════════════════════════════════╝' -ForegroundColor Green
Write-Host ''
Write-Host '🚀 Starting on http://127.0.0.1:8000' -ForegroundColor Cyan
Write-Host '📚 API Docs: http://127.0.0.1:8000/docs' -ForegroundColor Cyan
Write-Host ''

if (-not (Test-Path '.env')) {
    Write-Host '⚠️  Creating .env file...' -ForegroundColor Yellow
    'SECRET_KEY=dev-secret-key-change-in-production' | Out-File -FilePath '.env' -Encoding utf8
}

python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand

Write-Host "   ✅ Backend terminal opened" -ForegroundColor Green
Write-Host "   ⏳ Waiting 6 seconds for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 6

# Start Frontend in new window
Write-Host ""
Write-Host "⚛️  [2/2] Starting Frontend Server..." -ForegroundColor Yellow

$frontendCommand = @"
Set-Location '$frontendPath'
Write-Host ''
Write-Host '╔═══════════════════════════════════════╗' -ForegroundColor Green
Write-Host '║  ⚛️  Frontend Server (Vite + React)  ║' -ForegroundColor Green
Write-Host '╚═══════════════════════════════════════╝' -ForegroundColor Green
Write-Host ''
Write-Host '🚀 Starting on http://localhost:5178' -ForegroundColor Cyan
Write-Host ''

npm run dev
"@

Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand

Write-Host "   ✅ Frontend terminal opened" -ForegroundColor Green
Write-Host "   ⏳ Waiting 10 seconds for frontend to build..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# Open browsers
Write-Host ""
Write-Host "🌐 Opening browsers..." -ForegroundColor Cyan

Write-Host "   → Application: http://localhost:5178" -ForegroundColor Gray
Start-Process "http://localhost:5178"

Start-Sleep -Seconds 2

Write-Host "   → API Docs: http://localhost:8000/docs" -ForegroundColor Gray
Start-Process "http://localhost:8000/docs"

# Final summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ Servers Started Successfully!                         ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 URLs:" -ForegroundColor Cyan
Write-Host "   • Frontend:  http://localhost:5178" -ForegroundColor White
Write-Host "   • Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "   • API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "📝 Notes:" -ForegroundColor Yellow
Write-Host "   • Both servers are running in separate windows" -ForegroundColor Gray
Write-Host "   • Press Ctrl+C in each window to stop the servers" -ForegroundColor Gray
Write-Host "   • Check each terminal for errors or warnings" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
