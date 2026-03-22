# Comprehensive Test and Analysis Script
# Tests all aspects of the application for errors, bugs, duplicates, and optimization

$ProjectRoot = $PSScriptRoot
$ErrorCount = 0
$WarningCount = 0

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  🔍 Comprehensive System Test & Analysis                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# 1. BACKEND TESTS
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "📦 BACKEND TESTS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$BackendDir = Join-Path $ProjectRoot "backend"
if (Test-Path $BackendDir) {
    Push-Location $BackendDir

    # 1.1 Python Syntax Check
    Write-Host "🐍 1.1 Python Syntax Check..." -ForegroundColor Cyan
    try {
        $pythonFiles = Get-ChildItem -Recurse -Filter "*.py" | Select-Object -First 5
        $syntaxErrors = 0
        foreach ($file in $pythonFiles) {
            python -m py_compile $file.FullName 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                $syntaxErrors++
                Write-Host "   ❌ Syntax error in: $($file.Name)" -ForegroundColor Red
            }
        }
        if ($syntaxErrors -eq 0) {
            Write-Host "   ✅ No Python syntax errors" -ForegroundColor Green
        } else {
            $ErrorCount += $syntaxErrors
        }
    } catch {
        Write-Host "   ⚠️  Could not check Python syntax: $_" -ForegroundColor Yellow
        $WarningCount++
    }
    Write-Host ""

    # 1.2 Ruff Linting
    Write-Host "🔍 1.2 Ruff Linting..." -ForegroundColor Cyan
    try {
        $ruffOutput = poetry run ruff check . --statistics 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ No ruff errors" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Ruff found issues:" -ForegroundColor Yellow
            $ruffOutput | Select-Object -First 10 | ForEach-Object { Write-Host "      $_" -ForegroundColor Yellow }
            $WarningCount++
        }
    } catch {
        Write-Host "   ⚠️  Ruff not available: $_" -ForegroundColor Yellow
        $WarningCount++
    }
    Write-Host ""

    # 1.3 Check for unused imports
    Write-Host "📦 1.3 Checking for unused imports..." -ForegroundColor Cyan
    try {
        $unusedImports = poetry run ruff check . --select F401 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ No unused imports" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Found unused imports (can be auto-fixed)" -ForegroundColor Yellow
            $WarningCount++
        }
    } catch {
        Write-Host "   ⚠️  Could not check unused imports" -ForegroundColor Yellow
    }
    Write-Host ""

    # 1.4 Check for duplicate code
    Write-Host "🔄 1.4 Checking for duplicate code..." -ForegroundColor Cyan
    $duplicateFiles = Get-ChildItem -Recurse -Filter "*.py" | Group-Object Name | Where-Object { $_.Count -gt 1 }
    if ($duplicateFiles.Count -eq 0) {
        Write-Host "   ✅ No duplicate file names" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Found duplicate file names:" -ForegroundColor Yellow
        $duplicateFiles | ForEach-Object {
            Write-Host "      - $($_.Name) ($($_.Count) files)" -ForegroundColor Yellow
        }
        $WarningCount += $duplicateFiles.Count
    }
    Write-Host ""

    # 1.5 Check dependencies size
    Write-Host "📊 1.5 Checking dependencies..." -ForegroundColor Cyan
    if (Test-Path "pyproject.toml") {
        $deps = Get-Content "pyproject.toml" | Select-String "^\s*\w+\s*=" | Measure-Object
        Write-Host "   📦 Total dependencies: $($deps.Count)" -ForegroundColor Cyan
    }
    Write-Host ""

    Pop-Location
} else {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    $ErrorCount++
}

