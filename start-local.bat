@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
title STYLIO - Local Runner
cd /d "%~dp0"

echo ==================================================
echo   STYLIO - poori app ek saath localhost par
echo ==================================================
echo.

:: ---------- 1. Prerequisites ----------
set "MISSING="
where node >nul 2>nul || set "MISSING=%MISSING% Node.js"
where python >nul 2>nul || set "MISSING=%MISSING% Python"
where docker >nul 2>nul && set "HAS_DOCKER=1"
if defined MISSING (
    echo [ERROR] Ye install nahi hain: %MISSING%
    echo         Inhe pehle install karke dobara run karo.
    pause
    exit /b 1
)

:: ---------- 2. MongoDB check / auto-start ----------
set "MONGO_UP=0"
python -c "import socket; s=socket.socket(); s.settimeout(2); s.connect(('127.0.0.1',27017)); s.close()" >nul 2>nul
if errorlevel 1 goto :mongo_down
set "MONGO_UP=1"
echo [OK]  MongoDB localhost:27017 par chal raha hai.
goto :mongo_done

:mongo_down
echo [WARN] MongoDB port 27017 par nahi mila.
if defined HAS_DOCKER (
    echo        Docker detect hua - MongoDB container start kar rahe hain...
    docker info >nul 2>nul || (echo        Docker daemon chalu nahi hai. Docker Desktop kholo.) 
    docker ps -a --format "{{.Names}}" | findstr /i "stylio-mongo" >nul 2>nul
    if errorlevel 1 (
        docker run -d --name stylio-mongo -p 27017:27017 mongo:6 >nul 2>nul && set "MONGO_UP=1"
    ) else (
        docker start stylio-mongo >nul 2>nul && set "MONGO_UP=1"
    )
    if "!MONGO_UP!"=="1" echo    [OK]  MongoDB container start ho gaya.
)
if "!MONGO_UP!"=="0" (
    echo        MongoDB nahi chala. Backend baad mein retry karega.
    echo        Chalo hum baqi services phir bhi start karte hain.
)
:mongo_done

:: ---------- 3. Install dependencies (pehli baar) ----------
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    npm --prefix backend install --no-audit --no-fund
)
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    npm --prefix frontend install --no-audit --no-fund
)

:: ---------- 4. Seed catalog agar MongoDB up ho ----------
if "%MONGO_UP%"=="1" (
    echo Seeding catalog check kiya jaa raha hai...
    npm --prefix backend run seed -- --if-empty
)

:: ---------- 5. Launch all three services ----------
echo.
echo Starting services...

start "STYLIO ML (8000)" cmd /k "cd /d %~dp0ml-service && python -m uvicorn --version >nul 2>nul || python -m pip install -r requirements.txt && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

start "STYLIO Backend (5000)" cmd /k "cd /d %~dp0backend && npm run dev"

start "STYLIO Frontend (5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ==================================================
echo    App kholo:        http://localhost:5173
echo    Backend health:   http://localhost:5000/api/health
echo    ML API docs:      http://localhost:8000/docs
echo.
echo    Ek baar models download honge (pehli baar thoda
echo    time lagta hai). Har service apni window mein
echo    chal rahi hai - window band karo to service band.
echo ==================================================
pause