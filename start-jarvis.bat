@echo off
setlocal
title J.A.R.V.I.S Launcher
cd /d "%~dp0"

echo ============================================
echo   Booting J.A.R.V.I.S ...
echo ============================================

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js was not found on PATH.
  pause
  exit /b 1
)

if not exist ".env" (
  echo Creating default .env ...
  echo DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db> .env
)

if not exist "node_modules" (
  echo Installing dependencies with npm install ...
  call npm install
  if errorlevel 1 goto :fail
)

echo Syncing database schema ...
call npx drizzle-kit push
if errorlevel 1 (
  echo [ERROR] Database schema sync failed. Make sure PostgreSQL is running and DATABASE_URL is correct.
  goto :fail
)

echo Running TypeScript checks ...
call npm run typecheck
if errorlevel 1 goto :fail

echo Running lint ...
call npm run lint
if errorlevel 1 goto :fail

echo Building J.A.R.V.I.S ...
call npm run build
if errorlevel 1 goto :fail

echo Starting server on http://localhost:3000 ...
start "" cmd /c "timeout /t 3 >nul && start http://localhost:3000"
call npm run start
goto :eof

:fail
echo.
echo [ERROR] Setup or validation failed. Scroll up for details.
pause
exit /b 1
