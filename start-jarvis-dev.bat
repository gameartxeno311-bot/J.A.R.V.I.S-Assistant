@echo off
REM Quick dev-mode launcher (hot reload, no production build) for J.A.R.V.I.S.
setlocal
title J.A.R.V.I.S (dev mode)
cd /d "%~dp0"

if not exist ".env" (
  echo DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/app_db> .env
)

if not exist "node_modules" (
  call npm install
)

call npx drizzle-kit push

start "" cmd /c "timeout /t 3 >nul && start http://localhost:3000"
call npm run dev
