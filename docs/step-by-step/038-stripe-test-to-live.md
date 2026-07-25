# Step-by-step 038 — Stripe: do Teste para Live

## Contexto
No setup do SaaS o produto/preço Pro (`price_1TwCvV…`) e a `STRIPE_SECRET_KEY` foram
criados no **modo Teste** (`sk_test_…`). Isso é normal em desenvolvimento, mas o
servidor em produção (Dokploy) ainda usa essas chaves — por isso a UI mostra
“Stripe em modo teste”.

**Importante:** a Stripe **não migra** Product/Price de Test → Live. É preciso
recriar no modo Live e trocar as env no Dokploy.

## O que fazer (5 min)

### 1. Dashboard Stripe → toggle **Live** (canto superior direito)

### 2. API keys
- Developers → API keys → Secret key → `sk_live_…`

### 3. Produto Pro (R$ 19,90 / mês)
- Product catalog → Add product  
  - Name: `MyCartao Pro`  
  - Recurring: R$ 19,90 / month (BRL)  
- Copiar o **Price ID** → `price_…`

### 4. Webhook live
- Developers → Webhooks → Add endpoint  
  - URL: `https://SEU-DOMINIO/api/v1/billing/webhook`  
  - Eventos: `checkout.session.completed`, `customer.subscription.updated`,
    `customer.subscription.deleted`  
- Copiar Signing secret → `whsec_…`

### 5. Dokploy (env do backend)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
APP_ENV=production
```
Redeploy do **backend**. Validar: `GET /api/v1/billing/status` → `"stripe_mode":"live"`.

## Live criado (2026-07-24)
Via API com a chave Live do projeto:

| Item | ID |
|------|-----|
| Product | `prod_UwnvhCBX6zdd5V` |
| Price Pro R$ 19,90/mês | `price_1TwuJE2Q9dtE625N0o68LKoI` |

No Dokploy (backend):

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_PRO=price_1TwuJE2Q9dtE625N0o68LKoI
STRIPE_WEBHOOK_SECRET=whsec_...   # webhook Live ainda precisa ser criado
APP_ENV=production
```

Webhook Live (se ainda não existir):
`https://SEU-DOMINIO/api/v1/billing/webhook`
Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

Validar: `GET /api/v1/billing/status` → `"stripe_mode":"live"`.

**Segurança:** se a `sk_live` foi colada no chat, rotacione em Developers → API keys.

## Arquivos
| Arquivo | Função |
|---------|--------|
| `frontend/.../billing/page.tsx` | Texto do aviso deixa claro que o setup foi em Teste |
| `docs/step-by-step/038-stripe-test-to-live.md` | Este checklist |
