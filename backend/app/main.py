import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.core.db import engine, Base, SessionLocal
from app.core.security import hash_password
from app.models.models import User
from app.api.auth import router as auth_router
from app.api.admin import router as admin_router
from app.api.quizzes import router as quizzes_router, seed_default_quizzes
from app.api.websocket import router as ws_router

def migrate_and_seed_admin(db):
    """Ensure database schema is up to date and at least one administrator account exists."""
    # 1. SQLite schema auto-migration for users table
    try:
        with engine.connect() as conn:
            columns_result = conn.execute(text("PRAGMA table_info(users)"))
            existing_columns = [row[1] for row in columns_result.fetchall()]

            if "role" not in existing_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'teacher'"))
            if "is_active" not in existing_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1"))
            if "status" not in existing_columns:
                conn.execute(text("ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active'"))
            conn.commit()
    except Exception as e:
        print(f"[Migration Warning] Auto-migration check: {e}")

    # 2. Promote primary account or seed default admin
    try:
        # Check if any admin exists
        admin_user = db.query(User).filter(User.role == "admin").first()
        if not admin_user:
            # Check if Pheaktra user exists
            pheaktra = db.query(User).filter(User.username.ilike("pheaktra")).first()
            if pheaktra:
                pheaktra.role = "admin"
                pheaktra.status = "active"
                pheaktra.is_active = 1
                db.commit()
                print(f"[Admin Init] Promoted '{pheaktra.username}' to Administrator.")

            # Create default admin account if 'admin' username not taken
            existing_admin_name = db.query(User).filter(User.username == "admin").first()
            if not existing_admin_name:
                default_admin = User(
                    username="admin",
                    email="admin@zenquiz.com",
                    hashed_password=hash_password("admin123"),
                    role="admin",
                    is_active=1,
                    status="active"
                )
                db.add(default_admin)
                db.commit()
                print("[Admin Init] Default administrator account created: username='admin' password='admin123'")
    except Exception as e:
        print(f"[Admin Init Warning] Could not seed admin user: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables, migrate schema, seed admin & default quizzes
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        migrate_and_seed_admin(db)
        seed_default_quizzes(db)
    except Exception as e:
        print(f"[Seed Warning] Could not seed database: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title="Zen_Quiz API",
    description="Real-time Chinese learning quiz platform API with Admin Management",
    version="1.1.0",
    lifespan=lifespan
)

# Configure CORS
origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
if "*" in origins or not origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include Routers
app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(quizzes_router)
app.include_router(ws_router)

@app.get("/")
def read_root():
    return {"app": "Zen_Quiz API", "status": "online", "docs": "/docs"}
