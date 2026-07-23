# 011 — Stripe billing (Checkout + webhook)

**Data:** 2026-07-22  
**Branch/worktree:** `feat/mycartao-saas` (`.worktrees/feat-mycartao-saas`)

## Objetivo

Expor Checkout Session (assinatura Pro) e webhook Stripe para sincronizar `users.plan` e `subscriptions`.

## O que foi feito

1. **TDD:** `tests/test_billing_webhook.py` — `construct_event` mockado; checkout.completed → pro; subscription.deleted → free; updated ativo; checkout sem keys → `billing_not_configured`.
2. Service `stripe_billing`: cria Session `mode=subscription` com `metadata.user_id`; processa eventos e faz upsert de `subscriptions`.
3. Rotas `POST /billing/checkout` (auth) e `POST /billing/webhook` (raw body + `Stripe-Signature`).
4. Docs step-by-step + commit.

## Arquivos e utilidade

| Arquivo | Função |
|---------|--------|
| `backend/app/services/stripe_billing.py` | Checkout Session, validação de webhook, handlers de eventos, upsert plan/subscription |
| `backend/app/api/v1/billing.py` | Endpoints `/checkout` e `/webhook` |
| `backend/app/api/v1/__init__.py` | Monta router `/billing` |
| `backend/tests/test_billing_webhook.py` | Webhooks mockados + checkout com/sem config |
| `docs/step-by-step/011-stripe-billing.md` | Este registro |

## Endpoints

- `POST /api/v1/billing/checkout` → `{url}` (requer auth; price=`STRIPE_PRICE_PRO`)
- `POST /api/v1/billing/webhook` — body bruto + header `Stripe-Signature`

## Eventos

- `checkout.session.completed` → `plan=pro`, upsert sub, grava `stripe_customer_id`
- `customer.subscription.updated` → upsert status/period; `active|trialing` → pro, senão free
- `customer.subscription.deleted` → `plan=free`, status `canceled`

## Config

- Sem `STRIPE_SECRET_KEY` / `STRIPE_PRICE_PRO`: checkout levanta `AppError` `billing_not_configured` (503)
- Testes mockam Stripe (`Webhook.construct_event`, `Session.create`)

## Verificação

```bash
cd backend
.venv/bin/pytest tests/test_billing_webhook.py -v
```

## Reflexão (escalabilidade / manutenção)

A lógica de billing ficou no service (não no router), o que facilita trocar provedor ou adicionar Customer Portal sem tocar na API. Upsert por `stripe_subscription_id` evita duplicatas e permite reconciliar updated/deleted sem depender só de metadata. Próximos passos: idempotência por `event.id`, Customer Portal, e job de reconciliação periódica com a API Stripe.
