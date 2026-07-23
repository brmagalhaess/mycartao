# 026 — Backend `custom_links` (Pro gate)

**Data:** 2026-07-23  
**Branch / worktree:** `feat/links-avatar-api-ui` → `.worktrees/feat-links-avatar-api-ui`  
**Task:** Task 3 (SDD links-avatar-api-ui)

## Objetivo

Persistir `fields.custom_links` apenas para planos Pro/admin, com validação de shape/URL e soft cap de 20 links.

## Avanços

1. **TDD — testes falhando** em `backend/tests/test_custom_links.py`
   - Free não pode PATCH/POST com `custom_links` não vazio → `403 custom_links_pro_only`
   - Free pode enviar `custom_links: []` junto com campos clássicos
   - Pro salva link válido
   - URL não-http → `400 invalid_custom_link`
   - >20 links → `400 too_many_custom_links`
2. **Implementação** `backend/app/services/custom_links.py`
   - `normalize_custom_links(raw)`
   - `gate_custom_links(user, fields)` (+ alias `assert_custom_links_allowed`)
3. **Integração** em `create_card` / `update_card` (`backend/app/services/cards.py`)
4. Pytest: `test_custom_links.py` + `test_cards.py` → 12 passed
5. Commit: `feat: Pro-only custom_links validation on cards`

## Arquivos

| Arquivo | Função / utilidade |
|---------|-------------------|
| `backend/app/services/custom_links.py` | Normaliza/valida lista de links; gate de plano Pro |
| `backend/app/services/cards.py` | Aplica o gate em create/update quando `fields` está presente |
| `backend/tests/test_custom_links.py` | Cobertura do gate e validação via API |

## Shape persistido

```json
{
  "id": "string",
  "title": "1–60 chars",
  "url": "http(s)://...",
  "icon": "link|globe|calendar|shop|video|music|null",
  "sort": 0
}
```

## Reflexão (escalabilidade / manutenção)

A validação ficou isolada do CRUD de cards, o que facilita evoluir regras (ícones, limites por plano) sem inchá-lo. O soft cap de 20 e a whitelist de ícones são constantes locais — se o produto ganhar tiers intermediários, extrair limites para config/planos evita branching espalhado. Próximo passo natural: UI do editor + render público ordenando por `sort`.
