# 045 — Personalização robusta + Leads + Assinatura de e-mail

## Parte 1 — Personalização

- `PATCH /me/slug` aceita `null`/vazio e limpa o slug (Pro).
- Settings: link + slug dentro do form; desmarcar personalizar + salvar limpa.
- `ThemePicker` compartilhado (Settings + CardEditor) com swatches.
- Temas Free mais distintos em `card-theme.ts` + CSS.
- `CardLivePreview` ao vivo em Settings e Editor.
- Presence Mode aplica tema/cor da marca.

## Parte 2 — Leads

- Migration `c3d4e5f6a7b8`: tabela `leads` + `profiles.lead_capture_enabled`.
- `POST /api/v1/public/cards/{slug_or_id}/leads`
- `GET/DELETE /api/v1/leads`
- Form no cartão público + página `/app/leads` + item na sidebar.
- Toggle em Configurações.

## Parte 3 — Assinatura

- `frontend/src/lib/email-signature.ts` gera HTML.
- Preview + “Copiar HTML” nas Configurações.

## Validação

- `pytest` (slug clear + leads)
- `tsc` / lint / build frontend
