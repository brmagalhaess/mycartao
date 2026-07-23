# 016 — Deploy VPS, Makefile, README e testes finais

**Data:** 2026-07-22  
**Branch/worktree:** `feat/mycartao-saas` (`.worktrees/feat-mycartao-saas`)

## Objetivo

Endurecer o caminho de deploy em VPS (docs + Make targets), consolidar fixtures de teste e validar a suíte backend localmente.

## O que foi feito

1. Makefile: `up`, `down`, `logs`, `test` (compose exec) e `test-local` (pytest no host/venv).
2. README expandido com checklist VPS: DNS, `.env`, compose build, Stripe webhook, Brevo, MinIO, backup Postgres + smoke E2E.
3. `backend/tests/conftest.py` revisado — fixtures `auth_client_free` / `auth_client_pro`, schema SQLite in-memory, limpeza de tabelas e rate limits, mock MinIO.
4. Suíte: `cd backend && python -m pytest -v` (via `.venv`).
5. Commit local apenas (sem push / sem remote novo — controller).

## Arquivos e utilidade

| Arquivo | Função |
|---------|--------|
| `Makefile` | Targets de compose, logs e testes |
| `README.md` | Quick start + checklist VPS + smoke E2E |
| `backend/tests/conftest.py` | Fixtures compartilhadas da suíte |
| `docs/step-by-step/016-deploy-vps-git.md` | Este registro |

## Verificação

```bash
make test-local
# ou: cd backend && .venv/bin/python -m pytest -v
```

## Reflexão (escalabilidade / manutenção)

Separar `test` (Docker) de `test-local` (host) evita bloquear CI/dev quando o compose não está no ar. O checklist VPS no README concentra DNS, secrets, webhook e backup num fluxo único, reduzindo falhas de go-live. Próximo passo operacional: controller faz push; na VPS, validar TLS + webhook Stripe + restore de backup.
