# MyCartao SaaS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o SaaS MyCartao (cartão de presença + portfólio + QR/print + analytics + Stripe + admin) com Next.js, FastAPI, PostgreSQL e MinIO em Docker Compose, pronto para VPS e push no Git.

**Architecture:** Monólito modular FastAPI (`backend/app/...`) + Next.js App Router (`frontend/`). Quatro containers (frontend, backend, db, minio). Auth magic link (Brevo), mídia no MinIO, billing Stripe via webhook, páginas públicas por id (Free) ou slug (Pro).

**Tech Stack:** Next.js 15 (App Router, TypeScript), FastAPI, SQLAlchemy 2 + Alembic, PostgreSQL 16, MinIO (boto3/minio SDK), PyJWT, httpx (Brevo), stripe, qrcode + reportlab, pytest, Docker Compose.

## Global Constraints

- UI e copy em **pt-BR**.
- Secrets **somente** via `.env` (nunca commitados); manter `.env.example`.
- Prefixo API: `/api/v1`.
- Planos: `free` | `pro` | `admin`.
- Magic link: uso único, expiração **15 minutos**, token armazenado como hash.
- Free: 1 cartão, link `/c/{id}` e `/p/{id}`, portfólio máx. 3 itens, print com watermark, analytics 7 dias.
- Pro: cartões ilimitados, slug custom, sem watermark, analytics 90 dias, smart rules, remove branding.
- Erro JSON: `{ "detail": string, "code": string }`.
- Arquivos backend preferencialmente **< 250 linhas**; dividir módulos se crescer.
- Documentar cada avanço em `docs/step-by-step/`.
- Commits frequentes com conventional commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Ano de referência da documentação do projeto: 2026-07-22 (spec aprovada).

## File Structure (mapa inicial)

```
mycartao/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── Makefile
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── db.py
│   │   ├── deps.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── api/
│   │   │   └── v1/
│   │   └── core/          # security, errors, rate_limit
│   └── tests/
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── src/app/           # App Router pages
    ├── src/components/
    ├── src/lib/           # api client, auth helpers
    └── src/styles/
```

---

### Task 1: Scaffold repo + Docker Compose (4 serviços)

**Files:**
- Create: `docker-compose.yml`, `.env.example`, `.gitignore`, `Makefile`, `README.md`
- Create: `backend/Dockerfile`, `backend/requirements.txt`, `backend/app/main.py`, `backend/app/config.py`
- Create: `frontend/Dockerfile`, `frontend/package.json` (via `create-next-app`)
- Create: `docs/step-by-step/002-scaffold-docker.md`

**Interfaces:**
- Consumes: nada
- Produces: `docker compose up` sobe `frontend:3000`, `backend:8000` (`GET /health` → `{"status":"ok"}`), `db:5432`, `minio:9000`

- [ ] **Step 1: Criar `.gitignore` e `.env.example`**

```gitignore
.env
__pycache__/
.venv/
node_modules/
.next/
*.pyc
.pytest_cache/
.mypy_cache/
dist/
coverage/
```

```env
# App
PUBLIC_APP_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
JWT_SECRET=change-me-in-production
JWT_EXPIRE_MINUTES=10080

# Database
DATABASE_URL=postgresql+psycopg://mycartao:mycartao@db:5432/mycartao
POSTGRES_USER=mycartao
POSTGRES_PASSWORD=mycartao
POSTGRES_DB=mycartao

# Brevo
BREVO_API_KEY=
BREVO_SENDER_EMAIL=noreply@example.com
BREVO_SENDER_NAME=MyCartao

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=

# MinIO
MINIO_ENDPOINT=minio:9000
MINIO_PUBLIC_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=mycartao
MINIO_USE_SSL=false
```

- [ ] **Step 2: Criar `backend/app/config.py` e `backend/app/main.py` mínimos**

```python
# backend/app/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    public_app_url: str = "http://localhost:3000"
    cors_origins: str = "http://localhost:3000"
    jwt_secret: str = "change-me"
    jwt_expire_minutes: int = 10080
    database_url: str
    brevo_api_key: str = ""
    brevo_sender_email: str = "noreply@example.com"
    brevo_sender_name: str = "MyCartao"
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_price_pro: str = ""
    minio_endpoint: str = "minio:9000"
    minio_public_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "mycartao"
    minio_use_ssl: bool = False

settings = Settings()
```

