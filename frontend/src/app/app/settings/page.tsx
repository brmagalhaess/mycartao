"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

const THEMES = [
  { value: "minimal", label: "Minimal" },
  { value: "classic", label: "Clássico" },
  { value: "bold", label: "Bold" },
] as const;

type Profile = {
  slug: string | null;
  theme: string | null;
  brand_color: string | null;
  display_name: string | null;
};

export default function SettingsPage() {
  const router = useRouter();
  const [plan, setPlan] = useState("free");
  const [slug, setSlug] = useState("");
  const [theme, setTheme] = useState("minimal");
  const [brandColor, setBrandColor] = useState("#0f766e");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const who = await apiFetch("/api/v1/auth/whoami");
      if (who.status === 401) {
        router.replace("/login");
        return;
      }
      if (who.ok) {
        const user = (await who.json()) as { plan: string };
        if (!cancelled) setPlan(user.plan);
      }

      const me = await apiFetch("/api/v1/me");
      if (me.status === 401) {
        router.replace("/login");
        return;
      }
      if (!me.ok) {
        if (!cancelled) setError("Não foi possível carregar configurações.");
        return;
      }
      const profile = (await me.json()) as Profile;
      if (cancelled) return;
      setSlug(profile.slug ?? "");
      setTheme(profile.theme ?? "minimal");
      setBrandColor(profile.brand_color ?? "#0f766e");
      setLoading(false);
    }
    load().catch(() => {
      if (!cancelled) setError("Falha de rede.");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const isPro = plan === "pro" || plan === "admin";

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const meRes = await apiFetch("/api/v1/me", {
        method: "PATCH",
        body: JSON.stringify({
          theme,
          brand_color: brandColor.trim() || null,
        }),
      });
      if (meRes.status === 401) {
        router.replace("/login");
        return;
      }
      if (!meRes.ok) {
        const data = (await meRes.json().catch(() => null)) as {
          detail?: string;
        } | null;
        setError(data?.detail ?? "Falha ao salvar tema/cor.");
        return;
      }

      if (isPro && slug.trim()) {
        const slugRes = await apiFetch("/api/v1/me/slug", {
          method: "PATCH",
          body: JSON.stringify({ slug: slug.trim() }),
        });
        if (slugRes.status === 401) {
          router.replace("/login");
          return;
        }
        if (!slugRes.ok) {
          const data = (await slugRes.json().catch(() => null)) as {
            detail?: string;
            code?: string;
          } | null;
          setError(
            data?.code === "plan_required"
              ? "Slug requer plano Pro."
              : (data?.detail ?? "Slug inválido ou indisponível."),
          );
          return;
        }
      }

      setMessage("Configurações salvas.");
    } catch {
      setError("Falha de rede ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function onLogout() {
    setLoggingOut(true);
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
    }
  }

  if (loading && !error) {
    return <p className="text-sm text-ink-soft">Carregando…</p>;
  }

  return (
    <main>
      <h1 className="animate-rise font-display text-3xl font-semibold sm:text-4xl">
        Configurações
      </h1>
      <p className="animate-rise-delay mt-2 text-ink-soft">
        Slug, tema, cor da marca e sessão.
      </p>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-6 text-sm text-teal-deep">{message}</p>
      ) : null}

      <form onSubmit={onSave} className="mt-10 max-w-lg space-y-5">
        <label className="block text-sm">
          <span className="font-medium text-ink-soft">
            Slug {isPro ? "(Pro)" : "(requer Pro)"}
          </span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={!isPro}
            placeholder="seu-nome"
            className="mt-1 w-full rounded-md border border-line bg-paper/80 px-3 py-2 disabled:opacity-50"
          />
          {!isPro ? (
            <span className="mt-1 block text-xs text-ink-soft">
              Assine o Pro em Cobrança para personalizar o slug.
            </span>
          ) : null}
        </label>

        <label className="block text-sm">
          <span className="font-medium text-ink-soft">Tema</span>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-paper/80 px-3 py-2"
          >
            {THEMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-ink-soft">Cor da marca</span>
          <div className="mt-1 flex items-center gap-3">
            <input
              type="color"
              value={brandColor.startsWith("#") ? brandColor : "#0f766e"}
              onChange={(e) => setBrandColor(e.target.value)}
              className="h-10 w-14 cursor-pointer rounded border border-line bg-paper"
            />
            <input
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="flex-1 rounded-md border border-line bg-paper/80 px-3 py-2"
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-teal-deep disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
      </form>

      <div className="mt-14 border-t border-line pt-8">
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="rounded-md border border-line bg-paper/70 px-5 py-2.5 text-sm font-medium text-ink transition hover:border-red-800/40 hover:text-red-800 disabled:opacity-60"
        >
          {loggingOut ? "Saindo…" : "Sair da conta"}
        </button>
      </div>
    </main>
  );
}
