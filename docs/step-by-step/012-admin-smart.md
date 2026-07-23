# 012 — Admin + Smart rules + Presence redirect

**Data:** 2026-07-22  
**Branch/worktree:** `feat/mycartao-saas` (`.worktrees/feat-mycartao-saas`)

## Objetivo

Expor APIs de admin (lista/planos), CRUD de smart rules (Pro) e endpoint público `/go` que resolve o destino do Smart Card / Presence redirect.

## O que foi feito

1. **TDD:** `tests/test_admin_smart.py` — free → 403 admin/smart; admin lista + PATCH plan; CRUD Pro; `/go` default card, `always→whatsapp`, `hour_range→portfolio`.
2. Services `admin` e `smart_rules` com gates `admin_required` / `plan_required`.
3. Rotas montadas em `/admin`, `/smart-rules` e `/public/go`.
4. Docs step-by-step + commit.

## Arquivos e utilidade

| Arquivo | Função |
|---------|--------|
| `backend/app/services/admin.py` | Gate admin; lista users; atualiza `plan` |
| `backend/app/services/smart_rules.py` | CRUD Pro; avalia condições; monta `{target,url}` |
| `backend/app/api/v1/admin.py` | `GET/PATCH /admin/users` |
| `backend/app/api/v1/smart_rules.py` | CRUD `/smart-rules` + `GET /public/go/{slug_or_id}` |
| `backend/app/schemas/admin.py` | `AdminUserResponse`, `AdminPlanUpdate` |
| `backend/app/schemas/smart_rule.py` | Create/Update/Response + `GoRedirectResponse` |
| `backend/app/api/v1/__init__.py` | Inclui routers admin/smart-rules/public go |
| `backend/tests/test_admin_smart.py` | Cobertura 403/200 e regras mínimas |
| `docs/step-by-step/012-admin-smart.md` | Este registro |

## Endpoints

- `GET /api/v1/admin/users` — só `plan=admin`
- `PATCH /api/v1/admin/users/{id}` — body `{plan: free|pro|admin}`
- CRUD `/api/v1/smart-rules` — Pro/admin
- `GET /api/v1/public/go/{slug_or_id}` → `{target, url}`

## Regras suportadas

```json
{"conditions": {"always": true}, "target": "whatsapp"}
{"conditions": {"hour_range": [9, 18]}, "target": "portfolio"}
```

- Primeira regra que casa (ordem `created_at`) vence; senão `target=card`.
- URLs: card → `/c/{slug|id}`, portfolio → `/p/{slug|id}`, whatsapp → `https://wa.me/{digits}` (fields do cartão primário).

## Verificação

```bash
cd backend
.venv/bin/pytest tests/test_admin_smart.py -v
```

## Reflexão (escalabilidade / manutenção)

Admin e smart rules ficaram em services separados com gates explícitos, alinhados a portfolio/cards (`plan_required` / `admin_required`). O motor de condições é mínimo (`always`, `hour_range`) e fácil de estender (dia da semana, geo, UTM) sem mudar o contrato `{target,url}` do frontend `/go`. Próximos passos: timezone configurável no perfil, prioridade/ordem explícita nas regras, e analytics de redirects Presence.
