# Step-by-step 033 — Links de compartilhar cartão e portfólio

## Pedido
Links para compartilhar cartão e portfólio: comum grátis; personalizado (slug) pago.

## Entrega
- Componente `ShareLinksBlock`: URL comum + URL Pro (slug) + Copiar/Abrir
- Dashboard (`/app`): bloco cartão principal + portfólio
- Editor do cartão: bloco de compartilhar
- Portfólio: bloco no topo
- Preços atualizados (Free = link por ID; Pro = slug)

## Arquivos
| Arquivo | Função |
|---------|--------|
| `frontend/src/components/ShareLinksBlock.tsx` | UI de compartilhar |
| `frontend/src/app/app/page.tsx` | Dashboard + shares |
| `frontend/src/components/CardEditor.tsx` | Share no editor |
| `frontend/src/app/app/portfolio/page.tsx` | Share do portfólio |
| `frontend/src/app/pricing/page.tsx` | Copy Free/Pro |

## Dokploy
Redeploy/rebuild do frontend.
