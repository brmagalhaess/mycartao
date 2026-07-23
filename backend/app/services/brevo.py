from __future__ import annotations

import httpx

from app.config import settings


def send_magic_link_email(email: str, link: str) -> None:
    if not settings.brevo_api_key:
        print(f"[brevo-dev] magic link for {email}: {link}")
        return
    payload = {
        "sender": {
            "name": settings.brevo_sender_name,
            "email": settings.brevo_sender_email,
        },
        "to": [{"email": email}],
        "subject": "Seu link de acesso MyCartao",
        "htmlContent": (
            "<p>Clique para entrar (válido 15 min):</p>"
            f'<p><a href="{link}">{link}</a></p>'
        ),
    }
    r = httpx.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={
            "api-key": settings.brevo_api_key,
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=20,
    )
    r.raise_for_status()
