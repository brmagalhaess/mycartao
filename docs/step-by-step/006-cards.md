# 006 — Cards CRUD, página pública e limite Free

**Data:** 2026-07-22  
**Branch/worktree:** `feat/mycartao-saas` (`.worktrees/feat-mycartao-saas`)

## Objetivo

Expor CRUD autenticado de cartões, endpoint público por UUID ou slug do profile, e limitar Free a 1 cartão (`403 card_limit_reached`).

## O que foi feito

1. **TDD RED:** `tests/test_cards.py` — falhou com `404` (rotas ausentes).
2. Schemas Pydantic (`CardCreate`, `CardUpdate`, `CardResponse`); `fields` JSON livre com chaves sugeridas.
3. Service `cards`: list/create/get/update/delete; gate Free (`FREE_CARD_LIMIT=1`); resolução pública UUID → card ou slug → primary (fallback: primeiro por `created_at`).
4. Rotas autenticadas `/api/v1/cards` e pública `/api/v1/public/cards/{slug_or_id}`.
5. Docs step-by-step + commit.

## Arquivos e utilidade

| Arquivo | Função |
|---------|--------|
| `backend/app/schemas/card.py` | Contratos request/response do cartão |
| `backend/app/services/cards.py` | Regras de negócio (CRUD, limite Free, público) |
| `backend/app/api/v1/cards.py` | Rotas auth + `public_router` |
| `backend/app/api/v1/__init__.py` | Registra routers `cards` e `public/cards` |
| `backend/tests/test_cards.py` | Limite Free, CRUD, público id/slug |
| `docs/step-by-step/006-cards.md` | Este registro |

## Endpoints

- `GET/POST /api/v1/cards` — lista / cria (Free: 2º → `403 card_limit_reached`)
- `GET/PATCH/DELETE /api/v1/cards/{id}` — dono do profile
- `GET /api/v1/public/cards/{slug_or_id}` — UUID do card ou slug do profile

## Fields JSON (sugeridos)

`phone`, `email`, `company`, `whatsapp`, `website`, `linkedin`, `instagram`

## Verificação

```bash
cd backend
.venv/bin/pytest tests/test_cards.py tests/test_me_slug.py tests/test_auth_magic_link.py tests/test_models_smoke.py -v
```

## Reflexão (escalabilidade / manutenção)

O limite Free vive só no service de create, o que evita inconsistência entre rotas e facilita mudar a cota por plano depois (ex.: tabela de quotas). A resolução pública por slug reutiliza `profiles.slug` (Task 4) e escolhe `is_primary` com fallback temporal — adequado para MVP; se um profile tiver vários cards públicos, um endpoint `/public/cards/{slug}/{card_id}` ou slug por card pode ser o próximo passo. Próximos: analytics de view (Task 8) e exports QR/PDF/vCard (Task 7) sobre o mesmo `CardResponse`.