# ============================================================================
# 2. FRONTEND TESTS
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "⚛️  FRONTEND TESTS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$FrontendDir = Join-Path $ProjectRoot "frontend"
if (Test-Path $FrontendDir) {
    Push-Location $FrontendDir

    # 2.1 TypeScript Check
    Write-Host "📘 2.1 TypeScript Check..." -ForegroundColor Cyan
    if (Test-Path "node_modules") {
        try {
            $tsOutput = npx tsc --noEmit 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ No TypeScript errors" -ForegroundColor Green
            } else {
                Write-Host "   ❌ TypeScript errors found:" -ForegroundColor Red
                $tsOutput | Select-Object -First 15 | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
                $ErrorCount++
            }
        } catch {
            Write-Host "   ⚠️  Could not run TypeScript check: $_" -ForegroundColor Yellow
            $WarningCount++
        }
    } else {
        Write-Host "   ⚠️  node_modules not found. Run: npm install" -ForegroundColor Yellow
        $WarningCount++
    }
    Write-Host ""

    # 2.2 ESLint Check
    Write-Host "🔍 2.2 ESLint Check..." -ForegroundColor Cyan
    if (Test-Path "node_modules") {
        try {
            $eslintOutput = npm run lint 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "   ✅ No ESLint errors" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  ESLint found issues (can be auto-fixed with 'npm run lint:fix')" -ForegroundColor Yellow
                $WarningCount++
            }
        } catch {
            Write-Host "   ⚠️  ESLint check failed: $_" -ForegroundColor Yellow
            $WarningCount++
        }
    }
    Write-Host ""

    # 2.3 Check for duplicate components
    Write-Host "🔄 2.3 Checking for duplicate components..." -ForegroundColor Cyan
    $duplicateComponents = Get-ChildItem -Path "src" -Recurse -Filter "*.tsx" |
        Group-Object Name | Where-Object { $_.Count -gt 1 }
    if ($duplicateComponents.Count -eq 0) {
        Write-Host "   ✅ No duplicate component names" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Found duplicate component names:" -ForegroundColor Yellow
        $duplicateComponents | ForEach-Object {
            Write-Host "      - $($_.Name) ($($_.Count) files)" -ForegroundColor Yellow
            $_.Group | ForEach-Object { Write-Host "        → $($_.FullName -replace [regex]::Escape($FrontendDir), '')" -ForegroundColor Gray }
        }
        $WarningCount += $duplicateComponents.Count
    }
    Write-Host ""

    # 2.4 Bundle Size Analysis
    Write-Host "📊 2.4 Analyzing bundle size..." -ForegroundColor Cyan
    if (Test-Path "dist") {
        $distSize = (Get-ChildItem "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
        Write-Host "   📦 Build size: $([math]::Round($distSize, 2)) MB" -ForegroundColor Cyan

        # Check for large files
        $largeFiles = Get-ChildItem "dist" -Recurse -File |
            Where-Object { $_.Length -gt 500KB } |
            Sort-Object Length -Descending |
            Select-Object -First 5

        if ($largeFiles) {
            Write-Host "   ⚠️  Large files found (>500KB):" -ForegroundColor Yellow
            $largeFiles | ForEach-Object {
                $size = [math]::Round($_.Length / 1KB, 2)
                Write-Host "      - $($_.Name): ${size} KB" -ForegroundColor Yellow
            }
            $WarningCount++
        }
    } else {
        Write-Host "   ⚠️  No build found. Run: npm run build" -ForegroundColor Yellow
        $WarningCount++
    }
    Write-Host ""

    # 2.5 Check unused dependencies
    Write-Host "📦 2.5 Checking for unused dependencies..." -ForegroundColor Cyan
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        $depCount = ($packageJson.dependencies | Get-Member -MemberType NoteProperty).Count
        $devDepCount = ($packageJson.devDependencies | Get-Member -MemberType NoteProperty).Count
        Write-Host "   📦 Dependencies: $depCount" -ForegroundColor Cyan
        Write-Host "   🛠️  Dev Dependencies: $devDepCount" -ForegroundColor Cyan
        Write-Host "   💡 Total: $($depCount + $devDepCount) packages" -ForegroundColor Cyan
    }
    Write-Host ""

    # 2.6 Check for unused CSS
    Write-Host "🎨 2.6 Checking CSS..." -ForegroundColor Cyan
    $cssFiles = Get-ChildItem -Path "src" -Recurse -Filter "*.css"
    Write-Host "   📄 CSS files: $($cssFiles.Count)" -ForegroundColor Cyan
    Write-Host ""

    Pop-Location
} else {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    $ErrorCount++
}

# ============================================================================
# 3. GENERAL FILE ANALYSIS
# ============================================================================

Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "📁 GENERAL FILE ANALYSIS" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

# 3.1 Check for large files
Write-Host "📦 3.1 Checking for large files (>1MB)..." -ForegroundColor Cyan
$largeFiles = Get-ChildItem -Path $ProjectRoot -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Length -gt 1MB -and $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*.git*" -and $_.FullName -notlike "*dist*" } |
    Sort-Object Length -Descending |
    Select-Object -First 5

if ($largeFiles) {
    Write-Host "   ⚠️  Large files found:" -ForegroundColor Yellow
    $largeFiles | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        $relativePath = $_.FullName -replace [regex]::Escape($ProjectRoot), ''
        Write-Host "      - ${size} MB: $relativePath" -ForegroundColor Yellow
    }
    $WarningCount++
} else {
    Write-Host "   ✅ No unusually large files" -ForegroundColor Green
}
Write-Host ""

# 3.2 Check for duplicate documentation
Write-Host "📚 3.2 Checking for duplicate documentation..." -ForegroundColor Cyan
$mdFiles = Get-ChildItem -Path $ProjectRoot -Recurse -Filter "*.md" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notlike "*node_modules*" }
$duplicateDocs = $mdFiles | Group-Object Name | Where-Object { $_.Count -gt 1 }

if ($duplicateDocs) {
    Write-Host "   ⚠️  Duplicate documentation files:" -ForegroundColor Yellow
    $duplicateDocs | Select-Object -First 5 | ForEach-Object {
        Write-Host "      - $($_.Name) ($($_.Count) copies)" -ForegroundColor Yellow
    }
    $WarningCount++
} else {
    Write-Host "   ✅ No duplicate documentation" -ForegroundColor Green
}
Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📊 TEST SUMMARY                                           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if ($ErrorCount -eq 0 -and $WarningCount -eq 0) {
    Write-Host "✅ All tests passed! No errors or warnings found." -ForegroundColor Green
    Write-Host "🚀 Application is optimized and ready for production." -ForegroundColor Green
} else {
    if ($ErrorCount -gt 0) {
        Write-Host "❌ Errors found: $ErrorCount" -ForegroundColor Red
    }
    if ($WarningCount -gt 0) {
        Write-Host "⚠️  Warnings found: $WarningCount" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "💡 Recommendations:" -ForegroundColor Cyan
    Write-Host "   1. Fix TypeScript errors: cd frontend && npx tsc --noEmit" -ForegroundColor White
    Write-Host "   2. Auto-fix linting: cd frontend && npm run lint:fix" -ForegroundColor White
    Write-Host "   3. Remove unused imports: cd backend && poetry run ruff check --fix ." -ForegroundColor White
    Write-Host "   4. Optimize bundle: cd frontend && npm run build:analyze" -ForegroundColor White
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Test completed at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Return exit code based on errors
exit $ErrorCount
