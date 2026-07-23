# Links, Avatar API, Smart UI & Layout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar avatar público por e-mail, página `/developers` (com Next.js), links custom + Smart UI (Pro) e refresh visual do app + páginas públicas.

**Architecture:** Avatar resolve e-mail → mídia same-origin (stream/placeholder). Links custom vivem em `card.fields.custom_links` com gate Pro no service. Smart UI consome CRUD `/smart-rules` existente. Layout evolui tokens/CSS e componentes sem novo framework.

**Tech Stack:** FastAPI, SQLAlchemy, pytest, Next.js App Router, Tailwind CSS v4, TypeScript.

## Global Constraints

- Respostas em pt-BR na UI.
- Browser nunca fala com MinIO/localhost direto — só `/api/...` same-origin.
- Free: sem `custom_links` persistidos; Smart Card UI com upsell.
- Pro/admin: links custom (soft cap 20) + Smart Rules.
- Avatar: `GET /api/v1/public/avatar?email=&s=` — e-mail inválido 400; demais casos 200 (imagem ou SVG placeholder).
- Dev page: exemplos HTML, JS, **Next.js**, Python, PHP, cURL.
- Documentar avanços em `docs/step-by-step/`.
- Spec: `docs/superpowers/specs/2026-07-23-links-avatar-api-ui-design.md`.

---

## File map

| File | Responsibility |
|------|----------------|
| `backend/app/services/avatar.py` | Resolve e-mail → bytes + content-type ou SVG placeholder |
| `backend/app/api/v1/avatar.py` | Router público `/public/avatar` |
| `backend/app/api/v1/__init__.py` | Monta router avatar |
| `backend/app/services/cards.py` | Valida `custom_links` no create/update |
| `backend/app/services/custom_links.py` | Normalize/validate lista de links |
| `backend/tests/test_avatar.py` | Testes avatar |
| `backend/tests/test_custom_links.py` | Testes gate Pro |
| `frontend/src/lib/custom-links.ts` | Tipos + helpers de links |
| `frontend/src/components/CustomLinksEditor.tsx` | UI editor Pro |
| `frontend/src/components/CardEditor.tsx` | Integra links + sync |
| `frontend/src/app/developers/page.tsx` | Docs + exemplos |
| `frontend/src/app/app/smart/page.tsx` | UI Smart Rules |
| `frontend/src/components/AppNav.tsx` | Item Smart + polish |
| `frontend/src/app/c/[slugOrId]/page.tsx` | Links públicos + layout |
| `frontend/src/app/c/[slugOrId]/presence/page.tsx` | Presence polish + CTAs |
| `frontend/src/app/globals.css` | Tokens / motion |
| `frontend/src/app/page.tsx` | Link Dev + polish landing |
| `frontend/src/app/app/layout.tsx` | Shell polish |

---

### Task 1: Avatar API pública

**Files:**
- Create: `backend/app/services/avatar.py`
- Create: `backend/app/api/v1/avatar.py`
- Create: `backend/tests/test_avatar.py`
- Modify: `backend/app/api/v1/__init__.py`
- Modify: `backend/app/api/v1/media.py` (opcional: ao upload `purpose=avatar`, setar `profile.avatar_key = bucket_key`)

**Interfaces:**
- Produces: `resolve_avatar(db, email: str, size: int) -> tuple[bytes, str]` e rota `GET /api/v1/public/avatar`
- Consumes: `User`, `Profile`, `MediaAsset`, `minio_client.open_object`, `Card` primary fields.avatar

- [ ] **Step 1: Write failing tests**

```python
# backend/tests/test_avatar.py
from unittest.mock import MagicMock, patch

def test_avatar_invalid_email(client_or_auth):
    from fastapi.testclient import TestClient
    from app.main import app
    r = TestClient(app).get("/api/v1/public/avatar", params={"email": "not-an-email"})
    assert r.status_code == 400
    assert r.json()["code"] == "invalid_email"

def test_avatar_unknown_email_returns_svg_placeholder():
    from fastapi.testclient import TestClient
    from app.main import app
    r = TestClient(app).get(
        "/api/v1/public/avatar",
        params={"email": "nobody-xyz@example.com"},
    )
    assert r.status_code == 200
    assert "image/svg" in r.headers["content-type"]
    assert b"<svg" in r.content.lower()

def test_avatar_with_media_streams_bytes(auth_client_free, png_bytes):
    # after login, upload avatar mocked, then GET public avatar by email
    ...
```

