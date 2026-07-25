# 043 — Carrossel deslizante + páginas de link sem duplicata

## Contexto

Feedback: o hero “não parecia carrossel” porque 2 cards sumiam e outros 2
apareciam (crossfade). Também as páginas com links mostravam 2 entradas para
o mesmo destino (campos clássicos + custom links, ou link comum + slug).

## O que foi feito

### 1. Carrossel hero com slide horizontal

`LandingHeroCards.tsx` reescrito:

- Trilha triplicada com `translateX` — os cards **deslizam** um a um.
- Dois cards visíveis + peek do próximo (máscara à direita).
- Auto-avanço a cada 3,2s, setas e dots; pausa no hover.
- Um único CTA por card (“Salvar contato”), sem botão Contact duplicado.

### 2. Cartão público `/c/` — layout moderno, 1 botão por link

`frontend/src/app/c/[slugOrId]/page.tsx`:

- Avatar centralizado, nome, cargo e bio.
- Stack único estilo Linktree: WhatsApp/telefone, e-mail, site, LinkedIn,
  Instagram e `custom_links` viram **botões clicáveis**.
- Deduplicação por URL/host — se o mesmo site está no campo clássico e em
  custom link, aparece só uma vez.
- CTA primário único: “Salvar contato”; portfólio vira link de texto abaixo.

### 3. Compartilhar — um link só

`ShareLinksBlock.tsx`:

- Mostra **apenas o link principal** (slug Pro se existir; senão o comum).
- Upsell de slug vira uma linha de texto, não um segundo campo.

## Validação

- `npx tsc --noEmit`, `npm run lint`, `npm run build`
