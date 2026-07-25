# Security + UX Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Padronizar confirmações (Radix Dialog) e mensagens (Sonner) com animações, e endurecer upload/proxy de mídia + rate limits em leads/views públicos.

**Architecture:** Frontend ganha `AppProviders` (Toaster) + `ConfirmDialog`/`useConfirm` Promise-based; páginas trocam `window.confirm` e feedbacks de ação por modal/toast. Backend ganha `image_validate.sniff_image_mime` usado no upload e no proxy; leads e analytics reutilizam `check_rate_limit`.

**Tech Stack:** Next.js 15, React 19, `@radix-ui/react-dialog`, `sonner`, Tailwind 4 tokens MyCartao; FastAPI, pytest, rate_limit in-memory existente.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-25-security-ux-feedback-design.md`
- Sem `window.confirm` / `alert` no app após a entrega
- Confirmar: lead, portfólio, smart, cancelar assinatura, limpar slug, logout
- Toast para sucesso/erro de mutações; erros de campo podem ficar inline
- Upload: magic bytes JPEG/PNG/WEBP; proxy: `nosniff` + 404 se não-imagem
- Leads públicos: rate limit; views: no-op após limite (GET do cartão continua 200)
- Não sobrescrever `.env`
- Documentar em `docs/step-by-step/047-security-ux-feedback.md`
- Responder / commits em pt-BR; conventional commits

## File map

| File | Responsibility |
|---|---|
| `backend/app/services/image_validate.py` | Sniff magic bytes → mime ou `None` |
| `backend/app/api/v1/media.py` | Upload valida bytes; proxy nosniff + reject |
| `backend/app/api/v1/leads.py` | Rate limit POST público |
| `backend/app/services/analytics.py` | Rate limit brando em `record_view` (skip) |
| `backend/tests/test_image_validate.py` | Unit sniff |
| `backend/tests/test_media.py` | Upload spoof + proxy reject |
| `backend/tests/test_leads.py` | 429 leads |
| `backend/tests/test_analytics.py` | Views capped silently |
| `frontend/package.json` | deps radix + sonner |
| `frontend/src/components/AppProviders.tsx` | Client wrapper Toaster |
| `frontend/src/app/layout.tsx` | Monta AppProviders |
| `frontend/src/components/ui/ConfirmDialog.tsx` | Radix Dialog estilizado |
| `frontend/src/components/ui/confirm.tsx` | Provider + `useConfirm()` |
| `frontend/src/app/globals.css` | Animações dialog + sonner theme |
| Pages/components listados nas Tasks 5–7 | Wire confirm + toast |
| `docs/step-by-step/047-security-ux-feedback.md` | Registro da entrega |

---

### Task 1: Image magic-byte validation (backend)

**Files:**
- Create: `backend/app/services/image_validate.py`
- Create: `backend/tests/test_image_validate.py`
- Modify: `backend/app/api/v1/media.py`
- Modify: `backend/tests/test_media.py`
- Test: `backend/tests/test_image_validate.py`, `backend/tests/test_media.py`

**Interfaces:**
- Consumes: bytes do upload / proxy
- Produces: `sniff_image_mime(data: bytes) -> Optional[str]` retornando `"image/jpeg"` | `"image/png"` | `"image/webp"` | `None`

- [ ] **Step 1: Write failing unit tests**

```python
# backend/tests/test_image_validate.py
from app.services.image_validate import sniff_image_mime

def test_sniff_png():
    data = b"\x89PNG\r\n\x1a\n" + b"\x00" * 8
    assert sniff_image_mime(data) == "image/png"

def test_sniff_jpeg():
    assert sniff_image_mime(b"\xff\xd8\xff\xe0" + b"\x00" * 8) == "image/jpeg"

def test_sniff_webp():
    data = b"RIFF" + (30).to_bytes(4, "little") + b"WEBP" + b"\x00" * 20
    assert sniff_image_mime(data) == "image/webp"

def test_sniff_rejects_spoof():
    assert sniff_image_mime(b"GIF89a" + b"\x00" * 20) is None
    assert sniff_image_mime(b"") is None
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `cd backend && python3 -m pytest tests/test_image_validate.py -q`
Expected: FAIL (module missing)

- [ ] **Step 3: Implement sniff**

```python
# backend/app/services/image_validate.py
from __future__ import annotations
from typing import Optional

def sniff_image_mime(data: bytes) -> Optional[str]:
    if not data or len(data) < 12:
        return None
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None
```

- [ ] **Step 4: Wire upload + proxy in `media.py`**

No upload, após `data = await file.read()`:

