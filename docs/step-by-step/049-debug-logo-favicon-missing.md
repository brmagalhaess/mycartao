# 049 — Debug: logo/favicon não apareciam

## Causa raiz

Os assets e o `BrandLockup` foram implementados na branch
`feat/logo-favicon` (worktree), mas o workspace/`main` só tinha as specs/planos.
Quem rodava o frontend a partir do `main` não tinha:

- `frontend/public/brand/logo-mark.svg`
- `frontend/src/app/icon.svg`
- `BrandLockup` na landing/AppShell

## Correção

Merge de `feat/logo-favicon` → `main` (`f827411`).

## Como validar

1. Reiniciar o `next dev` (ou rebuild do container frontend).
2. Hard refresh no browser (favicon costuma ficar em cache).
3. Conferir `/brand/logo-mark.svg` e `/icon.svg?…` no Network.
