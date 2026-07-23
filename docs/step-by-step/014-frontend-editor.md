# 014 — Frontend: dashboard, editor de cartão e QR/print

**Data:** 2026-07-22  
**Branch/worktree:** `feat/mycartao-saas` (`.worktrees/feat-mycartao-saas`)

## Objetivo

Entregar a área autenticada: listar/criar cartões, editar perfil+fields e painel de QR/PDF com download via blob (cookies cross-origin).

## O que foi feito

1. Layout `/app` com nav (Cartões, Portfólio, Analytics, Cobrança, Configurações).
2. Dashboard: `GET /me` + `GET /cards`; 401 → `/login`; CTA `POST /cards`.
3. `CardEditor`: `PATCH /cards/{id}` + `PATCH /me` (display_name, headline, theme); avatar `POST /media/upload`.
4. `QrPanel`: preview PNG via `apiFetch` → object URL; downloads PNG/SVG/print.pdf.
5. `apiFetch` não força `Content-Type` em `FormData` (multipart).

## Arquivos e utilidade

| Arquivo | Função |
|---------|--------|
| `frontend/src/lib/api.ts` | Cliente HTTP + `API_BASE`; FormData-safe |
| `frontend/src/app/app/layout.tsx` | Shell autenticado + nav |
| `frontend/src/app/app/page.tsx` | Lista de cartões + criar |
| `frontend/src/app/app/cards/[id]/page.tsx` | Rota do editor |
| `frontend/src/app/app/cards/[id]/qr/page.tsx` | Rota QR/print |
| `frontend/src/components/CardEditor.tsx` | Formulário cartão + perfil + avatar |
| `frontend/src/components/QrPanel.tsx` | Preview e downloads blob |
| `docs/step-by-step/014-frontend-editor.md` | Este registro |

## Verificação

```bash
cd frontend && npm run build
```

Fluxo: login → `/app` → criar cartão → editar → QR/print.

## Reflexão (escalabilidade / manutenção)

Editor e QR ficam em componentes client isolados das rotas App Router, o que facilita reuso e testes. Downloads via blob evitam falha de cookie em `<img>` cross-origin. Próximo passo: Task 14 — páginas públicas, Presence, portfólio, billing e admin (nav já aponta para essas rotas).