```python
from app.services.image_validate import sniff_image_mime

real_mime = sniff_image_mime(data)
if real_mime is None:
    raise AppError(
        "Arquivo de imagem inválido",
        "invalid_image",
        status_code=400,
    )
# usar real_mime para ext / MediaAsset.mime / upload_bytes (não confiar só no header)
```

No `serve_media_file`: ler bytes do objeto MinIO (buffer completo até 5MB; se maior, 404), sniff; se `None` → `AppError(..., "not_found", 404)`; headers:

```python
headers={
    "Cache-Control": "public, max-age=86400",
    "X-Content-Type-Options": "nosniff",
}
# media_type=real_mime
```

Atualizar `test_serve_media_file_proxies_minio` para streamar PNG válido completo (`png_bytes` do conftest). Adicionar:

```python
def test_upload_rejects_mime_spoof(auth_client_free):
    with patch("app.api.v1.media.minio_client.upload_bytes", side_effect=_fake_upload):
        r = auth_client_free.post(
            "/api/v1/media/upload",
            files={"file": ("a.png", b"not-an-image-content!!", "image/png")},
            data={"purpose": "avatar"},
        )
    assert r.status_code == 400
    assert r.json()["code"] == "invalid_image"

def test_serve_rejects_non_image():
    mock_obj = MagicMock()
    mock_obj.headers = {"Content-Type": "image/png"}
    mock_obj.stream.return_value = iter([b"<?php evil"])
    with patch("app.api.v1.media.minio_client.open_object", return_value=mock_obj):
        r = TestClient(fastapi_app).get("/api/v1/media/files/user/avatar/x.png")
    assert r.status_code == 404
```

- [ ] **Step 5: Run tests — expect PASS**

Run: `cd backend && python3 -m pytest tests/test_image_validate.py tests/test_media.py -q`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/image_validate.py backend/app/api/v1/media.py \
  backend/tests/test_image_validate.py backend/tests/test_media.py
git commit -m "fix: validate image magic bytes on upload and media proxy"
```

---

### Task 2: Rate limit public leads + analytics views

**Files:**
- Modify: `backend/app/api/v1/leads.py`
- Modify: `backend/app/services/analytics.py`
- Modify: `backend/tests/test_leads.py`
- Modify: `backend/tests/test_analytics.py`
- Test: mesmos

**Interfaces:**
- Consumes: `check_rate_limit(key, max_requests=...)` de `app.core.rate_limit`
- Produces: leads POST → 429 `rate_limited`; `record_view` retorna sem gravar se limited (tipo `Optional[CardView]`)

- [ ] **Step 1: Write failing lead rate-limit test**

Em `test_leads.py`, após helper que cria card público:

```python
def test_public_lead_rate_limited(auth_client_free):
    from app.core.rate_limit import clear_rate_limits
    clear_rate_limits()
    card = auth_client_free.post("/api/v1/cards", json={"title": "L", "fields": {}}).json()
    # enable lead capture on profile if required by create_public_lead
    body = {"name": "A", "email": "a@example.com", "message": "oi"}
    client = TestClient(app)
    for _ in range(10):
        r = client.post(f"/api/v1/public/cards/{card['id']}/leads", json=body)
        assert r.status_code in (201, 400)  # 400 se captura desligada — ligar no setup
    r = client.post(f"/api/v1/public/cards/{card['id']}/leads", json=body)
    assert r.status_code == 429
    assert r.json()["code"] == "rate_limited"
```

Ajustar setup para `lead_capture_enabled=True` (PATCH `/me` ou direto no DB como nos testes existentes de leads).

- [ ] **Step 2: Run — expect FAIL (no 429)**

Run: `python3 -m pytest tests/test_leads.py::test_public_lead_rate_limited -q`

- [ ] **Step 3: Implement lead rate limit**

```python
# leads.py create_public_lead
from fastapi import Request
from app.core.errors import AppError
from app.core.rate_limit import check_rate_limit

def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For") or request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip() or "unknown"
    if request.client and request.client.host:
        return request.client.host
    return "unknown"

def create_public_lead(..., request: Request, ...):
    ip = _client_ip(request)
    if not check_rate_limit(f"lead:{ip}:{slug_or_id}", max_requests=10):
        raise AppError(
            "Muitas tentativas. Tente novamente em alguns minutos.",
            "rate_limited",
            status_code=429,
        )
    return leads_service.create_public_lead(...)
```

- [ ] **Step 4: Analytics view skip**

```python
# analytics.py record_view
from app.core.rate_limit import check_rate_limit
from typing import Optional

