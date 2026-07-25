"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CSSProperties, useEffect, useMemo, useState } from "react";
import { apiFetch, toMediaSrc } from "@/lib/api";
import { parseCustomLinks, type CustomLink } from "@/lib/custom-links";
import { themeStyleVars, type CardTheme } from "@/lib/card-theme";
import { isPublicToolId } from "@/lib/public-tools";

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

type ActionLink = {
  id: string;
  title: string;
  href: string;
  external: boolean;
};

function fieldStr(fields: Record<string, unknown>, key: string): string {
  const v = fields[key];
  return typeof v === "string" ? v.trim() : "";
}

function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^(https?:|mailto:|tel:)/i.test(t)) return t;
  if (t.includes("@") && !t.includes(" ")) return `mailto:${t}`;
  if (/^[\d+()\s.-]{6,}$/.test(t)) return `tel:${t.replace(/[^\d+]/g, "")}`;
  if (t.startsWith("wa.me/") || t.startsWith("api.whatsapp.com/")) {
    return `https://${t}`;
  }
  return `https://${t.replace(/^\/\//, "")}`;
}

function hostKey(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

/** Classic contact fields + custom links → one button each (no duplicates). */
function buildActionLinks(
  fields: Record<string, unknown>,
  custom: CustomLink[],
): ActionLink[] {
  const actions: ActionLink[] = [];
  const seen = new Set<string>();

  function push(id: string, title: string, href: string, external = true) {
    const key = href.toLowerCase();
    const host = hostKey(href);
    if (seen.has(key) || (host && seen.has(`h:${host}`))) return;
    seen.add(key);
    if (host) seen.add(`h:${host}`);
    actions.push({ id, title, href, external });
  }

  const phone = fieldStr(fields, "phone");
  const whatsapp = fieldStr(fields, "whatsapp");
  const email = fieldStr(fields, "email");
  const website = fieldStr(fields, "website");
  const linkedin = fieldStr(fields, "linkedin");
  const instagram = fieldStr(fields, "instagram");

  if (whatsapp) {
    const digits = whatsapp.replace(/\D/g, "");
    push(
      "whatsapp",
      "WhatsApp",
      digits ? `https://wa.me/${digits}` : normalizeUrl(whatsapp),
    );
  } else if (phone) {
    push("phone", "Telefone", normalizeUrl(phone));
  }
  if (email) push("email", "E-mail", normalizeUrl(email));
  if (website) push("website", "Site", normalizeUrl(website));
  if (linkedin) push("linkedin", "LinkedIn", normalizeUrl(linkedin));
  if (instagram) {
    const handle = instagram.replace(/^@/, "");
    const href = handle.includes("instagram.com")
      ? normalizeUrl(handle)
      : `https://instagram.com/${handle}`;
    push("instagram", "Instagram", href);
  }

  for (const link of custom) {
    push(link.id, link.title, normalizeUrl(link.url));
  }

  return actions;
}

export default function PublicCardPage() {
  const params = useParams<{ slugOrId: string }>();
  const router = useRouter();
  const slugOrId = params.slugOrId;
  const [card, setCard] = useState<PublicCard | null>(null);
  const [error, setError] = useState("");
  const [routing, setRouting] = useState(true);

  // One public link: /c/{key}?tool=portfolio|presence|smart
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("tool");
    if (!raw || raw === "card" || !isPublicToolId(raw)) {
      setRouting(false);
      return;
    }
    if (raw === "portfolio") {
      router.replace(`/p/${slugOrId}`);
      return;
    }
    if (raw === "presence") {
      router.replace(`/c/${slugOrId}/presence`);
      return;
    }
    if (raw === "smart") {
      router.replace(`/go/${slugOrId}`);
      return;
    }
    setRouting(false);
  }, [slugOrId, router]);

  useEffect(() => {
    if (routing) return;
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
  }, [slugOrId, routing]);

  const theme = (card?.theme || "minimal") as CardTheme;
  const style = useMemo(
    () => themeStyleVars(theme, card?.brand_color) as CSSProperties,
    [theme, card?.brand_color],
  );

  const avatar = card ? toMediaSrc(fieldStr(card.fields, "avatar")) : "";
  const company = card ? fieldStr(card.fields, "company") : "";
  const customLinks = card ? parseCustomLinks(card.fields) : [];
  const actions = card ? buildActionLinks(card.fields, customLinks) : [];
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
        <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-5">
          {showBrand ? (
            <Link
              href="/"
              className="font-display text-base font-semibold tracking-tight opacity-80 transition hover:opacity-100"
            >
              MyCartao
            </Link>
          ) : (
            <span className="font-display text-base font-semibold tracking-tight">
              {displayName}
            </span>
          )}
          <Link
            href={`/c/${slugOrId}/presence`}
            className="rounded-full px-3 py-1 text-xs font-semibold transition opacity-80 hover:opacity-100"
            style={{
              color: "var(--card-accent)",
              background:
                "color-mix(in srgb, var(--card-accent) 12%, transparent)",
            }}
          >
            Presence
          </Link>
        </header>

        <main className="mx-auto max-w-md px-5 pb-24">
          {error ? (
            <p role="alert" className="text-sm text-red-800">
              {error}
            </p>
          ) : null}

          {(routing || (!card && !error)) ? (
            <p className="animate-fade text-sm opacity-70">Carregando…</p>
          ) : null}

          {card ? (
            <div className="animate-rise flex flex-col items-center text-center">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt=""
                  className="h-28 w-28 rounded-full object-cover ring-4 sm:h-32 sm:w-32"
                  style={{ ["--tw-ring-color" as string]: "var(--card-ring)" }}
                />
              ) : (
                <div
                  className="flex h-28 w-28 items-center justify-center rounded-full font-display text-4xl font-semibold sm:h-32 sm:w-32"
                  style={{
                    background:
                      "color-mix(in srgb, var(--card-accent) 18%, transparent)",
                    color: "var(--card-accent)",
                  }}
                >
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}

              <h1
                className={`mt-6 font-semibold tracking-tight sm:text-4xl ${
                  theme === "bold"
                    ? "font-sans text-3xl"
                    : "font-display text-3xl"
                }`}
              >
                {displayName}
              </h1>
              {headline ? (
                <p className="animate-rise-delay mt-2 text-base opacity-75">
                  {headline}
                </p>
              ) : null}
              {card.bio ? (
                <p className="mt-4 max-w-sm text-sm leading-relaxed opacity-70">
                  {card.bio}
                </p>
              ) : null}

              {/* One button per link — Linktree-style stack */}
              {actions.length > 0 ? (
                <nav
                  aria-label="Links"
                  className="animate-rise-delay mt-8 w-full space-y-3"
                >
                  {actions.map((link) => (
                    <a
                      key={link.id}
                      href={link.href}
                      {...(link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="flex w-full items-center justify-center rounded-xl border px-5 py-3.5 text-sm font-semibold transition hover:scale-[1.015] active:scale-[0.99]"
                      style={{
                        borderColor: "var(--card-line)",
                        background:
                          "color-mix(in srgb, var(--card-accent) 8%, transparent)",
                      }}
                    >
                      {link.title}
                    </a>
                  ))}
                </nav>
              ) : null}

              <div className="animate-rise-delay-2 mt-8 w-full">
                <a
                  href={`/api/v1/public/cards/${slugOrId}/vcard.vcf`}
                  className="flex w-full items-center justify-center rounded-xl px-5 py-3.5 text-sm font-semibold text-white transition hover:opacity-95"
                  style={{ background: "var(--card-accent)" }}
                >
                  Salvar contato
                </a>
                <Link
                  href={`/p/${slugOrId}`}
                  className="mt-3 inline-block text-sm font-medium opacity-70 transition hover:opacity-100"
                  style={{ color: "var(--card-accent)" }}
                >
                  Ver portfólio →
                </Link>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