- [ ] **Step 2: Run tests — expect FAIL (route missing)**

Run: `cd backend && python3 -m pytest tests/test_avatar.py -q`  
Expected: FAIL import/404

- [ ] **Step 3: Implement service + route**

```python
# backend/app/services/avatar.py — essentials
import re
from email.utils import parseaddr

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def normalize_email(raw: str) -> str:
    return (raw or "").strip().lower()

def is_valid_email(email: str) -> bool:
    return bool(EMAIL_RE.match(email))

def clamp_size(s: int | None) -> int:
    if s is None:
        return 200
    return max(80, min(512, int(s)))

def placeholder_svg(label: str, size: int) -> bytes:
    initial = (label[:1] or "?").upper()
    # return UTF-8 SVG with circle + text, width/height=size

def resolve_avatar(db, email: str, size: int) -> tuple[bytes, str]:
    # 1) User by email
    # 2) Profile.avatar_key → minio open_object → read all
    # 3) else latest MediaAsset purpose=avatar for owner
    # 4) else primary card fields.avatar path → extract bucket key after /media/files/
    # 5) else placeholder_svg(display_name or email, size)
```

```python
# backend/app/api/v1/avatar.py
@public_router.get("")
def public_avatar(email: str, s: int | None = None, request: Request, db: Session = Depends(get_db)):
    # rate limit key f"avatar:{client_ip}" max_requests=120
    # validate email → AppError invalid_email 400
    # data, ctype = resolve_avatar(...)
    # return Response(content=data, media_type=ctype, headers={"Cache-Control": "public, max-age=3600"})
```

Mount: `api_router.include_router(avatar.public_router, prefix="/public/avatar", tags=["public"])`

On `POST /media/upload` when `purpose == "avatar"`: set `profile.avatar_key = bucket_key` and commit.

- [ ] **Step 4: Run tests — expect PASS**

Run: `python3 -m pytest tests/test_avatar.py -q`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/avatar.py backend/app/api/v1/avatar.py backend/app/api/v1/__init__.py backend/app/api/v1/media.py backend/tests/test_avatar.py
git commit -m "feat: public avatar API by email"
```

---

### Task 2: Página `/developers`

**Files:**
- Create: `frontend/src/app/developers/page.tsx`
- Modify: `frontend/src/app/page.tsx` (nav + CTA Developers)
- Create: `docs/step-by-step/024-avatar-api-and-developers.md` (pode cobrir Tasks 1–2)

**Interfaces:**
- Consumes: path público `/api/v1/public/avatar?email=`
- Produces: página estática client/server com snippets

- [ ] **Step 1: Create page with code samples**

Usar componente client ou server com blocos `<pre><code>`. Incluir tabs simples por linguagem (botões que setam `lang` state) ou seções empilhadas.

Snippets obrigatórios (URL relativa ou `https://SEU_DOMINIO`):

1. **HTML:** `<img src="/api/v1/public/avatar?email=voce@email.com&s=200" alt="" width="200" height="200" />`
2. **JavaScript:** `const url = \`${origin}/api/v1/public/avatar?email=${encodeURIComponent(email)}\`;`
3. **Next.js:**

```tsx
// app/components/MyCartaoAvatar.tsx
export function MyCartaoAvatar({ email }: { email: string }) {
  const src = `/api/v1/public/avatar?email=${encodeURIComponent(email)}&s=128`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={128} height={128} className="rounded-full" />
  );
}
```

4. **Python:** `requests.get(f"{base}/api/v1/public/avatar", params={"email": email})`
5. **PHP:** `file_get_contents($base.'/api/v1/public/avatar?email='.urlencode($email));`
6. **cURL:** `curl -L "$BASE/api/v1/public/avatar?email=voce@email.com&s=200" -o avatar.bin`

Texto: e-mail deve ser o cadastrado no MyCartao; foto = avatar do perfil.

- [ ] **Step 2: Link from landing**

Em `page.tsx` header: link `Developers` → `/developers`. Opcional segundo CTA.

- [ ] **Step 3: Manual smoke**

