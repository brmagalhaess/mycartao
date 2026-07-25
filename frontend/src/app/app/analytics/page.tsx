"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type DayPoint = { day: string; views: number };

type Summary = {
  views: number;
  unique_approx: number;
  by_day: DayPoint[];
};

function ByDayChart({ points }: { points: DayPoint[] }) {
  if (points.length === 0) {
    return (
      <p className="mt-4 text-sm text-ink-soft">Sem visualizações no período.</p>
    );
  }

  const max = Math.max(...points.map((p) => p.views), 1);
  const width = 560;
  const height = 160;
  const padX = 24;
  const padY = 16;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const step = points.length > 1 ? innerW / (points.length - 1) : 0;

  const coords = points.map((p, i) => {
    const x = padX + (points.length === 1 ? innerW / 2 : i * step);
    const y = padY + innerH - (p.views / max) * innerH;
    return { x, y, ...p };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-6 w-full max-w-xl text-teal"
      role="img"
      aria-label="Gráfico de visualizações por dia"
    >
      <line
        x1={padX}
        y1={height - padY}
        x2={width - padX}
        y2={height - padY}
        stroke="currentColor"
        strokeOpacity={0.2}
      />
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2.5} />
      {coords.map((c) => (
        <circle key={c.day} cx={c.x} cy={c.y} r={3.5} fill="currentColor" />
      ))}
    </svg>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [days, setDays] = useState(7);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("free");

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
        if (!cancelled) {
          setPlan(user.plan);
          if (user.plan === "free" && days > 7) setDays(7);
        }
      }

      const res = await apiFetch(
        `/api/v1/analytics/summary?days=${days}`,
      );
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        if (!cancelled) setError("Não foi possível carregar analytics.");
        return;
      }
      const data = (await res.json()) as Summary;
      if (!cancelled) setSummary(data);
    }

    load().catch(() => {
      if (!cancelled) setError("Falha de rede ao carregar analytics.");
    });

    return () => {
      cancelled = true;
    };
  }, [router, days]);

  const maxDays = plan === "free" ? 7 : 90;

  return (
    <main>
      <h1 className="animate-rise font-display text-3xl font-semibold sm:text-4xl">
        Analytics
      </h1>
      <p className="animate-rise-delay mt-2 text-ink-soft">
        Visualizações dos seus cartões públicos.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {[7, 30, 90].filter((d) => d <= maxDays).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              days === d
                ? "bg-teal text-paper"
                : "border border-line bg-paper/70 text-ink hover:border-teal/40"
            }`}
          >
            {d} dias
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {!summary && !error ? (
        <p className="mt-10 text-sm text-ink-soft">Carregando…</p>
      ) : null}

      {summary ? (
        <div className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap gap-8">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/70">
                  Views
                </p>
                <p className="mt-1 font-display text-4xl font-semibold">
                  {summary.views}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/70">
                  Únicos (aprox.)
                </p>
                <p className="mt-1 font-display text-4xl font-semibold">
                  {summary.unique_approx}
                </p>
              </div>
            </div>
            {plan === "pro" || plan === "admin" ? (
              <a
                href={`/api/v1/analytics/export?days=${days}`}
                className="rounded-md border border-line bg-paper/70 px-4 py-2 text-sm font-semibold text-ink transition hover:border-teal/40"
                onClick={async (e) => {
                  e.preventDefault();
                  const res = await apiFetch(
                    `/api/v1/analytics/export?days=${days}`,
                  );
                  if (!res.ok) {
                    setError("Exportação disponível só no Pro.");
                    return;
                  }
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "mycartao-analytics.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Exportar CSV
              </a>
            ) : (
              <Link
                href="/app/billing"
                className="text-sm font-medium text-teal hover:text-teal-deep"
              >
                Export CSV no Pro →
              </Link>
            )}
          </div>
          <h2 className="mt-10 font-display text-xl font-medium">Por dia</h2>
          <ByDayChart points={summary.by_day} />
          {summary.by_day.length > 0 ? (
            <ul className="mt-4 max-w-xl space-y-1 text-sm text-ink-soft">
              {summary.by_day.map((p) => (
                <li key={p.day} className="flex justify-between gap-4">
                  <span>{p.day}</span>
                  <span className="font-medium text-ink">{p.views}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}