def record_view(...) -> Optional[CardView]:
    ip = _client_ip(request) or "unknown"
    key = f"view:{ip}:{card.id}"
    if not check_rate_limit(key, max_requests=60):
        return None
    # ... existing create ...
```

Caller em `cards.py` public GET já ignora retorno — ok.

Teste:

```python
def test_public_view_rate_limit_skips_extra(auth_client_free, card_id):
    from app.core.rate_limit import clear_rate_limits
    clear_rate_limits()
    client = TestClient(app)
    for _ in range(60):
        assert client.get(f"/api/v1/public/cards/{card_id}").status_code == 200
    before = auth_client_free.get("/api/v1/analytics/summary", params={"days": 7}).json()["views"]
    assert client.get(f"/api/v1/public/cards/{card_id}").status_code == 200
    after = auth_client_free.get("/api/v1/analytics/summary", params={"days": 7}).json()["views"]
    assert after == before
```

- [ ] **Step 5: Run tests PASS**

Run: `python3 -m pytest tests/test_leads.py tests/test_analytics.py -q`

- [ ] **Step 6: Commit**

```bash
git add backend/app/api/v1/leads.py backend/app/services/analytics.py \
  backend/tests/test_leads.py backend/tests/test_analytics.py
git commit -m "fix: rate limit public leads and soft-cap card views"
```

---

### Task 3: Install Sonner + Radix Dialog; AppProviders + Toaster

**Files:**
- Modify: `frontend/package.json` (via npm)
- Create: `frontend/src/components/AppProviders.tsx`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/globals.css`

**Interfaces:**
- Consumes: `sonner` Toaster
- Produces: app tree wrapped; `toast` importável de `sonner` em qualquer client component

- [ ] **Step 1: Install deps**

```bash
cd frontend && npm install @radix-ui/react-dialog sonner
```

- [ ] **Step 2: AppProviders**

```tsx
// frontend/src/components/AppProviders.tsx
"use client";

import { Toaster } from "sonner";

export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        closeButton
        toastOptions={{
          classNames: {
            toast: "mycartao-toast",
            title: "mycartao-toast-title",
            description: "mycartao-toast-description",
          },
        }}
      />
    </>
  );
}
```

- [ ] **Step 3: Root layout**

```tsx
import AppProviders from "@/components/AppProviders";
// inside body:
<I18nProvider locale={locale} dict={dict}>
  <AppProviders>{children}</AppProviders>
</I18nProvider>
```

- [ ] **Step 4: CSS theme + dialog animation**

Em `globals.css` adicionar:

```css
@keyframes dialog-overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes dialog-content-in {
  from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
.dialog-overlay { animation: dialog-overlay-in 160ms ease-out; }
.dialog-content { animation: dialog-content-in 180ms ease-out; }

.mycartao-toast {
  background: var(--paper) !important;
  color: var(--ink) !important;
  border: 1px solid var(--line) !important;
  box-shadow: 0 8px 28px rgba(12, 42, 46, 0.12) !important;
  font-family: var(--font-dm-sans), ui-sans-serif, sans-serif !important;
}
[data-sonner-toast][data-type="success"] { border-color: rgba(15, 118, 110, 0.35) !important; }
[data-sonner-toast][data-type="error"] { border-color: rgba(185, 28, 28, 0.35) !important; }
```

- [ ] **Step 5: Verify build**

Run: `cd frontend && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add frontend/package.json frontend/package-lock.json \
  frontend/src/components/AppProviders.tsx frontend/src/app/layout.tsx \
  frontend/src/app/globals.css
git commit -m "feat: add Sonner toaster and AppProviders"
```

---

### Task 4: ConfirmDialog + useConfirm

**Files:**
- Create: `frontend/src/components/ui/ConfirmDialog.tsx`
- Create: `frontend/src/components/ui/confirm.tsx`
- Modify: `frontend/src/components/AppProviders.tsx` (envolver ConfirmProvider)

**Interfaces:**
- Consumes: `@radix-ui/react-dialog`
- Produces:

```ts
type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

function useConfirm(): (opts: ConfirmOptions) => Promise<boolean>;
```

- [ ] **Step 1: Implement ConfirmDialog (presentational)**

