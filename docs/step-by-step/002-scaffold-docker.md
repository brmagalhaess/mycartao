# 002 — Scaffold do repositório + Docker Compose

**Data:** 2026-07-22  
**Task:** 1 — Scaffold repo + Docker Compose (4 serviços)  
**Branch:** `feat/mycartao-saas`

## Objetivo

Criar a base do monorepo MyCartao com frontend Next.js, backend FastAPI e quatro serviços via Docker Compose (`frontend`, `backend`, `db`, `minio`).

## O que foi feito

1. Estendido `.gitignore` (mantendo ignores do worktree) e criado `.env.example` com variáveis de app, DB, Brevo, Stripe e MinIO.
2. Backend mínimo em `backend/app/`:
   - `config.py` — settings via `pydantic-settings`
   - `main.py` — FastAPI + CORS + `GET /health` → `{"status":"ok"}`
3. `backend/requirements.txt` e `backend/Dockerfile` (Python 3.12-slim).
   - CMD temporário só com `uvicorn` (sem `alembic upgrade head` até a Task 2).
4. Scaffold do frontend com `create-next-app@15` (TypeScript, Tailwind, ESLint, App Router, `src/`).
5. `frontend/Dockerfile` multi-stage (deps → builder → runner standalone) e `output: "standalone"` em `next.config.ts`.
6. `docker-compose.yml` com `db`, `minio`, `backend`, `frontend` + volumes.
7. `Makefile` e `README.md` para subir/verificar a stack.

## Arquivos e função

| Arquivo | Função |
|---------|--------|
| `.gitignore` | Ignora `.env`, caches Python/Node, `.worktrees/`, `.superpowers/` |
| `.env.example` | Template de variáveis de ambiente (sem secrets reais) |
| `docker-compose.yml` | Orquestra os 4 serviços e volumes |
| `Makefile` | Atalhos `up`, `down`, `build`, `logs`, `health` |
| `README.md` | Visão geral e quick start |
| `backend/Dockerfile` | Imagem da API FastAPI |
| `backend/requirements.txt` | Dependências Python pinadas |
| `backend/app/config.py` | Carrega settings do ambiente |
| `backend/app/main.py` | App FastAPI e endpoint `/health` |
| `frontend/Dockerfile` | Build/produção Next.js standalone |
| `frontend/package.json` | Dependências e scripts Next.js |
| `frontend/next.config.ts` | Config Next, incluindo `output: "standalone"` |

## Verificação

```bash
cp .env.example .env
docker compose up -d --build db minio backend
curl -s http://localhost:8000/health
```

Esperado: `{"status":"ok"}`

## Notas

- `.env` local não deve ser commitado.
- Migrações Alembic entram na Task 2; por isso o CMD do backend não roda `alembic upgrade head` nesta etapa.
- Copy da UI em pt-BR virá nas tasks de frontend; scaffold Next permanece com defaults em inglês.

## Escalabilidade e manutenibilidade

O scaffold separa claramente frontend, backend e infraestrutura local, o que facilita evoluir cada camada sem acoplamento prematuro. O backend mínimo (`config` + `main` + health) deixa um ponto estável para as próximas tasks (DB, Alembic, auth) sem forçar migrate no boot antes das migrations existirem.

**Próximos passos sugeridos:** Task 2 (Alembic + models), ativar `alembic upgrade head` no CMD do backend, e healthcheck dedicado no serviço `backend` do Compose.
