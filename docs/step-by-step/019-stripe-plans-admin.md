# Step-by-step 019 — Planos Stripe + admin

## Stripe criado
- Product: `prod_Uw55NojMDnsE1j` (MyCartao Pro)
- Price: `price_1TwCvV2Q9dtE625NdexKumxU` — **R$ 19,90 / mês** (BRL)

## Código
- Tabela `plans` + migration Alembic
- Admin: `GET/POST/PATCH /api/v1/admin/plans` (cria/edita e sincroniza Stripe)
- Público: `GET /api/v1/billing/plans`
- Checkout usa plano default (ou `plan_id`)
- UI admin: seção Planos para criar/editar

## Dokploy
Defina `STRIPE_PRICE_PRO=price_1TwCvV2Q9dtE625NdexKumxU` no Environment e faça redeploy do backend.
