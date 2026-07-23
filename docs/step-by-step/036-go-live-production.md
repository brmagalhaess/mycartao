# Step-by-step 036 — Colocar MyCartao em produção

## Arquivos tocados e função
| Arquivo | Função |
|---------|--------|
| `backend/app/config.py` | `APP_ENV`, `is_production()`, `stripe_mode()` |
| `backend/app/main.py` | Sem `/docs` em prod; avisos JWT/Stripe/Brevo; seed price do env |
| `backend/app/services/brevo.py` | Em prod sem Brevo → 503 (não loga magic link) |
| `backend/app/services/stripe_billing.py` | Bloqueia checkout se prod + `sk_test_` |
| `backend/app/services/plans.py` | Sincroniza `stripe_price_id` com `STRIPE_PRICE_PRO` no boot |
| `backend/app/api/v1/billing.py` | `GET /billing/status` (environment + stripe_mode) |
| `frontend/.../login/page.tsx` | Texto de login sem menção a “dev/log” |
| `frontend/.../billing/page.tsx` | Banner + botão desativado se Stripe teste |
| `docker-compose.yml` | `APP_ENV=production` no backend |
| `.env.example` | Template live (sem `sk_test_` / price de teste) |

## Checklist Dokploy (obrigatório)

### 1. Domínio e app
```
APP_ENV=production
PUBLIC_APP_URL=https://SEU-DOMINIO
CORS_ORIGINS=https://SEU-DOMINIO
JWT_SECRET=<segredo longo aleatório, ≥32 chars>
NEXT_PUBLIC_API_URL=
```

### 2. Brevo (login por e-mail)
```
BREVO_API_KEY=<chave real>
BREVO_SENDER_EMAIL=<remetente verificado na Brevo>
BREVO_SENDER_NAME=MyCartao
```

### 3. Stripe LIVE
No dashboard Stripe → **modo Live** (não Test):

1. Criar Product/Price Pro (R$ 19,90/mês) se ainda não existir em Live
2. Copiar `price_…` live
3. Developers → API keys → `sk_live_…`
4. Webhooks → endpoint `https://SEU-DOMINIO/api/v1/billing/webhook`
   eventos: `checkout.session.completed`, `customer.subscription.*`
   copiar `whsec_…` live

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
```

No boot, o backend grava `STRIPE_PRICE_PRO` no plano Pro do banco.

### 4. MinIO / Postgres
Troque senhas default (`minioadmin`, `mycartao`).

### 5. Redeploy
1. Commit/push deste hardening
2. Colar env live no Dokploy
3. Rebuild **frontend + backend**

## Como validar
1. Login: e-mail chega via Brevo; sem menção a “dev” na UI
2. `/api/v1/billing/status` → `{"environment":"production","stripe_mode":"live"}`
3. `/docs` da API deve dar 404 em produção
4. Assinar Pro abre Checkout Stripe **live** (cartão real)

## Análise (escalabilidade / manutenção)
O gate `is_production()` + `stripe_mode()` evita cobrar com chaves de teste sem depender só de disciplina humana. Sync do price no boot evita drift entre env e tabela `plans`. Próximo passo: painel admin para trocar Price ID sem redeploy, e rotação documentada de `JWT_SECRET`/`whsec`.
