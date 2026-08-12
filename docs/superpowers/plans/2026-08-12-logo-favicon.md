# Logo e Favicon (Monograma MC) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar monograma MC em SVG, favicon Next.js e wordmark (ícone + “MyCartao”) na landing e no AppShell.

**Architecture:** Assets SVG em `public/brand/`; `app/icon.svg` para favicon automático; componente `BrandLockup` reutilizado na landing e no shell. Sem novas deps; cores teal/ink/paper da marca.

**Tech Stack:** Next.js 15 App Router, React 19, SVG estático, Tailwind tokens existentes.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-12-logo-favicon-design.md`
- Monograma tipográfico **MC**; teal `#0f766e`, ink `#0c2a2e`, paper `#faf8f5`
- Sem glow, sem roxo, sem libs npm novas
- Não sobrescrever `.env`
- Doc: `docs/step-by-step/048-logo-favicon.md`
- Commits conventional; respostas em pt-BR

## File map

| File | Responsibility |
|---|---|
| `frontend/public/brand/logo-mark.svg` | Monograma MC |
| `frontend/public/brand/logo-lockup.svg` | MC + wordmark (asset marketing) |
| `frontend/src/app/icon.svg` | Favicon App Router |
| `frontend/src/components/BrandLockup.tsx` | Ícone + texto para UI |
| `frontend/src/app/page.tsx` | Nav landing com BrandLockup |
| `frontend/src/components/AppShell.tsx` | Sidebar + header mobile com BrandLockup |
| `docs/step-by-step/048-logo-favicon.md` | Registro da entrega |

---

### Task 1: SVG mark, lockup e favicon

**Files:**
- Create: `frontend/public/brand/logo-mark.svg`
- Create: `frontend/public/brand/logo-lockup.svg`
- Create: `frontend/src/app/icon.svg`

**Interfaces:**
- Produz: paths públicos `/brand/logo-mark.svg`, `/brand/logo-lockup.svg`; favicon via `icon.svg`

- [ ] **Step 1: Create `logo-mark.svg`**

ViewBox 32×32. Fundo arredondado paper (rx≈7), letras **MC** em teal, peso visual alto, legível em 16px. Sem filtros/glow.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="MyCartao">
  <rect width="32" height="32" rx="7" fill="#faf8f5"/>
  <text x="16" y="22" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"
        font-size="14" font-weight="700" fill="#0f766e" letter-spacing="-0.5">MC</text>
</svg>
```

Ajuste fino: se o texto SVG ficar frágil em favicon, trocar `<text>` por paths de M e C desenhados (2–4 paths simples) mantendo a mesma silhueta.

- [ ] **Step 2: Create `logo-lockup.svg`**

ViewBox ~160×32: mark à esquerda + “MyCartao” em ink à direita (`font-family` serif, `font-weight` 600).

- [ ] **Step 3: Create `app/icon.svg`**

Cópia otimizada do mark (mesmo monograma). Next.js 15 serve como favicon automaticamente quando o arquivo existe em `src/app/icon.svg`.

- [ ] **Step 4: Visual smoke**

Abrir os três SVGs no browser/preview; confirmar contraste teal/paper e legibilidade do MC.

- [ ] **Step 5: Commit**

```bash
git add frontend/public/brand/logo-mark.svg frontend/public/brand/logo-lockup.svg frontend/src/app/icon.svg
git commit -m "feat: add MyCartao MC logo mark and app favicon"
```

---

### Task 2: BrandLockup na landing e AppShell

**Files:**
- Create: `frontend/src/components/BrandLockup.tsx`
- Modify: `frontend/src/app/page.tsx` (Link do header ~L21–26)
- Modify: `frontend/src/components/AppShell.tsx` (Links desktop ~L189–194 e mobile ~L209–214)

**Interfaces:**
- Consumes: `/brand/logo-mark.svg`
- Produz: `<BrandLockup href="..." size="sm|md" />`

- [ ] **Step 1: Create BrandLockup**

```tsx
import Image from "next/image";
import Link from "next/link";

type Props = {
  href: string;
  size?: "sm" | "md";
  className?: string;
};

const SIZES = { sm: 28, md: 32 } as const;

export default function BrandLockup({ href, size = "md", className = "" }: Props) {
  const px = SIZES[size];
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 font-display font-semibold tracking-tight text-ink transition hover:text-teal-deep ${className}`}
    >
      <Image
        src="/brand/logo-mark.svg"
        alt=""
        width={px}
        height={px}
        className="shrink-0"
        priority
      />
      <span className={size === "sm" ? "text-lg" : "text-xl"}>MyCartao</span>
    </Link>
  );
}
```

Se `next/image` reclamar de SVG estático sem config, usar `<img src="/brand/logo-mark.svg" ... />` (preferível e mais simples para SVG local).

- [ ] **Step 2: Wire landing header**

Substituir o `Link` “MyCartao” por `<BrandLockup href="/" size="sm" />`.

- [ ] **Step 3: Wire AppShell**

Desktop e mobile: `<BrandLockup href="/app" size="md" />` / `size="sm"` no mobile.

- [ ] **Step 4: Verify**

```bash
cd frontend && npx tsc --noEmit
```

Expected: PASS. Manual: `/` e `/app` mostram ícone + texto; aba do browser com favicon MC.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/BrandLockup.tsx frontend/src/app/page.tsx frontend/src/components/AppShell.tsx
git commit -m "feat: show BrandLockup on landing and app shell"
```

---

### Task 3: Step-by-step 048 + build check

**Files:**
- Create: `docs/step-by-step/048-logo-favicon.md`

- [ ] **Step 1: Write 048**

Conteúdo: objetivo, arquivos (função de cada um), cores, onde aparece na UI, comandos `tsc`/`build`.

- [ ] **Step 2: Build**

```bash
cd frontend && npm run build
```

Expected: success.

- [ ] **Step 3: Commit**

```bash
git add docs/step-by-step/048-logo-favicon.md
git commit -m "docs: step-by-step 048 logo and favicon"
```

---

## Spec coverage

| Spec item | Task |
|---|---|
| logo-mark.svg | 1 |
| logo-lockup.svg | 1 |
| app/icon.svg | 1 |
| Brand na landing/AppShell | 2 |
| Cores teal/ink/paper | 1–2 |
| Sem deps novas | todas |
| step-by-step 048 | 3 |
| Apple icon PNG | fora |
