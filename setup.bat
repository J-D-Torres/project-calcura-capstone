@REM Jonathan Torres wrote 22 lines of code for this file
@echo off
echo === Calcura Project Setup ===
echo.

:: Frontend setup
echo [1/3] Installing frontend dependencies...
call npm install

:: Backend setup
echo [2/3] Setting up Python virtual environment...
python -m venv .venv
call .venv\Scripts\activate.bat

echo [3/3] Installing backend dependencies...
pip install -r requirements.txt

echo.
echo === Setup Complete. Starting application... ===
echo.

:: Start backend in a separate window
echo Starting backend on http://localhost:8000 ...
:: Modified by Jonathan Torres: renamed testapp -> main
start "Calcura Backend" cmd /k "call .venv\Scripts\activate.bat && uvicorn main:app --reload"

:: Start frontend (blocks until Ctrl+C)
echo Starting frontend on http://localhost:3000 ...
call npm run dev

:: When frontend exits, stop backend
echo Shutting down backend...
taskkill /FI "WINDOWTITLE eq Calcura Backend" /F >nul 2>&1
echo Done.
