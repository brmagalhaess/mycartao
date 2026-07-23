# 028 — UI Smart Card `/app/smart`

**Data:** 2026-07-23  
**Branch:** `feat/links-avatar-api-ui`  
**Task:** Task 5 — UI Smart Card

## Objetivo

Expor CRUD de smart-rules para usuários Pro e upsell para Free, com link público `/go/{slug|id}` copiável.

## Alterações

1. Criada página `frontend/src/app/app/smart/page.tsx`.
2. Adicionado item **Smart** em `AppNav` (`/app/smart`).
3. Free: texto explicativo + CTA para `/app/billing`.
4. Pro/admin: listagem, criação (sempre ou `hour_range`), delete com `confirm`, bloco “Seu link Smart” + Copiar.

## Arquivos

| Arquivo | Função |
|---------|--------|
| `frontend/src/app/app/smart/page.tsx` | UI Smart Card: whoami/me/smart-rules, upsell Free, CRUD Pro |
| `frontend/src/lib/smart-rules.ts` | Tipos, labels e helpers de conditions (`always` / `hour_range`) |
| `frontend/src/components/AppNav.tsx` | Nav com item Smart |

## Conditions (API)

- Sempre: `{ "always": true }`
- Horário: `{ "hour_range": [hora_inicio, hora_fim] }` (espelha `test_admin_smart.py` / service)

## Verificação

- `npx tsc --noEmit`
- `npm run build`
