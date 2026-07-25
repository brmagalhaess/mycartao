"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useI18n } from "@/components/I18nProvider";

type BillingStatus = { environment: string; stripe_mode: string };

type Overview = {
  plan: string;
  status: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  has_subscription: boolean;
};

type Invoice = {
  id: string;
  number: string | null;
  status: string | null;
  amount_paid: number | null;
  currency: string | null;
  created: string | null;
  hosted_invoice_url: string | null;
};

function parseDetail(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const detail = (data as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (d as { msg?: string }).msg ?? JSON.stringify(d))
      .join("; ");
  }
  if (detail && typeof detail === "object") {
    return (detail as { message?: string }).message ?? JSON.stringify(detail);
  }
  return null;
}

export default function BillingPage() {
  const router = useRouter();
  const { dict, locale } = useI18n();
  const t = dict.billing;

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [matrix, setMatrix] = useState<{
    free: { label: string }[];
    pro: { label: string }[];
  } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const intlLocale = locale === "pt" ? "pt-BR" : locale;

  const loadAll = useCallback(async () => {
    const [ovRes, invRes, entRes] = await Promise.all([
      apiFetch("/api/v1/billing/subscription"),
      apiFetch("/api/v1/billing/history"),
      apiFetch("/api/v1/me/entitlements"),
    ]);
    if (ovRes.status === 401) {
      router.replace("/login");
      return;
    }
    if (ovRes.ok) setOverview((await ovRes.json()) as Overview);
    if (invRes.ok) {
      const data = (await invRes.json()) as { invoices: Invoice[] };
      setInvoices(data.invoices);
    } else {
      setInvoices([]);
    }
    if (entRes.ok) {
      const data = (await entRes.json()) as {
        matrix?: { free: { label: string }[]; pro: { label: string }[] };
      };
      if (data.matrix) setMatrix(data.matrix);
    }
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const statusRes = await apiFetch("/api/v1/billing/status");
      if (statusRes.ok && !cancelled) {
        setStatus((await statusRes.json()) as BillingStatus);
      }
      // Back from Stripe Checkout: reconcile before reading the plan.
      const fromCheckout =
        typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).get("success") === "1";
      if (fromCheckout) {
        await apiFetch("/api/v1/billing/sync", { method: "POST" }).catch(
          () => null,
        );
      }
      if (!cancelled) await loadAll();
    }
    boot().catch(() => {
      if (!cancelled) setError(t.genericError);
    });
    return () => {
      cancelled = true;
    };
  }, [loadAll, t.genericError]);

  async function action(
    path: string,
    opts?: { confirm?: string; testModeMessage?: boolean },
  ) {
    if (opts?.confirm && !window.confirm(opts.confirm)) return;
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch(path, { method: "POST" });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const code = (data as { code?: string } | null)?.code;
        setError(
          code === "stripe_test_mode"
            ? t.testBanner
            : (parseDetail(data) ?? t.genericError),
        );
        return;
      }
      if (path === "/api/v1/billing/checkout") {
        const url = (data as { url?: string } | null)?.url;
        if (url) {
          window.location.href = url;
          return;
        }
      }
      if (
        path === "/api/v1/billing/sync" &&
        (data as { plan?: string } | null)?.plan === "free"
      ) {
        setError(t.syncNoSub);
      }
      await loadAll();
    } catch {
      setError(t.genericError);
    } finally {
      setBusy(false);
    }
  }

  const plan = overview?.plan ?? null;
  const isAdmin = plan === "admin";
  const isPro = plan === "pro" || isAdmin;
  const stripeTest = status?.stripe_mode === "test";
  const periodEnd = overview?.current_period_end
    ? new Date(overview.current_period_end).toLocaleDateString(intlLocale, {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  function money(inv: Invoice) {
    if (inv.amount_paid == null) return "—";
    try {
      return new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: (inv.currency ?? "brl").toUpperCase(),
      }).format(inv.amount_paid / 100);
    } catch {
      return `${(inv.amount_paid / 100).toFixed(2)}`;
    }
  }

  return (
    <main>
      <h1 className="animate-rise font-display text-3xl font-semibold sm:text-4xl">
        {t.title}
      </h1>
      <p className="animate-rise-delay mt-2 text-ink-soft">{t.lead}</p>

      {stripeTest ? (
        <p
          role="status"
          className="mt-6 rounded-md border border-amber-700/30 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {t.testBanner}
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-6 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {overview === null && !error ? (
        <p className="mt-10 text-sm text-ink-soft">{dict.common.loading}</p>
      ) : null}

      {overview ? (
        <section className="mt-8 rounded-2xl border border-line bg-paper/70 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/70">
                {t.currentPlan}
              </p>
              <p className="mt-1 font-display text-3xl font-semibold capitalize">
                {plan}
              </p>
            </div>
            {overview.status ? (
              <span className="rounded-full bg-teal/10 px-3 py-1 text-sm font-medium text-teal-deep">
                {t.statuses[overview.status] ?? overview.status}
              </span>
            ) : null}
          </div>

          {isAdmin ? (
            <p className="mt-5 text-sm text-ink-soft">{t.adminNote}</p>
          ) : isPro ? (
            <>
              <p className="mt-5 text-sm text-ink-soft">{t.proActive}</p>
              {periodEnd ? (
                <p className="mt-2 text-sm text-ink-soft">
                  {overview.cancel_at_period_end ? t.endsOn : t.renewsOn}{" "}
                  <strong className="text-ink">{periodEnd}</strong>
                </p>
              ) : null}
              {overview.cancel_at_period_end ? (
                <p className="mt-3 rounded-md border border-amber-700/30 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  {t.cancelScheduled}
                </p>
              ) : null}
              {overview.has_subscription ? (
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  {overview.cancel_at_period_end ? (
                    <button
                      type="button"
                      onClick={() => action("/api/v1/billing/resume")}
                      disabled={busy}
                      className="inline-flex justify-center rounded-md bg-teal px-6 py-3 text-sm font-semibold text-paper transition hover:bg-teal-deep disabled:opacity-60"
                    >
                      {busy ? t.wait : t.resume}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        action("/api/v1/billing/cancel", {
                          confirm: t.cancelConfirm,
                        })
                      }
                      disabled={busy}
                      className="inline-flex justify-center rounded-md border border-red-800/30 px-6 py-3 text-sm font-medium text-red-800 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      {busy ? t.wait : t.cancel}
                    </button>
                  )}
                </div>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-5 text-sm text-ink-soft">{t.proPitch}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => action("/api/v1/billing/checkout")}
                  disabled={busy || stripeTest}
                  className="inline-flex justify-center rounded-md bg-teal px-6 py-3 text-sm font-semibold text-paper transition hover:bg-teal-deep disabled:opacity-60"
                >
                  {busy ? t.wait : t.subscribe}
                </button>
                <button
                  type="button"
                  onClick={() => action("/api/v1/billing/sync")}
                  disabled={busy}
                  className="inline-flex justify-center rounded-md border border-line px-6 py-3 text-sm font-medium text-ink transition hover:border-teal/40 disabled:opacity-60"
                >
                  {t.alreadyPaid}
                </button>
              </div>
              {stripeTest ? (
                <p className="mt-3 text-xs text-ink-soft">{t.testButtonNote}</p>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {matrix ? (
        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-paper/70 p-6">
            <h2 className="font-display text-lg font-semibold">Free</h2>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              {matrix.free.map((row) => (
                <li key={row.label} className="flex gap-2">
                  <span className="text-teal" aria-hidden>
                    ✓
                  </span>
                  {row.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-teal/40 bg-teal/5 p-6">
            <h2 className="font-display text-lg font-semibold">Pro</h2>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              {matrix.pro.map((row) => (
                <li key={row.label} className="flex gap-2">
                  <span className="text-teal" aria-hidden>
                    ✓
                  </span>
                  {row.label}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {invoices !== null ? (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold">{t.history}</h2>
          {invoices.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">{t.noInvoices}</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-paper/70">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-soft/70">
                    <th className="px-5 py-3 font-medium">{t.date}</th>
                    <th className="px-5 py-3 font-medium">{t.amount}</th>
                    <th className="px-5 py-3 font-medium">{t.status}</th>
                    <th className="px-5 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-line/60 last:border-0">
                      <td className="px-5 py-3">
                        {inv.created
                          ? new Date(inv.created).toLocaleDateString(intlLocale)
                          : "—"}
                      </td>
                      <td className="px-5 py-3">{money(inv)}</td>
                      <td className="px-5 py-3 capitalize">
                        {t.statuses[inv.status ?? ""] ?? inv.status ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {inv.hosted_invoice_url ? (
                          <a
                            href={inv.hosted_invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-teal hover:underline"
                          >
                            {t.view}
                          </a>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
