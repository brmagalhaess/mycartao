"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { CopyableLink } from "@/components/ShareLinksBlock";
import { FREE_THEMES, PRO_THEMES, type CardTheme } from "@/lib/card-theme";
import {
  PUBLIC_TOOLS,
  publicToolUrl,
  type PublicToolId,
} from "@/lib/public-tools";

type Profile = {
  id: string;
  slug: string | null;
  theme: string | null;
  brand_color: string | null;
  display_name: string | null;
  headline: string | null;
  bio: string | null;
};

type Card = {
  id: string;
  is_primary: boolean;
};

export default function SettingsPage() {
  const router = useRouter();
  const [plan, setPlan] = useState("free");
  const [primaryCardId, setPrimaryCardId] = useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [usePersonalized, setUsePersonalized] = useState(false);
  const [tool, setTool] = useState<PublicToolId>("card");
  const [theme, setTheme] = useState<CardTheme>("minimal");
  const [brandColor, setBrandColor] = useState("#0f766e");
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [origin, setOrigin] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isPro = plan === "pro" || plan === "admin";

  useEffect(() => {
    setOrigin(window.location.origin);
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

      const cardsRes = await apiFetch("/api/v1/cards");
      let cardId: string | null = null;
      if (cardsRes.ok) {
        const cards = (await cardsRes.json()) as Card[];
        const primary = cards.find((c) => c.is_primary) ?? cards[0];
        cardId = primary?.id ?? null;
      }

      if (cancelled) return;
      setPrimaryCardId(cardId);
      setSlug(profile.slug ?? "");
      setUsePersonalized(Boolean(profile.slug));
      setTheme((profile.theme as CardTheme) || "minimal");
      setBrandColor(profile.brand_color ?? "#0f766e");
      setDisplayName(profile.display_name ?? "");
      setHeadline(profile.headline ?? "");
      setBio(profile.bio ?? "");
      setLoading(false);
    }
    load().catch(() => {
      if (!cancelled) setError("Falha de rede.");
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const publicKey = useMemo(() => {
    if (isPro && usePersonalized && slug.trim()) return slug.trim().toLowerCase();
    return primaryCardId;
  }, [isPro, usePersonalized, slug, primaryCardId]);

  const publicUrl =
    origin && publicKey ? publicToolUrl(origin, publicKey, tool) : "";

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const body: Record<string, unknown> = {
        display_name: displayName.trim() || null,
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        theme,
      };
      if (isPro) {
        body.brand_color = brandColor.trim() || null;
      }

      const meRes = await apiFetch("/api/v1/me", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (meRes.status === 401) {
        router.replace("/login");
        return;
      }
      if (!meRes.ok) {
        const data = (await meRes.json().catch(() => null)) as {
          detail?: string;
          code?: string;
        } | null;
        setError(
          data?.code === "brand_color_pro_only"
            ? "Cor da marca é exclusividade Pro."
            : data?.code === "theme_plan_required"
              ? "Esse tema é Pro. Assine para usar."
              : (data?.detail ?? "Falha ao salvar perfil/aparência."),
        );
        return;
      }

      if (isPro && usePersonalized && slug.trim()) {
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

      setMessage("Configurações salvas. Seu cartão público já reflete o visual.");
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

  const themeOptions = isPro
    ? [...FREE_THEMES, ...PRO_THEMES]
    : FREE_THEMES;

  return (
    <main className="max-w-2xl">
      <h1 className="animate-rise font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Configurações
      </h1>
      <p className="animate-rise-delay mt-2 text-ink-soft">
        Seu link, perfil e aparência do cartão público — Free e Pro no mesmo
        lugar.
      </p>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-6 text-sm text-teal-deep">{message}</p>
      ) : null}

      <section className="mt-10 border-t border-line pt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal">
          Seu link
        </p>
        <h2 className="mt-2 font-display text-xl font-semibold">
          Um endereço, várias ferramentas
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          Um único link público. Escolha a ferramenta abaixo — ela entra como
          parâmetro <code className="text-xs">?tool=</code> na mesma URL.
        </p>

        {!primaryCardId ? (
          <p className="mt-4 text-sm text-ink-soft">
            Crie um cartão em{" "}
            <Link href="/app" className="font-medium text-teal">
              Cartões
            </Link>{" "}
            para gerar seu link.
          </p>
        ) : (
          <div className="mt-6 space-y-5">
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-soft/70">
                Ferramenta
              </p>
              <div className="flex flex-wrap gap-2">
                {PUBLIC_TOOLS.map((item) => {
                  const active = tool === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTool(item.id)}
                      className={
                        active
                          ? "rounded-full bg-teal px-3.5 py-1.5 text-sm font-semibold text-paper"
                          : "rounded-full border border-line bg-paper/70 px-3.5 py-1.5 text-sm font-medium text-ink-soft transition hover:border-teal/40 hover:text-ink"
                      }
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-ink-soft">
                {PUBLIC_TOOLS.find((t) => t.id === tool)?.hint}
              </p>
            </div>

            {publicUrl ? (
              <CopyableLink
                label="Seu link"
                url={publicUrl}
                hint={
                  isPro && usePersonalized && slug.trim()
                    ? "Slug Pro"
                    : "Link público"
                }
              />
            ) : null}

            <div className="rounded-md border border-line bg-paper/60 px-4 py-4">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={usePersonalized}
                  disabled={!isPro}
                  onChange={(e) => setUsePersonalized(e.target.checked)}
                />
                <span>
                  <span className="font-medium text-ink">
                    Personalizar o link (Pro)
                  </span>
                  <span className="mt-1 block text-ink-soft">
                    Troca o ID por um nome curto, ex.{" "}
                    <code className="text-xs">/c/seu-nome</code>
                  </span>
                </span>
              </label>

              {isPro && usePersonalized ? (
                <label className="mt-4 block text-sm">
                  <span className="font-medium text-ink-soft">Slug</span>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="seu-nome"
                    className="input-field mt-1.5"
                  />
                </label>
              ) : null}

              {!isPro ? (
                <Link
                  href="/app/billing"
                  className="mt-3 inline-block text-sm font-medium text-teal hover:text-teal-deep"
                >
                  Assinar Pro para personalizar →
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <form onSubmit={onSave} className="mt-12 space-y-10">
        <section className="border-t border-line pt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">
            Grátis
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold">Perfil</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Nome e headline aparecem no cartão público.
          </p>
          <div className="mt-5 space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-ink-soft">Nome de exibição</span>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field mt-1.5"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ink-soft">Headline</span>
              <input
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Ex.: Designer · São Paulo"
                className="input-field mt-1.5"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ink-soft">Bio</span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="input-field mt-1.5"
              />
            </label>
          </div>
        </section>

        <section className="border-t border-line pt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">
            Aparência
          </p>
          <h2 className="mt-2 font-display text-xl font-semibold">
            Tema do cartão público
          </h2>
          <p className="mt-2 text-sm text-ink-soft">
            Temas Minimal, Clássico e Bold são grátis. Areia e Ink + cor da marca
            são Pro.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {themeOptions.map((t) => {
              const selected = theme === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTheme(t.value)}
                  className={
                    selected
                      ? "rounded-md border-2 border-teal bg-paper px-4 py-3 text-left"
                      : "rounded-md border border-line bg-paper/60 px-4 py-3 text-left transition hover:border-teal/40"
                  }
                >
                  <span className="block font-medium text-ink">{t.label}</span>
                  <span className="mt-0.5 block text-xs text-ink-soft">
                    {t.blurb}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            <p className="text-sm font-medium text-ink">
              Cor da marca{" "}
              <span className="font-normal text-ink-soft">
                {isPro ? "(Pro)" : "(Pro — bloqueada)"}
              </span>
            </p>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="color"
                value={brandColor.startsWith("#") ? brandColor : "#0f766e"}
                onChange={(e) => setBrandColor(e.target.value)}
                disabled={!isPro}
                className="h-10 w-14 cursor-pointer rounded border border-line bg-paper disabled:opacity-40"
              />
              <input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                disabled={!isPro}
                className="input-field flex-1 disabled:opacity-50"
              />
            </div>
            {!isPro ? (
              <Link
                href="/app/billing"
                className="mt-2 inline-block text-sm font-medium text-teal hover:text-teal-deep"
              >
                Liberar cor e temas Pro →
              </Link>
            ) : (
              <p className="mt-2 text-xs text-ink-soft">
                Pro também remove o branding MyCartao no cartão público.
              </p>
            )}
          </div>
        </section>

        <div className="border-t border-line pt-8">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-teal-deep disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar configurações"}
          </button>
          {primaryCardId ? (
            <Link
              href={`/c/${publicKey || primaryCardId}`}
              target="_blank"
              className="ml-3 inline-flex text-sm font-medium text-teal hover:text-teal-deep"
            >
              Ver cartão público →
            </Link>
          ) : null}
        </div>
      </form>

      <div className="mt-14 border-t border-line pt-8">
        <p className="text-sm text-ink-soft">
          Plano atual:{" "}
          <span className="font-medium text-ink">{plan}</span>
        </p>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="mt-4 rounded-md border border-line bg-paper/70 px-5 py-2.5 text-sm font-medium text-ink transition hover:border-red-800/40 hover:text-red-800 disabled:opacity-60"
        >
          {loggingOut ? "Saindo…" : "Sair da conta"}
        </button>
      </div>
    </main>
  );
}
