# 008 — QR, Print PDF e vCard

**Data:** 2026-07-22  
**Branch/worktree:** `feat/mycartao-saas` (`.worktrees/feat-mycartao-saas`)

## Objetivo

Exportar cartão autenticado como QR (PNG/SVG), PDF de impressão (watermark no Free) e vCard (auth + público).

## O que foi feito

1. **TDD:** `tests/test_exports.py` — content-types PNG/SVG/PDF/vCard + rota pública.
2. Serviços: `qr.py` (URL `{PUBLIC_APP_URL}/c/{slug|id}`), `print_pdf.py` (ReportLab + watermark Free), `vcard.py` (vCard 3.0).
3. Rotas em `exports.py` montadas em `/cards` e `/public/cards`.
4. Commit: `feat: add QR, print PDF and vCard exports`.

## Arquivos e utilidade

| Arquivo | Função |
|---------|--------|
| `backend/app/services/qr.py` | Gera QR PNG/SVG; resolve slug ou id |
| `backend/app/services/print_pdf.py` | PDF A4; watermark se Free |
| `backend/app/services/vcard.py` | Monta `.vcf` a partir de profile + fields |
| `backend/app/api/v1/exports.py` | Endpoints auth + vCard público |
| `backend/app/api/v1/__init__.py` | Registra routers de exports |
| `backend/tests/test_exports.py` | Content-type e smoke dos exports |
| `docs/step-by-step/008-qr-print-vcard.md` | Este registro |

## Endpoints

- `GET /api/v1/cards/{id}/qr?format=png|svg` — auth
- `GET /api/v1/cards/{id}/print.pdf` — auth; watermark se `user.plan == free`
- `GET /api/v1/cards/{id}/vcard.vcf` — auth
- `GET /api/v1/public/cards/{slug_or_id}/vcard.vcf` — público

## Verificação

```bash
cd backend && .venv/bin/pytest tests/test_exports.py -v
```

## Reflexão (escalabilidade / manutenção)

Serviços de geração ficam desacoplados das rotas: dá para cachear QR/PDF por `(card_id, slug, plan)` ou mover para worker sem mudar a API. O watermark é uma flag de plano, não um template separado — quando o Print Kit Pro ganhar layouts, extrair templates e manter a mesma interface `generate_print_pdf(..., watermark=)`. Próximo passo natural: embutir o PNG do QR no PDF de impressão.
