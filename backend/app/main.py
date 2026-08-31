from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.core.config import settings
from app.db.session import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FastAPI backend for Reddit Copilot - Phase 1 (Reddit OAuth).",
    version="0.2.0",
    lifespan=lifespan,
)

# Set up CORS middleware with credentials support
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Include API routers
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", summary="Root Endpoint")
def read_root():
    return {
        "project": settings.PROJECT_NAME,
        "phase": "Phase 1 - Reddit OAuth",
        "health_check": f"{settings.API_V1_STR}/health",
        "auth_me": f"{settings.API_V1_STR}/auth/me",
        "auth_login": f"{settings.API_V1_STR}/auth/reddit/login",
    }
