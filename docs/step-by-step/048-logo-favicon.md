# 048 — Logo e favicon (fechamento: docs + build)

**Data:** 2026-08-12  
**Branch/worktree:** `feat/logo-favicon` em `.worktrees/feat-logo-favicon`  
**Escopo:** documentação consolidada das Tasks 1–2 + verificação `npm run build`

## Objetivo

Registrar arquivos, paleta, uso na UI e comandos de verificação do monograma MC / favicon, e confirmar que o frontend compila sem erros após a remoção do `favicon.ico` legado.

## Paleta (cores)

| Token | Hex | Uso |
|-------|-----|-----|
| Teal | `#0f766e` | Letras MC nos SVGs; hover tipográfico (`text-teal-deep`) |
| Paper | `#faf8f5` | Fundo arredondado do mark / favicon |
| Ink | `#0c2a2e` | Wordmark no lockup SVG; texto “MyCartao” no `BrandLockup` (`text-ink`) |

Sem filtros, glow ou dependências novas.

## Arquivos — função e utilidade

| Arquivo | Função / utilidade |
|---------|-------------------|
| `frontend/public/brand/logo-mark.svg` | Mark 32×32 (paths MC); URL estática `/brand/logo-mark.svg` usada pelo `BrandLockup` |
| `frontend/public/brand/logo-lockup.svg` | Lockup 160×32 (mark + wordmark serif); asset estático `/brand/logo-lockup.svg` (referência/export) |
| `frontend/src/app/icon.svg` | Favicon App Router (Next.js 15); mesmo monograma do mark |
| `frontend/src/components/BrandLockup.tsx` | Link de marca: `<img>` do mark + texto “MyCartao” (`sm`/`md`) |
| `frontend/src/app/page.tsx` | Landing: `BrandLockup` no header (`href="/"`, `size="sm"`) |
| `frontend/src/components/AppShell.tsx` | App autenticado: lockup na sidebar desktop (`md`) e header mobile (`sm`), `href="/app"` |
| ~~`frontend/src/app/favicon.ico`~~ | **Removido** na Task 1 fix (`5c6d3b3`) para o `icon.svg` MC prevalecer |

## Onde aparece na UI

1. **Landing (`/`)** — header sticky: mark + “MyCartao” via `BrandLockup`.
2. **App shell (`/app/*`)** — sidebar (desktop) e topo (mobile): mesma marca, link para `/app`.
3. **Aba do navegador** — `app/icon.svg` como favicon (sem `favicon.ico` concorrente).

O wordmark do UI é tipografia CSS (`font-display`), não o texto embutido de `logo-lockup.svg`.

## Comandos de verificação

```bash
cd frontend
npx tsc --noEmit
npm run build
```

- `tsc --noEmit`: checagem de tipos TypeScript.
- `npm run build`: `next build --turbopack` (produção).

**Esperado:** build com sucesso.

## Passos desta Task 3

1. Escrita deste step-by-step `048-logo-favicon.md`
2. `cd frontend && npm run build`
3. Commit: `docs: step-by-step 048 logo and favicon`
4. Relatório em `.superpowers/sdd/logo-task-3-report.md`

## Relação com 047

O `047` cobre a criação dos SVGs (Task 1). Este `048` fecha o ciclo: UI (`BrandLockup`), remoção do `favicon.ico`, e prova de build.

## Reflexão (escalabilidade / manutenção)

Assets estáticos + um componente fino (`BrandLockup`) mantêm a marca desacoplada do restante do app e fáceis de cachear. O drift potencial continua sendo a triplicação do path MC (`logo-mark`, `logo-lockup`, `icon.svg`). Próximo passo opcional: gerar `icon.svg`/lockup a partir de um único source no CI, ou documentar checklist visual 16px/32px quando a marca mudar.

**Fora de escopo:** Apple touch icon PNG, push remoto, novas deps.
