# Step-by-step 022 — Mídia same-origin (sem prompt de permissão)

## Problema
Ao anexar avatar no cartão, o celular pedia permissão (rede local / outros apps).

## Causa
O upload devolvia URL absoluta do MinIO (`http://localhost:9000/...` ou `minio:9000`).
O `<img>` tentava abrir esse host no dispositivo do usuário.

## Correção
1. `public_url()` passa a retornar `/api/v1/media/files/{bucket_key}`
2. Nova rota `GET /api/v1/media/files/{bucket_key}` faz proxy do objeto no MinIO
3. Frontend: `toMediaSrc()` normaliza URLs antigas do MinIO
4. Links de vCard usam path relativo (sem `API_BASE` absoluto)

## Arquivos
| Arquivo | Função |
|---------|--------|
| `backend/app/services/minio_client.py` | URL same-origin + `open_object` |
| `backend/app/api/v1/media.py` | Proxy GET de arquivos |
| `frontend/src/lib/media.ts` | Normalização de URL de mídia |
| `frontend/src/components/CardEditor.tsx` | Preview/save com URL same-origin |
| `frontend/src/app/c/...` | Avatar e vCard no domínio do site |

## Dokploy
Redeploy com rebuild de **frontend** e **backend**.
Não exponha MinIO no Traefik para o browser.
