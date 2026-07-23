# 007 — MinIO media upload (avatar / portfolio / print)

**Data:** 2026-07-22  
**Branch/worktree:** `feat/mycartao-saas` (`.worktrees/feat-mycartao-saas`)

## Objetivo

Upload autenticado de imagens para MinIO com validação MIME/tamanho, criação automática do bucket no startup e limite de 1 avatar no plano Free (`403 avatar_limit_reached`).

## O que foi feito

1. **TDD:** `tests/test_media.py` com MinIO mockado (`unittest.mock`) — host sem Docker.
2. Client real `minio_client.py`: `ensure_bucket`, `upload_bytes`, `public_url`; MIME jpeg/png/webp; max 5MB.
3. Rota `POST /api/v1/media/upload` (multipart: `file` + `purpose`) → `{id, url, purpose}`.
4. Lifespan do FastAPI chama `ensure_bucket` (falha silenciosa se MinIO offline).
5. Docs + commit.

## Arquivos e utilidade

| Arquivo | Função |
|---------|--------|
| `backend/app/services/minio_client.py` | SDK MinIO: bucket, upload, URL pública |
| `backend/app/schemas/media.py` | `MediaUploadResponse` |
| `backend/app/api/v1/media.py` | Rota upload + gate Free avatar |
| `backend/app/api/v1/__init__.py` | Registra router `/media` |
| `backend/app/main.py` | Lifespan → `ensure_bucket` |
| `backend/tests/test_media.py` | Upload, limite Free, MIME, tamanho |
| `backend/tests/conftest.py` | Fixture `png_bytes` + mock `ensure_bucket` |
| `docs/step-by-step/007-media-minio.md` | Este registro |

## Endpoints

- `POST /api/v1/media/upload` — auth; `purpose`: `avatar` \| `portfolio` \| `print`
  - Free + 2º avatar → `403 avatar_limit_reached`
  - MIME inválido → `400 invalid_mime`
  - \>5MB → `400 file_too_large`

## Verificação

```bash
cd backend
.venv/bin/pytest tests/test_media.py tests/test_cards.py tests/test_me_slug.py tests/test_auth_magic_link.py tests/test_models_smoke.py -v
```

## Reflexão (escalabilidade / manutenção)

O client MinIO fica isolado da regra de negócio (limite Free), o que permite trocar storage ou adicionar signed URLs sem tocar na rota. O mock em testes evita dependência de Docker no host CI/local. Próximos passos naturais: atualizar `profiles.avatar_key` no upload de avatar, limpeza de objetos órfãos no delete, e política de retenção para `print`/portfolio.
