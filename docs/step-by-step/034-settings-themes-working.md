# Step-by-step 034 — Configurações completas + temas que funcionam

## Problema
Configurações eram simples; tema/cor não apareciam no cartão público
(API não devolvia e a UI pública não aplicava).

## Correção
1. `PublicCardResponse` com display_name, headline, bio, theme, brand_color, branding
2. Temas Free (minimal/classic/bold) e Pro (sand/ink) aplicados via CSS vars
3. Cor da marca só Pro (403 Free)
4. Configurações: hub com **um único link** (comum grátis / personalizado Pro),
   perfil Free, aparência Free+Pro

## Arquivos principais
| Arquivo | Função |
|---------|--------|
| `backend/app/schemas/card.py` | PublicCardResponse |
| `backend/app/services/cards.py` | to_public_card_response |
| `backend/app/services/profile.py` | Gate tema/cor |
| `frontend/src/app/app/settings/page.tsx` | Hub de config |
| `frontend/src/lib/card-theme.ts` | Tokens dos temas |
| `frontend/src/app/c/[slugOrId]/page.tsx` | Aplica tema no público |

## Dokploy
Redeploy **frontend + backend**.
