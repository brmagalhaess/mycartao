"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { apiFetch, toMediaSrc } from "@/lib/api";
import { parseCustomLinks } from "@/lib/custom-links";

type PublicCard = {
  id: string;
  title: string;
  fields: Record<string, unknown>;
  display_name?: string | null;
};

export default function PresenceModePage() {
  const params = useParams<{ slugOrId: string }>();
  const slugOrId = params.slugOrId;
  const [card, setCard] = useState<PublicCard | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await apiFetch(`/api/v1/public/cards/${slugOrId}`);
      if (!res.ok) {
        if (!cancelled) setError("Cartão não encontrado.");
        return;
      }
      const data = (await res.json()) as PublicCard;
      if (cancelled) return;
      setCard(data);

      const cardUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/c/${slugOrId}`
          : `/c/${slugOrId}`;
      const dataUrl = await QRCode.toDataURL(cardUrl, {
        width: 280,
        margin: 2,
        color: { dark: "#0c2a2e", light: "#faf8f5" },
      });
      if (!cancelled) setQrDataUrl(dataUrl);
    }

    load().catch(() => {
      if (!cancelled) setError("Falha ao carregar Presence Mode.");
    });

    return () => {
      cancelled = true;
    };
  }, [slugOrId]);

  const avatar =
    card && typeof card.fields.avatar === "string"
      ? toMediaSrc(card.fields.avatar)
      : null;
  const presenceLinks = card
    ? parseCustomLinks(card.fields).slice(0, 3)
    : [];
  const displayName =
    card?.display_name?.trim() || card?.title?.trim() || "MyCartao";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0c2a2e] text-paper">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(232,213,181,0.18),transparent_55%),radial-gradient(ellipse_at_80%_80%,rgba(15,118,110,0.35),transparent_50%)]"
      />
      <header className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
        <Link
          href={`/c/${slugOrId}`}
          className="text-sm font-medium text-paper/65 transition hover:text-paper"
        >
          ← Voltar
        </Link>
        <span className="font-display text-lg font-semibold tracking-tight">
          MyCartao
        </span>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center gap-7 px-6 pb-14">
        {error ? (
          <p role="alert" className="text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {!card && !error ? (
          <p className="animate-fade text-sm text-paper/60">Carregando…</p>
        ) : null}

        {card ? (
          <>
            <div className="animate-rise flex flex-col items-center gap-5">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt=""
                  className="h-40 w-40 rounded-full object-cover ring-4 ring-sand/45 sm:h-48 sm:w-48"
                />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-full bg-teal/40 font-display text-5xl sm:h-48 sm:w-48">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <h1 className="max-w-md text-center font-display text-3xl font-semibold tracking-tight sm:text-5xl">
                {displayName}
              </h1>
            </div>

            <div className="animate-rise-delay flex h-52 w-52 items-center justify-center bg-paper p-3 sm:h-64 sm:w-64">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="QR Code do cartão"
                  className="h-full w-full object-contain"
                />
              ) : (
                <p className="text-sm text-ink-soft">Gerando QR…</p>
              )}
            </div>

            <a
              href={`/api/v1/public/cards/${slugOrId}/vcard.vcf`}
              className="animate-rise-delay-2 inline-flex items-center justify-center rounded-md bg-sand px-7 py-3.5 text-base font-semibold text-ink transition hover:bg-sand-warm"
            >
              Salvar contato
            </a>

            {presenceLinks.length > 0 ? (
              <nav
                aria-label="Links rápidos"
                className="animate-rise-delay-2 flex flex-col items-center gap-3"
              >
                {presenceLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium tracking-wide text-sand/90 underline-offset-4 transition hover:text-sand hover:underline"
                  >
                    {link.title}
                  </a>
                ))}
              </nav>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
