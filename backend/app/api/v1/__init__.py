from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import auth, cards, me

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(me.router, prefix="/me", tags=["me"])
api_router.include_router(cards.router, prefix="/cards", tags=["cards"])
api_router.include_router(cards.public_router, prefix="/public/cards", tags=["public"])