```python
# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings

app = FastAPI(title="MyCartao API", version="1.0.0")
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 3: Criar `backend/requirements.txt` e `backend/Dockerfile`**

```text
fastapi==0.115.6
uvicorn[standard]==0.34.0
sqlalchemy==2.0.36
psycopg[binary]==3.2.3
alembic==1.14.0
pydantic-settings==2.7.0
PyJWT==2.10.1
httpx==0.28.1
stripe==11.4.1
minio==7.2.12
python-multipart==0.0.20
qrcode[pil]==8.0
reportlab==4.2.5
email-validator==2.2.0
pytest==8.3.4
pytest-asyncio==0.25.0
```

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

- [ ] **Step 4: Scaffold Next.js e Dockerfile do frontend**

Run:
```bash
npx create-next-app@15 frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack false
```

`frontend/Dockerfile`:
```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

Habilitar `output: "standalone"` em `frontend/next.config.ts`.

- [ ] **Step 5: Criar `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 5s
      timeout: 5s
      retries: 10
    restart: unless-stopped

  backend:
    build: ./backend
    env_file: .env
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
      minio:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      args:
        NEXT_PUBLIC_API_URL: ${PUBLIC_APP_URL:-http://localhost:3000}
    env_file: .env
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  pgdata:
  minio_data:
```

Nota: no Task 1 o `alembic upgrade head` pode falhar até Task 2 — temporariamente usar `CMD uvicorn...` sem migrate, ou criar migration vazia `head`. Preferir migration inicial na Task 2 e neste step usar:

```dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

e ativar migrate no Task 2.

- [ ] **Step 6: Verificar health**

Run:
```bash
cp .env.example .env
docker compose up -d --build db minio backend
curl -s http://localhost:8000/health
```
Expected: `{"status":"ok"}`

- [ ] **Step 7: Commit**

```bash
git add .gitignore .env.example docker-compose.yml Makefile README.md backend frontend docs/step-by-step/002-scaffold-docker.md
git commit -m "chore: scaffold frontend, backend and docker compose"
```

---

### Task 2: Database models + Alembic + error handling

**Files:**
- Create: `backend/app/db.py`, `backend/app/models/__init__.py`, `backend/app/models/user.py`, `backend/app/models/profile.py`, `backend/app/models/card.py`, `backend/app/models/portfolio.py`, `backend/app/models/media.py`, `backend/app/models/analytics.py`, `backend/app/models/billing.py`, `backend/app/models/smart_rule.py`, `backend/app/models/auth_token.py`
- Create: `backend/app/core/errors.py`, `backend/app/deps.py`
- Create: `backend/alembic.ini`, `backend/alembic/env.py`, migration inicial
- Test: `backend/tests/test_models_smoke.py`
- Create: `docs/step-by-step/003-database-models.md`

**Interfaces:**
- Consumes: `settings.database_url`
- Produces: modelos SQLAlchemy; `get_db()` generator; `AppError` + handler registrando `{detail, code}`

- [ ] **Step 1: Escrever teste smoke de sessão DB**

```python
# backend/tests/test_models_smoke.py
from app.db import SessionLocal
from app.models.user import User

def test_can_create_user():
    db = SessionLocal()
    try:
        u = User(email="smoke@example.com", plan="free")
        db.add(u)
        db.commit()
        db.refresh(u)
        assert u.id is not None
        assert u.plan == "free"
    finally:
        db.rollback()
        db.close()
```

- [ ] **Step 2: Rodar e confirmar FAIL**

Run: `cd backend && pytest tests/test_models_smoke.py -v`  
Expected: FAIL (módulo/tabela inexistente) — em CI local sem Postgres, usar `DATABASE_URL` do compose ou pytest com container.

- [ ] **Step 3: Implementar `db.py`, models e errors**

```python
# backend/app/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

Modelos (campos mínimos alinhados à spec):

```python
# backend/app/models/user.py
import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base

class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    plan: Mapped[str] = mapped_column(String(20), default="free")  # free|pro|admin
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    profile = relationship("Profile", back_populates="user", uselist=False)
```

Repetir padrão para: `MagicLinkToken`, `Profile` (slug unique nullable), `Card` (fields JSON), `PortfolioItem`, `MediaAsset`, `CardView`, `Subscription`, `SmartRule`.

