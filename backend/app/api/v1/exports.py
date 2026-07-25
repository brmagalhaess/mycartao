from __future__ import annotations

from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.errors import AppError
from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.services import cards as cards_service
from app.services.entitlements import is_pro
from app.services.print_pdf import generate_print_pdf
from app.services.qr import generate_qr, public_card_url
from app.services.vcard import generate_vcard

router = APIRouter()
public_router = APIRouter()


@router.get("/{card_id}/qr")
def get_card_qr(
    card_id: UUID,
    format: Literal["png", "svg"] = Query("png", alias="format"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = cards_service.get_card_for_user(db, user, card_id)
    url = public_card_url(card)
    try:
        payload = generate_qr(url, format)
    except AppError:
        raise
    except Exception as exc:
        raise AppError("Falha ao gerar QR", "qr_failed", status_code=500) from exc

    if format == "png":
        return Response(
            content=payload,
            media_type="image/png",
            headers={"Content-Disposition": f'inline; filename="card-{card_id}.png"'},
        )
    return Response(
        content=payload,
        media_type="image/svg+xml",
        headers={"Content-Disposition": f'inline; filename="card-{card_id}.svg"'},
    )


@router.get("/{card_id}/print.pdf")
def get_card_print_pdf(
    card_id: UUID,
    template: str = Query("classic"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = cards_service.get_card_for_user(db, user, card_id)
    profile = card.profile
    watermark = not is_pro(user.plan)
    try:
        payload = generate_print_pdf(
            card,
            profile,
            watermark=watermark,
            template=template,
            plan=user.plan,
        )
    except AppError:
        raise
    except Exception as exc:
        raise AppError("Falha ao gerar PDF", "pdf_failed", status_code=500) from exc

    return Response(
        content=payload,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="card-{card_id}.pdf"'},
    )


@router.get("/{card_id}/vcard.vcf")
def get_card_vcard(
    card_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    card = cards_service.get_card_for_user(db, user, card_id)
    payload = generate_vcard(card, card.profile)
    return Response(
        content=payload,
        media_type="text/vcard; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="card-{card_id}.vcf"'},
    )


@public_router.get("/{slug_or_id}/vcard.vcf")
def get_public_vcard(slug_or_id: str, db: Session = Depends(get_db)):
    card = cards_service.get_public_card(db, slug_or_id)
    payload = generate_vcard(card, card.profile)
    return Response(
        content=payload,
        media_type="text/vcard; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{slug_or_id}.vcf"'},
    )
