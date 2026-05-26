# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Stage 2: Python backend
FROM python:3.12-slim
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install Python deps with pinned, known-good versions
RUN pip install --upgrade pip && \
    pip install \
        "fastapi>=0.110" \
        "uvicorn[standard]>=0.27" \
        "sqlalchemy>=2.0" \
        "aiosqlite>=0.19" \
        "openpyxl>=3.1" \
        "python-multipart>=0.0.9"

# Copy app code
COPY backend/ ./backend/

# Copy built frontend from stage 1
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Persistent data dir for SQLite
RUN mkdir -p /app/data

# Railway sets PORT env var at runtime; default to 8080 locally
ENV PORT=8080
EXPOSE 8080

# Shell form so $PORT expands at runtime
CMD python -m uvicorn backend.app:app --host 0.0.0.0 --port $PORT
