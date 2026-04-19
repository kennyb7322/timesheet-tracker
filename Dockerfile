# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend
FROM python:3.12-slim
WORKDIR /app

# Install Python dependencies directly (no uv needed in prod)
COPY pyproject.toml ./
RUN pip install --no-cache-dir fastapi uvicorn sqlalchemy aiosqlite openpyxl python-multipart

# Copy app code
COPY backend/ ./backend/
COPY main.py ./

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV PYTHONDONTWRITEBYTECODE=1

# Railway injects PORT env var at runtime
CMD uvicorn backend.app:app --host 0.0.0.0 --port ${PORT:-8080}
