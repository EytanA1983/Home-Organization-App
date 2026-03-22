# Setup GitHub Repository Script
# This script initializes git in the project directory and prepares it for GitHub upload

Write-Host "🚀 Setting up GitHub for Home Organization App" -ForegroundColor Cyan
Write-Host ""

# Get the project directory (current script location)
$ProjectRoot = $PSScriptRoot
Write-Host "📁 Project directory: $ProjectRoot" -ForegroundColor Yellow

# Check if .git exists in project root
$GitDir = Join-Path $ProjectRoot ".git"
if (Test-Path $GitDir) {
  Write-Host "✅ Git repository already initialized" -ForegroundColor Green
}
else {
  Write-Host "📦 Initializing git repository..." -ForegroundColor Yellow
  Push-Location $ProjectRoot
  git init
  git branch -M main
  Pop-Location
  Write-Host "✅ Git repository initialized" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 Checking modified files..." -ForegroundColor Yellow

# Navigate to project directory
Push-Location $ProjectRoot

# Show git status
git status --short

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Add all files to staging:" -ForegroundColor Yellow
Write-Host "   git add ." -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Create initial commit:" -ForegroundColor Yellow
Write-Host "   git commit -m 'Initial commit: Home Organization App with FastAPI + React'" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Create a new repository on GitHub:" -ForegroundColor Yellow
Write-Host "   - Go to: https://github.com/new" -ForegroundColor White
Write-Host "   - Repository name: home-organization-eli-maor" -ForegroundColor White
Write-Host "   - Description: אפליקציה לניהול ארגון הבית - FastAPI + React + WebSocket" -ForegroundColor White
Write-Host "   - Public or Private: Your choice" -ForegroundColor White
Write-Host "   - DON'T initialize with README (we already have one)" -ForegroundColor Red
Write-Host ""
Write-Host "4️⃣  Add GitHub as remote (replace YOUR_USERNAME):" -ForegroundColor Yellow
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/home-organization-eli-maor.git" -ForegroundColor White
Write-Host ""
Write-Host "5️⃣  Push to GitHub:" -ForegroundColor Yellow
Write-Host "   git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Quick command to copy for step 4 (after creating GitHub repo):" -ForegroundColor Cyan
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/home-organization-eli-maor.git" -ForegroundColor Green
Write-Host ""

# Return to original directory
Pop-Location

# Pause to allow reading
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
