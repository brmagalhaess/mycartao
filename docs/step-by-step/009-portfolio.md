# 009 — Portfólio / catálogo + limites

**Data:** 2026-07-22  
**Branch/worktree:** `feat/mycartao-saas` (`.worktrees/feat-mycartao-saas`)

## Objetivo

CRUD autenticado de itens de portfólio/catálogo (`project` | `service`), endpoint público por slug ou id do profile, e limite Free de 3 itens (4º → `403 portfolio_limit_reached`).

## O que foi feito

1. **TDD:** `tests/test_portfolio.py` — limite Free, CRUD com `price` em service, público por slug/profile id.
2. Schemas Pydantic (`PortfolioCreate`, `PortfolioUpdate`, `PortfolioResponse`).
3. Service `portfolio`: list/create/get/update/delete; gate Free (`FREE_PORTFOLIO_LIMIT=3`); público resolve slug → profile id → item id.
4. Rotas `/api/v1/portfolio` e `/api/v1/public/portfolio/{slug_or_id}` (lista).
5. Docs step-by-step + commit.

## Arquivos e utilidade

| Arquivo | Função |
|---------|--------|
| `backend/app/schemas/portfolio.py` | Contratos request/response do item |
| `backend/app/services/portfolio.py` | Regras (CRUD, limite Free, lookup público) |
| `backend/app/api/v1/portfolio.py` | Rotas auth + `public_router` |
| `backend/app/api/v1/__init__.py` | Registra `portfolio` e `public/portfolio` |
| `backend/tests/test_portfolio.py` | Limite Free, CRUD, público slug/id |
| `docs/step-by-step/009-portfolio.md` | Este registro |

## Endpoints

- `GET/POST /api/v1/portfolio` — lista / cria (Free: 4º → `403 portfolio_limit_reached`)
- `GET/PATCH/DELETE /api/v1/portfolio/{id}` — dono do profile
- `GET /api/v1/public/portfolio/{slug_or_id}` — lista por slug, profile UUID ou item UUID

## Types

- `project` — título/descrição/imagem/categoria
- `service` — igual + `price` opcional (`Numeric(12,2)`)

## Verificação

```bash
cd backend
.venv/bin/pytest tests/test_portfolio.py -v
```

## Reflexão (escalabilidade / manutenção)

O limite Free fica só no `create_item`, espelhando o padrão de cards — fácil trocar por tabela de quotas por plano. O público devolve lista ordenada por `sort_order`, adequada à página `/p/[slugOrId]`; resolver também por UUID do item evita 404 se o frontend passar o id de um item isolado. Próximo passo natural: filtrar por `category` na API pública e amarrar `image_key` ao upload MinIO (`purpose=portfolio`).
