#!/bin/bash
#Jonathan Torres wrote 25 lines of code for this file
set -e

echo "=== Calcura Production Deploy ==="
echo ""

echo "[1/4] Installing frontend dependencies..."
npm ci

echo "[2/4] Building frontend..."
chmod +x node_modules/.bin/*
npm run build

echo "[3/4] Setting up Python virtual environment..."
python3 -m venv .venv
source .venv/bin/activate

echo "[4/4] Installing backend dependencies..."
pip install -r requirements.txt

echo ""
echo "=== Build Complete. Starting application on http://0.0.0.0:8000 ==="
echo ""

exec uvicorn main:app --host 0.0.0.0 --port 8000
