# Step-by-step 039 — Fix checkout Live (preço/cliente de teste)

## Sintoma
UI Cobrança: “Não foi possível iniciar o checkout.” com plano Free.

## Causas prováveis
1. `plans.stripe_price_id` ainda com Price de **teste** enquanto `STRIPE_SECRET_KEY` é `sk_live_`
2. `users.stripe_customer_id` criado no modo Teste — Live rejeita (“No such customer”)
3. Erro da Stripe virava 500 sem mensagem clara na UI

## Correção
| Arquivo | Função |
|---------|--------|
| `backend/app/services/stripe_billing.py` | Env `STRIPE_PRICE_PRO` prevalece; retry se customer inválido; `StripeError` → AppError |
| `frontend/.../billing/page.tsx` | Mostra `detail` / HTTP status real |
| `backend/tests/test_billing_webhook.py` | Env override, retry customer, surface error |

## Dokploy (obrigatório)
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PRICE_PRO=price_1TwuJE2Q9dtE625N0o68LKoI
STRIPE_WEBHOOK_SECRET=whsec_...   # webhook Live
APP_ENV=production
PUBLIC_APP_URL=https://SEU-DOMINIO
```
Redeploy **backend + frontend** após o push deste fix.

Validar: `/api/v1/billing/status` → `"stripe_mode":"live"` e Assinar Pro abre o Checkout Stripe.

## Análise
Priorizar env no price evita drift Test→Live sem SQL manual. Retry de customer cobre migração de usuários que já clicaram checkout em teste. Superfície de erro na UI reduz “caixa preta” em falhas Stripe.
