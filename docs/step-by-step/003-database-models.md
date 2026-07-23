# 003 — Database models + Alembic + error handling

**Data:** 2026-07-22  
**Branch/worktree:** `feat/mycartao-saas` (`.worktrees/feat-mycartao-saas`)

## Objetivo

Implementar a camada de persistência do backend: modelos SQLAlchemy alinhados à spec, migration inicial Alembic, `get_db()`, e handler global `AppError` com payload `{detail, code}`.

## O que foi feito

1. Teste smoke TDD (`tests/test_models_smoke.py`) — falhou primeiro por ausência de `app.db` / models.
2. Criados `db.py`, models, `core/errors.py`, `deps.py` e registro do handler em `main.py`.
3. Alembic inicializado; revision `initial schema` gerada; Dockerfile CMD passa a rodar `alembic upgrade head && uvicorn ...`.
4. Smoke test verde com SQLite in-memory (host sem Docker/Postgres).
5. Doc Task1 de fix renomeado para `003a-fix-minio-healthcheck-api-url.md` para liberar o número `003` desta task.

## Arquivos e utilidade

| Arquivo | Função |
|---------|--------|
| `backend/app/db.py` | Engine, `SessionLocal`, `Base`, `get_db()`; suporte SQLite (StaticPool) para testes |
| `backend/app/deps.py` | Reexporta `get_db` para injeção de dependências |
| `backend/app/core/errors.py` | `AppError` + `app_error_handler` → JSON `{detail, code}` |
| `backend/app/models/user.py` | Usuário (`plan`, Stripe customer) |
| `backend/app/models/auth_token.py` | Tokens magic link (hash, expiração, uso) |
| `backend/app/models/profile.py` | Perfil + slug único nullable |
| `backend/app/models/card.py` | Cartões com `fields` JSON |
| `backend/app/models/portfolio.py` | Itens de portfólio |
| `backend/app/models/media.py` | Assets MinIO |
| `backend/app/models/analytics.py` | Views de cartão |
| `backend/app/models/billing.py` | Assinaturas Stripe |
| `backend/app/models/smart_rule.py` | Regras Presence/Smart Card |
| `backend/alembic.ini` + `alembic/` | Migrações; URL via `settings.database_url` |
| `backend/tests/conftest.py` | `DATABASE_URL` SQLite + `create_all` para smoke local |
| `backend/tests/test_models_smoke.py` | Cria `User` e valida `id`/`plan` |
| `backend/Dockerfile` | Migra schema antes de subir a API |

## Verificação

```bash
cd backend
DATABASE_URL=sqlite+pysqlite:///:memory: .venv/bin/pytest tests/test_models_smoke.py -v
DATABASE_URL=sqlite+pysqlite:///./alembic_upgrade_test.db .venv/bin/alembic upgrade head
```

Sem Docker no host: smoke via SQLite. Em Compose, usar Postgres e `alembic upgrade head` no boot do container.

## Reflexão (escalabilidade / manutenção)

Models ficaram em módulos por domínio (<250 linhas), com FKs e cascades claros — facilita evoluir schema por feature. O bridge SQLite no `db.py`/`conftest` desbloqueia CI/local sem Docker, mas a fonte da verdade de produção continua Postgres; a migration usa tipos portáveis (`Uuid`, `JSON`). Próximo passo natural: endpoints Auth (Task 3) consumindo `User` + `MagicLinkToken` e `get_db`.
