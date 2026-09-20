@echo off
setlocal
cd /d "%~dp0"
title J.A.R.V.I.S XTTS-v2 Voice Server
where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Python was not found on PATH.
  echo [INFO] Install Python 3.10 or 3.11 and enable Add Python to PATH.
  pause
  exit /b 1
)
if not exist ".venv" (
  echo Creating XTTS virtual environment...
  python -m venv .venv
  if errorlevel 1 goto :fail
)
call ".venv\Scripts\activate.bat"
if errorlevel 1 goto :fail
python -m pip install --disable-pip-version-check --upgrade pip
if errorlevel 1 goto :fail
python -m pip install --disable-pip-version-check -r requirements.txt
if errorlevel 1 goto :fail
echo.
echo Starting Coqui XTTS-v2 on http://127.0.0.1:5002 ...
echo Keep this window open while J.A.R.V.I.S. is using custom TTS.
echo.
python server.py
goto :eof
:fail
echo.
echo [ERROR] XTTS-v2 setup failed.
pause
exit /b 1
