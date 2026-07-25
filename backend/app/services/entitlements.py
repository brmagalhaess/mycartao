"""Single source of truth for Free vs Pro plan capabilities."""

from __future__ import annotations

from typing import Any, Dict, List

PRO_PLANS = frozenset({"pro", "admin"})

FREE_CARD_LIMIT = 1
FREE_PORTFOLIO_LIMIT = 3
FREE_ANALYTICS_DAYS = 7
PRO_ANALYTICS_DAYS = 90

FREE_THEMES = frozenset({"minimal", "classic", "bold"})
PRO_THEMES = frozenset({"minimal", "classic", "bold", "sand", "ink"})

PRINT_TEMPLATES_FREE = frozenset({"classic"})
PRINT_TEMPLATES_PRO = frozenset({"classic", "compact", "bold"})


def is_pro(plan: str) -> bool:
    return plan in PRO_PLANS


def entitlements_for(plan: str) -> Dict[str, Any]:
    pro = is_pro(plan)
    return {
        "plan": plan if plan in {"free", "pro", "admin"} else "free",
        "is_pro": pro,
        "cards": {
            "limit": None if pro else FREE_CARD_LIMIT,
            "unlimited": pro,
        },
        "slug": pro,
        "custom_links": pro,
        "smart_rules": pro,
        "brand_color": pro,
        "themes": sorted(PRO_THEMES if pro else FREE_THEMES),
        "themes_pro_extra": sorted(PRO_THEMES - FREE_THEMES),
        "remove_branding": pro,
        "print": {
            "watermark": not pro,
            "templates": sorted(PRINT_TEMPLATES_PRO if pro else PRINT_TEMPLATES_FREE),
        },
        "portfolio": {
            "limit": None if pro else FREE_PORTFOLIO_LIMIT,
            "unlimited": pro,
            "categories": pro,
        },
        "analytics": {
            "max_days": PRO_ANALYTICS_DAYS if pro else FREE_ANALYTICS_DAYS,
            "export": pro,
        },
        "avatar": {
            "upload": True,
            "gallery": pro,
        },
        "lead_capture": True,
        "email_signature": True,
        "presence": True,
        "vcard": True,
        "qr_export": True,
    }


def feature_matrix() -> Dict[str, List[Dict[str, Any]]]:
    """Marketing-oriented feature rows for Free vs Pro comparison."""
    return {
        "free": [
            {"key": "cards", "label": "1 cartão digital"},
            {"key": "link", "label": "Link público por ID"},
            {"key": "qr_presence", "label": "QR + Presence Mode"},
            {"key": "avatar_api", "label": "API pública de avatar"},
            {"key": "portfolio", "label": "Portfólio com até 3 itens"},
            {"key": "analytics", "label": "Analytics 7 dias"},
            {"key": "print", "label": "Print PDF com watermark"},
            {"key": "themes", "label": "3 temas (Minimal, Clássico, Bold)"},
            {"key": "leads", "label": "Captura de leads no cartão"},
            {"key": "signature", "label": "Assinatura de e-mail"},
        ],
        "pro": [
            {"key": "cards", "label": "Cartões ilimitados"},
            {"key": "slug", "label": "Link personalizado (slug)"},
            {"key": "custom_links", "label": "Botões/links personalizados"},
            {"key": "smart", "label": "Smart Card com regras"},
            {"key": "print", "label": "Print Kit sem watermark (3 templates)"},
            {"key": "portfolio", "label": "Portfólio ilimitado + categorias"},
            {"key": "analytics", "label": "Analytics 90 dias + export CSV"},
            {"key": "branding", "label": "Sem branding MyCartao"},
            {"key": "themes", "label": "Todos os temas + cor da marca"},
            {"key": "gallery", "label": "Galeria de avatares"},
        ],
    }
