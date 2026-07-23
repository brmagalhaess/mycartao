# Step-by-step — Fix MinIO healthcheck + frontend API build arg

**Data:** 2026-07-22  
**Branch:** `feat/mycartao-saas`  
**Contexto:** Correção de findings Important da revisão da Task 1.

## Objetivo

1. Remover healthcheck do MinIO baseado em `curl` (ausente na imagem `minio/minio`).
2. Alinhar `NEXT_PUBLIC_API_URL` no build arg do frontend com a API (`:8000`).
3. Evitar que o backend fique bloqueado em `depends_on: service_healthy` do MinIO.

## Alterações

### `docker-compose.yml`

| Serviço | Mudança | Função |
|---------|---------|--------|
| `minio` | Healthcheck com `wget --spider` em `/minio/health/live` | Probe best-effort sem `curl` |
| `backend` | `depends_on.minio` → `service_started` | Sobe sem esperar health do MinIO |
| `frontend` | Build arg `NEXT_PUBLIC_API_URL: http://localhost:8000` | Consistente com runtime (API na 8000) |

## Verificação

- Docker indisponível neste host → compose não exercitado.
- Revalidação local de `GET /health` via uvicorn (quando ambiente permitir).

## Arquivos tocados

- `docker-compose.yml` — compose local (dev)
- `docs/step-by-step/003-fix-minio-healthcheck-api-url.md` — este registro
- `.superpowers/sdd/task-1-report.md` (repo root) — notas de fix