```python
# backend/app/core/errors.py
from fastapi import Request
from fastapi.responses import JSONResponse

class AppError(Exception):
    def __init__(self, detail: str, code: str, status_code: int = 400):
        self.detail = detail
        self.code = code
        self.status_code = status_code

async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
    )
```

Registrar handler em `main.py`.

- [ ] **Step 4: Alembic migration inicial + ligar migrate no Dockerfile**

```bash
cd backend && alembic init alembic
# configurar env.py para usar Base.metadata e settings.database_url
alembic revision --autogenerate -m "initial schema"
```

Atualizar Dockerfile CMD para: `alembic upgrade head && uvicorn ...`

- [ ] **Step 5: Rodar testes com DB**

Run:
```bash
docker compose up -d db
cd backend && DATABASE_URL=postgresql+psycopg://mycartao:mycartao@localhost:5432/mycartao alembic upgrade head && pytest tests/test_models_smoke.py -v
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend docs/step-by-step/003-database-models.md
git commit -m "feat: add database models and alembic migration"
```

---

### Task 3: Auth magic link (Brevo) + JWT

**Files:**
- Create: `backend/app/services/brevo.py`, `backend/app/services/auth.py`, `backend/app/core/security.py`, `backend/app/api/v1/auth.py`, `backend/app/schemas/auth.py`
- Modify: `backend/app/main.py` (router `/api/v1`)
- Test: `backend/tests/test_auth_magic_link.py`
- Create: `docs/step-by-step/004-auth-magic-link.md`

**Interfaces:**
- Consumes: `User`, `MagicLinkToken`, Brevo settings
- Produces:
  - `POST /api/v1/auth/magic-link` body `{email}` → `{ok: true}`
  - `GET /api/v1/auth/verify?token=` → Set-Cookie `access_token` + `{user}`
  - `POST /api/v1/auth/logout` → clear cookie
  - `get_current_user(db, request) -> User`

- [ ] **Step 1: Teste falhando de fluxo magic link (Brevo mockado)**

```python
# backend/tests/test_auth_magic_link.py
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@patch("app.services.brevo.send_magic_link_email")
def test_magic_link_verify_sets_cookie(mock_send):
    mock_send.return_value = None
    r = client.post("/api/v1/auth/magic-link", json={"email": "a@example.com"})
    assert r.status_code == 200
    # extrair token raw do serviço em teste via DB helper ou mock side_effect
    from app.db import SessionLocal
    from app.models.auth_token import MagicLinkToken
    # implementação do teste deve ler último token hash e usar token conhecido:
    # auth.create_magic_link deve retornar (raw, hash) em ambiente de teste
```

Implementar `create_magic_link(email) -> str` retornando o token raw **apenas** na chamada interna; no teste, patchar geração para token fixo `"test-token-fixed"`.

```python
@patch("app.services.auth.secrets.token_urlsafe", return_value="fixed-token")
@patch("app.services.brevo.send_magic_link_email")
def test_verify(mock_send, mock_token):
    client.post("/api/v1/auth/magic-link", json={"email": "a@example.com"})
    r = client.get("/api/v1/auth/verify", params={"token": "fixed-token"})
    assert r.status_code == 200
    assert "access_token" in r.cookies
    assert r.json()["email"] == "a@example.com"
```

- [ ] **Step 2: Rodar FAIL**

Run: `pytest backend/tests/test_auth_magic_link.py -v`  
Expected: FAIL (rota inexistente)

- [ ] **Step 3: Implementar security + brevo + auth service + routes**

```python
# backend/app/core/security.py
import hashlib, hmac
from datetime import datetime, timedelta, timezone
import jwt
from app.config import settings

def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()

def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

def decode_access_token(token: str) -> str:
    data = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    return data["sub"]
```

```python
# backend/app/services/brevo.py
import httpx
from app.config import settings

def send_magic_link_email(email: str, link: str) -> None:
    if not settings.brevo_api_key:
        # dev: log only
        print(f"[brevo-dev] magic link for {email}: {link}")
        return
    payload = {
        "sender": {"name": settings.brevo_sender_name, "email": settings.brevo_sender_email},
        "to": [{"email": email}],
        "subject": "Seu link de acesso MyCartao",
        "htmlContent": f"<p>Clique para entrar (válido 15 min):</p><p><a href=\"{link}\">{link}</a></p>",
    }
    r = httpx.post(
        "https://api.brevo.com/v3/smtp/email",
        headers={"api-key": settings.brevo_api_key, "Content-Type": "application/json"},
        json=payload,
        timeout=20,
    )
    r.raise_for_status()
```

