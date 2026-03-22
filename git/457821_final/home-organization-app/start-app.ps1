# Simple script to start both servers and open browser
# Run from project root

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🚀 Starting Home Organization App                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot
$backendPath = Join-Path $projectRoot "backend"
$frontendPath = Join-Path $projectRoot "frontend"

# Check if paths exist
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ Frontend directory not found: $frontendPath" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Project root: $projectRoot" -ForegroundColor Gray
Write-Host ""

# Start Backend
Write-Host "🔧 [1/2] Starting Backend Server..." -ForegroundColor Yellow
Write-Host "   Path: $backendPath" -ForegroundColor Gray

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backendPath'; Write-Host '╔═══════════════════════════════════════╗' -ForegroundColor Green; Write-Host '║  🐍 Backend Server (FastAPI)          ║' -ForegroundColor Green; Write-Host '╚═══════════════════════════════════════╝' -ForegroundColor Green; Write-Host ''; if (-not (Test-Path .env)) { Write-Host '⚠️  Creating .env file...' -ForegroundColor Yellow; 'SECRET_KEY=dev-secret-key-change-in-production' | Out-File -FilePath .env -Encoding utf8 }; Write-Host '🚀 Starting on http://127.0.0.1:8000' -ForegroundColor Cyan; Write-Host '📚 API Docs: http://127.0.0.1:8000/docs' -ForegroundColor Cyan; Write-Host ''; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
)

Write-Host "   ✅ Backend terminal opened" -ForegroundColor Green
Write-Host "   ⏳ Waiting 5 seconds for backend to start..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Start Frontend
Write-Host ""
Write-Host "⚛️  [2/2] Starting Frontend Server..." -ForegroundColor Yellow
Write-Host "   Path: $frontendPath" -ForegroundColor Gray

Start-Process powershell -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontendPath'; Write-Host '╔═══════════════════════════════════════╗' -ForegroundColor Green; Write-Host '║  ⚛️  Frontend Server (Vite + React)  ║' -ForegroundColor Green; Write-Host '╚═══════════════════════════════════════╝' -ForegroundColor Green; Write-Host ''; Write-Host '🚀 Starting on http://localhost:5178' -ForegroundColor Cyan; Write-Host ''; npm run dev"
)

Write-Host "   ✅ Frontend terminal opened" -ForegroundColor Green
Write-Host "   ⏳ Waiting 8 seconds for frontend to start..." -ForegroundColor Gray
Start-Sleep -Seconds 8

# Open browsers
Write-Host ""
Write-Host "🌐 Opening browsers..." -ForegroundColor Cyan

Write-Host "   → Frontend: http://localhost:5178" -ForegroundColor Gray
Start-Process "http://localhost:5178"

Start-Sleep -Seconds 2

Write-Host "   → API Docs: http://localhost:8000/docs" -ForegroundColor Gray
Start-Process "http://localhost:8000/docs"

# Summary
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
Write-Host "   • Both servers are running in separate terminals" -ForegroundColor Gray
Write-Host "   • Press Ctrl+C in each terminal to stop servers" -ForegroundColor Gray
Write-Host "   • Backend logs: backend/logs/" -ForegroundColor Gray
Write-Host "   • Check console for any errors" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Tip: Keep this window open to see server status" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
