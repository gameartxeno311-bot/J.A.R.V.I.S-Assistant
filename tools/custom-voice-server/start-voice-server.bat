@echo off
cd /d "%~dp0"
if not exist ".venv" python -m venv .venv
if not exist ".venv\Scripts\activate.bat" (
  echo [ERROR] Could not create the Python virtual environment.
  pause
  exit /b 1
)
call .venv\Scripts\activate.bat
python -m pip install --disable-pip-version-check -q -r requirements.txt
if errorlevel 1 (
  echo [ERROR] Could not install voice server dependencies.
  pause
  exit /b 1
)
if not exist "reference_voice.wav" (
  echo [ERROR] Put a reference clip at "%cd%\reference_voice.wav" or set REFERENCE_VOICE.
  pause
  exit /b 1
)
echo Starting custom voice server on http://127.0.0.1:5002 ...
python server.py
pause