Cookie: `access_token`, httponly, samesite=lax, secure em prod (`PUBLIC_APP_URL` https).

Rate limit simples in-memory: máx 5 pedidos / e-mail / 15 min em `POST /auth/magic-link` (código em `backend/app/core/rate_limit.py`).

- [ ] **Step 4: PASS nos testes**

Run: `pytest backend/tests/test_auth_magic_link.py -v`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend docs/step-by-step/004-auth-magic-link.md
git commit -m "feat: implement magic link auth with JWT cookie"
```

---

### Task 4: Perfil `/me`, slug Pro e temas

**Files:**
- Create: `backend/app/api/v1/me.py`, `backend/app/schemas/profile.py`, `backend/app/services/profile.py`
- Test: `backend/tests/test_me_slug.py`
- Create: `docs/step-by-step/005-profile-slug.md`

**Interfaces:**
- Consumes: `get_current_user`
- Produces: `GET/PATCH /api/v1/me`, `PATCH /api/v1/me/slug` (403 se free)

- [ ] **Step 1: Teste slug Pro**

```python
def test_free_cannot_set_slug(auth_client_free):
    r = auth_client_free.patch("/api/v1/me/slug", json={"slug": "bruno"})
    assert r.status_code == 403
    assert r.json()["code"] == "plan_required"

def test_pro_can_set_slug(auth_client_pro):
    r = auth_client_pro.patch("/api/v1/me/slug", json={"slug": "bruno"})
    assert r.status_code == 200
    assert r.json()["slug"] == "bruno"
```

Slug: `^[a-z0-9-]{3,32}$`, unique.

- [ ] **Step 2: FAIL → implementar → PASS → commit**

```bash
git commit -m "feat: add profile me endpoints and pro slug"
```

---

### Task 5: Cards CRUD + página pública + limite Free

**Files:**
- Create: `backend/app/api/v1/cards.py`, `backend/app/schemas/card.py`, `backend/app/services/cards.py`
- Test: `backend/tests/test_cards.py`
- Create: `docs/step-by-step/006-cards.md`

**Interfaces:**
- Produces:
  - `GET/POST /api/v1/cards`
  - `GET/PATCH/DELETE /api/v1/cards/{id}`
  - `GET /api/v1/public/cards/{slug_or_id}`
- Free: segundo `POST /cards` → 403 `card_limit_reached`
- Público resolve UUID **ou** slug do profile (Pro)

- [ ] **Step 1: Testes**

```python
def test_free_card_limit(auth_client_free):
    assert auth_client_free.post("/api/v1/cards", json={"title": "A", "fields": {}}).status_code == 201
    r = auth_client_free.post("/api/v1/cards", json={"title": "B", "fields": {}})
    assert r.status_code == 403
    assert r.json()["code"] == "card_limit_reached"

def test_public_by_id(auth_client_free):
    created = auth_client_free.post("/api/v1/cards", json={"title": "A", "fields": {"phone": "11999999999"}}).json()
    r = auth_client_free.get(f"/api/v1/public/cards/{created['id']}")
    assert r.status_code == 200
    assert r.json()["title"] == "A"
```

`fields` JSON sugerido: `phone`, `email`, `company`, `whatsapp`, `website`, `linkedin`, `instagram`.

- [ ] **Step 2: Implementar service + routes → PASS → commit**

```bash
git commit -m "feat: add cards CRUD and public card endpoint"
```

---

### Task 6: MinIO media upload (avatar / portfolio / print)

**Files:**
- Create: `backend/app/services/minio_client.py`, `backend/app/api/v1/media.py`, `backend/app/schemas/media.py`
- Test: `backend/tests/test_media.py`
- Create: `docs/step-by-step/007-media-minio.md`

**Interfaces:**
- Produces: `POST /api/v1/media/upload` multipart (`file`, `purpose`) → `{id, url, purpose}`
- Bucket auto-create no startup (`ensure_bucket`)
- MIME allow: `image/jpeg`, `image/png`, `image/webp`; max 5MB
- Free avatar: se já existe purpose=avatar → 403 `avatar_limit_reached`

- [ ] **Step 1: Teste com MinIO do compose**

```python
def test_upload_avatar(auth_client_free, png_bytes):
    r = auth_client_free.post(
        "/api/v1/media/upload",
        files={"file": ("a.png", png_bytes, "image/png")},
        data={"purpose": "avatar"},
    )
    assert r.status_code == 201
    assert r.json()["url"].startswith("http")
