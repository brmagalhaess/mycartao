"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import ShareLinksBlock from "@/components/ShareLinksBlock";

type Card = {
  id: string;
  title: string;
  is_primary: boolean;
  fields: Record<string, unknown>;
};

type Profile = {
  id: string;
  slug: string | null;
};

export default function AppDashboardPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState("free");
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

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

      const meRes = await apiFetch("/api/v1/me");
      if (meRes.status === 401) {
        router.replace("/login");
        return;
      }
      if (!meRes.ok) {
        if (!cancelled) setError("Não foi possível carregar o perfil.");
        return;
      }
      const me = (await meRes.json()) as Profile;
      if (!cancelled) setProfile(me);

      const cardsRes = await apiFetch("/api/v1/cards");
      if (cardsRes.status === 401) {
        router.replace("/login");
        return;
      }
      if (!cardsRes.ok) {
        if (!cancelled) setError("Não foi possível listar os cartões.");
        return;
      }

      const data = (await cardsRes.json()) as Card[];
      if (!cancelled) setCards(data);
    }

    load().catch(() => {
      if (!cancelled) setError("Falha de rede ao carregar o dashboard.");
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  const isPro = plan === "pro" || plan === "admin";
  const shareCard = useMemo(() => {
    if (!cards?.length) return null;
    return cards.find((c) => c.is_primary) ?? cards[0];
  }, [cards]);

  async function createCard() {
    setCreating(true);
    setError("");
    try {
      const res = await apiFetch("/api/v1/cards", {
        method: "POST",
        body: JSON.stringify({
          title: "Meu cartão",
          fields: {},
          is_primary: (cards?.length ?? 0) === 0,
        }),
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
          data?.code === "card_limit_reached"
            ? "Limite do plano Free atingido. Assine o Pro para mais cartões."
            : (data?.detail ?? "Não foi possível criar o cartão."),
        );
        return;
      }

      const created = (await res.json()) as Card;
      router.push(`/app/cards/${created.id}`);
    } catch {
      setError("Falha de rede ao criar o cartão.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="animate-rise font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Seus cartões
          </h1>
          <p className="animate-rise-delay mt-2 max-w-md text-ink-soft">
            Edite, compartilhe e gere QR / PDF de impressão.
          </p>
        </div>
        <button
          type="button"
          onClick={createCard}
          disabled={creating}
          className="animate-rise-delay inline-flex items-center justify-center rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-teal-deep disabled:opacity-60"
        >
          {creating ? "Criando…" : "Criar cartão"}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {cards === null && !error ? (
        <p className="mt-10 text-sm text-ink-soft">Carregando…</p>
      ) : null}

      {cards && cards.length === 0 ? (
        <div className="mt-12 max-w-lg">
          <p className="font-display text-xl font-medium text-ink">
            Ainda sem cartões
          </p>
          <p className="mt-2 text-ink-soft">
            Crie o primeiro para começar a compartilhar seu link e QR.
          </p>
        </div>
      ) : null}

      {cards && cards.length > 0 ? (
        <ul className="mt-10 space-y-3">
          {cards.map((card) => (
            <li key={card.id}>
              <Link
                href={`/app/cards/${card.id}`}
                className="flex items-center justify-between gap-4 border-b border-line py-4 transition hover:border-teal/40"
              >
                <div>
                  <p className="font-medium text-ink">{card.title}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {card.is_primary ? "Principal · " : ""}
                    Editar · QR / print
                  </p>
                </div>
                <span className="text-sm font-medium text-teal">Abrir →</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {origin && shareCard && profile ? (
        <div className="mt-14 max-w-2xl space-y-12 border-t border-line pt-10">
          <ShareLinksBlock
            kind="card"
            commonPath={`/c/${shareCard.id}`}
            personalizedPath={profile.slug ? `/c/${profile.slug}` : null}
            isPro={isPro}
            origin={origin}
          />
          <ShareLinksBlock
            kind="portfolio"
            commonPath={`/p/${profile.id}`}
            personalizedPath={profile.slug ? `/p/${profile.slug}` : null}
            isPro={isPro}
            origin={origin}
          />
        </div>
      ) : null}
    </main>
  );
}
