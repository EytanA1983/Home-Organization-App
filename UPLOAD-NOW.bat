@echo off
chcp 65001 > nul
cls

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  📤 Upload Project to GitHub                              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"
echo 📁 Project directory: %CD%
echo.

echo 🎯 Target: https://github.com/EytanA1983/my-jb-exercise
echo.

echo ═══════════════════════════════════════════════════════════
echo Step 1: Initialize Git Repository
echo ═══════════════════════════════════════════════════════════
echo.

if not exist ".git" (
    echo Initializing Git...
    git init
    echo ✅ Git initialized
) else (
    echo ✅ Git already initialized
)
echo.

echo ═══════════════════════════════════════════════════════════
echo Step 2: Configure Remote
echo ═══════════════════════════════════════════════════════════
echo.

git remote remove origin 2>nul
git remote add origin https://github.com/EytanA1983/my-jb-exercise.git
echo ✅ Remote configured
echo.

echo ═══════════════════════════════════════════════════════════
echo Step 3: Add Files
echo ═══════════════════════════════════════════════════════════
echo.

git add .
echo ✅ Files added
echo.

echo ═══════════════════════════════════════════════════════════
echo Step 4: Create Commit
echo ═══════════════════════════════════════════════════════════
echo.

git commit -m "feat: home organization app - complete project" -m "" -m "- Backend: FastAPI with PostgreSQL" -m "- Frontend: React + TypeScript + Vite" -m "- Features: Rooms, Tasks, Calendar, Voice input" -m "- Security: VAPID encryption, Audit logging" -m "- DevOps: Docker, K8s, Monitoring" -m "" -m "Project: אלי מאור - סידור וארגון הבית"
echo ✅ Commit created
echo.

echo ═══════════════════════════════════════════════════════════
echo Step 5: Push to GitHub
echo ═══════════════════════════════════════════════════════════
echo.
echo ⚠️  IMPORTANT: You'll need to authenticate with GitHub
echo.
echo 💡 Credentials:
echo    Username: EytanA1983
echo    Password: USE YOUR PERSONAL ACCESS TOKEN (NOT regular password!)
echo.
echo 📝 To create a PAT:
echo    1. Go to: https://github.com/settings/tokens
echo    2. Click "Generate new token (classic)"
echo    3. Select scopes: repo (all)
echo    4. Copy the token and paste it when prompted
echo.
pause
echo.

git branch -M main
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════════╗
    echo ║  ✅ Successfully Uploaded to GitHub!                      ║
    echo ╚════════════════════════════════════════════════════════════╝
    echo.
    echo 🔗 Repository: https://github.com/EytanA1983/my-jb-exercise
    echo.
    echo 📝 Next steps:
    echo    1. Visit: https://github.com/EytanA1983/my-jb-exercise
    echo    2. Review the uploaded files
    echo    3. Delete old exercise folders if needed
    echo    4. Update repository settings and description
    echo.
    start https://github.com/EytanA1983/my-jb-exercise
) else (
    echo.
    echo ❌ Upload failed!
    echo.
    echo 💡 Common solutions:
    echo    1. Make sure you used Personal Access Token, not password
    echo    2. Check token has "repo" permissions
    echo    3. Verify repository exists and you have write access
    echo.
)

echo.
pause
