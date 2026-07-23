# 027 — Editor + cartão público com custom links

**Data:** 2026-07-23  
**Branch:** `feat/links-avatar-api-ui`  
**Task:** 4 (links-avatar-api-ui)

## Objetivo

Permitir que usuários Pro editem `fields.custom_links` no editor do cartão e exibir esses links no cartão público e no Presence Mode. Free vê upsell para `/app/billing`.

## O que cada arquivo faz

| Arquivo | Função |
|---|---|
| `frontend/src/lib/custom-links.ts` | Tipo `CustomLink`, `parseCustomLinks`, `sortCustomLinks`, `newCustomLink`, `reindexCustomLinks` e whitelist de ícones |
| `frontend/src/components/CustomLinksEditor.tsx` | UI Free (upsell) / Pro (CRUD + reorder ↑↓) |
| `frontend/src/components/CardEditor.tsx` | Carrega `plan` via whoami, estado `customLinks`, PATCH com `custom_links` só se Pro; trata `403 custom_links_pro_only` |
| `frontend/src/app/c/[slugOrId]/page.tsx` | Botões full-width dos links sob campos clássicos |
| `frontend/src/app/c/[slugOrId]/presence/page.tsx` | Até 3 links texto secundários abaixo do vCard |

## Alterações

1. Helpers de parse/sort/reindex alinhados ao shape do backend.
2. Editor Pro: title, url, icon select, adicionar/remover/↑/↓ (cap 20).
3. Free: mensagem + CTA Cobrança; PATCH omite a chave `custom_links`.
4. Público: `<a target="_blank" rel="noopener noreferrer">` em coluna.
5. Presence: `slice(0, 3)` como links texto sob “Salvar contato”.

## Verificação

- `npx tsc --noEmit` — ok
- `npm run build` — ok

## Próximos passos

- Task 5: UI Smart Card `/app/smart`
- Considerar extrair seções do `CardEditor` (arquivo > 400 linhas) no refresh de layout (Task 6)
