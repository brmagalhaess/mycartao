# Step-by-step 001 — Brainstorming e spec

**Data:** 2026-07-22  
**Fase:** Descoberta / Design (sem código de aplicação ainda)

## Objetivo

Definir o SaaS MyCartao (cartão de presença) com front, back e banco em containers, pronto para VPS e push no Git.

## Decisões do usuário

1. Escopo **C** — produto completo (analytics, vCard/NFC-ready, temas, admin, Stripe).
2. Pagamentos: **Stripe**.
3. Stack: **Next.js + FastAPI + PostgreSQL**.
4. Auth: **magic link**.
5. E-mail: **Brevo** (API).
6. URLs: Free por **id**, Pro com **slug custom**.
7. Storage: **MinIO** (4º container).
8. Arquitetura: monólito modular FastAPI + Next.js.

## Arquivos criados nesta etapa

| Arquivo | Função |
|---|---|
| `docs/superpowers/specs/2026-07-22-mycartao-saas-design.md` | Spec de design aprovada por seções; fonte da verdade antes do plano de implementação |
| `docs/step-by-step/001-brainstorming-e-spec.md` | Diário desta etapa (este arquivo) |

## Próximos passos

1. Review do usuário na spec.
2. Plano de implementação (`writing-plans`).
3. Scaffold frontend/backend + Docker Compose + implementação por fases.
4. Push do projeto completo para o Git remoto do usuário.
```