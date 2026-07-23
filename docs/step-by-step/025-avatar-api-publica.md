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
6. **Review fix:** cascade após falha MinIO — `_iter_bucket_keys` tenta avatar_key → MediaAsset → card.fields.avatar antes do placeholder; testes dedicados de fallback; bare bucket key em `fields.avatar`.
7. **Verificação review:** `pytest tests/test_avatar.py -q` → 7 passed.

## Arquivos

| Arquivo | Função |
|---------|--------|
| `backend/app/services/avatar.py` | Normaliza e-mail, clamp, SVG, `_iter_bucket_keys` + `resolve_avatar` (falha de read continua nas fontes seguintes) |
| `backend/app/api/v1/avatar.py` | Rota pública com rate limit `avatar:{ip}` max 120, `AppError invalid_email`, Response com cache 1h |
| `backend/app/api/v1/__init__.py` | Monta `public_router` em `/public/avatar` |
| `backend/app/api/v1/media.py` | Em upload `purpose=avatar`, seta `profile.avatar_key = bucket_key` |
| `backend/tests/test_avatar.py` | Privacidade, stream, MediaAsset, card.fields.avatar, stale avatar_key |

## Escalabilidade / manutenibilidade

A resolução itera chaves candidatas em vez de escolher uma só — falha de objeto no MinIO não mascara MediaAsset/card. Dedup evita retries inúteis na mesma key. Próximo passo opcional: resize real de bytes (hoje `s` só afeta SVG).
