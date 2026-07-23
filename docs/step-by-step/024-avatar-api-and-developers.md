# Step-by-step — Tasks 1–2: Avatar API + página Developers

**Data:** 2026-07-23  
**Branch/worktree:** `feat/links-avatar-api-ui` (`.worktrees/feat-links-avatar-api-ui`)  
**Status:** Task 2 concluída (Task 1 documentada em `025-avatar-api-publica.md`)

## Objetivo

Documentar e publicar a página `/developers` com exemplos de consumo do endpoint público de avatar, e ligar a landing a essa página.

## Avanços (Task 2)

1. Criada `frontend/src/app/developers/page.tsx` — client component com atmosphere/Fraunces/DM Sans, tabs por linguagem e snippets HTML, JavaScript, Next.js, Python, PHP e cURL.
2. Landing (`frontend/src/app/page.tsx`): link **Developers** no header + CTA secundário no hero.
3. Verificação: `npx tsc --noEmit` / `npm run build` no frontend.
4. Commit: `feat: developers page with avatar API examples including Next.js`.

## Arquivos

| Arquivo | Função |
|---------|--------|
| `frontend/src/app/developers/page.tsx` | Página estática/client de documentação da API pública de avatar; tabs de exemplos |
| `frontend/src/app/page.tsx` | Landing: nav + CTA para `/developers` |
| `docs/step-by-step/024-avatar-api-and-developers.md` | Este registro (Tasks 1–2) |
| `docs/step-by-step/025-avatar-api-publica.md` | Detalhe da Task 1 (backend) |

## Endpoint consumido

`GET /api/v1/public/avatar?email=&s=` (same-origin). O e-mail deve ser o cadastrado no MyCartao; a resposta é o avatar do perfil ou placeholder SVG.

## Escalabilidade / manutenibilidade

A página concentra snippets em um mapa tipado (`SNIPPETS`) e um único `<pre>`, o que evita seis blocos duplicados no DOM e facilita adicionar linguagens. Como client component, o custo de JS é baixo; se a página crescer (guia de erros, rate limits, OpenAPI), extrair `CodeTabs` e metadados de snippet para um módulo server-friendly reduz bundle e permite `metadata` SEO específico. Próximo passo: metadata `title`/`description` em layout ou via wrapper server + client só nas tabs.
