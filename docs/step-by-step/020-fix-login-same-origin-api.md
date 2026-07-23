# Step-by-step 020 — Fix login same-origin API

## Problema
Login no celular pedia permissão para “outros apps/serviços” e falhava com “Falha de rede”.

## Causa
`NEXT_PUBLIC_API_URL=http://localhost:8000` estava no bundle do frontend.
O navegador tentava abrir localhost no **dispositivo do usuário**.

## Correção
- Browser chama só `/api/...` no mesmo domínio do site
- Next.js faz rewrite/proxy para `http://backend:8000`
- Sem segundo host → sem prompt de permissão

## Dokploy
1. Redeploy com rebuild da imagem `frontend`
2. Em Environment:
   - `PUBLIC_APP_URL=https://SEU-DOMINIO-FRONTEND`
   - `CORS_ORIGINS=https://SEU-DOMINIO-FRONTEND`
   - `NEXT_PUBLIC_API_URL=` (vazio / remover)
3. Domínio Traefik só no **frontend** (porta 3000) — a API passa pelo proxy
