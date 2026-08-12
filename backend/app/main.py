import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.db import engine, Base, SessionLocal
from app.api.auth import router as auth_router
from app.api.quizzes import router as quizzes_router, seed_default_quizzes
from app.api.websocket import router as ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables & seed default quizzes if database is fresh
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_default_quizzes(db)
    except Exception as e:
        print(f"[Seed Warning] Could not seed default quizzes: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title="Zen_Quiz API",
    description="Real-time Chinese learning quiz platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(quizzes_router)
app.include_router(ws_router)

@app.get("/")
def read_root():
    return {"app": "Zen_Quiz API", "status": "online", "docs": "/docs"}
