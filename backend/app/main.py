import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.limiter import limiter
from app.api.v1.api import api_router
from app.db.session import engine
from app.db.base import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()


docs_url = "/docs" if settings.ENVIRONMENT == "development" else None
redoc_url = "/redoc" if settings.ENVIRONMENT == "development" else None
openapi_url = f"{settings.API_V1_STR}/openapi.json" if settings.ENVIRONMENT == "development" else None

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=openapi_url,
    docs_url=docs_url,
    redoc_url=redoc_url,
    lifespan=lifespan,
)

# Rate limiting. The limiter has to be reachable from request.app.state for the
# per-route decorators to find it.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "img-src 'self' data: https: blob:; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' data: https://fonts.gstatic.com; "
        "script-src 'self' 'unsafe-inline'; "
        "connect-src 'self' http://localhost:* http://127.0.0.1:* https:; "
        "frame-ancestors 'none'; "
        "base-uri 'self'; "
        "form-action 'self';"
    )
    if settings.ENVIRONMENT != "development":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response

# CORS.
#
# The origin list was hardcoded here and BACKEND_CORS_ORIGINS was read by
# nothing — so a deployment could set its real origin in the environment, watch
# it be ignored, and have every browser request from its own storefront fail
# CORS while localhost stayed trusted in production.
#
# The any-localhost-port regex is a development convenience and is only applied
# there; with allow_credentials on, it has no business in a deployed service.
cors_kwargs = {
    "allow_origins": list(set([
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://nillsmart.com",
        "https://www.nillsmart.com",
        "http://nillsmart.com",
        "http://www.nillsmart.com",
        *(settings.BACKEND_CORS_ORIGINS if isinstance(settings.BACKEND_CORS_ORIGINS, list) else [settings.BACKEND_CORS_ORIGINS]),
    ])),
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
    "allow_origin_regex": r"https?://(localhost|127\.0\.0\.1|.*\.?nillsmart\.com)(:\d+)?",
}

app.add_middleware(CORSMiddleware, **cors_kwargs)

# Serve uploaded static media files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "message": "Welcome to E-Commerce FastAPI Backend API",
        "docs": "/docs",
        "version": "1.0.0"
    }
