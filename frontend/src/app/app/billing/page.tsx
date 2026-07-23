"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function BillingPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await apiFetch("/api/v1/auth/whoami");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        if (!cancelled) setError("Não foi possível carregar o plano.");
        return;
      }
      const user = (await res.json()) as { plan: string };
      if (!cancelled) setPlan(user.plan);
    }
    load().catch(() => {
      if (!cancelled) setError("Falha de rede.");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function subscribe() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/v1/billing/checkout", {
        method: "POST",
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          detail?: string;
        } | null;
        setError(data?.detail ?? "Não foi possível iniciar o checkout.");
        return;
      }
      const data = (await res.json()) as { url: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Checkout sem URL de redirecionamento.");
    } catch {
      setError("Falha de rede no checkout.");
    } finally {
      setLoading(false);
    }
  }

  const isPro = plan === "pro" || plan === "admin";

  return (
    <main>
      <h1 className="animate-rise font-display text-3xl font-semibold sm:text-4xl">
        Cobrança
      </h1>
      <p className="animate-rise-delay mt-2 text-ink-soft">
        Gerencie seu plano Free ou Pro.
      </p>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {plan === null && !error ? (
        <p className="mt-10 text-sm text-ink-soft">Carregando…</p>
      ) : null}

      {plan ? (
        <div className="mt-10 max-w-lg">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/70">
            Plano atual
          </p>
          <p className="mt-1 font-display text-3xl font-semibold capitalize">
            {plan}
          </p>

          {isPro ? (
            <p className="mt-6 text-ink-soft">
              Você já tem acesso Pro
              {plan === "admin" ? " (admin)" : ""}. Confira{" "}
              <Link href="/pricing" className="text-teal hover:underline">
                os benefícios
              </Link>
              .
            </p>
          ) : (
            <>
              <p className="mt-6 text-ink-soft">
                Desbloqueie slug, cartões ilimitados, analytics 90 dias e sem
                watermark.
              </p>
              <button
                type="button"
                onClick={subscribe}
                disabled={loading}
                className="mt-8 inline-flex rounded-md bg-teal px-6 py-3 text-sm font-semibold text-paper transition hover:bg-teal-deep disabled:opacity-60"
              >
                {loading ? "Redirecionando…" : "Assinar Pro"}
              </button>
            </>
          )}
        </div>
      ) : null}
    </main>
  );
}
