# 2026-07-25 — Segurança + UX de feedback (modal, toast, animações)

## Objetivo

Padronizar confirmações e mensagens no app com **modal** e **toast** animados,
e endurecer os principais riscos de segurança identificados (mídia + rate limits
públicos), sem mudar o modelo de auth cookie JWT.

## Decisões aprovadas

| Decisão | Escolha |
|---|---|
| Escopo | UX + hardening de segurança (opção B) |
| Stack UI | `@radix-ui/react-dialog` + `sonner` (opção B) |
| Confirmações | Destrutivas + limpar slug + logout (opção C) |
| Visual | Tema MyCartao (tokens ink/teal/paper/line); animações Dialog + Sonner |

## Escopo

### Dentro

**Frontend — feedback**

1. Instalar `@radix-ui/react-dialog` e `sonner`.
2. `Toaster` no layout raiz (`frontend/src/app/layout.tsx`) para cobrir app + admin + login.
3. Componente `ConfirmDialog` (wrapper Radix) com:
   - título, descrição, botão cancelar, botão confirmar;
   - variante destrutiva (vermelho) para delete/cancelar assinatura;
   - focus trap / Escape / clique no overlay (padrão Radix);
   - animação de overlay (fade) e conteúdo (fade + scale leve).
4. Hook ou helper `useConfirm()` (Promise) opcional para não espalhar estado de open/close em cada página.
5. Substituir `window.confirm` e cobrir:
   - excluir lead;
   - excluir item de portfólio;
   - remover regra Smart;
   - cancelar assinatura;
   - limpar slug personalizado (antes de persistir `{ slug: null }` / desmarcar);
   - logout (AppShell e/ou settings).
6. Toast (`toast.success` / `toast.error` / `toast.message`) para:
   - sucesso/erro de save (settings, editor, portfolio, smart);
   - sucesso/erro de delete (após confirm);
   - billing (subscribe sync, cancel, resume);
   - upload de avatar / falhas de QR-print;
   - “Copiado!” em share/assinatura/API (onde hoje só muda o texto do botão).
7. Manter `role="alert"` inline só onde fizer sentido para formulários (erro de campo); feedback de ação → toast.
8. Estilizar Sonner com CSS variables do `globals.css` (sem tema roxo default).

**Backend — segurança**

1. **Magic bytes no upload** (`media.py` / serviço de validação):
   - após ler o arquivo, validar assinatura JPEG / PNG / WEBP;
   - rejeitar com `400` + código `invalid_image` se Content-Type mentir;
   - manter limite 5MB.
2. **Proxy de mídia** (`GET /media/files/{key}`):
   - `X-Content-Type-Options: nosniff`;
   - se o objeto não for imagem reconhecida pelos magic bytes → `404` ou `attachment` (preferência: **404** para não servir polyglots);
   - Content-Type derivado da assinatura real, não só do valor armazenado se divergir.
3. **Rate limit leads públicos**: `POST /public/cards/{id}/leads` — por IP (+ opcional card id), janela curta (ex. 10 / 15 min), reutilizar `app.core.rate_limit`.
4. **Rate limit views**: clamp brando em `record_view` do cartão público (ex. 60 / 15 min por IP+card) para reduzir spam de analytics.

### Fora de escopo (só documentar)

- Rate limit distribuído (Redis) para multi-réplica.
- Remover token do magic link da query string (fluxo POST one-time).
- CSRF token explícito além de `SameSite=lax` + CORS allowlist.
- UI de exclusão de cartão (API já existe; não entra nesta entrega).
- Trocar MinIO public-read por signed URLs (mudança maior de arquitetura).

## Arquitetura frontend

```
app/layout.tsx
  └── <Toaster />          # sonner, theme MyCartao

components/ui/
  ConfirmDialog.tsx        # Radix Dialog estilizado
  (opcional) useConfirm.ts # Promise-based confirm

lib/toast.ts               # re-export tipado / defaults (opcional)
```

Fluxo de confirmação:

1. Usuário clica ação destrutiva.
2. Abre `ConfirmDialog` (ou `await confirm({...})`).
3. Cancelar → fecha, sem side-effect.
4. Confirmar → executa API; toast success/error; fecha dialog.

## Arquitetura backend

```
services/image_validate.py   # sniff magic bytes → mime real ou None
api/v1/media.py              # upload usa validate; proxy usa nosniff + reject
api/v1/leads.py              # rate_limit no POST público
api/v1/cards.py (public)     # rate_limit brando em record_view
core/rate_limit.py           # helpers existentes / chaves novas
```

## Tratamento de erros

| Caso | UX |
|---|---|
| API 4xx/5xx em mutação | `toast.error` com mensagem amigável |
| 429 rate limit (lead) | toast ou mensagem no form público: “Muitas tentativas…” |
| Upload inválido | toast/inline “Arquivo de imagem inválido” |
| Confirm cancelado | silêncio (sem toast) |

## Testes

**Backend**

- Upload com bytes não-imagem e `Content-Type: image/png` → 400 `invalid_image`.
- Upload PNG válido → 201.
- Proxy de chave com conteúdo não-imagem → 404.
- Lead público acima do limite → 429.
- View pública: muitas requests do mesmo IP não quebram o GET do cartão (view pode ser no-op após limite).

**Frontend**

- Smoke manual: cada confirm listado; toast após save/delete.
- Sem regressão de a11y básica (foco no dialog, Escape fecha).

## Critérios de aceite

1. Nenhum `window.confirm` / `alert` no frontend do app.
2. Logout, limpar slug e deletes listados usam modal.
3. Ações de sucesso/erro principais usam toast animado.
4. Upload rejeita polyglot/MIME spoof.
5. Proxy de mídia não serve conteúdo não-imagem.
6. Leads públicos rate-limited.
7. Docs: `docs/step-by-step/047-security-ux-feedback.md`.

## Riscos / notas

- Sonner e Radix precisam de `"use client"` nos wrappers.
- Rate limit in-memory continua por processo (já é o padrão do projeto); documentar limitação.
- Não sobrescrever `.env`.
