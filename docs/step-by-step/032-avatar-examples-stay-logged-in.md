# Step-by-step 032 — Exemplos da API Avatar sem sair do login

## Problema
“Ver exemplos de código” ia para `/developers` (página pública), e o usuário
parecia deslogado (sumia o menu do app).

## Correção
- Exemplos abrem **na mesma página** `/app/api` (toggle), com AppNav intacto
- Snippets compartilhados em `lib/avatar-api-snippets.ts` + `AvatarCodeExamples`
- `/developers` continua pública para marketing; aponta para o painel logado

## Arquivos
| Arquivo | Função |
|---------|--------|
| `frontend/src/app/app/api/page.tsx` | Toggle de exemplos in-app |
| `frontend/src/components/AvatarCodeExamples.tsx` | Abas de código |
| `frontend/src/lib/avatar-api-snippets.ts` | Snippets por linguagem |
| `frontend/src/app/developers/page.tsx` | Reusa o componente |

## Dokploy
Redeploy/rebuild do frontend.
