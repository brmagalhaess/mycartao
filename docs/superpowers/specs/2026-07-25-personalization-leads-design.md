# 2026-07-25 — Personalização robusta, leads e assinatura de e-mail

## Objetivo

Corrigir personalização (slug/temas/preview), capturar leads no cartão público
e gerar assinatura de e-mail — alinhado a HiHello/Popl/Wave/Blinq.

## Escopo entregue

1. Clear de slug via `PATCH /me/slug` com `null`
2. ThemePicker unificado + temas Free distintos + preview ao vivo
3. Presence com `themeStyleVars`
4. Tabela `leads` + inbox `/app/leads` + form “Deixar contato”
5. Assinatura HTML nas Configurações

Ver implementação em `docs/step-by-step/045-personalization-leads-signature.md`.