Run: `cd frontend && npm run build` (ou `npx tsc --noEmit` se build pesado)  
Expected: sem erro de tipo na página.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/developers/page.tsx frontend/src/app/page.tsx docs/step-by-step/024-avatar-api-and-developers.md
git commit -m "feat: developers page with avatar API examples including Next.js"
```

---

### Task 3: Backend `custom_links` (Pro gate)

**Files:**
- Create: `backend/app/services/custom_links.py`
- Modify: `backend/app/services/cards.py` (`create_card`, `update_card`)
- Create: `backend/tests/test_custom_links.py`

**Interfaces:**
- Produces: `normalize_custom_links(raw) -> list[dict]` / `assert_custom_links_allowed(user, fields)`
- Shape: `{id: str, title: str, url: str, icon: str | None, sort: int}`

- [ ] **Step 1: Failing tests**

```python
def test_free_cannot_save_custom_links(auth_client_free):
    created = auth_client_free.post("/api/v1/cards", json={"title": "A", "fields": {}}).json()
    r = auth_client_free.patch(
        f"/api/v1/cards/{created['id']}",
        json={
            "fields": {
                "custom_links": [
                    {"id": "1", "title": "Site", "url": "https://example.com", "sort": 0}
                ]
            }
        },
    )
    assert r.status_code == 403
    assert r.json()["code"] == "custom_links_pro_only"

def test_pro_can_save_custom_links(auth_client_pro):
    created = auth_client_pro.post("/api/v1/cards", json={"title": "A", "fields": {}}).json()
    r = auth_client_pro.patch(
        f"/api/v1/cards/{created['id']}",
        json={
            "fields": {
                "custom_links": [
                    {
                        "id": "a1",
                        "title": "Site",
                        "url": "https://example.com",
                        "icon": "globe",
                        "sort": 0,
                    }
                ]
            }
        },
    )
    assert r.status_code == 200
    assert r.json()["fields"]["custom_links"][0]["url"] == "https://example.com"

def test_reject_non_http_url(auth_client_pro):
    ...
    assert code == "invalid_custom_link"
```

- [ ] **Step 2: Run — FAIL**

- [ ] **Step 3: Implement**

```python
# custom_links.py
ALLOWED_ICONS = frozenset({"link", "globe", "calendar", "shop", "video", "music"})
MAX_LINKS = 20

def normalize_custom_links(raw) -> list[dict]:
    # validate list, title 1-60, url startswith http:// or https://
    # icon in ALLOWED_ICONS or None
    # sort int, max 20 → AppError invalid_custom_link / too_many_custom_links

def gate_custom_links(user: User, fields: dict | None) -> dict | None:
    if fields is None:
        return fields
    links = fields.get("custom_links")
    if not links:
        return fields
    if user.plan not in {"pro", "admin"}:
        raise AppError(..., "custom_links_pro_only", 403)
    fields = {**fields, "custom_links": normalize_custom_links(links)}
    return fields
```

Chamar em `create_card` / `update_card` quando `fields` presente.

- [ ] **Step 4: PASS + commit**

```bash
git commit -m "feat: Pro-only custom_links validation on cards"
```

---

### Task 4: Editor + cartão público com links

**Files:**
- Create: `frontend/src/lib/custom-links.ts`
- Create: `frontend/src/components/CustomLinksEditor.tsx`
- Modify: `frontend/src/components/CardEditor.tsx`
- Modify: `frontend/src/app/c/[slugOrId]/page.tsx`
- Modify: `frontend/src/app/c/[slugOrId]/presence/page.tsx`

**Interfaces:**
- Type `CustomLink = { id: string; title: string; url: string; icon?: string; sort: number }`
- `parseCustomLinks(fields): CustomLink[]`
- `sortCustomLinks(links): CustomLink[]`

- [ ] **Step 1: Helpers + CustomLinksEditor**

Editor props: `links`, `onChange`, `disabled` (Free), `isPro`.  
Free: mensagem + link `/app/billing`.  
Pro: inputs title/url, select icon, botões adicionar/remover/↑/↓.

- [ ] **Step 2: Wire CardEditor**

- Carregar `plan` via whoami.
- Estado `customLinks` a partir de `card.fields`.
- No save PATCH, incluir `custom_links` só se Pro (Free omite a chave ou envia `[]` sem tentar links novos).
- Tratar `403 custom_links_pro_only`.

- [ ] **Step 3: Public card**

Renderizar lista de `<a href={url} target="_blank" rel="noopener noreferrer">` com estilo de botão full-width sob os campos clássicos.

Presence: até 3 links como links texto/botão secundário abaixo do vCard.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: custom links editor and public card display"
```

