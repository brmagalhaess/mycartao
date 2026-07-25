# 042 — Hero da landing no estilo do carrossel do Gravatar

## Contexto

O usuário enviou um screenshot do hero do Gravatar: texto grande à esquerda
sobre uma faixa de cor, e à direita **dois cartões de perfil grandes e
realistas** (avatar, nome, cargo, ícones sociais, bio e botões), um deles
deslocado para baixo. Nosso carrossel anterior era um marquee de miniaturas —
visual bem diferente.

## O que foi feito

### 1. Novo componente `LandingHeroCards`

`frontend/src/components/LandingHeroCards.tsx` (novo, client):

- Dois cartões de perfil grandes lado a lado, o segundo com offset vertical
  (como no screenshot de referência).
- Cada cartão tem: avatar (gradiente com iniciais), nome em destaque, cargo,
  fileira de ícones (verificado, telefone, Instagram, trabalho, site), bio de
  2–3 linhas e botões "Contato" (outline) e "Salvar contato" (preenchido).
- **Carrossel**: 6 personas em 3 pares, com troca automática a cada 6s via
  crossfade suave e dots clicáveis para navegação manual.

### 2. Hero em duas colunas

`frontend/src/app/page.tsx`:

- Hero deixou de ser centralizado: agora é grid `1fr auto` no desktop — texto
  (badge, título, subtítulo, CTAs) à esquerda e cartões à direita.
- Faixa de fundo tonalizada (`from-sand/60 via-paper to-mist/70`) delimitada
  por borda inferior, ecoando o bloco de cor do hero do Gravatar.
- No mobile, texto centralizado com os cartões empilhados abaixo.

### 3. Limpeza

- `frontend/src/components/LandingCarousel.tsx` **removido** (marquee antigo).
- CSS do marquee (`marquee-scroll`, `.marquee-track`, `.marquee-mask`)
  removido de `globals.css`.

### 4. i18n

Novos textos em `landing` nos três dicionários (pt/en/es):

- `cardContact` / `cardSave` — rótulos dos botões dos cartões.
- `personas` — 6 perfis (nome, cargo, bio) traduzidos por idioma.

## Arquivos alterados

- `frontend/src/components/LandingHeroCards.tsx` — novo
- `frontend/src/components/LandingCarousel.tsx` — removido
- `frontend/src/app/page.tsx` — hero em duas colunas com faixa de cor
- `frontend/src/app/globals.css` — CSS do marquee removido
- `frontend/src/lib/i18n/dictionaries/{pt,en,es}.ts` — personas e rótulos

## Validação

- `npx tsc --noEmit`, `npm run lint` e `npm run build` → ok.
