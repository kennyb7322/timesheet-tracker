"""FastAPI application — UCS Rides backend (Uber/Lyft-style rideshare + time-hire)."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.database import init_db
from backend.routes_auth import router as auth_router
from backend.routes_rides import router as rides_router
from backend.routes_drivers import router as drivers_router
from backend.routes_payments import router as payments_router

app = FastAPI(title="UCS Rides API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(rides_router)
app.include_router(drivers_router)
app.include_router(payments_router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/health")
def api_health():
    return {"status": "ok", "service": "ucs-rides"}


@app.on_event("startup")
def on_startup():
    init_db()


# Serve built frontend in production
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
