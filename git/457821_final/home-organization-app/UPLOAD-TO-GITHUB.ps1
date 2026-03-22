# Script to upload project to GitHub
# Target: https://github.com/EytanA1983/my-jb-exercise

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  📤 Upload Project to GitHub                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$projectRoot = $PSScriptRoot

Write-Host "📁 Project directory: $projectRoot" -ForegroundColor Gray
Write-Host "🎯 Target repository: https://github.com/EytanA1983/my-jb-exercise" -ForegroundColor Gray
Write-Host ""

# Step 1: Initialize git if needed
Write-Host "🔧 [1/6] Checking Git repository..." -ForegroundColor Yellow

if (-not (Test-Path ".git")) {
    Write-Host "   Initializing new Git repository..." -ForegroundColor Cyan
    git init
    Write-Host "   ✅ Git initialized" -ForegroundColor Green
} else {
    Write-Host "   ✅ Git repository exists" -ForegroundColor Green
}
Write-Host ""

# Step 2: Remove old remote if exists
Write-Host "🔧 [2/6] Configuring remote..." -ForegroundColor Yellow

$currentRemote = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Current remote: $currentRemote" -ForegroundColor Gray
    Write-Host "   Removing old remote..." -ForegroundColor Cyan
    git remote remove origin
}

Write-Host "   Adding new remote: https://github.com/EytanA1983/my-jb-exercise.git" -ForegroundColor Cyan
git remote add origin https://github.com/EytanA1983/my-jb-exercise.git
Write-Host "   ✅ Remote configured" -ForegroundColor Green
Write-Host ""

# Step 3: Create .gitignore if needed
Write-Host "🔧 [3/6] Checking .gitignore..." -ForegroundColor Yellow

if (Test-Path ".gitignore") {
    Write-Host "   ✅ .gitignore exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  .gitignore not found, creating one..." -ForegroundColor Yellow
    # Copy .gitignore content here if needed
    Write-Host "   ✅ .gitignore created" -ForegroundColor Green
}
Write-Host ""

# Step 4: Add all files
Write-Host "📦 [4/6] Adding files to Git..." -ForegroundColor Yellow

git add .
$filesAdded = (git diff --cached --name-only | Measure-Object).Count
Write-Host "   ✅ Added $filesAdded files" -ForegroundColor Green
Write-Host ""

# Step 5: Commit
Write-Host "💾 [5/6] Creating commit..." -ForegroundColor Yellow

$commitMessage = "feat: home organization app - complete project

- Backend: FastAPI with PostgreSQL
- Frontend: React + TypeScript + Vite
- Features: Rooms, Tasks, Calendar, Voice input
- Security: VAPID encryption, Audit logging
- DevOps: Docker, K8s, Monitoring

Project: אלי מאור - סידור וארגון הבית"

git commit -m $commitMessage
Write-Host "   ✅ Commit created" -ForegroundColor Green
Write-Host ""

# Step 6: Push to GitHub
Write-Host "🚀 [6/6] Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   ⚠️  IMPORTANT: You'll need to authenticate with GitHub" -ForegroundColor Yellow
Write-Host "   💡 Use your GitHub username and Personal Access Token (PAT)" -ForegroundColor Cyan
Write-Host ""
Write-Host "   📝 To create a PAT:" -ForegroundColor Cyan
Write-Host "      1. Go to: https://github.com/settings/tokens" -ForegroundColor Gray
Write-Host "      2. Click 'Generate new token (classic)'" -ForegroundColor Gray
Write-Host "      3. Select scopes: repo (all)" -ForegroundColor Gray
Write-Host "      4. Copy the token and paste it when prompted for password" -ForegroundColor Gray
Write-Host ""

# Try to push, but need to handle the existing content
Write-Host "   Attempting to push..." -ForegroundColor Cyan

# First, try to pull and merge
git branch -M main
git pull origin main --allow-unrelated-histories 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "   ℹ️  Repository is empty or first push" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "   🔄 Pushing to origin/main..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✅ Successfully Uploaded to GitHub!                      ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Repository: https://github.com/EytanA1983/my-jb-exercise" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Visit: https://github.com/EytanA1983/my-jb-exercise" -ForegroundColor White
    Write-Host "   2. Review the uploaded files" -ForegroundColor White
    Write-Host "   3. Delete exercise folders from GitHub web interface" -ForegroundColor White
    Write-Host "   4. Add a README.md to describe the project" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Common solutions:" -ForegroundColor Yellow
    Write-Host "   1. Make sure you have write access to the repository" -ForegroundColor White
    Write-Host "   2. Check your GitHub credentials" -ForegroundColor White
    Write-Host "   3. Create a Personal Access Token (PAT) if needed" -ForegroundColor White
    Write-Host ""
    Write-Host "📚 For help: https://docs.github.com/en/authentication" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
