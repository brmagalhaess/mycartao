# 005 — Perfil `/me`, slug Pro e temas

**Data:** 2026-07-22  
**Branch/worktree:** `feat/mycartao-saas` (`.worktrees/feat-mycartao-saas`)

## Objetivo

Expor perfil autenticado (`GET/PATCH /me`), permitir personalização de tema/cor e restringir slug customizado a planos Pro/admin.

## O que foi feito

1. **TDD RED:** `tests/test_me_slug.py` + fixtures `auth_client_free` / `auth_client_pro` — falhou com `404` (rotas ausentes).
2. Schemas Pydantic (`ProfileResponse`, `ProfileUpdate`, `SlugUpdate`).
3. Service `profile`: get/update perfil; `set_slug` com regex `^[a-z0-9-]{3,32}$`, unicidade e gate de plano.
4. Rotas `GET/PATCH /api/v1/me`, `PATCH /api/v1/me/slug`.
5. Erros: `plan_required` (403 free), `invalid_slug` (400 formato/duplicado).

## Arquivos e utilidade

| Arquivo | Função |
|---------|--------|
| `backend/app/schemas/profile.py` | Contratos request/response do perfil |
| `backend/app/services/profile.py` | Regras de negócio (tema, slug, plano) |
| `backend/app/api/v1/me.py` | Endpoints autenticados `/me` |
| `backend/app/api/v1/__init__.py` | Registra router `me` |
| `backend/tests/conftest.py` | Fixtures `auth_client_free` / `auth_client_pro` |
| `backend/tests/test_me_slug.py` | Slug Pro, validação, GET/PATCH tema |
| `docs/step-by-step/005-profile-slug.md` | Este registro |

## Endpoints

- `GET /api/v1/me` → perfil (inclui `theme`, `brand_color`, `slug`)
- `PATCH /api/v1/me` → atualiza `display_name`, `headline`, `bio`, `theme`, `brand_color`
- `PATCH /api/v1/me/slug` `{slug}` → Pro/admin; free → `403 plan_required`

## Verificação

```bash
cd backend
.venv/bin/pytest tests/test_me_slug.py tests/test_auth_magic_link.py tests/test_models_smoke.py -v
```

## Reflexão (escalabilidade / manutenção)

A separação rota → service mantém o gate de plano e a validação de slug num único lugar, o que evita duplicar regras quando a resolução pública por slug (Task 5+) for adicionada. Normalizar o slug (`strip` + `lower`) reduz colisões acidentais. Próximos passos: lista branca de temas se o produto fixar presets; índice único já existe no modelo — em concorrência real, tratar `IntegrityError` do banco como `invalid_slug` além do check prévio.