```

- [ ] **Step 2: Implementar client MinIO + rota → PASS → commit**

```bash
git commit -m "feat: add MinIO media upload endpoints"
```

---

### Task 7: QR, Print PDF e vCard

**Files:**
- Create: `backend/app/services/qr.py`, `backend/app/services/print_pdf.py`, `backend/app/services/vcard.py`, `backend/app/api/v1/exports.py`
- Test: `backend/tests/test_exports.py`
- Create: `docs/step-by-step/008-qr-print-vcard.md`

**Interfaces:**
- `GET /api/v1/cards/{id}/qr?format=png|svg` (auth)
- `GET /api/v1/cards/{id}/print.pdf` (auth; watermark se free)
- `GET /api/v1/cards/{id}/vcard.vcf` (auth; público opcional `GET /api/v1/public/cards/{slug_or_id}/vcard.vcf`)
- URL embutida no QR: `{PUBLIC_APP_URL}/c/{slug_or_id}`

- [ ] **Step 1: Testes de content-type**

```python
def test_qr_png(auth_client_free, card_id):
    r = auth_client_free.get(f"/api/v1/cards/{card_id}/qr", params={"format": "png"})
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("image/png")

def test_print_pdf_free_has_body(auth_client_free, card_id):
    r = auth_client_free.get(f"/api/v1/cards/{card_id}/print.pdf")
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.content[:4] == b"%PDF"
```

- [ ] **Step 2: Implementar → PASS → commit**

```bash
git commit -m "feat: add QR, print PDF and vCard exports"
```

---

### Task 8: Portfólio / catálogo + limites

**Files:**
- Create: `backend/app/api/v1/portfolio.py`, `backend/app/schemas/portfolio.py`, `backend/app/services/portfolio.py`
- Test: `backend/tests/test_portfolio.py`
- Create: `docs/step-by-step/009-portfolio.md`

**Interfaces:**
- CRUD `/api/v1/portfolio`
- `GET /api/v1/public/portfolio/{slug_or_id}`
- Free: 4º item → 403 `portfolio_limit_reached`
- Types: `project` | `service` (service pode ter `price`)

- [ ] **Step 1: Testes limite + público → implementar → PASS → commit**

```bash
git commit -m "feat: add portfolio catalog with plan limits"
```

---

### Task 9: Analytics de visualizações

**Files:**
- Create: `backend/app/api/v1/analytics.py`, `backend/app/services/analytics.py`
- Modify: `backend/app/api/v1/cards.py` (public GET registra view)
- Test: `backend/tests/test_analytics.py`
- Create: `docs/step-by-step/010-analytics.md`

**Interfaces:**
- Ao `GET /public/cards/{id}`: insert `card_views` com `ip_hash=sha256(ip + jwt_secret)`, `ua`, `referrer`
- `GET /api/v1/analytics/summary?days=7` → `{views, unique_approx, by_day: []}`
- Free: `days > 7` → clamp 7; Pro: máx 90

- [ ] **Step 1: Teste**

```python
def test_public_view_increments(auth_client_free, card_id):
    client.get(f"/api/v1/public/cards/{card_id}")
    r = auth_client_free.get("/api/v1/analytics/summary", params={"days": 7})
    assert r.status_code == 200
    assert r.json()["views"] >= 1
