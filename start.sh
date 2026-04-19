#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

PORT="${APP_PORT:-3000}"

if [ -f /usr/local/lib/workshop-devguard.sh ]; then
    source /usr/local/lib/workshop-devguard.sh
    devguard_acquire "$PORT"
fi

# Ensure Python deps
if [ ! -d ".venv" ]; then
    uv sync
fi

# Build frontend if dist doesn't exist
if [ ! -d "frontend/dist" ]; then
    echo "Building frontend..."
    cd frontend && npm install && npm run build && cd ..
fi

# Pre-warm imports so server starts fast
echo "Warming up..."
uv run python -c "from backend.app import app; print('Ready')"

echo "Starting Timesheet Tracker on port $PORT..."
exec uv run uvicorn backend.app:app --host 0.0.0.0 --port "$PORT"
