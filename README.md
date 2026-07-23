# MyCartao

SaaS de cartão de presença digital + portfólio, com QR/print, analytics, billing Stripe e painel admin.

## Stack

- **Frontend:** Next.js 15 (App Router, TypeScript, Tailwind)
- **Backend:** FastAPI (Python 3.12)
- **Database:** PostgreSQL 16
- **Object storage:** MinIO

## Quick start (local)

```bash
cp .env.example .env
docker compose up -d --build
# ou: make up
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
make up         # docker compose up -d --build
make down       # docker compose down
make logs       # logs compose (follow)
make test       # pytest no container backend
make test-local # pytest no host (venv/local)
make health     # GET /health
```

## Checklist deploy VPS

1. **Domínio / DNS** — A/AAAA apontando para o IP da VPS; TLS (Caddy/Nginx/Traefik) em `PUBLIC_APP_URL` e API.
2. **`.env`** — `cp .env.example .env` e preencha secrets reais:
   - `JWT_SECRET`, `POSTGRES_PASSWORD`
   - `PUBLIC_APP_URL` / `CORS_ORIGINS` com o domínio HTTPS
   - Brevo, Stripe, MinIO (abaixo)
3. **Subir stack** — na VPS, na raiz do repo:
   ```bash
   docker compose up -d --build
   ```
4. **Stripe webhook** — no Dashboard Stripe → Webhooks → endpoint  
   `https://<API_HOST>/api/v1/billing/webhook`  
   eventos de assinatura; copie o signing secret para `STRIPE_WEBHOOK_SECRET`. Defina `STRIPE_SECRET_KEY` e `STRIPE_PRICE_PRO`.
5. **Brevo sender** — `BREVO_API_KEY`, `BREVO_SENDER_EMAIL` e `BREVO_SENDER_NAME` com remetente verificado no Brevo (magic link).
6. **MinIO** — volumes persistentes (`minio_data`); credenciais fortes em `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY`; `MINIO_PUBLIC_ENDPOINT` acessível pelo browser (ou proxy); `MINIO_USE_SSL=true` se HTTPS.
7. **Backup Postgres** — agende dump periódico do volume `pgdata`, por exemplo:
   ```bash
   docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup-$(date +%F).sql
   ```
   Guarde off-box (S3/rsync) e teste restore.

## Smoke E2E (pós-deploy)

1. Magic link login  
2. Criar cartão + abrir `/c/{id}`  
3. QR + PDF  
4. Portfólio público  
5. Analytics > 0  
6. Checkout Stripe (modo test)  
7. Admin lista users  

## Desenvolvimento

- Secrets apenas em `.env` (não commitado). Use `.env.example` como base.
- Documentação de avanços em `docs/step-by-step/`.
