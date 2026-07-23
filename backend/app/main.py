from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.config import settings
from app.core.errors import AppError, app_error_handler
from app.services.minio_client import ensure_bucket


@asynccontextmanager
async def lifespan(_app: FastAPI):
    try:
        ensure_bucket()
    except Exception:
        # MinIO may be down in local/dev without compose; upload will fail later.
        pass
    yield


app = FastAPI(title="MyCartao API", version="1.0.0", lifespan=lifespan)
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