```tsx
// frontend/src/components/ui/ConfirmDialog.tsx
"use client";

import * as Dialog from "@radix-ui/react-dialog";

type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export default function ConfirmDialog({
  open, title, description, confirmLabel = "Confirmar", cancelLabel = "Cancelar",
  destructive, busy, onConfirm, onOpenChange,
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px]" />
        <Dialog.Content className="dialog-content fixed left-1/2 top-1/2 z-50 w-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-paper p-6 shadow-xl focus:outline-none">
          <Dialog.Title className="font-display text-xl font-semibold text-ink">
            {title}
          </Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-2 text-sm text-ink-soft">
              {description}
            </Dialog.Description>
          ) : null}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" disabled={busy}
              className="rounded-md border border-line px-4 py-2.5 text-sm font-medium text-ink transition hover:border-teal/40 disabled:opacity-60"
              onClick={() => onOpenChange(false)}>
              {cancelLabel}
            </button>
            <button type="button" disabled={busy}
              className={
                destructive
                  ? "rounded-md bg-red-700 px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-red-800 disabled:opacity-60"
                  : "rounded-md bg-teal px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-teal-deep disabled:opacity-60"
              }
              onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 2: ConfirmProvider + useConfirm**

```tsx
// frontend/src/components/ui/confirm.tsx
"use client";

