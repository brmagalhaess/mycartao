# 010 — Analytics de visualizações

**Data:** 2026-07-22  
**Branch/worktree:** `feat/mycartao-saas` (`.worktrees/feat-mycartao-saas`)

## Objetivo

Registrar views no `GET` público do cartão (`card_views` com `ip_hash`, `ua`, `referrer`) e expor resumo autenticado com janela por plano (Free ≤7 dias, Pro ≤90).

## O que foi feito

1. **TDD:** `tests/test_analytics.py` — view pública incrementa summary; Free aceita `days=90` (clamp); Pro até 90.
2. Service `analytics`: `record_view` (sha256(ip+jwt_secret)), `summary` (`views`, `unique_approx`, `by_day`), `clamp_days`.
3. Rota `GET /api/v1/analytics/summary?days=7`.
4. `GET /api/v1/public/cards/{slug_or_id}` passa a gravar view após resolver o cartão.
5. Docs step-by-step + commit.

## Arquivos e utilidade

| Arquivo | Função |
|---------|--------|
| `backend/app/services/analytics.py` | Hash de IP, insert de view, agregação e clamp por plano |
| `backend/app/api/v1/analytics.py` | Endpoint autenticado `/summary` |
| `backend/app/api/v1/cards.py` | Public GET registra `card_views` |
| `backend/app/api/v1/__init__.py` | Monta router `/analytics` |
| `backend/tests/test_analytics.py` | Incremento de views + limites Free/Pro |
| `docs/step-by-step/010-analytics.md` | Este registro |

## Endpoints

- `GET /api/v1/public/cards/{slug_or_id}` — retorna cartão e insere view (`ip_hash`, `ua`, `referrer`)
- `GET /api/v1/analytics/summary?days=7` → `{views, unique_approx, by_day:[{day, views}]}`

## Regras de janela

- Free: `days > 7` → clamp 7
- Pro/admin: máx 90

## Verificação

```bash
cd backend
.venv/bin/pytest tests/test_analytics.py -v
```

## Reflexão (escalabilidade / manutenção)

O tracking fica no handler público (após lookup), o que evita poluir o service de cards e permite evoluir (dedupe, sampling) sem mudar CRUD. `ip_hash` com `jwt_secret` evita PII em claro; `unique_approx` por `DISTINCT ip_hash` é suficiente para MVP. Próximos passos: filtrar summary por `card_id`, índices compostos `(card_id, viewed_at)` já existem, e eventualmente materializar `by_day` se o volume crescer.
