"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  buildSmartConditions,
  formatSmartConditions,
  TARGET_LABELS,
  type SmartRule,
  type SmartTarget,
} from "@/lib/smart-rules";

type ProfileMe = {
  id: string;
  slug: string | null;
};

export default function SmartPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileMe | null>(null);
  const [rules, setRules] = useState<SmartRule[] | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [target, setTarget] = useState<SmartTarget>("whatsapp");
  const [always, setAlways] = useState(true);
  const [hourStart, setHourStart] = useState(9);
  const [hourEnd, setHourEnd] = useState(18);

  const isPro = plan === "pro" || plan === "admin";

  const goUrl = useMemo(() => {
    if (typeof window === "undefined" || !profile) return "";
    const key = profile.slug || profile.id;
    return `${window.location.origin}/go/${key}`;
  }, [profile]);

  async function loadProData() {
    const [meRes, rulesRes] = await Promise.all([
      apiFetch("/api/v1/me"),
      apiFetch("/api/v1/smart-rules"),
    ]);
    if (meRes.status === 401 || rulesRes.status === 401) {
      router.replace("/login");
      return;
    }
    if (!meRes.ok) {
      setError("Não foi possível carregar o perfil.");
      return;
    }
    setProfile((await meRes.json()) as ProfileMe);

    if (!rulesRes.ok) {
      setError("Não foi possível listar as regras Smart.");
      return;
    }
    setRules((await rulesRes.json()) as SmartRule[]);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const who = await apiFetch("/api/v1/auth/whoami");
      if (who.status === 401) {
        router.replace("/login");
        return;
      }
      if (!who.ok) {
        if (!cancelled) setError("Não foi possível verificar o plano.");
        return;
      }
      const user = (await who.json()) as { plan: string };
      if (cancelled) return;
      setPlan(user.plan);

      if (user.plan === "pro" || user.plan === "admin") {
        await loadProData();
      } else {
        const meRes = await apiFetch("/api/v1/me");
        if (meRes.status === 401) {
          router.replace("/login");
          return;
        }
        if (meRes.ok && !cancelled) {
          setProfile((await meRes.json()) as ProfileMe);
        }
      }
    }

    load().catch(() => {
      if (!cancelled) setError("Falha de rede ao carregar Smart Card.");
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");
    try {
      const conditions = buildSmartConditions(always, hourStart, hourEnd);
      const res = await apiFetch("/api/v1/smart-rules", {
        method: "POST",
        body: JSON.stringify({ conditions, target }),
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          detail?: string;
          code?: string;
        } | null;
        setError(
          data?.code === "plan_required"
            ? "Smart Card requer plano Pro."
            : (data?.detail ?? "Não foi possível criar a regra."),
        );
        return;
      }
      setAlways(true);
      setTarget("whatsapp");
      setHourStart(9);
      setHourEnd(18);
      setMessage("Regra criada.");
      await loadProData();
    } catch {
      setError("Falha de rede ao criar regra.");
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm("Remover esta regra Smart?")) return;
    setError("");
    setMessage("");
    const res = await apiFetch(`/api/v1/smart-rules/${id}`, {
      method: "DELETE",
    });
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (!res.ok && res.status !== 204) {
      setError("Não foi possível remover a regra.");
      return;
    }
    setMessage("Regra removida.");
    await loadProData();
  }

  async function onCopy() {
    if (!goUrl) return;
    try {
      await navigator.clipboard.writeText(goUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Não foi possível copiar o link.");
    }
  }

  return (
    <main>
      <h1 className="animate-rise font-display text-3xl font-semibold sm:text-4xl">
        Smart Card
      </h1>
      <p className="animate-rise-delay mt-2 text-ink-soft">
        Um link que redireciona conforme regras de horário ou destino.
      </p>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-6 text-sm text-teal-deep">{message}</p>
      ) : null}

      {plan === null && !error ? (
        <p className="mt-10 text-sm text-ink-soft">Carregando…</p>
      ) : null}

      {plan === "free" ? (
        <section className="mt-10 max-w-lg space-y-4">
          <p className="text-ink-soft">
            Com o Smart Card (Pro), você compartilha um único link{" "}
            <code className="text-sm text-ink">/go/…</code> que decide o
            destino: cartão, portfólio ou WhatsApp — por exemplo, WhatsApp em
            horário comercial e portfólio fora dele.
          </p>
          <p className="text-ink-soft">
            Desbloqueie regras condicionais, slug personalizado e analytics
            estendido no plano Pro.
          </p>
          <Link
            href="/app/billing"
            className="inline-flex rounded-md bg-teal px-6 py-3 text-sm font-semibold text-paper transition hover:bg-teal-deep"
          >
            Assinar Pro
          </Link>
        </section>
      ) : null}

      {isPro ? (
        <>
          <section className="mt-10 max-w-lg border-b border-line pb-10">
            <h2 className="font-display text-xl font-medium">Seu link Smart</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Quem abrir este URL será redirecionado pela primeira regra que
              bater.
            </p>
            {goUrl ? (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <code className="break-all text-sm text-ink">{goUrl}</code>
                <button
                  type="button"
                  onClick={onCopy}
                  className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:border-teal hover:text-teal"
                >
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-ink-soft">Carregando link…</p>
            )}
          </section>

          <form
            onSubmit={onCreate}
            className="mt-10 max-w-lg space-y-4 border-b border-line pb-10"
          >
            <h2 className="font-display text-xl font-medium">Nova regra</h2>
            <label className="block text-sm">
              <span className="font-medium text-ink-soft">Destino</span>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value as SmartTarget)}
                className="mt-1 w-full rounded-md border border-line bg-paper/80 px-3 py-2"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="portfolio">Portfólio</option>
                <option value="card">Cartão</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={always}
                onChange={(e) => setAlways(e.target.checked)}
                className="rounded border-line"
              />
              <span className="font-medium text-ink-soft">Sempre</span>
            </label>
            {!always ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-ink-soft">Hora início</span>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={hourStart}
                    onChange={(e) => setHourStart(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-line bg-paper/80 px-3 py-2"
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-ink-soft">Hora fim</span>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={hourEnd}
                    onChange={(e) => setHourEnd(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-line bg-paper/80 px-3 py-2"
                    required
                  />
                </label>
              </div>
            ) : null}
            <button
              type="submit"
              disabled={creating}
              className="rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-teal-deep disabled:opacity-60"
            >
              {creating ? "Criando…" : "Adicionar regra"}
            </button>
          </form>

          {rules === null && !error ? (
            <p className="mt-8 text-sm text-ink-soft">Carregando regras…</p>
          ) : null}

          {rules && rules.length === 0 ? (
            <p className="mt-8 text-ink-soft">Nenhuma regra ainda.</p>
          ) : null}

          {rules && rules.length > 0 ? (
            <ul className="mt-8 max-w-lg space-y-3">
              {rules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex items-start justify-between gap-4 border-b border-line py-4"
                >
                  <div>
                    <p className="font-medium">
                      {TARGET_LABELS[rule.target] ?? rule.target}
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {formatSmartConditions(rule.conditions)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(rule.id)}
                    className="text-sm font-medium text-ink-soft transition hover:text-red-800"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
