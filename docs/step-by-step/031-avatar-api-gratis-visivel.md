# Step-by-step 031 — API Avatar visível e grátis no app

## Problema
A API estilo Gravatar já existia (`GET /api/v1/public/avatar`), mas não aparecia
de forma clara no painel — usuário Free não via como usar.

## Decisão de produto
- **Grátis:** API de avatar por e-mail (embed em outros sistemas)
- **Pro:** personalizar links no cartão + Smart Card

## Alterações
| Arquivo | Função |
|---------|--------|
| `frontend/src/app/app/api/page.tsx` | Painel Free: URL + preview + copiar |
| `frontend/src/components/AppNav.tsx` | Item **API Avatar** |
| `frontend/src/app/pricing/page.tsx` | Free lista a API de avatar |
| `frontend/src/app/page.tsx` | Seção Free da API separada do Pro |
| `frontend/src/app/developers/page.tsx` | Snippets com origin real + badge Grátis |

## Dokploy
Redeploy/rebuild do **frontend**.
