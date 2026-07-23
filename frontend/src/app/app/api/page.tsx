"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import AvatarCodeExamples from "@/components/AvatarCodeExamples";

export default function AvatarApiPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    let cancelled = false;
    async function load() {
      const who = await apiFetch("/api/v1/auth/whoami");
      if (who.status === 401) {
        router.replace("/login");
        return;
      }
      if (!who.ok) {
        if (!cancelled) setError("Não foi possível carregar sua conta.");
        return;
      }
      const user = (await who.json()) as { email: string };
      if (!cancelled) {
        setEmail(user.email);
        setLoading(false);
      }
    }
    load().catch(() => {
      if (!cancelled) setError("Falha de rede.");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const avatarPath = useMemo(() => {
    if (!email) return "";
    return `/api/v1/public/avatar?email=${encodeURIComponent(email)}&s=200`;
  }, [email]);

  const avatarUrl = origin && avatarPath ? `${origin}${avatarPath}` : avatarPath;

  async function copyUrl() {
    if (!avatarUrl) return;
    try {
      await navigator.clipboard.writeText(avatarUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }

  if (loading && !error) {
    return <p className="text-sm text-ink-soft">Carregando…</p>;
  }

  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal">
        Grátis · todos os planos
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        API de avatar
      </h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Use a foto do seu MyCartao em outros sites e sistemas — no mesmo
        espírito do Gravatar. Basta o e-mail da conta. Sem chave de API e sem
        plano Pro.
      </p>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {email ? (
        <section className="mt-10 border-t border-line pt-8">
          <h2 className="section-title">Seu embed</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Conta: <span className="font-medium text-ink">{email}</span>
          </p>

          <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarPath}
              alt=""
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-sand"
            />
            <div className="min-w-0 flex-1 space-y-3">
              <label className="block text-sm font-medium text-ink-soft">
                URL pública
                <input
                  readOnly
                  value={avatarUrl}
                  className="input-field mt-1.5 font-mono text-xs sm:text-sm"
                  onFocus={(e) => e.currentTarget.select()}
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={copyUrl}
                  className="rounded-md bg-teal px-4 py-2 text-sm font-semibold text-paper transition hover:bg-teal-deep"
                >
                  {copied ? "Copiado!" : "Copiar URL"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowExamples((v) => !v)}
                  className="rounded-md border border-line bg-paper/70 px-4 py-2 text-sm font-medium text-ink transition hover:border-teal/40"
                  aria-expanded={showExamples}
                >
                  {showExamples ? "Ocultar exemplos" : "Ver exemplos de código"}
                </button>
              </div>
            </div>
          </div>

          <pre className="mt-8 overflow-x-auto rounded-md border border-line bg-ink/[0.03] p-4 text-xs leading-relaxed text-ink-soft">
            {`<img src="${avatarUrl}" alt="" width="200" height="200" />`}
          </pre>

          {showExamples && origin ? (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-ink">
                Exemplos (HTML, JS, Next.js, Python, PHP, cURL)
              </h3>
              <p className="mt-1 text-sm text-ink-soft">
                Já com o seu domínio e e-mail. Você continua logado nesta
                página.
              </p>
              <div className="mt-4">
                <AvatarCodeExamples origin={origin} email={email} />
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="section-title">O que é grátis vs Pro</h2>
        <ul className="mt-4 space-y-2 text-sm text-ink-soft">
          <li>
            <span className="font-medium text-ink">Grátis:</span> API de avatar
            por e-mail para embutir em qualquer sistema.
          </li>
          <li>
            <span className="font-medium text-ink">Pro:</span> links
            personalizados no cartão e Smart Card.
          </li>
        </ul>
        <Link
          href="/app/billing"
          className="mt-4 inline-block text-sm font-medium text-teal transition hover:text-teal-deep"
        >
          Ver plano Pro →
        </Link>
      </section>
    </div>
  );
}
