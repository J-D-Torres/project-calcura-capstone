#!/bin/bash
#Jonathan Torres wrote 36 lines of code for this file
set -e

echo "=== Calcura Project Setup ==="
echo ""

# Frontend setup
echo "[1/4] Installing frontend dependencies..."
npm install

echo "[2/4] Fixing binary permissions..."
chmod +x node_modules/.bin/*

# Backend setup
echo "[3/4] Setting up Python virtual environment..."
python3 -m venv .venv
source .venv/bin/activate

echo "[4/4] Installing backend dependencies..."
pip install -r requirements.txt

echo ""
echo "=== Setup Complete. Starting application... ==="
echo ""

# Start backend in background
echo "Starting backend on http://localhost:8000 ..."
# Modified by Jonathan Torres: renamed testapp -> main
uvicorn main:app --reload &
BACKEND_PID=$!

# Start frontend in foreground
echo "Starting frontend on http://localhost:3000 ..."
npm run dev

# When frontend exits, stop backend
kill $BACKEND_PID 2>/dev/null
