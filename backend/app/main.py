from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.core.config import get_settings
from backend.app.core.logging import logger
from backend.app.database.database import init_db
from backend.app.api.routes import chat_router, models_router, metrics_router, health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    settings = get_settings()
    logger.info(f"Starting {settings.app_name} (Environment: {settings.environment})")
    logger.info(f"Active Model Provider: {settings.active_provider.upper()}")
    # Initialize SQLite tables
    await init_db()
    yield
    logger.info(f"Shutting down {settings.app_name}")


settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    description="ML-Based Dynamic LLM Routing & Cascading Gateway",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for React/Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api/v1
app.include_router(chat_router, prefix="/api/v1")
app.include_router(models_router, prefix="/api/v1")
app.include_router(metrics_router, prefix="/api/v1")
app.include_router(health_router, prefix="/api/v1")

# Also mount under /v1 for direct standard compatibility
app.include_router(chat_router, prefix="/v1")
app.include_router(models_router, prefix="/v1")
app.include_router(metrics_router, prefix="/v1")
app.include_router(health_router, prefix="/v1")


@app.get("/")
async def root():
    return {
        "service": settings.app_name,
        "version": "1.0.0",
        "active_provider": settings.active_provider,
        "docs_url": "/docs",
        "health_url": "/api/v1/health",
        "chat_url": "/api/v1/chat",
        "metrics_url": "/api/v1/metrics",
    }
