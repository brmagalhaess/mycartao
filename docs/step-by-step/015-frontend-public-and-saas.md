# 015 — Frontend: páginas públicas, Presence, SaaS UI

**Data:** 2026-07-22  
**Branch/worktree:** `feat/mycartao-saas` (`.worktrees/feat-mycartao-saas`)

## Objetivo

Entregar rotas públicas (cartão, Presence Mode, portfólio, go) e área autenticada (portfólio, analytics, billing, settings, admin), com nav atualizada e QR client-side.

## O que foi feito

1. Público `/c/[slugOrId]` — fetch `/api/v1/public/cards/...`; fields + vcard + link Presence/portfólio.
2. Presence Mode fullscreen — foto, QR (`qrcode` npm → URL do cartão), “Salvar contato” via `/vcard.vcf`.
3. Público `/p/[slugOrId]` e `/go/[slugOrId]` (redirect após `public/go`).
4. App: CRUD portfólio, analytics (summary + SVG by_day), billing checkout Stripe, settings (slug Pro, theme, brand_color, logout).
5. Admin `/admin` — tabela de users se `plan=admin`; nav com link Admin + logout real.
6. Dependência: `qrcode` + `@types/qrcode`.

## Arquivos e utilidade

| Arquivo | Função |
|---------|--------|
| `frontend/src/app/c/[slugOrId]/page.tsx` | Cartão público |
| `frontend/src/app/c/[slugOrId]/presence/page.tsx` | Presence Mode fullscreen |
| `frontend/src/app/p/[slugOrId]/page.tsx` | Portfólio público |
| `frontend/src/app/go/[slugOrId]/page.tsx` | Smart redirect |
| `frontend/src/app/app/portfolio/page.tsx` | Gerenciar itens |
| `frontend/src/app/app/analytics/page.tsx` | Summary + gráfico SVG |
| `frontend/src/app/app/billing/page.tsx` | Assinar Pro → Stripe |
| `frontend/src/app/app/settings/page.tsx` | Slug/tema/cor/logout |
| `frontend/src/app/admin/page.tsx` | Tabela admin users |
| `frontend/src/components/AppNav.tsx` | Nav + Admin + logout |
| `frontend/src/app/app/layout.tsx` | Shell com AppNav |
| `docs/step-by-step/015-frontend-public-and-saas.md` | Este registro |

## Verificação

```bash
cd frontend && npm run build
```

## Reflexão (escalabilidade / manutenção)

Páginas públicas e autenticadas compartilham `apiFetch`/`API_BASE` e o design system (atmosphere, Fraunces/DM Sans), o que mantém consistência sem acoplar SSR. O QR client-side evita endpoint autenticado no Presence. Próximo passo: Task 15 — harden deploy, README e testes finais.