```

- [ ] **Step 2: Implementar → PASS → commit**

```bash
git commit -m "feat: track card views and analytics summary"
```

---

### Task 10: Stripe billing (Checkout + webhook)

**Files:**
- Create: `backend/app/api/v1/billing.py`, `backend/app/services/stripe_billing.py`
- Test: `backend/tests/test_billing_webhook.py`
- Create: `docs/step-by-step/011-stripe-billing.md`

**Interfaces:**
- `POST /api/v1/billing/checkout` → `{url}` Checkout Session mode=subscription price=`STRIPE_PRICE_PRO`
- `POST /api/v1/billing/webhook` raw body + `Stripe-Signature`
- Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Atualiza `users.plan` para `pro`/`free` e upsert `subscriptions`

- [ ] **Step 1: Teste webhook com payload assinado (stripe test helper ou mock construct_event)**

```python
@patch("app.services.stripe_billing.stripe.Webhook.construct_event")
def test_checkout_completed_upgrades_plan(mock_event, db_user):
    mock_event.return_value = {
        "type": "checkout.session.completed",
        "data": {"object": {"customer": "cus_1", "subscription": "sub_1", "metadata": {"user_id": str(db_user.id)}}},
    }
    r = client.post("/api/v1/billing/webhook", data=b"{}", headers={"Stripe-Signature": "t"})
    assert r.status_code == 200
    # reload user.plan == "pro"
```

- [ ] **Step 2: Implementar → PASS → commit**

```bash
git commit -m "feat: add Stripe checkout and webhook billing"
```

---

### Task 11: Admin + Smart rules + Presence redirect

**Files:**
- Create: `backend/app/api/v1/admin.py`, `backend/app/api/v1/smart_rules.py`, `backend/app/services/smart_rules.py`
- Test: `backend/tests/test_admin_smart.py`
- Create: `docs/step-by-step/012-admin-smart.md`

**Interfaces:**
- `GET /api/v1/admin/users` (só admin)
- `PATCH /api/v1/admin/users/{id}` body `{plan}`
- CRUD `/api/v1/smart-rules` (Pro)
- `GET /api/v1/public/go/{slug_or_id}` — aplica smart rule (default → card)

Regra mínima suportada:
```json
{"conditions": {"always": true}, "target": "whatsapp"}
```
ou `{"conditions": {"hour_range": [9, 18]}, "target": "portfolio"}`

- [ ] **Step 1: Testes 403 free / 200 admin → implementar → PASS → commit**

```bash
git commit -m "feat: add admin panel APIs and smart card rules"
```

---

### Task 12: Frontend — shell, auth magic link, landing e preços

**Files:**
- Create/Modify: `frontend/src/app/page.tsx`, `frontend/src/app/login/page.tsx`, `frontend/src/app/auth/verify/page.tsx`, `frontend/src/app/pricing/page.tsx`, `frontend/src/lib/api.ts`, `frontend/src/app/globals.css`
- Create: `docs/step-by-step/013-frontend-auth-landing.md`

**Interfaces:**
- `api.ts`: `apiFetch(path, init)` com `credentials: "include"`
- Login chama `POST /api/v1/auth/magic-link`
- `/auth/verify` lê `?token=` e chama backend verify, redireciona `/app`

Design (respeitar regras de UI do usuário):
- Marca **MyCartao** hero-level na landing
- Tipografia expressiva (ex.: `"Fraunces"` + `"DM Sans"` via next/font)
- Fundo com gradiente/atmosfera (evitar purple default / cream+terracotta clichê)
- Hero full-bleed com uma headline, um subtítulo, um grupo de CTA
- Sem cards no hero

- [ ] **Step 1: Implementar `api.ts` + páginas login/verify/landing/pricing**
- [ ] **Step 2: Smoke manual** — pedir link (dev log no backend) e verificar cookie
- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add landing, pricing and magic-link login UI"
```

---

### Task 13: Frontend — app dashboard, editor de cartão, QR/print

**Files:**
- Create: `frontend/src/app/app/layout.tsx`, `frontend/src/app/app/page.tsx`, `frontend/src/app/app/cards/[id]/page.tsx`, `frontend/src/app/app/cards/[id]/qr/page.tsx`, `frontend/src/components/CardEditor.tsx`, `frontend/src/components/QrPanel.tsx`
- Create: `docs/step-by-step/014-frontend-editor.md`

**Interfaces:**
- Dashboard lista cards + CTA criar
- Editor salva `PATCH /cards/{id}` (nome, headline, fields, theme)
- QR panel: mostra imagem `GET /cards/{id}/qr?format=png`, botões download PNG/SVG e PDF print
- Upload avatar via `POST /media/upload`

