"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LangId = "html" | "javascript" | "nextjs" | "python" | "php" | "curl";

const LANGS: { id: LangId; label: string }[] = [
  { id: "html", label: "HTML" },
  { id: "javascript", label: "JavaScript" },
  { id: "nextjs", label: "Next.js" },
  { id: "python", label: "Python" },
  { id: "php", label: "PHP" },
  { id: "curl", label: "cURL" },
];

function buildSnippets(origin: string): Record<LangId, string> {
  const base = origin || "https://SEU_DOMINIO";
  return {
    html: `<img
  src="${base}/api/v1/public/avatar?email=voce@email.com&s=200"
  alt=""
  width="200"
  height="200"
/>`,
    javascript: `const origin = "${base}";
const email = "voce@email.com";
const url = \`\${origin}/api/v1/public/avatar?email=\${encodeURIComponent(email)}&s=200\`;

const img = document.createElement("img");
img.src = url;
img.alt = "";
img.width = 200;
img.height = 200;
document.body.appendChild(img);`,
    nextjs: `// app/components/MyCartaoAvatar.tsx
export function MyCartaoAvatar({ email }: { email: string }) {
  const src = \`${base}/api/v1/public/avatar?email=\${encodeURIComponent(email)}&s=128\`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={128} height={128} className="rounded-full" />
  );
}`,
    python: `import requests

base = "${base}"
email = "voce@email.com"
resp = requests.get(
    f"{base}/api/v1/public/avatar",
    params={"email": email, "s": 200},
)
resp.raise_for_status()
with open("avatar.bin", "wb") as f:
    f.write(resp.content)`,
    php: `<?php
$base = '${base}';
$email = 'voce@email.com';
$url = $base.'/api/v1/public/avatar?email='.urlencode($email).'&s=200';
$bytes = file_get_contents($url);
file_put_contents('avatar.bin', $bytes);`,
    curl: `BASE="${base}"
curl -L "$BASE/api/v1/public/avatar?email=voce@email.com&s=200" -o avatar.bin`,
  };
}

export default function DevelopersPage() {
  const [lang, setLang] = useState<LangId>("html");
  const [origin, setOrigin] = useState("https://SEU_DOMINIO");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const snippets = useMemo(() => buildSnippets(origin), [origin]);

  return (
    <div className="atmosphere min-h-screen text-ink">
      <div className="atmosphere-pattern min-h-screen">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5 sm:px-8">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight"
          >
            MyCartao
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link
              href="/pricing"
              className="text-ink-soft transition hover:text-teal"
            >
              Preços
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-ink px-4 py-2 text-paper transition hover:bg-ink-soft"
            >
              Entrar
            </Link>
          </nav>
        </header>

        <main className="mx-auto max-w-5xl px-6 pb-20 pt-10 sm:px-8">
          <p className="animate-rise text-sm font-medium tracking-wide text-teal">
            Grátis · API pública
          </p>
          <h1 className="animate-rise font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Developers
          </h1>
          <p className="animate-rise-delay mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft/90">
            Exiba o avatar do perfil MyCartao pelo e-mail cadastrado — como o
            Gravatar, sem plano Pro. Endpoint:{" "}
            <code className="rounded bg-paper/80 px-1.5 py-0.5 text-sm text-teal-deep">
              GET /api/v1/public/avatar?email=&amp;s=
            </code>
            . Sem foto, um placeholder SVG é servido.
          </p>

          <section className="animate-rise-delay-2 mt-12">
            <h2 className="font-display text-2xl font-semibold">Endpoint</h2>
            <p className="mt-3 max-w-2xl text-ink-soft/90">
              O parâmetro <code className="text-sm">email</code> deve ser o
              mesmo cadastrado no MyCartao. Opcional{" "}
              <code className="text-sm">s</code> (80–512, default 200).
            </p>
            <pre className="mt-5 overflow-x-auto rounded-md border border-line bg-ink px-4 py-3 text-sm leading-relaxed text-paper">
              <code>
                GET {origin}/api/v1/public/avatar?email=voce@email.com&amp;s=200
              </code>
            </pre>
            <p className="mt-4 text-sm text-ink-soft">
              Já tem conta?{" "}
              <Link
                href="/app/api"
                className="font-medium text-teal hover:text-teal-deep"
              >
                Copie sua URL no painel →
              </Link>
            </p>
          </section>

          <section className="animate-rise-delay-2 mt-14">
            <h2 className="font-display text-2xl font-semibold">Exemplos</h2>
            <div
              role="tablist"
              aria-label="Linguagem do exemplo"
              className="mt-6 flex flex-wrap gap-2"
            >
              {LANGS.map(({ id, label }) => {
                const active = lang === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setLang(id)}
                    className={
                      active
                        ? "rounded-md bg-teal px-3.5 py-2 text-sm font-semibold text-paper"
                        : "rounded-md border border-line bg-paper/60 px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:border-teal/40 hover:text-teal"
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <pre className="mt-4 overflow-x-auto rounded-md border border-line bg-ink px-4 py-4 text-sm leading-relaxed text-paper">
              <code>{snippets[lang]}</code>
            </pre>
          </section>

          <p className="mt-14 text-sm text-ink-soft/75">
            Links personalizados no cartão são recurso{" "}
            <Link
              href="/pricing"
              className="font-medium text-teal hover:text-teal-deep"
            >
              Pro
            </Link>
            . A API de avatar permanece grátis.
          </p>
        </main>
      </div>
    </div>
  );
}
