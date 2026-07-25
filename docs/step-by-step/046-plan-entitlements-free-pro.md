# 046 — Entitlements Free vs Pro (definição + implementação)

## Objetivo

Fonte única da verdade para o que cada plano pode fazer, com gates no backend,
export CSV, Print Kit com templates, e pricing/billing alinhados ao produto.

## Matriz Free vs Pro

| Capacidade | Free | Pro |
|---|---|---|
| Cartões | 1 | Ilimitados |
| Link | `/c/{id}` + `?tool=` | + slug personalizado |
| QR / Presence / vCard | Sim | Sim |
| Avatar | Upload + API pública (1 ativo) | + galeria |
| Portfólio | ≤3 itens, sem categoria | Ilimitado + categorias |
| Analytics | 7 dias | 90 dias + export CSV |
| Print | Template `classic` + watermark | `classic` / `compact` / `bold`, sem watermark |
| Temas | minimal, classic, bold | + sand, ink + `brand_color` |
| Custom links / Smart Card / sem branding | Não | Sim |
| Leads + assinatura de e-mail | Sim | Sim |

## Backend

| Arquivo | Função |
|---|---|
| `backend/app/services/entitlements.py` | Limits, temas, print, analytics, flags; `entitlements_for`, `feature_matrix` |
| `backend/app/api/v1/me.py` | `GET /api/v1/me/entitlements` (+ matrix) |
| `backend/app/services/analytics.py` | `export_csv` Pro-only |
| `backend/app/api/v1/analytics.py` | `GET /api/v1/analytics/export` |
| `backend/app/services/print_pdf.py` | Templates classic/compact/bold + gate por plano |
| `backend/app/api/v1/exports.py` | Query `?template=` no print PDF |
| `backend/app/services/portfolio.py` | Categorias Pro-only |
| `backend/app/api/v1/media.py` | `GET /media` — Free só avatar ativo; Pro lista galeria |
| `backend/tests/test_entitlements.py` | Cobertura Free/Pro dos gates |

## Frontend

| Arquivo | Função |
|---|---|
| `frontend/src/app/app/analytics/page.tsx` | Botão Exportar CSV / upsell Free |
| `frontend/src/components/QrPanel.tsx` | Seletor de template Print Kit |
| `frontend/src/app/app/billing/page.tsx` | Checklist Free/Pro via `/me/entitlements` |
| `frontend/src/lib/i18n/dictionaries/{pt,en,es}.ts` | Listas de pricing atualizadas |

## Unificação de gates

Services que tinham `PRO_PLANS` local passam a usar `is_pro` / constantes de
`entitlements.py`: `cards`, `profile`, `custom_links`, `smart_rules`, `portfolio`,
`analytics`, `print_pdf`, `media`, `exports`.

## Validação

- `pytest` — **105 passed** (inclui `test_entitlements.py`)
- Frontend: `npx tsc --noEmit` — OK
