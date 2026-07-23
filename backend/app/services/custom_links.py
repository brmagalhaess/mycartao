from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.core.errors import AppError
from app.models.user import User

ALLOWED_ICONS = frozenset({"link", "globe", "calendar", "shop", "video", "music"})
MAX_LINKS = 20
PRO_PLANS = frozenset({"pro", "admin"})
MAX_TITLE_LEN = 60


def normalize_custom_links(raw: Any) -> List[Dict[str, Any]]:
    if not isinstance(raw, list):
        raise AppError(
            "custom_links deve ser uma lista",
            "invalid_custom_link",
            status_code=400,
        )
    if len(raw) > MAX_LINKS:
        raise AppError(
            f"Máximo de {MAX_LINKS} custom_links por cartão",
            "too_many_custom_links",
            status_code=400,
        )

    normalized: List[Dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            raise AppError(
                "Cada custom_link deve ser um objeto",
                "invalid_custom_link",
                status_code=400,
            )

        link_id = item.get("id")
        if not isinstance(link_id, str) or not link_id.strip():
            raise AppError(
                "id do custom_link é obrigatório",
                "invalid_custom_link",
                status_code=400,
            )

        title = item.get("title")
        if not isinstance(title, str):
            raise AppError(
                "title do custom_link é obrigatório",
                "invalid_custom_link",
                status_code=400,
            )
        title = title.strip()
        if not title or len(title) > MAX_TITLE_LEN:
            raise AppError(
                "title do custom_link deve ter entre 1 e 60 caracteres",
                "invalid_custom_link",
                status_code=400,
            )

        url = item.get("url")
        if not isinstance(url, str) or not (
            url.startswith("http://") or url.startswith("https://")
        ):
            raise AppError(
                "url do custom_link deve começar com http:// ou https://",
                "invalid_custom_link",
                status_code=400,
            )

        icon = item.get("icon")
        if icon is not None and icon != "":
            if not isinstance(icon, str) or icon not in ALLOWED_ICONS:
                raise AppError(
                    "icon do custom_link inválido",
                    "invalid_custom_link",
                    status_code=400,
                )
        else:
            icon = None

        sort = item.get("sort", 0)
        if isinstance(sort, bool) or not isinstance(sort, int) or sort < 0:
            raise AppError(
                "sort do custom_link deve ser um inteiro >= 0",
                "invalid_custom_link",
                status_code=400,
            )

        normalized.append(
            {
                "id": link_id.strip(),
                "title": title,
                "url": url,
                "icon": icon,
                "sort": sort,
            }
        )

    return normalized


def gate_custom_links(user: User, fields: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if fields is None:
        return fields
    links = fields.get("custom_links")
    if not links:
        return fields
    if user.plan not in PRO_PLANS:
        raise AppError(
            "Links personalizados disponíveis apenas no plano Pro",
            "custom_links_pro_only",
            status_code=403,
        )
    return {**fields, "custom_links": normalize_custom_links(links)}


# Alias da interface do plano
assert_custom_links_allowed = gate_custom_links