---

### Task 5: UI Smart Card `/app/smart`

**Files:**
- Create: `frontend/src/app/app/smart/page.tsx`
- Modify: `frontend/src/components/AppNav.tsx` — item `{ href: "/app/smart", label: "Smart" }`

**Interfaces:**
- Consumes: `GET/POST/PATCH/DELETE /api/v1/smart-rules`, `GET /api/v1/me` (slug), `GET /api/v1/auth/whoami`
- Conditions shape already used in tests: e.g. `{ "always": true }` or `{ "hour_start": 9, "hour_end": 18 }` — mirror `test_admin_smart.py`

- [ ] **Step 1: Build page**

1. whoami → se free, mostrar upsell Pro + ainda assim explicar o recurso.
2. Se Pro: listar regras; form criar (`target` select + JSON conditions simples via campos: “Sempre” checkbox OU hora início/fim).
3. Bloco “Seu link Smart”:  
   `const goUrl = `${origin}/go/${slug || profileId}``  
   botão Copiar.
4. Delete com confirmação simples (`window.confirm`).

- [ ] **Step 2: Smoke**

Run: typecheck/build frontend.  
Manual: Pro cria regra `always` → whatsapp; abrir `/go/{slug}` redireciona.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: Smart Card rules UI for Pro users"
```

---

### Task 6: Refresh de layout (app + público)

**Files:**
- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/app/app/layout.tsx`
- Modify: `frontend/src/components/AppNav.tsx`
- Modify: `frontend/src/app/app/page.tsx`
- Modify: `frontend/src/components/CardEditor.tsx` (seções / tipografia)
- Modify: `frontend/src/app/c/[slugOrId]/page.tsx`
- Modify: `frontend/src/app/c/[slugOrId]/presence/page.tsx`
- Modify: `frontend/src/app/page.tsx`, `pricing/page.tsx`, `login/page.tsx` (polish leve)
- Create: `docs/step-by-step/025-links-smart-layout.md`

**Constraints de design:**
- Manter Fraunces + DM Sans, teal/sand/ink.
- Sem purple glow / cream+terracotta genérico / cards no hero.
- Hierarquia: brand forte, uma headline, CTAs claros.
- Motion: manter/expandir `animate-rise` (2–3 motions).

- [ ] **Step 1: Tokens + shell**

Ajustar espaçamentos do layout `/app` (header sticky sutil, max-width, borda inferior `border-line`). Nav com estado ativo via `usePathname()` (`text-teal` no item atual).

- [ ] **Step 2: Dashboard + editor sections**

Títulos de página com `font-display` + subtítulo curto. Editor: blocos “Perfil”, “Contatos”, “Links”, “Tema” com `border-t border-line pt-8`.

- [ ] **Step 3: Público + Presence**

Cartão: avatar maior, nome display, links em coluna com hover teal. Presence: tipografia e CTA sand refinados; até 3 custom links.

- [ ] **Step 4: Landing**

Incluir Developers; reforçar Pro (links + Smart) numa seção curta abaixo do hero (não no primeiro viewport).

- [ ] **Step 5: Commit + step-by-step**

```bash
git commit -m "style: modernize app shell and public card layout"
```

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Avatar `?email=&s=` + placeholder | 1 |
| Rate limit público avatar | 1 |
| Sync `avatar_key` no upload | 1 |
| `/developers` + Next.js | 2 |
| `custom_links` Pro gate | 3 |
| Editor + público + Presence links | 4 |
| `/app/smart` UI | 5 |
| Layout app + público | 6 |
| step-by-step docs | 2, 6 |

## Self-review notes

- Sem hash Gravatar (conforme spec B).
- Soft cap 20 links alinhado à spec.
- Placeholder sempre 200 para não vazar existência de e-mail.
- Rate limit avatar com `max_requests` alto (ex. 120) — o default 5/15min quebraria `<img>` embeds.
