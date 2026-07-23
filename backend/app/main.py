from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.config import settings
from app.core.errors import AppError, app_error_handler
from app.db import SessionLocal
from app.services import plans as plans_service
from app.services.minio_client import ensure_bucket

logger = logging.getLogger("mycartao")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if settings.is_production():
        weak_jwt = settings.jwt_secret in {
            "",
            "change-me",
            "change-me-in-production",
            "change-me-in-production-use-long-secret",
        }
        if weak_jwt or len(settings.jwt_secret) < 32:
            logger.warning(
                "JWT_SECRET fraco ou padrão em produção — troque por um segredo longo.",
            )
        if settings.stripe_mode() == "test":
            logger.warning(
                "STRIPE_SECRET_KEY em modo teste (sk_test_) com APP em produção.",
            )
        if not settings.brevo_api_key:
            logger.warning("BREVO_API_KEY ausente — magic link não enviará e-mail.")

    try:
        ensure_bucket()
    except Exception:
        # MinIO may be down in local/dev without compose; upload will fail later.
        pass
    try:
        db = SessionLocal()
        try:
            plans_service.ensure_pro_plan(
                db,
                stripe_product_id=None,
                stripe_price_id=settings.stripe_price_pro or None,
            )
        finally:
            db.close()
    except Exception:
        # DB may be unavailable during image build health; migrate seeds on boot.
        pass
    yield


_docs = None if settings.is_production() else "/docs"
_redoc = None if settings.is_production() else "/redoc"
_openapi = None if settings.is_production() else "/openapi.json"

app = FastAPI(
    title="MyCartao API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=_docs,
    redoc_url=_redoc,
    openapi_url=_openapi,
)
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_exception_handler(AppError, app_error_handler)
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
