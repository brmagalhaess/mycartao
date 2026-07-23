# 029 — Refresh de layout (app + público)

**Data:** 2026-07-23  
**Branch:** `feat/links-avatar-api-ui`  
**Task:** Task 6 — Refresh de layout (app + público)  
**Nota:** O plano citava `025-links-smart-layout.md`; a sequência local já usava 025–028, por isso este diário é `029`.

## Objetivo

Modernizar shell do app, editor, cartão público, Presence e landing — mantendo Fraunces + DM Sans e paleta teal/sand/ink.

## Alterações

1. **Tokens / motion** (`globals.css`): tokens de max-width, utilitários `.input-field` / `.section-title`, animação `animate-fade`.
2. **Shell** (`app/layout.tsx`): header sticky com `border-line`, blur e espaçamento refinados.
3. **Nav** (`AppNav.tsx`): estado ativo via `usePathname()` (`text-teal` + `aria-current`).
4. **Dashboard**: título display + subtítulo curto.
5. **Editor**: seções Perfil / Contatos / Links / Tema com `border-t border-line pt-8`; split em `CardEditorSections.tsx`.
6. **Custom links**: URL com `type="text"` (evita bloqueio HTML5 no submit).
7. **Público**: avatar maior, nome em destaque, links em coluna com hover teal.
8. **Presence**: tipografia e CTA sand refinados; até 3 links.
9. **Landing**: Developers no nav/hero; seção Pro (links + Smart) abaixo do primeiro viewport.
10. **Pricing / login**: polish leve (features Pro, tipografia).

## Arquivos

| Arquivo | Função |
|---------|--------|
| `frontend/src/app/globals.css` | Tokens, atmosphere, motions, utilitários de form |
| `frontend/src/app/app/layout.tsx` | Shell autenticado sticky |
| `frontend/src/components/AppNav.tsx` | Navegação com item ativo |
| `frontend/src/app/app/page.tsx` | Dashboard de cartões |
| `frontend/src/components/CardEditor.tsx` | Orquestra load/save do editor |
| `frontend/src/components/CardEditorSections.tsx` | Seções Perfil, Contatos, Tema |
| `frontend/src/components/CustomLinksEditor.tsx` | Seção Links (Pro) |
| `frontend/src/app/c/[slugOrId]/page.tsx` | Cartão público |
| `frontend/src/app/c/[slugOrId]/presence/page.tsx` | Presence Mode |
| `frontend/src/app/page.tsx` | Landing + seção Pro |
| `frontend/src/app/pricing/page.tsx` | Preços (features Pro atualizadas) |
| `frontend/src/app/login/page.tsx` | Login magic link |

## Verificação

- `npx tsc --noEmit`
- `npm run build`

## Escalabilidade / manutenção

Separar seções do editor reduz o arquivo monolítico e facilita evoluir cada bloco (ex.: crop de avatar, validação de URL no cliente) sem tocar no fluxo de save. O estado ativo da nav por pathname escala com novas rotas `/app/*` sem props drilling. Próximo passo natural: expor `display_name` / `headline` no payload público da API para o cartão público não depender só de `title`.
