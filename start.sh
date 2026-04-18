#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

VITE_PORT="${APP_PORT:-3000}"
BACKEND_PORT=$((VITE_PORT + 100))

if [ -f /usr/local/lib/workshop-devguard.sh ]; then
    source /usr/local/lib/workshop-devguard.sh
    devguard_acquire "$VITE_PORT" "$BACKEND_PORT"
fi

# Ensure Python deps
if [ ! -d ".venv" ]; then
    uv sync
fi

# Start backend
echo "Starting backend on port $BACKEND_PORT..."
uv run uvicorn backend.app:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload &
BACKEND_PID=$!

# Install frontend deps if needed
if [ ! -d "frontend/node_modules" ]; then
    cd frontend && npm install && cd ..
fi

# Start frontend
echo "Starting frontend on port $VITE_PORT..."
cd frontend
VITE_PORT=$VITE_PORT npx vite --host 0.0.0.0 --port "$VITE_PORT" --strictPort &
FRONTEND_PID=$!
cd ..

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
