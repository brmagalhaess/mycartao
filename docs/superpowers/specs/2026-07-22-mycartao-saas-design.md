# MyCartao — Design Spec (SaaS de Cartão de Presença)

**Data:** 2026-07-22  
**Status:** Aprovado em brainstorming — aguardando review final do usuário  
**Produto:** SaaS para criar e compartilhar cartões de presença digitais, com portfólio, catálogo, QR, impressão e billing.

---

## 1. Resumo

MyCartao permite que usuários criem cartões de presença online, compartilhem por link ou QR Code, exibam Presence Mode no celular, gerem arte para impressão, usem foto como avatar, publiquem portfólio + catálogo de serviços, acompanhem analytics e assinem o plano Pro via Stripe.

Stack: **Next.js (frontend)** + **FastAPI (backend)** + **PostgreSQL** + **MinIO**. Deploy em VPS via Docker Compose (4 containers). Auth por **magic link** via **Brevo**. Billing via **Stripe**.

---

## 2. Decisões de produto

| Decisão | Escolha |
|---|---|
| Escopo | Produto completo (cartão, QR, print, avatar, portfólio, catálogo, analytics, vCard/NFC-ready, temas, admin, Stripe) |
| Pagamentos | Stripe |
| Stack | Next.js + FastAPI + PostgreSQL |
| Auth | Magic link (Brevo API) |
| URLs públicas | Free: `/c/{id}` e `/p/{id}`; Pro: slug customizável |
| Storage | MinIO (4º container, S3-compatible) |
| Arquitetura | Monólito modular FastAPI + Next.js App Router |

---

## 3. Arquitetura

```
frontend (Next.js :3000)
    → backend (FastAPI :8000)
        → postgres (16)
        → minio (fotos, QR assets, print)
externos: Brevo (e-mail), Stripe (assinaturas)
```

### Estrutura do repositório

```
mycartao/
├── frontend/                 # Next.js App Router
├── backend/                  # FastAPI modular
├── docker-compose.yml
├── .env.example
├── docs/
│   ├── superpowers/specs/    # design specs
│   └── step-by-step/         # diário de desenvolvimento
└── README.md
```

### Módulos do backend

- `auth` — magic link, JWT, logout
- `users` / `profiles` — perfil, slug, tema
- `cards` — CRUD + público
- `portfolio` — projetos/serviços
- `media` — upload MinIO
- `qr` / `print` — QR e PDF
- `analytics` — views
- `billing` — Stripe checkout + webhook
- `admin` — gestão
- `smart_rules` — Presence/Smart Card (Pro)

---

## 4. Modelo de produto

### Planos

| Feature | Free | Pro |
|---|---|---|
| Cartões | 1 | ilimitados |
| Link | `/c/{id}` | slug custom `/c/seu-nome` |
| QR no app + PNG/SVG | sim | sim |
| Print PDF | com watermark | sem watermark + templates |
| Avatar / foto | 1 | galeria + crop |
| Portfólio + catálogo | até 3 itens | ilimitado + categorias |
| Temas | 3 | todos + cor da marca |
| Analytics | 7 dias | 90 dias + export |
| vCard / NFC-ready | sim (QR → URL pública; tag NFC grava a mesma URL) | sim + download `.vcf` |
| Remover branding | não | sim |
| Smart rules | não | sim |

### Diferenciais

1. **Presence Mode** — tela cheia: foto + QR + CTA “Salvar contato”.
2. **Smart Card** — um link redireciona para cartão, portfólio ou WhatsApp conforme regras (Pro).
3. **Print Kit** — PDF para gráfica com QR dinâmico (destino editável depois).

### Superfícies de UI

- Marketing: landing, preços, login
- App: dashboard, editor, QR/print, portfólio, analytics, billing, settings
- Público: `/c/[slugOrId]`, `/p/[slugOrId]`, vCard
- Admin: usuários, planos, métricas

---

## 5. Modelo de dados

- `users` — id, email, plan (`free` | `pro` | `admin`), stripe_customer_id, created_at
- `magic_link_tokens` — token_hash, email, expires_at, used_at
- `profiles` — user_id, display_name, headline, bio, avatar_key, theme, brand_color, slug (unique, nullable)
- `cards` — profile_id, title, layout, fields (JSON), is_primary
- `portfolio_items` — profile_id, type (`project` | `service`), title, description, price, image_key, sort_order, category
- `media_assets` — owner_id, bucket_key, mime, purpose (`avatar` | `portfolio` | `print`)
- `card_views` — card_id, viewed_at, ip_hash, ua, referrer
- `subscriptions` — user_id, stripe_subscription_id, status, current_period_end
- `smart_rules` — profile_id, conditions (JSON), target (`card` | `portfolio` | `whatsapp`)

