# 030 — Fix: Free PATCH preserva `custom_links`

**Data:** 2026-07-23  
**Branch / worktree:** `feat/links-avatar-api-ui` → `.worktrees/feat-links-avatar-api-ui`  
**Task:** Critical #1 (whole-branch review)

## Problema

`update_card` faz replace-all de `fields`. Usuário Free (ex.: após downgrade) que PATCHava só `phone` sem a chave `custom_links` apagava links já persistidos na era Pro.

## Avanços

1. Em `update_card`, após `gate_custom_links`, se plano Free: copia `card.fields["custom_links"]` existente para o novo dict (Free não limpa/modifica links neste path).
2. Pro/admin mantêm o gate atual (podem setar/limpar via `normalize`).
3. Validação opcional: `urlparse` rejeita `https://` sem host.
4. Teste de downgrade + preservação + 403 ao tentar adicionar links como Free.
5. Pytest: `test_custom_links.py` + `test_cards.py`.

## Arquivos

| Arquivo | Função / utilidade |
|---------|-------------------|
| `backend/app/services/cards.py` | Preserva `custom_links` no update para Free |
| `backend/app/services/custom_links.py` | Valida URL http(s) com host via `urlparse` |
| `backend/tests/test_custom_links.py` | Downgrade + preserve + reject hostless URL |

## Reflexão (escalabilidade / manutenção)

A preservação no service de cards evita acoplar o gate de plano à semântica de merge parcial de JSON — Free continua bloqueado para escrever links, e o replace-all deixa de ser destrutivo para dados Pro legados. Se no futuro o PATCH de `fields` virar merge profundo por chave, essa cópia pode ser removida; até lá, o comportamento explícito no update é o contrato mais seguro. Próximo passo: considerar endpoint dedicado Pro para editar links, separando do replace-all dos campos clássicos.
