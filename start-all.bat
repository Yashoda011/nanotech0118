@echo off
REM NanoSphere one-click starter: backend API + frontend, then opens the app.
cd /d "%~dp0"
echo Starting NanoSphere backend (port 8000)...
start "NanoSphere API" cmd /c "python -m uvicorn backend.app.main:app --port 8000 --host 127.0.0.1"
echo Starting NanoSphere frontend (port 5173)...
start "NanoSphere Web" cmd /c "npm run dev -- --port 5173 --host --strictPort"
echo Waiting for servers...
timeout /t 9 >nul
start http://localhost:5173/
echo Open http://localhost:5173/ in your browser. Keep the two black windows open.
