# Step-by-step 018 — Fix porta 3000 no Dokploy

## Problema
`Bind for 0.0.0.0:3000 failed: port is already allocated`

## Solução
- `docker-compose.yml` sem bind de host (`expose` + `dokploy-network`)
- Domínios pelo painel Domains do Dokploy (Traefik)
- Local: usar `docker-compose.local.yml`