---

## 6. API (`/api/v1`)

### Auth
- `POST /auth/magic-link` — body: `{ email }`
- `GET /auth/verify?token=` — cria sessão JWT
- `POST /auth/logout`

### Conta / perfil
- `GET /me`, `PATCH /me`
- `PATCH /me/slug` — Pro only

### Cartões
- `GET/POST /cards`, `GET/PATCH/DELETE /cards/{id}`
- `GET /public/cards/{slugOrId}`

### Portfólio
- `CRUD /portfolio`
- `GET /public/portfolio/{slugOrId}`

### Mídia
- `POST /media/upload` — retorna URL/presigned MinIO
- `GET /media/{id}`

### QR / Print / vCard
- `GET /cards/{id}/qr` — PNG/SVG
- `GET /cards/{id}/print.pdf`
- `GET /cards/{id}/vcard.vcf`

### Analytics / Billing / Admin
- `GET /analytics/summary`
- `POST /billing/checkout`
- `POST /billing/webhook` — Stripe signed
- `GET/PATCH /admin/*` — admin only

**Contrato de erro:** `{ "detail": string, "code": string }`  
**Auth de sessão:** JWT em cookie httpOnly (ou Bearer no header).

---

## 7. Fluxos principais

1. **Login:** e-mail → token único 15 min → Brevo → verify → JWT.
2. **Cartão:** CRUD autenticado → página pública por id/slug.
3. **Mídia:** upload validado → MinIO → key opaca no banco.
4. **Billing:** Checkout Session Stripe → webhook → atualiza `plan` + `subscriptions`.
5. **Analytics:** view pública registra `card_views` (ip_hash + ua).
6. **Presence Mode:** rota dedicada no front consumindo cartão + QR.

---

## 8. Deploy VPS

Containers Compose:
1. `frontend` — Next.js
2. `backend` — FastAPI + Alembic migrate on start
3. `db` — PostgreSQL 16 + volume `pgdata`
4. `minio` — volume `minio_data`

Variáveis (`.env`, nunca commitadas):
- `DATABASE_URL`, `JWT_SECRET`, `PUBLIC_APP_URL`, `CORS_ORIGINS`
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PRO`
- `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`

Operação:
- `docker compose up -d --build`
- healthchecks + `restart: unless-stopped`
- README com backup Postgres e checklist de domínio/SSL (Caddy/Nginx na frente, opcional)

---

## 9. Segurança

- Magic link: uso único, expiração 15 min, token armazenado como hash
- Rate limit em magic-link e endpoints públicos de view
- Webhook Stripe com verificação de assinatura
- Upload: whitelist mime + tamanho máximo
- Admin gated por `plan=admin`
- Secrets apenas via environment

---

## 10. Erros e observabilidade

- Backend: exception handlers globais, logs estruturados (request_id)
- Frontend: toasts, empty states, retry em falhas de rede
- Integrações Brevo/Stripe: falhas registradas e surfadas no dashboard quando afetam o usuário

---

## 11. Testes

- Backend (pytest): auth magic link, limites Free/Pro, card público, webhook Stripe mockado
- Frontend: smoke das rotas login, editor, página pública
- Comando unificado: `make test` (local/containers)

---

## 12. Fora de escopo (explícito)

- App nativo iOS/Android (PWA/Presence Mode no browser cobre o caso)
- Marketplace de templates pagos de terceiros
- Multi-idioma completo (UI em pt-BR no MVP; i18n depois)
- Microserviços

---

## 13. Entrega

O produto é “full”, mas a implementação segue fases no plano (auth → cards → mídia/QR/print → portfólio → analytics → Stripe → admin → Presence/Smart/Print Kit), com um único Compose deployável desde a fase 1.

**NFC-ready (definição explícita):** não há hardware NFC no app. O QR e o link público são estáveis para gravação em tags NFC de terceiros; o destino da URL pode mudar no Painel (Print Kit / Smart Card).

## 14. Critérios de sucesso do primeiro deploy

1. Usuário pede magic link, entra, cria cartão e abre link público.
2. QR aparece no app e baixa PNG; PDF de impressão gera.
3. Portfólio/catálogo público funciona.
4. Upgrade Pro via Stripe (modo test) libera slug e remove watermark.
5. Admin lista usuários.
6. `docker compose up` sobe os 4 serviços na VPS com dados persistentes.
```