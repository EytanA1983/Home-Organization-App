# Commit All Changes Script
# This script adds all changes and creates a commit

Write-Host "📝 Committing all changes..." -ForegroundColor Cyan
Write-Host ""

# Get the project directory
$ProjectRoot = $PSScriptRoot
Push-Location $ProjectRoot

# Check if git is initialized
if (!(Test-Path ".git")) {
    Write-Host "❌ Git repository not initialized!" -ForegroundColor Red
    Write-Host "   Run SETUP-GITHUB.ps1 first" -ForegroundColor Yellow
    Pop-Location
    exit 1
}

# Show current status
Write-Host "📊 Current status:" -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "➕ Adding all files..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "📝 Creating commit..." -ForegroundColor Yellow
$commitMessage = "feat: Add complete home organization app

Features:
- FastAPI backend with authentication, rooms, tasks, categories
- React frontend with Tailwind CSS and dark mode
- WebSocket support for real-time updates
- Push notifications (Web Push)
- JWT refresh tokens with revocation
- Rate limiting and brute-force protection
- Audit logging for all CRUD operations
- Google OAuth2 with PKCE
- Content Security Policy (CSP)
- VAPID key encryption
- Comprehensive test suite (pytest + Cypress)
- Docker Compose setup for development
- Kubernetes manifests for production
- Prometheus + Grafana observability
- Image optimization and lazy loading
- PWA support with service worker
- i18n support (Hebrew)
- Accessibility (WCAG AA compliant)
- Performance optimizations (esbuild, HTTP/2 push)

Tech Stack:
- Backend: Python 3.12, FastAPI, SQLAlchemy, PostgreSQL, Redis, Celery
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, React Query
- Deployment: Docker, Kubernetes, Helm, NGINX
"

git commit -m $commitMessage

Write-Host ""
Write-Host "✅ Commit created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Commit info:" -ForegroundColor Yellow
git log --oneline -1

Write-Host ""
Write-Host "🚀 Ready to push to GitHub!" -ForegroundColor Cyan
Write-Host "   Run: git push -u origin main" -ForegroundColor Green

Pop-Location
