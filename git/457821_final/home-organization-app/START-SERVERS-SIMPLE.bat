@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo ╔════════════════════════════════════════════════════════════╗
echo ║  🚀 Starting Home Organization App                        ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

echo 📁 Project directory: %CD%
echo.

REM Start Backend
echo 🔧 [1/2] Starting Backend Server...
start "Backend Server" cmd /k "cd /d %CD%\backend && echo Backend Server && python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

echo    ✅ Backend terminal opened
echo    ⏳ Waiting 5 seconds...
timeout /t 5 /nobreak > nul

REM Start Frontend
echo.
echo ⚛️  [2/2] Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d %CD%\frontend && echo Frontend Server && npm run dev"

echo    ✅ Frontend terminal opened
echo    ⏳ Waiting 8 seconds...
timeout /t 8 /nobreak > nul

REM Open browsers
echo.
echo 🌐 Opening browsers...
start http://localhost:5178
timeout /t 2 /nobreak > nul
start http://localhost:8000/docs

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║  ✅ Servers Started Successfully!                         ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo 🔗 URLs:
echo    • Frontend:  http://localhost:5178
echo    • Backend:   http://localhost:8000
echo    • API Docs:  http://localhost:8000/docs
echo.
echo 📝 Notes:
echo    • Both servers are running in separate windows
echo    • Close those windows to stop the servers
echo.
pause
