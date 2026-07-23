"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, toMediaSrc } from "@/lib/api";
import { parseCustomLinks } from "@/lib/custom-links";

const FIELD_LABELS: Record<string, string> = {
  phone: "Telefone",
  whatsapp: "WhatsApp",
  email: "E-mail",
  company: "Empresa",
  website: "Site",
  linkedin: "LinkedIn",
  instagram: "Instagram",
};

type PublicCard = {
  id: string;
  title: string;
  fields: Record<string, unknown>;
  is_primary: boolean;
};

function fieldStr(fields: Record<string, unknown>, key: string): string {
  const v = fields[key];
  return typeof v === "string" ? v : "";
}

export default function PublicCardPage() {
  const params = useParams<{ slugOrId: string }>();
  const slugOrId = params.slugOrId;
  const [card, setCard] = useState<PublicCard | null>(null);
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
      if (!cancelled) setCard(data);
    }
    load().catch(() => {
      if (!cancelled) setError("Falha ao carregar o cartão.");
    });
    return () => {
      cancelled = true;
    };
  }, [slugOrId]);

  const avatar = card ? toMediaSrc(fieldStr(card.fields, "avatar")) : "";
  const company = card ? fieldStr(card.fields, "company") : "";
  const visibleFields = card
    ? Object.keys(FIELD_LABELS).filter(
        (k) => k !== "company" && fieldStr(card.fields, k),
      )
    : [];
  const customLinks = card ? parseCustomLinks(card.fields) : [];
  const displayName = card?.title?.trim() || "MyCartao";

  return (
    <div className="atmosphere min-h-screen text-ink">
      <div className="atmosphere-pattern min-h-screen">
        <header className="mx-auto flex w-full max-w-lg items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-tight"
          >
            MyCartao
          </Link>
          <Link
            href={`/c/${slugOrId}/presence`}
            className="text-sm font-medium text-teal transition hover:text-teal-deep"
          >
            Presence Mode
          </Link>
        </header>

        <main className="mx-auto max-w-lg px-6 pb-20">
          {error ? (
            <p role="alert" className="text-sm text-red-800">
              {error}
            </p>
          ) : null}

          {!card && !error ? (
            <p className="animate-fade text-sm text-ink-soft">Carregando…</p>
          ) : null}

          {card ? (
            <div className="animate-rise">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt=""
                  className="mb-7 h-36 w-36 rounded-full object-cover ring-2 ring-sand sm:h-40 sm:w-40"
                />
              ) : (
                <div className="mb-7 flex h-36 w-36 items-center justify-center rounded-full bg-teal/15 font-display text-4xl text-teal sm:h-40 sm:w-40">
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
                {displayName}
              </h1>
              {company ? (
                <p className="animate-rise-delay mt-3 text-lg text-ink-soft">
                  {company}
                </p>
              ) : null}

              {visibleFields.length > 0 ? (
                <ul className="animate-rise-delay mt-10 space-y-1">
                  {visibleFields.map((key) => (
                    <li key={key} className="border-b border-line py-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/70">
                        {FIELD_LABELS[key]}
                      </p>
                      <p className="mt-0.5 text-ink">
                        {fieldStr(card.fields, key)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}

              {customLinks.length > 0 ? (
                <nav
                  aria-label="Links"
                  className="animate-rise-delay-2 mt-10 flex flex-col gap-2.5"
                >
                  {customLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full border-b border-line py-3.5 text-base font-semibold text-ink transition hover:border-teal hover:text-teal"
                    >
                      {link.title}
                    </a>
                  ))}
                </nav>
              ) : null}

              <div className="animate-rise-delay-2 mt-12 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`/api/v1/public/cards/${slugOrId}/vcard.vcf`}
                  className="inline-flex items-center justify-center rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-teal-deep"
                >
                  Salvar contato
                </a>
                <Link
                  href={`/p/${slugOrId}`}
                  className="inline-flex items-center justify-center rounded-md border border-line bg-paper/70 px-5 py-2.5 text-sm font-medium text-ink transition hover:border-teal/40"
                >
                  Ver portfólio
                </Link>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
