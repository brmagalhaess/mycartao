# MyCartao

SaaS de cartão de presença digital + portfólio, com QR/print, analytics, billing Stripe e painel admin.

## Stack

- **Frontend:** Next.js 15 (App Router, TypeScript, Tailwind)
- **Backend:** FastAPI (Python 3.12)
- **Database:** PostgreSQL 16
- **Object storage:** MinIO

## Quick start

```bash
cp .env.example .env
docker compose up -d --build
```

Serviços:

| Serviço  | URL / porta              |
|----------|--------------------------|
| Frontend | http://localhost:3000    |
| Backend  | http://localhost:8000    |
| Health   | http://localhost:8000/health |
| MinIO    | http://localhost:9000    |
| MinIO UI | http://localhost:9001    |
| Postgres | localhost:5432           |

## Make targets

```bash
make up       # sobe stack
make down     # derruba stack
make health   # GET /health
make logs     # logs compose
```

## Desenvolvimento

- Secrets apenas em `.env` (não commitado). Use `.env.example` como base.
- Documentação de avanços em `docs/step-by-step/`.
