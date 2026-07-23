from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
    admin,
    analytics,
    auth,
    billing,
    cards,
    exports,
    me,
    media,
    portfolio,
    smart_rules,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(me.router, prefix="/me", tags=["me"])
api_router.include_router(cards.router, prefix="/cards", tags=["cards"])
api_router.include_router(exports.router, prefix="/cards", tags=["exports"])
api_router.include_router(cards.public_router, prefix="/public/cards", tags=["public"])
api_router.include_router(exports.public_router, prefix="/public/cards", tags=["public"])
api_router.include_router(media.router, prefix="/media", tags=["media"])
api_router.include_router(portfolio.router, prefix="/portfolio", tags=["portfolio"])
api_router.include_router(
    portfolio.public_router, prefix="/public/portfolio", tags=["public"]
)
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(smart_rules.router, prefix="/smart-rules", tags=["smart-rules"])
api_router.include_router(
    smart_rules.public_router, prefix="/public/go", tags=["public"]
)