import {
  createContext, useCallback, useContext, useMemo, useRef, useState,
} from "react";
import ConfirmDialog from "./ConfirmDialog";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmCtx = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({ title: "" });
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((next) => {
    setOpts(next);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const finish = useCallback((value: boolean) => {
    setOpen(false);
    resolver.current?.(value);
    resolver.current = null;
  }, []);

  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmCtx.Provider value={value}>
      {children}
      <ConfirmDialog
        open={open}
        title={opts.title}
        description={opts.description}
        confirmLabel={opts.confirmLabel}
        cancelLabel={opts.cancelLabel}
        destructive={opts.destructive}
        onConfirm={() => finish(true)}
        onOpenChange={(v) => { if (!v) finish(false); }}
      />
    </ConfirmCtx.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}
```

- [ ] **Step 3: Wrap in AppProviders**

```tsx
import { ConfirmProvider } from "@/components/ui/confirm";
// ...
<ConfirmProvider>
  {children}
  <Toaster ... />
</ConfirmProvider>
```

- [ ] **Step 4: tsc PASS**

Run: `cd frontend && npx tsc --noEmit`

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/ConfirmDialog.tsx \
  frontend/src/components/ui/confirm.tsx \
  frontend/src/components/AppProviders.tsx
git commit -m "feat: add ConfirmDialog and useConfirm provider"
```

---

### Task 5: Wire destructive confirms (leads, portfolio, smart, billing)

**Files:**
- Modify: `frontend/src/app/app/leads/page.tsx`
- Modify: `frontend/src/app/app/portfolio/page.tsx`
- Modify: `frontend/src/app/app/smart/page.tsx`
- Modify: `frontend/src/app/app/billing/page.tsx`

**Interfaces:**
- Consumes: `useConfirm()`, `toast` from `sonner`
- Produces: zero `window.confirm` nesses arquivos

- [ ] **Step 1: leads `onDelete`**

```tsx
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm";

const confirm = useConfirm();

async function onDelete(id: string) {
  const ok = await confirm({
    title: "Excluir este lead?",
    description: "Esta ação não pode ser desfeita.",
    confirmLabel: "Excluir",
    destructive: true,
  });
  if (!ok) return;
  const res = await apiFetch(`/api/v1/leads/${id}`, { method: "DELETE" });
  if (!res.ok) {
    toast.error("Não foi possível excluir.");
    return;
  }
  toast.success("Lead excluído.");
  // refresh list...
}
```

- [ ] **Step 2: portfolio `onDelete`** — mesmo padrão (`"Remover este item do portfólio?"`).

- [ ] **Step 3: smart `onDelete`** — `"Remover esta regra Smart?"`.

- [ ] **Step 4: billing cancel** — trocar `window.confirm(opts.confirm)` por:

```tsx
const ok = await confirm({
  title: t.cancelConfirmTitle ?? "Cancelar assinatura?",
  description: typeof opts.confirm === "string" ? opts.confirm : t.cancelConfirm,
  confirmLabel: t.cancel ?? "Cancelar plano",
  destructive: true,
});
if (!ok) return;
// on success: toast.success(...); on error: toast.error(...)
```

Se i18n não tiver `cancelConfirmTitle`, usar string PT no título e manter `t.cancelConfirm` na description (ou adicionar chave mínima em `pt/en/es` só se já houver padrão de billing strings).

- [ ] **Step 5: Grep zero confirms**

Run: `rg "window\\.confirm" frontend/src`
Expected: sem matches (ou só fora do escopo — não deve restar)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/app/leads/page.tsx frontend/src/app/app/portfolio/page.tsx \
  frontend/src/app/app/smart/page.tsx frontend/src/app/app/billing/page.tsx
git commit -m "feat: replace confirms with modal and toasts on destructive actions"
```

---

### Task 6: Confirm slug clear + logout; toast on saves

**Files:**
- Modify: `frontend/src/app/app/settings/page.tsx`
- Modify: `frontend/src/components/AppShell.tsx`
- Modify: `frontend/src/components/CardEditor.tsx` (toast save/upload)
- Modify: `frontend/src/components/QrPanel.tsx` (toast erro/sucesso download)
- Modify: `frontend/src/components/LeadCaptureForm.tsx` (toast success + erro 429)

**Interfaces:**
- Consumes: `useConfirm`, `toast`
- Produces: logout e clear-slug com modal; mutações com toast

- [ ] **Step 1: Logout in AppShell**

```tsx
const confirm = useConfirm();
async function onLogout() {
  const ok = await confirm({
    title: "Sair da conta?",
    description: "Você precisará do magic link para entrar de novo.",
    confirmLabel: "Sair",
    destructive: true,
  });
  if (!ok) return;
  setLoggingOut(true);
  try {
    await apiFetch("/api/v1/auth/logout", { method: "POST" });
    toast.success("Sessão encerrada.");
  } finally {
    router.replace("/");
  }
}
```

- [ ] **Step 2: Settings logout** — mesma confirmação se existir botão sair.

- [ ] **Step 3: Clear slug** — quando o save for persistir `slug: null` (desmarcar personalização ou limpar):

```tsx
const clearingSlug = /* true se estava com slug e agora envia null */;
if (clearingSlug) {
  const ok = await confirm({
    title: "Remover link personalizado?",
    description: "Seus links /c/{slug} e /p/{slug} deixam de funcionar. O ID do cartão continua válido.",
    confirmLabel: "Remover slug",
    destructive: true,
  });
  if (!ok) return;
}
```

Após save ok: `toast.success("Configurações salvas.")` (pode manter ou remover `setMessage` inline).

- [ ] **Step 4: CardEditor** — `toast.success("Alterações salvas.")` / avatar; `toast.error` nos falhas.

- [ ] **Step 5: QrPanel** — toast em falha de download; success opcional ao baixar PDF/PNG.

- [ ] **Step 6: LeadCaptureForm** — em 201 `toast.success("Obrigado! Contato enviado.")`; em 429 mensagem rate limit; manter `done` state se quiser esconder o form.

- [ ] **Step 7: tsc + lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: PASS (ou só warnings pré-existentes)

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/app/settings/page.tsx frontend/src/components/AppShell.tsx \
  frontend/src/components/CardEditor.tsx frontend/src/components/QrPanel.tsx \
  frontend/src/components/LeadCaptureForm.tsx
git commit -m "feat: confirm logout and slug clear; toast on saves"
```

---

### Task 7: Docs step-by-step + full verification

**Files:**
- Create: `docs/step-by-step/047-security-ux-feedback.md`
- Modify: (nenhum código salvo se já verde)

- [ ] **Step 1: Write step-by-step**

Conteúdo mínimo: objetivo, arquivos, matriz de confirms, hardening mídia/rate limit, comandos de validação (`pytest` count, `tsc`).

- [ ] **Step 2: Full backend suite**

Run: `cd backend && python3 -m pytest -q`
Expected: all passed

- [ ] **Step 3: Frontend build**

Run: `cd frontend && npm run build`
Expected: success

- [ ] **Step 4: Final grep**

```bash
rg "window\\.confirm|\\balert\\(" frontend/src
```

Expected: no matches

- [ ] **Step 5: Commit docs**

```bash
git add docs/step-by-step/047-security-ux-feedback.md
git commit -m "docs: step-by-step 047 security and UX feedback"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|---|---|
| Radix Dialog + Sonner | 3, 4 |
| Toaster root layout | 3 |
| ConfirmDialog + useConfirm | 4 |
| Confirms: lead, portfolio, smart, billing cancel | 5 |
| Confirms: slug clear, logout | 6 |
| Toasts success/error mutações | 5, 6 |
| Magic bytes upload | 1 |
| Proxy nosniff + reject non-image | 1 |
| Rate limit leads | 2 |
| Soft rate limit views | 2 |
| Tests backend | 1, 2, 7 |
| step-by-step 047 | 7 |
| Fora de escopo Redis/CSRF/magic-link query | documentado na spec (sem task) |

## Self-review notes

- Sem placeholders TBD.
- `sniff_image_mime` e `useConfirm` nomes consistentes em todas as tasks.
- View rate limit **não** retorna 429 no GET público (alinhado à spec).
