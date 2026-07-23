# 004 — Auth magic link (Brevo) + JWT

**Data:** 2026-07-22  
**Branch/worktree:** `feat/mycartao-saas` (`.worktrees/feat-mycartao-saas`)

## Objetivo

Implementar autenticação por magic link (e-mail via Brevo), cookie JWT `access_token`, rate limit e dependência `get_current_user` para as tasks seguintes.

## O que foi feito

1. **TDD RED:** `tests/test_auth_magic_link.py` — falhou por ausência de `app.services` / rotas.
2. Implementados `security`, `rate_limit`, `brevo`, `auth` service, schemas e rotas `/api/v1/auth/*`.
3. Cookie HttpOnly `access_token` (SameSite=Lax; `secure` se `PUBLIC_APP_URL` for https).
4. Token magic link: hash SHA-256, TTL 15 min, uso único; Profile criado no primeiro verify.
5. Rate limit in-memory: 5 pedidos / e-mail / 15 min → `429` + `rate_limited`.
6. Brevo: sem API key → log `[brevo-dev]` do link (dev).
7. `conftest` estendido: limpa rate limit e tabelas entre testes (SQLite shared).

## Arquivos e utilidade

| Arquivo | Função |
|---------|--------|
| `backend/app/core/security.py` | Hash de token, encode/decode JWT HS256 |
| `backend/app/core/rate_limit.py` | Contador in-memory por chave (janela 15 min) |
| `backend/app/services/brevo.py` | Envio de e-mail magic link (ou log em dev) |
| `backend/app/services/auth.py` | Criar/verificar magic link; user + profile |
| `backend/app/schemas/auth.py` | Request/response Pydantic (`MagicLinkRequest`, `UserResponse`) |
| `backend/app/api/v1/auth.py` | Rotas magic-link, verify, logout + cookies |
| `backend/app/api/v1/__init__.py` | Agrega routers sob `/api/v1` |
| `backend/app/deps.py` | `get_db` + `get_current_user` (cookie JWT) |
| `backend/app/main.py` | Inclui `api_router` com prefixo `/api/v1` |
| `backend/tests/test_auth_magic_link.py` | Fluxo, uso único, logout, rate limit |
| `backend/tests/conftest.py` | Isolamento SQLite + reset rate limit |

## Endpoints

- `POST /api/v1/auth/magic-link` `{email}` → `{ok: true}`
- `GET /api/v1/auth/verify?token=` → cookie `access_token` + user JSON
- `POST /api/v1/auth/logout` → limpa cookie

## Verificação

```bash
cd backend
.venv/bin/pytest tests/test_auth_magic_link.py tests/test_models_smoke.py -v
```

## Reflexão (escalabilidade / manutenção)

O fluxo ficou em camadas claras (rota → service → Brevo/security), o que facilita trocar o provedor de e-mail ou persistir rate limit (Redis) sem mudar a API. O rate limit in-memory serve para um único worker; em multi-réplica será preciso store compartilhado. Criar `Profile` vazio no verify desbloqueia Task 4 (`/me`) sem race de “usuário sem perfil”. Próximo passo: endpoints `/me` consumindo `get_current_user`.
