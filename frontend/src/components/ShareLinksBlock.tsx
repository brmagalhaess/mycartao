"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  label: string;
  url: string;
  hint?: string;
};

export function CopyableLink({ label, url, hint }: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore — user can select manually
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint ? <p className="text-xs text-ink-soft">{hint}</p> : null}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          readOnly
          value={url}
          className="input-field min-w-0 flex-1 font-mono text-xs sm:text-sm"
          onFocus={(e) => e.currentTarget.select()}
        />
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onCopy}
            className="rounded-md bg-teal px-3 py-2 text-sm font-semibold text-paper transition hover:bg-teal-deep"
          >
            {copied ? "Copiado!" : "Copiar"}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-line bg-paper/70 px-3 py-2 text-sm font-medium text-ink transition hover:border-teal/40"
          >
            Abrir
          </a>
        </div>
      </div>
    </div>
  );
}

type ShareBlockProps = {
  kind: "card" | "portfolio";
  /** Free link by UUID */
  commonPath: string;
  /** Pro personalized path e.g. /c/meu-slug — omit when no slug */
  personalizedPath?: string | null;
  isPro: boolean;
  origin: string;
};

export default function ShareLinksBlock({
  kind,
  commonPath,
  personalizedPath,
  isPro,
  origin,
}: ShareBlockProps) {
  const title = kind === "card" ? "Compartilhar" : "Compartilhar portfólio";
  const commonUrl = `${origin}${commonPath}`;
  const personalizedUrl =
    personalizedPath && origin ? `${origin}${personalizedPath}` : "";

  // One link only: prefer personalized slug when available.
  const primaryUrl = personalizedUrl || commonUrl;
  const isPersonalized = Boolean(personalizedUrl);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="section-title">{title}</h2>
        <p className="mt-1 text-sm text-ink-soft">
          {isPersonalized
            ? "Seu link personalizado — copie e compartilhe."
            : "Seu link público. Com Pro, você pode usar um nome personalizado."}
        </p>
      </div>

      <CopyableLink
        label={isPersonalized ? "Seu link" : "Link do cartão"}
        url={primaryUrl}
        hint={isPersonalized ? "Slug Pro" : "Link comum"}
      />

      {!isPersonalized ? (
        <p className="text-sm text-ink-soft">
          Quer um link com o seu nome?{" "}
          <Link
            href={isPro ? "/app/settings" : "/app/billing"}
            className="font-medium text-teal transition hover:text-teal-deep"
          >
            {isPro ? "Configurar slug →" : "Assinar Pro →"}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
