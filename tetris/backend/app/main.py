from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import auth, games, scores
from app.core.config import get_settings
from app.db import models
from app.db.session import Base, engine

settings = get_settings()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    description="테트리스 게임 계정, 기록, 전체 최고점수 API",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router, prefix="/api")
app.include_router(games.router, prefix="/api")
app.include_router(scores.router, prefix="/api")

frontend_dir = Path(__file__).resolve().parents[2] / "frontend"
if frontend_dir.exists():
    app.mount("/assets", StaticFiles(directory=frontend_dir / "assets"), name="assets")


@app.get("/", include_in_schema=False)
def serve_frontend():
    return FileResponse(frontend_dir / "index.html")


@app.get("/game", include_in_schema=False)
def serve_game():
    return FileResponse(frontend_dir / "index.html")


@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok"}
