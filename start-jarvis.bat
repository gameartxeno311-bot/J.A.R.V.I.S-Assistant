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
  > .env echo DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db
  echo [INFO] A default PostgreSQL connection was created in .env.
  echo [INFO] If your PostgreSQL username, password, port, or database differ, edit .env before continuing.
)

if not exist "node_modules" (
  echo Installing dependencies with npm install ...
  call npm install
  if errorlevel 1 goto :fail
)

echo.
echo Checking DATABASE_URL and PostgreSQL connection ...
node -e "require('dotenv').config(); const {Client}=require('pg'); const u=process.env.DATABASE_URL; if(!u){console.error('[ERROR] DATABASE_URL is missing from .env');process.exit(2)}; let c=new Client({connectionString:u,connectionTimeoutMillis:5000}); c.connect().then(()=>{console.log('[OK] PostgreSQL connection successful.');return c.end()}).catch(e=>{console.error('[ERROR] PostgreSQL connection failed: '+e.message);console.error('[INFO] DATABASE_URL='+u.replace(/:[^:@/]+@/,'://***@'));process.exit(1)})"
if errorlevel 1 (
  echo.
  echo [ERROR] PostgreSQL is not reachable with the DATABASE_URL in .env.
  echo [INFO] Start PostgreSQL and verify the database, username, password, host, and port in .env.
  echo [INFO] Example: DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/app_db
  goto :fail
)

echo.
echo Syncing database schema ...
call npx drizzle-kit push --config=drizzle.config.ts
if errorlevel 1 (
  echo [ERROR] Database schema sync failed after a successful connection test.
  echo [INFO] Check the Drizzle schema/migration output above.
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
echo [ERROR] Setup or validation failed. Scroll up for the exact error.
pause
exit /b 1
