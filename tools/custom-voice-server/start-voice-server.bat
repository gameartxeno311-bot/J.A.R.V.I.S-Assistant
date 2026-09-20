@echo off
cd /d "%~dp0"
if not exist ".venv" (
  python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install --disable-pip-version-check -q -r requirements.txt
echo Starting the custom voice server on http://127.0.0.1:5002 ...
python server.py
pause