- [ ] **Step 1: Implementar UI autenticada**
- [ ] **Step 2: Verificar fluxo criar → editar → ver QR**
- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add dashboard, card editor and QR/print panel"
```

---

### Task 14: Frontend — páginas públicas, Presence Mode, portfólio, analytics, billing, admin

**Files:**
- Create: `frontend/src/app/c/[slugOrId]/page.tsx`, `frontend/src/app/p/[slugOrId]/page.tsx`, `frontend/src/app/c/[slugOrId]/presence/page.tsx`, `frontend/src/app/go/[slugOrId]/page.tsx`
- Create: `frontend/src/app/app/portfolio/page.tsx`, `frontend/src/app/app/analytics/page.tsx`, `frontend/src/app/app/billing/page.tsx`, `frontend/src/app/app/settings/page.tsx`, `frontend/src/app/admin/page.tsx`
- Create: `docs/step-by-step/015-frontend-public-and-saas.md`

**Interfaces:**
- Público cartão/portfólio SSR ou client fetch em `/api/v1/public/...`
- Presence Mode: fullscreen foto + QR + “Salvar contato” (`/vcard.vcf`)
- `/go/[slugOrId]` chama public go e redireciona
- Billing: botão “Assinar Pro” → redirect Stripe URL
- Admin: tabela de users (se plan=admin)
- Settings: slug (Pro), tema, cor da marca

- [ ] **Step 1: Implementar rotas públicas + Presence**
- [ ] **Step 2: Portfólio app + analytics charts simples (CSS/SVG, sem lib pesada obrigatória)**
- [ ] **Step 3: Billing + admin + settings**
- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add public pages, presence mode, portfolio, billing and admin UI"
```

---

### Task 15: Harden deploy VPS + README + testes finais + push Git

**Files:**
- Modify: `README.md`, `Makefile`, `docker-compose.yml` (se necessário)
- Create: `docs/step-by-step/016-deploy-vps-git.md`
- Create: `backend/tests/conftest.py` (fixtures `auth_client_free`, `auth_client_pro`) se ainda não existirem consolidadas

**Interfaces:**
- `make up` / `make down` / `make test` / `make logs`
- README: checklist VPS ( Domínio → DNS → `.env` → `docker compose up -d --build` → Stripe webhook URL → Brevo sender )

- [ ] **Step 1: Makefile**

```makefile
up:
	docker compose up -d --build
down:
	docker compose down
logs:
	docker compose logs -f
test:
	docker compose exec backend pytest -v
```

- [ ] **Step 2: Rodar suíte**

Run: `make test`  
Expected: todos PASS

- [ ] **Step 3: Smoke E2E manual checklist**
  1. Magic link login
  2. Criar cartão + abrir `/c/{id}`
  3. QR + PDF
  4. Portfólio público
  5. Analytics > 0
  6. Checkout Stripe test
  7. Admin lista users

- [ ] **Step 4: Commit final + push (pedir remote ao usuário se não existir)**

```bash
git add .
git commit -m "chore: finalize VPS deploy docs and test targets"
git remote add origin <URL_DO_USUARIO>
git push -u origin main
```

---

## Spec coverage checklist (self-review)

| Requisito spec | Task |
|---|---|
| Next + FastAPI + Postgres + MinIO Compose | 1, 6 |
| Magic link Brevo + JWT | 3, 12 |
| Cards + link id/slug | 4, 5, 13, 14 |
| QR / print / vCard NFC-ready | 7, 13, 14 |
| Avatar / media | 6, 13 |
| Portfólio + catálogo | 8, 14 |
| Temas / brand color | 4, 13, 14 |
| Analytics 7/90 dias | 9, 14 |
| Stripe Pro | 10, 14 |
| Admin | 11, 14 |
| Presence Mode | 14 |
| Smart Card rules | 11, 14 |
| Print Kit PDF | 7 |
| Deploy VPS + Git | 15 |
| step-by-step docs | todas |

## Type consistency notes

- User.plan: `"free" | "pro" | "admin"`
- Public lookup param name: `slug_or_id` (API) / `[slugOrId]` (Next routes)
- Cookie name: `access_token`
- Error shape: `{detail, code}` com codes: `plan_required`, `card_limit_reached`, `portfolio_limit_reached`, `avatar_limit_reached`, `unauthorized`, `not_found`, `rate_limited`, `invalid_slug`
```