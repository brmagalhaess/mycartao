# Step-by-step 041 — Nova landing page

## Objetivo
Substituir a home simples por uma landing page completa, mantendo o design system
existente (paleta paper/sand/teal, Fraunces + DM Sans, animações `rise`/`float`).

## Seções
1. **Header sticky** com blur — Recursos, Preços, Developers, Entrar
2. **Hero em 2 colunas** — headline “Um link. Todos os seus contatos.” + mock visual
   do cartão (avatar, botões, Salvar contato, QR ilustrativo)
3. **Como funciona** — 3 passos (criar → compartilhar → virar contato salvo)
4. **Recursos** — grade com 6 cards (QR/Presence, slug, portfólio, Smart Card,
   analytics, API de avatar)
5. **Free vs Pro** — resumo com link para /pricing
6. **Developers** — faixa com exemplo da URL do avatar
7. **CTA final** — fundo ink com botão sand
8. **Footer** — navegação + copyright

## Arquivos
| Arquivo | Função |
|---------|--------|
| `frontend/src/app/page.tsx` | Landing page (server component, sem JS de cliente) |
| `frontend/src/components/LandingCardPreview.tsx` | Mock do cartão digital com QR ilustrativo |

## Validação
```bash
cd frontend && npm run lint && npx tsc --noEmit
```
Ambos passando.

## Análise
A página é 100% estática (server component) — zero JS extra no cliente além do que o
Next já envia, bom para SEO e performance. O mock do cartão é CSS puro (sem imagem),
então acompanha o design system automaticamente. Conteúdo em arrays no topo facilita
editar textos sem mexer em JSX. Próximo passo natural: metadata OG/Twitter específica
da home e uma imagem `og:image` gerada.
