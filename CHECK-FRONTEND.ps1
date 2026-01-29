# Frontend Health Check Script
# בודק את תקינות הפרונט

Write-Host "`n=== Frontend Health Check ===" -ForegroundColor Green
Write-Host ""

# 1. Check if we're in the right directory
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendPath = Join-Path $projectRoot "frontend"

if (-not (Test-Path $frontendPath)) {
    Write-Host "ERROR: frontend directory not found!" -ForegroundColor Red
    Write-Host "Expected: $frontendPath" -ForegroundColor Yellow
    exit 1
}

Write-Host "[1/6] Checking directory structure..." -ForegroundColor Cyan
Set-Location $frontendPath

# 2. Check essential files
Write-Host "[2/6] Checking essential files..." -ForegroundColor Cyan
$essentialFiles = @(
    "package.json",
    "vite.config.ts",
    "index.html",
    "src/main.tsx",
    "src/App.tsx",
    "src/index.css"
)

$missingFiles = @()
foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file MISSING!" -ForegroundColor Red
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "`nERROR: Missing essential files!" -ForegroundColor Red
    exit 1
}

# 3. Check node_modules
Write-Host "`n[3/6] Checking dependencies..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "  ✓ node_modules exists" -ForegroundColor Green
    
    $requiredPackages = @("react", "react-dom", "react-router-dom", "vite", "i18next", "react-i18next")
    $missingPackages = @()
    foreach ($pkg in $requiredPackages) {
        if (Test-Path "node_modules\$pkg") {
            Write-Host "  ✓ $pkg" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $pkg MISSING!" -ForegroundColor Red
            $missingPackages += $pkg
        }
    }
    
    if ($missingPackages.Count -gt 0) {
        Write-Host "`nWARNING: Missing packages. Run: npm install" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ node_modules NOT FOUND!" -ForegroundColor Red
    Write-Host "  Run: npm install" -ForegroundColor Yellow
}

# 4. Check i18n files
Write-Host "`n[4/6] Checking i18n files..." -ForegroundColor Cyan
$i18nFiles = @(
    "src/i18n/config.ts",
    "src/i18n/locales/he.json",
    "src/i18n/locales/en.json",
    "src/i18n/locales/ru.json"
)

foreach ($file in $i18nFiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file MISSING!" -ForegroundColor Red
    }
}

# 5. Check pages
Write-Host "`n[5/6] Checking pages..." -ForegroundColor Cyan
$pages = @(
    "src/pages/LoginPage.tsx",
    "src/pages/RegisterPage.tsx",
    "src/pages/HomePage.tsx",
    "src/pages/RoomPage.tsx",
    "src/pages/CalendarPage.tsx"
)

foreach ($page in $pages) {
    if (Test-Path $page) {
        Write-Host "  ✓ $page" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $page MISSING!" -ForegroundColor Red
    }
}

# 6. Check Vite config
Write-Host "`n[6/6] Checking Vite configuration..." -ForegroundColor Cyan
if (Test-Path "vite.config.ts") {
    $viteConfig = Get-Content "vite.config.ts" -Raw
    if ($viteConfig -match "port:\s*3000") {
        Write-Host "  ✓ Port configured: 3000" -ForegroundColor Green
    }
    if ($viteConfig -match "proxy") {
        Write-Host "  ✓ Proxy configured" -ForegroundColor Green
    }
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Green
Write-Host "Frontend path: $frontendPath" -ForegroundColor Gray
Write-Host "`nTo start the frontend:" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host "`nThen open: http://localhost:3000" -ForegroundColor Green
Write-Host ""
