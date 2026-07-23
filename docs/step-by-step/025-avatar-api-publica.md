# Step-by-step — Task 1: Avatar API pública

**Data:** 2026-07-23  
**Branch/worktree:** `feat/links-avatar-api-ui` (`.worktrees/feat-links-avatar-api-ui`)  
**Status:** Concluído

## Objetivo

Expor `GET /api/v1/public/avatar?email=&s=` com resolução por e-mail, placeholder SVG (privacidade) e sync de `profile.avatar_key` no upload.

## Avanços

1. **TDD (vermelho):** criado `backend/tests/test_avatar.py` — e-mail inválido 400, e-mail desconhecido/sem foto → SVG 200, upload + stream PNG.
2. **Implementação (verde):** service `avatar.py`, rota pública, mount no router, sync `avatar_key` em `media.py`.
3. **Ajuste Python 3.9:** anotação `Optional[int]` na rota (FastAPI/Pydantic não avalia `int | None` no 3.9).
4. **Verificação:** `pytest tests/test_avatar.py tests/test_media.py -q` → 11 passed.
5. **Commit:** `feat: public avatar API by email`.

## Arquivos

| Arquivo | Função |
|---------|--------|
| `backend/app/services/avatar.py` | Normaliza e-mail, clamp de tamanho, SVG placeholder, `resolve_avatar` (profile → MediaAsset → card.fields.avatar → placeholder) |
| `backend/app/api/v1/avatar.py` | Rota pública com rate limit `avatar:{ip}` max 120, `AppError invalid_email`, Response com cache 1h |
| `backend/app/api/v1/__init__.py` | Monta `public_router` em `/public/avatar` |
| `backend/app/api/v1/media.py` | Em upload `purpose=avatar`, seta `profile.avatar_key = bucket_key` |
| `backend/tests/test_avatar.py` | Cobertura dos casos de privacidade, validação e stream |

## Escalabilidade / manutenibilidade

A resolução ficou concentrada no service, reutilizando MinIO proxy e modelos existentes — sem migration. Rate limit elevado evita quebra de embeds `<img>`. Próximos passos úteis: teste explícito do fallback via `fields.avatar` do cartão primário; eventual resize real de bytes (hoje `s` só afeta o SVG).
