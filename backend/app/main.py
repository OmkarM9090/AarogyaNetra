"""AarogyaNetra API — FastAPI application entry point.

Run locally:
    uvicorn app.main:app --reload

- Startup: JSON logging, MongoDB (with retries) + indexes, model loading.
- Unified envelope for every response (success + error shapes).
- Request-id + timing middleware (JSON logs).
"""
from __future__ import annotations

import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from app.api.v1.router import api_v1_router
from app.core.config import get_settings
from app.core.database import close_mongo, connect_mongo
from app.core.envelope import (
    ERR_INTERNAL,
    ERR_VALIDATION,
    ApiError,
    error,
)
from app.core.logging_config import request_id_var, setup_logging
from app.ml.model_registry import get_registry

logger = logging.getLogger("aarogyanetra.api")


def create_app() -> FastAPI:
    settings = get_settings()
    setup_logging(logging.DEBUG if settings.debug else logging.INFO)

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs" if settings.debug else None,
        redoc_url=None,
        openapi_url="/openapi.json" if settings.debug else None,
    )

    # ── CORS ────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Startup / shutdown ──────────────────────────────────────────
    @app.on_event("startup")
    async def startup() -> None:
        logger.info("Starting %s v%s", settings.app_name, settings.app_version)
        try:
            await connect_mongo()
        except Exception:  # noqa: BLE001
            logger.exception("MongoDB connection failed — API will return 503 on data routes")
        # Load models (graceful per-condition failure).
        get_registry().load_all()
        status = get_registry().status()
        for name, meta in status["models"].items():
            logger.info("model %s: available=%s", name, meta["available"])

    @app.on_event("shutdown")
    async def shutdown() -> None:
        await close_mongo()

    # ── Request id + timing middleware ─────────────────────────────
    @app.middleware("http")
    async def request_context(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        token = request_id_var.set(request_id)
        start = time.perf_counter()
        try:
            response: Response = await call_next(request)
        finally:
            request_id_var.reset(token)
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        if request.url.path not in ("/health", "/docs", "/openapi.json"):
            logger.info(
                "request completed",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "durationMs": elapsed_ms,
                },
            )
        return response

    # ── Exception handlers → unified envelope ───────────────────────
    @app.exception_handler(ApiError)
    async def api_error_handler(_: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(status_code=exc.status, content=error(exc.code, exc.message, exc.details))

    @app.exception_handler(RequestValidationError)
    async def validation_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
        field_errors: dict[str, str] = {}
        for e in exc.errors():
            loc = [str(part) for part in e.get("loc", []) if part != "body"]
            key = ".".join(loc) if loc else "body"
            field_errors[key] = str(e.get("msg", "invalid"))
        return JSONResponse(
            status_code=422,
            content=error(ERR_VALIDATION, "Validation failed.", {"fieldErrors": field_errors}),
        )

    @app.exception_handler(Exception)
    async def unhandled_handler(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception: %s", exc)
        return JSONResponse(
            status_code=500,
            content=error(ERR_INTERNAL, "An unexpected error occurred. Please try again."),
        )

    # ── Routes ──────────────────────────────────────────────────────
    app.include_router(api_v1_router, prefix=settings.api_v1_prefix)

    @app.get("/", include_in_schema=False)
    async def root() -> dict:
        return {
            "success": True,
            "data": {"app": settings.app_name, "version": settings.app_version},
            "timestamp": "n/a",
        }

    return app


app = create_app()
