"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, toMediaSrc } from "@/lib/api";
import { useI18n } from "@/components/I18nProvider";

type PortfolioItem = {
  id: string;
  type: "project" | "service";
  title: string;
  description: string | null;
  price: string | number | null;
  image_key: string | null;
  category: string | null;
};

type PublicCard = {
  title: string;
  fields: Record<string, unknown>;
  display_name?: string | null;
  headline?: string | null;
};

export default function PublicPortfolioPage() {
  const params = useParams<{ slugOrId: string }>();
  const slugOrId = params.slugOrId;
  const { dict } = useI18n();
  const t = dict.publicPortfolio;
  const [items, setItems] = useState<PortfolioItem[] | null>(null);
  const [card, setCard] = useState<PublicCard | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [itemsRes, cardRes] = await Promise.all([
        apiFetch(`/api/v1/public/portfolio/${slugOrId}`),
        apiFetch(`/api/v1/public/cards/${slugOrId}`),
      ]);
      if (!itemsRes.ok) {
        if (!cancelled) setError(t.notFound);
        return;
      }
      const data = (await itemsRes.json()) as PortfolioItem[];
      if (!cancelled) setItems(data);
      if (cardRes.ok) {
        const cardData = (await cardRes.json()) as PublicCard;
        if (!cancelled) setCard(cardData);
      }
    }
    load().catch(() => {
      if (!cancelled) setError(t.loadError);
    });
    return () => {
      cancelled = true;
    };
  }, [slugOrId, t.notFound, t.loadError]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — ignore
    }
  }

  const avatarKey =
    card && typeof card.fields.avatar === "string" ? card.fields.avatar : "";
  const avatar = avatarKey ? toMediaSrc(avatarKey) : "";
  const displayName = card?.display_name?.trim() || card?.title?.trim() || "";

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
            {dict.common.viewCard}
          </Link>
        </header>

        <main className="mx-auto max-w-3xl px-6 pb-16">
          {displayName ? (
            <div className="animate-rise flex items-center gap-5">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt=""
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-sand/70"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal/15 font-display text-2xl font-semibold text-teal">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="font-display text-3xl font-semibold sm:text-4xl">
                  {displayName}
                </h1>
                {card?.headline ? (
                  <p className="mt-1 text-ink-soft">{card.headline}</p>
                ) : null}
              </div>
            </div>
          ) : (
            <h1 className="animate-rise font-display text-3xl font-semibold sm:text-4xl">
              {t.title}
            </h1>
          )}

          <div className="animate-rise-delay mt-4 flex flex-wrap items-center gap-4">
            <p className="text-ink-soft">{t.lead}</p>
            <button
              type="button"
              onClick={copyLink}
              className="rounded-md border border-line bg-paper/70 px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-teal/40"
            >
              {copied ? dict.common.copied : t.copyLink}
            </button>
          </div>

          {error ? (
            <p role="alert" className="mt-8 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          {items === null && !error ? (
            <p className="mt-10 text-sm text-ink-soft">
              {dict.common.loading}
            </p>
          ) : null}

          {items && items.length === 0 ? (
            <p className="mt-10 text-ink-soft">{t.empty}</p>
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
                      {item.type === "service" ? t.service : t.project}
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
