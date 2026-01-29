# Code Optimization Script
# Automatically fixes common issues and optimizes code

$ProjectRoot = $PSScriptRoot

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ⚡ Code Optimization & Cleanup                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 1. BACKEND OPTIMIZATION
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "📦 BACKEND OPTIMIZATION" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$BackendDir = Join-Path $ProjectRoot "backend"
if (Test-Path $BackendDir) {
    Push-Location $BackendDir

    # 1.1 Remove unused imports
    Write-Host "🧹 1.1 Removing unused imports..." -ForegroundColor Cyan
    try {
        poetry run ruff check --fix --select F401 .
        Write-Host "   ✅ Unused imports removed" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Could not remove unused imports: $_" -ForegroundColor Yellow
    }
    Write-Host ""

    # 1.2 Format code
    Write-Host "🎨 1.2 Formatting Python code..." -ForegroundColor Cyan
    try {
        poetry run ruff format .
        Write-Host "   ✅ Code formatted" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Could not format code: $_" -ForegroundColor Yellow
    }
    Write-Host ""

    # 1.3 Sort imports
    Write-Host "📦 1.3 Sorting imports..." -ForegroundColor Cyan
    try {
        poetry run ruff check --fix --select I .
        Write-Host "   ✅ Imports sorted" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Could not sort imports: $_" -ForegroundColor Yellow
    }
    Write-Host ""

    Pop-Location
} else {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
}

# ============================================================================
# 2. FRONTEND OPTIMIZATION
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "⚛️  FRONTEND OPTIMIZATION" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$FrontendDir = Join-Path $ProjectRoot "frontend"
if (Test-Path $FrontendDir) {
    Push-Location $FrontendDir

    # 2.1 Fix ESLint issues
    Write-Host "🔧 2.1 Auto-fixing ESLint issues..." -ForegroundColor Cyan
    try {
        npm run lint:fix
        Write-Host "   ✅ ESLint issues fixed" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Some ESLint issues could not be auto-fixed" -ForegroundColor Yellow
    }
    Write-Host ""

    # 2.2 Format code
    Write-Host "🎨 2.2 Formatting code with Prettier..." -ForegroundColor Cyan
    try {
        npm run format
        Write-Host "   ✅ Code formatted" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Could not format code: $_" -ForegroundColor Yellow
    }
    Write-Host ""

    # 2.3 Clean build artifacts
    Write-Host "🧹 2.3 Cleaning build artifacts..." -ForegroundColor Cyan
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Host "   ✅ dist/ removed" -ForegroundColor Green
    }
    if (Test-Path "node_modules/.vite") {
        Remove-Item -Recurse -Force "node_modules/.vite"
        Write-Host "   ✅ Vite cache cleared" -ForegroundColor Green
    }
    Write-Host ""

    # 2.4 Optimize images (if script exists)
    Write-Host "🖼️  2.4 Optimizing images..." -ForegroundColor Cyan
    if (Test-Path "scripts/optimize-images.js") {
        try {
            node scripts/optimize-images.js
            Write-Host "   ✅ Images optimized" -ForegroundColor Green
        } catch {
            Write-Host "   ℹ️  No images to optimize or script failed" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   ℹ️  Image optimization script not found" -ForegroundColor Cyan
    }
    Write-Host ""

    Pop-Location
} else {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
}

# ============================================================================
# 3. GENERAL CLEANUP
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "🧹 GENERAL CLEANUP" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

# 3.1 Remove __pycache__
Write-Host "🗑️  3.1 Removing Python cache..." -ForegroundColor Cyan
$pycacheCount = 0
Get-ChildItem -Path $ProjectRoot -Recurse -Directory -Filter "__pycache__" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Recurse -Force $_.FullName
    $pycacheCount++
}
Write-Host "   ✅ Removed $pycacheCount __pycache__ directories" -ForegroundColor Green
Write-Host ""

# 3.2 Remove .pytest_cache
Write-Host "🗑️  3.2 Removing pytest cache..." -ForegroundColor Cyan
$pytestCacheCount = 0
Get-ChildItem -Path $ProjectRoot -Recurse -Directory -Filter ".pytest_cache" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Recurse -Force $_.FullName
    $pytestCacheCount++
}
Write-Host "   ✅ Removed $pytestCacheCount .pytest_cache directories" -ForegroundColor Green
Write-Host ""

# 3.3 Remove .mypy_cache
Write-Host "🗑️  3.3 Removing mypy cache..." -ForegroundColor Cyan
$mypyCacheCount = 0
Get-ChildItem -Path $ProjectRoot -Recurse -Directory -Filter ".mypy_cache" -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -Recurse -Force $_.FullName
    $mypyCacheCount++
}
Write-Host "   ✅ Removed $mypyCacheCount .mypy_cache directories" -ForegroundColor Green
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✅ Optimization Complete!                                 ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run tests: .\TEST-ALL.ps1" -ForegroundColor White
Write-Host "   2. Build frontend: cd frontend && npm run build" -ForegroundColor White
Write-Host "   3. Start servers: .\RUN-SERVERS.ps1" -ForegroundColor White
Write-Host ""
