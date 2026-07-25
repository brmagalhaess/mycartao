# 041 — Redesign interno: sidebar, central de assinatura e admin automático

## Contexto

Feedback do usuário: o interior do sistema estava "feio e confuso, cheio de link
pra tudo", não havia lugar para ver/cancelar a assinatura nem histórico de
faturas, e não existia forma de definir `bruno.magalhaess@gmail.com` como admin.

## O que foi feito

### 1. Admin automático por e-mail (`ADMIN_EMAILS`)

- `backend/app/config.py`: nova setting `admin_emails` (lista separada por
  vírgula) + helper `admin_email_set()` (case-insensitive).
- `backend/app/services/auth.py`: no `verify_magic_link`, se o e-mail estiver
  em `ADMIN_EMAILS`, o usuário é promovido a `plan=admin` (novo ou existente).
  Basta fazer login de novo para virar admin.
- `docker-compose.yml` e `.env.example`: variável `ADMIN_EMAILS` com default
  `bruno.magalhaess@gmail.com`.
- **Como usar no Dokploy:** adicione `ADMIN_EMAILS=bruno.magalhaess@gmail.com`
  nas variáveis do backend e faça redeploy. No próximo login desse e-mail, a
  conta vira admin e o item "Admin" aparece na navegação.

### 2. Central de assinatura (backend)

Novos endpoints em `/api/v1/billing` (`backend/app/api/v1/billing.py` +
`backend/app/services/stripe_billing.py`):

| Endpoint | Função |
| --- | --- |
| `GET /subscription` | Visão geral: plano, status, fim do período, cancelamento agendado |
| `POST /cancel` | Cancela no fim do período pago (`cancel_at_period_end=True`) |
| `POST /resume` | Desfaz o cancelamento agendado |
| `GET /history` | Faturas direto da Stripe (data, valor, status, link) |

Decisões:

- Cancelamento é sempre "no fim do período" — o usuário não perde o que pagou.
- Faturas não são armazenadas localmente; vêm da Stripe sob demanda.
- Se a Stripe estiver fora do ar, `GET /subscription` devolve o snapshot do DB.

### 3. Novo shell do app (frontend)

- `frontend/src/components/AppShell.tsx` (novo): sidebar fixa no desktop com
  **um item por função** (ícone + nome curto): Cartões, Portfólio, Avatar,
  Smart, Analytics, Assinatura, Configurações e Admin (só para admins). No
  mobile, header com barra horizontal de pílulas roláveis.
- `frontend/src/app/app/layout.tsx`: passa a usar o `AppShell`.
- `frontend/src/app/admin/layout.tsx` (novo): `/admin` agora usa o mesmo shell
  (antes ficava sem navegação).
- `frontend/src/components/AppNav.tsx`: **removido** (substituído pelo shell).
- `frontend/src/app/globals.css`: utility `.scrollbar-none` para a barra móvel.

### 4. Página Assinatura (frontend)

`frontend/src/app/app/billing/page.tsx` reescrita como central de assinatura:

- Card do plano com badge de status, data de renovação/fim, aviso de
  cancelamento agendado.
- Botão **Cancelar assinatura** (com confirmação) e **Retomar assinatura**.
- Tabela de **histórico de faturas** (data, valor, status, link "Ver" para a
  fatura hospedada na Stripe).
- Fluxos existentes mantidos: assinar Pro, "Já paguei — atualizar" (sync) e
  banner de modo teste.
- Tudo traduzido (pt/en/es) via novo namespace `billing` nos dicionários.

## Arquivos alterados

- `backend/app/config.py` — `admin_emails` + `admin_email_set()`
- `backend/app/services/auth.py` — promoção a admin no login
- `backend/app/services/stripe_billing.py` — overview, cancel, resume, invoices
- `backend/app/api/v1/billing.py` — 4 novos endpoints
- `backend/tests/test_admin_emails.py` — novo (3 testes)
- `backend/tests/test_billing_webhook.py` — +4 testes (overview/cancel/history)
- `frontend/src/components/AppShell.tsx` — novo shell com sidebar
- `frontend/src/components/AppNav.tsx` — removido
- `frontend/src/app/app/layout.tsx` — usa AppShell
- `frontend/src/app/admin/layout.tsx` — novo, usa AppShell
- `frontend/src/app/app/billing/page.tsx` — central de assinatura
- `frontend/src/lib/i18n/dictionaries/{pt,en,es}.ts` — namespace `billing`
- `frontend/src/app/globals.css` — `.scrollbar-none`
- `docker-compose.yml`, `.env.example` — `ADMIN_EMAILS`

## Validação

- Backend: `python3 -m pytest -q` → **94 passed**.
- Frontend: `npx tsc --noEmit`, `npm run lint` e `npm run build` → ok.

## Próximos passos sugeridos

- Configurar `ADMIN_EMAILS` no Dokploy e fazer login para ativar o admin.
- Avaliar o Stripe Customer Portal como alternativa (gestão de método de
  pagamento incluída) — exige configuração no dashboard da Stripe.
