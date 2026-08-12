# 047 — Logo mark, lockup e favicon (Task 1)

**Data:** 2026-08-12  
**Branch/worktree:** `feat/logo-favicon` em `.worktrees/feat-logo-favicon`  
**Commit:** `d0b8b2a` — `feat: add MyCartao MC logo mark and app favicon`

## Objetivo

Entregar os SVGs de marca MyCartao (monograma MC) e o favicon App Router, sem alterar UI/`BrandLockup`.

## Paleta

| Token | Hex | Uso |
|-------|-----|-----|
| Teal | `#0f766e` | Letras MC |
| Paper | `#faf8f5` | Fundo do mark |
| Ink | `#0c2a2e` | Wordmark “MyCartao” |

## Arquivos criados e função

| Arquivo | Função / utilidade |
|---------|-------------------|
| `frontend/public/brand/logo-mark.svg` | Mark 32×32 com MC em paths; servido em `/brand/logo-mark.svg` |
| `frontend/public/brand/logo-lockup.svg` | Lockup 160×32 (mark + “MyCartao”); `/brand/logo-lockup.svg` |
| `frontend/src/app/icon.svg` | Favicon Next.js 15 (mesmo monograma do mark) |
| `.superpowers/sdd/logo-task-1-report.md` | Relatório completo da Task 1 |

## Passos realizados

1. Leitura do brief `.superpowers/sdd/logo-task-1-brief.md`
2. Criação do diretório `frontend/public/brand/`
3. Implementação do mark com paths (melhor legibilidade em 16px vs `<text>`)
4. Lockup com mark + texto serif em ink
5. Cópia do mark para `src/app/icon.svg`
6. Smoke: existência, `xmllint`, cores, sem filter/glow
7. Commit conforme brief (sem push)

## Reflexão (escalabilidade / manutenção)

Centralizar o monograma em SVGs estáticos em `public/brand` e `app/icon.svg` é simples e cacheável, mas há duplicação do path do MC em três arquivos. Para manutenção futura, um único “source of truth” (ex.: gerar `icon.svg` e lockup a partir do mark, ou um snippet compartilhado no build) reduziria drift. Por ora, a duplicação é aceitável: assets pequenos, Task 1 isolada, e a Task 2 poderá referenciar esses paths sem acoplar React ao desenho tipográfico.

**Próximos passos sugeridos:** revisão visual 16px; Task 2 (`BrandLockup`/UI); opcionalmente alinhar ou remover `favicon.ico` legado.

## Escopo excluído

- Componentes UI / BrandLockup
- Push remoto
- Alterações em `.env`
