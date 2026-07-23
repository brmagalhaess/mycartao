# 013 — Frontend: shell, auth magic link, landing e preços

**Data:** 2026-07-22  
**Branch/worktree:** `feat/mycartao-saas` (`.worktrees/feat-mycartao-saas`)

## Objetivo

Entregar a casca de marketing + login por magic link no Next.js: landing, preços, pedido de link, verificação com cookie e placeholder `/app`.

## O que foi feito

1. `apiFetch` com `credentials: "include"` e base `NEXT_PUBLIC_API_URL`.
2. Design tokens teal/ink + sand em `globals.css`; fontes Fraunces + DM Sans no layout.
3. Landing full-bleed (marca hero-level, 1 headline, 1 subtítulo, CTAs).
4. Login `POST /api/v1/auth/magic-link`; verify `GET /api/v1/auth/verify?token=` → `/app`.
5. Página de preços Free/Pro (pt-BR) e placeholder Dashboard em `/app`.

## Arquivos e utilidade

| Arquivo | Função |
|---------|--------|
| `frontend/src/lib/api.ts` | Cliente HTTP com cookies de sessão |
| `frontend/src/app/layout.tsx` | Metadata pt-BR + next/font (Fraunces, DM Sans) |
| `frontend/src/app/globals.css` | Tokens, atmosfera, animações leves |
| `frontend/src/app/page.tsx` | Landing marketing |
| `frontend/src/app/login/page.tsx` | Formulário magic link |
| `frontend/src/app/auth/verify/page.tsx` | Consome token, seta cookie via API, redirect |
| `frontend/src/app/pricing/page.tsx` | Comparativo Free vs Pro |
| `frontend/src/app/app/page.tsx` | Placeholder autenticado (Task 13) |

## Verificação

```bash
cd frontend && npm run build
```

Smoke manual: pedir magic link no login (log `[brevo-dev]` no backend) e abrir `/auth/verify?token=…`.

## Reflexão (escalabilidade / manutenção)

`apiFetch` centraliza CORS/cookies; páginas de auth ficam finas e fáceis de testar. O design tokens em CSS variáveis evita drift visual nas tasks seguintes (dashboard/editor). Próximo passo: Task 13 — dashboard real consumindo `/me` e cards.
