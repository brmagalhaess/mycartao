"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { apiFetch, toMediaSrc } from "@/lib/api";
import { parseCustomLinks } from "@/lib/custom-links";
import { themeStyleVars, type CardTheme } from "@/lib/card-theme";

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
  display_name?: string | null;
  headline?: string | null;
  bio?: string | null;
  theme?: string | null;
  brand_color?: string | null;
  show_mycartao_branding?: boolean;
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

  const theme = (card?.theme || "minimal") as CardTheme;
  const style = useMemo(
    () => themeStyleVars(theme, card?.brand_color) as CSSProperties,
    [theme, card?.brand_color],
  );

  const avatar = card ? toMediaSrc(fieldStr(card.fields, "avatar")) : "";
  const company = card ? fieldStr(card.fields, "company") : "";
  const visibleFields = card
    ? Object.keys(FIELD_LABELS).filter(
        (k) => k !== "company" && fieldStr(card.fields, k),
      )
    : [];
  const customLinks = card ? parseCustomLinks(card.fields) : [];
  const displayName =
    card?.display_name?.trim() || card?.title?.trim() || "MyCartao";
  const headline = card?.headline?.trim() || company;
  const showBrand = card?.show_mycartao_branding !== false;

  return (
    <div
      className={`card-theme card-theme-${theme} min-h-screen`}
      style={style}
      data-theme={theme}
    >
      <div className="card-theme-surface min-h-screen">
        <header className="mx-auto flex w-full max-w-lg items-center justify-between px-6 py-5">
          {showBrand ? (
            <Link
              href="/"
              className="font-display text-lg font-semibold tracking-tight"
            >
              MyCartao
            </Link>
          ) : (
            <span className="font-display text-lg font-semibold tracking-tight">
              {displayName}
            </span>
          )}
          <Link
            href={`/c/${slugOrId}/presence`}
            className="text-sm font-medium transition opacity-80 hover:opacity-100"
            style={{ color: "var(--card-accent)" }}
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
            <p className="animate-fade text-sm opacity-70">Carregando…</p>
          ) : null}

          {card ? (
            <div className="animate-rise">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt=""
                  className="mb-7 h-36 w-36 rounded-full object-cover ring-2 sm:h-40 sm:w-40"
                  style={{ ["--tw-ring-color" as string]: "var(--card-ring)" }}
                />
              ) : (
                <div
                  className="mb-7 flex h-36 w-36 items-center justify-center rounded-full font-display text-4xl sm:h-40 sm:w-40"
                  style={{
                    background: "color-mix(in srgb, var(--card-accent) 18%, transparent)",
                    color: "var(--card-accent)",
                  }}
                >
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <h1
                className={`font-semibold tracking-tight sm:text-5xl ${
                  theme === "bold" ? "font-sans text-4xl" : "font-display text-4xl"
                }`}
              >
                {displayName}
              </h1>
              {headline ? (
                <p className="animate-rise-delay mt-3 text-lg opacity-80">
                  {headline}
                </p>
              ) : null}
              {card.bio ? (
                <p className="mt-4 text-base leading-relaxed opacity-75">
                  {card.bio}
                </p>
              ) : null}

              {visibleFields.length > 0 ? (
                <ul className="animate-rise-delay mt-10 space-y-1">
                  {visibleFields.map((key) => (
                    <li
                      key={key}
                      className="border-b py-3"
                      style={{ borderColor: "var(--card-line)" }}
                    >
                      <p className="text-xs font-medium uppercase tracking-wide opacity-60">
                        {FIELD_LABELS[key]}
                      </p>
                      <p className="mt-0.5">{fieldStr(card.fields, key)}</p>
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
                      className="block w-full border-b py-3.5 text-base font-semibold transition"
                      style={{ borderColor: "var(--card-line)" }}
                    >
                      {link.title}
                    </a>
                  ))}
                </nav>
              ) : null}

              <div className="animate-rise-delay-2 mt-12 flex flex-col gap-3 sm:flex-row">
                <a
                  href={`/api/v1/public/cards/${slugOrId}/vcard.vcf`}
                  className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold text-white transition"
                  style={{ background: "var(--card-accent)" }}
                >
                  Salvar contato
                </a>
                <Link
                  href={`/p/${slugOrId}`}
                  className="inline-flex items-center justify-center rounded-md border px-5 py-2.5 text-sm font-medium transition"
                  style={{ borderColor: "var(--card-line)" }}
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
