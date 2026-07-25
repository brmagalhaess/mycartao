# Step-by-step 040 — Assinatura paga não virava Pro (webhook + sync)

## Sintoma
Usuário assinou o Pro (pagamento aprovado na Stripe Live), mas `users.plan` continuou `free`.

## Causa raiz
A conta Stripe **não tinha webhook apontando para o MyCartao**. Os dois endpoints
cadastrados eram de outros projetos (`api.organizeup.com.br` e `tomaalista.com.br`).
O evento `checkout.session.completed` foi emitido, mas nunca chegou ao backend.

## Correção

### 1. Webhook Live criado via API
| Item | Valor |
|------|-------|
| ID | `we_1Twucq2Q9dtE625N5sunubSq` |
| URL | `https://servios-mycartao-b9nsvd-0fb6f3-2-24-94-160.sslip.io/api/v1/billing/webhook` |
| Eventos | `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` |

O `whsec_` foi entregue no chat — colar no Dokploy como `STRIPE_WEBHOOK_SECRET`.

### 2. Sync de plano (fallback de webhook perdido)
| Arquivo | Função |
|---------|--------|
| `backend/app/services/stripe_billing.py` | `sync_subscription_from_stripe`: lê assinaturas do customer na Stripe e aplica plano |
| `backend/app/api/v1/billing.py` | `POST /billing/sync` (auth) |
| `frontend/.../billing/page.tsx` | Auto-sync ao voltar do checkout (`?success=1`) + botão “Já paguei — atualizar” |
| `backend/tests/test_billing_webhook.py` | Sync ativa→pro, cancelada→free, sem customer mantém |

## Como resolver a assinatura já paga
1. Colar `STRIPE_WEBHOOK_SECRET` novo no Dokploy e redeploy backend+frontend
2. Entrar em `/app/billing` e clicar **Já paguei — atualizar** (ou voltar do checkout)
3. Plano vira Pro (assinatura `sub_1TwuXN2Q9dtE625Ncvzkhl7d` ativa)

## Análise
O sync remove o ponto único de falha do webhook para ativação de plano: o webhook
segue sendo o caminho principal (cancelamentos, renovações), mas o usuário nunca fica
pago-sem-Pro por causa de configuração de endpoint. Próximo passo natural: job diário
de reconciliação para todos os usuários com `stripe_customer_id`.
