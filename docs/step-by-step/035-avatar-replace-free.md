# Step-by-step 035 — Trocar avatar é grátis

## Problema
Free só podia enviar 1 avatar; a 2ª tentativa dava `avatar_limit_reached`.

## Correção
- Free pode **substituir** o avatar à vontade
- No replace Free, registros antigos de `MediaAsset` purpose=avatar são removidos
- `profile.avatar_key` aponta sempre para a foto atual
- UI: texto “Avatar (grátis)” + “Pode trocar a foto quando quiser”

## Arquivos
| Arquivo | Função |
|---------|--------|
| `backend/app/api/v1/media.py` | Remove gate Free no replace |
| `backend/tests/test_media.py` | `test_free_can_replace_avatar` |
| `frontend/.../CardEditor*.tsx` | Copy e erro |

## Dokploy
Redeploy **backend** (e frontend para o texto).
