"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type PortfolioItem = {
  id: string;
  type: "project" | "service";
  title: string;
  description: string | null;
  price: string | number | null;
  image_key: string | null;
  category: string | null;
};

export default function PublicPortfolioPage() {
  const params = useParams<{ slugOrId: string }>();
  const slugOrId = params.slugOrId;
  const [items, setItems] = useState<PortfolioItem[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await apiFetch(`/api/v1/public/portfolio/${slugOrId}`);
      if (!res.ok) {
        if (!cancelled) setError("Portfólio não encontrado.");
        return;
      }
      const data = (await res.json()) as PortfolioItem[];
      if (!cancelled) setItems(data);
    }
    load().catch(() => {
      if (!cancelled) setError("Falha ao carregar o portfólio.");
    });
    return () => {
      cancelled = true;
    };
  }, [slugOrId]);

  return (
    <div className="atmosphere min-h-screen text-ink">
      <div className="atmosphere-pattern min-h-screen">
        <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-display text-lg font-semibold">
            MyCartao
          </Link>
          <Link
            href={`/c/${slugOrId}`}
            className="text-sm font-medium text-teal transition hover:text-teal-deep"
          >
            Ver cartão
          </Link>
        </header>

        <main className="mx-auto max-w-3xl px-6 pb-16">
          <h1 className="animate-rise font-display text-3xl font-semibold sm:text-4xl">
            Portfólio
          </h1>
          <p className="animate-rise-delay mt-2 text-ink-soft">
            Projetos e serviços públicos.
          </p>

          {error ? (
            <p role="alert" className="mt-8 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          {items === null && !error ? (
            <p className="mt-10 text-sm text-ink-soft">Carregando…</p>
          ) : null}

          {items && items.length === 0 ? (
            <p className="mt-10 text-ink-soft">Nenhum item publicado ainda.</p>
          ) : null}

          {items && items.length > 0 ? (
            <ul className="mt-10 space-y-6">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="border-b border-line pb-6 last:border-0"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2 className="font-display text-xl font-medium">
                      {item.title}
                    </h2>
                    <span className="text-xs font-medium uppercase tracking-wide text-ink-soft/70">
                      {item.type === "service" ? "Serviço" : "Projeto"}
                      {item.category ? ` · ${item.category}` : ""}
                    </span>
                  </div>
                  {item.description ? (
                    <p className="mt-2 text-ink-soft">{item.description}</p>
                  ) : null}
                  {item.price != null && item.price !== "" ? (
                    <p className="mt-2 text-sm font-medium text-teal">
                      {typeof item.price === "number"
                        ? `R$ ${item.price.toFixed(2)}`
                        : `R$ ${item.price}`}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </main>
      </div>
    </div>
  );
}
