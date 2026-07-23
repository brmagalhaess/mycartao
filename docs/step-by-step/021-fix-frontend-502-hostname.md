# Step-by-step 021 — Fix 502 Bad Gateway no frontend

## Problema
`GET https://....sslip.io/ → 502 Bad Gateway`

## Causa comum
Next.js standalone no Docker escuta em `localhost` por padrão.
O Traefik (Dokploy) não consegue alcançar o processo → 502.

## Correção
No `frontend/Dockerfile` (runner):
```
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
```

## Dokploy
Redeploy com **rebuild** da imagem `frontend`.
No Domains: serviço `frontend`, porta `3000`.
