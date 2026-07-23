"use client";

import { useMemo, useState } from "react";
import {
  AVATAR_LANGS,
  AvatarLangId,
  buildAvatarSnippets,
} from "@/lib/avatar-api-snippets";

type Props = {
  origin: string;
  email?: string;
};

export default function AvatarCodeExamples({ origin, email }: Props) {
  const [lang, setLang] = useState<AvatarLangId>("html");
  const snippets = useMemo(
    () => buildAvatarSnippets(origin, email || "voce@email.com"),
    [origin, email],
  );

  return (
    <div>
      <div
        role="tablist"
        aria-label="Linguagem do exemplo"
        className="flex flex-wrap gap-2"
      >
        {AVATAR_LANGS.map(({ id, label }) => {
          const active = lang === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setLang(id)}
              className={
                active
                  ? "rounded-md bg-teal px-3.5 py-2 text-sm font-semibold text-paper"
                  : "rounded-md border border-line bg-paper/60 px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:border-teal/40 hover:text-teal"
              }
            >
              {label}
            </button>
          );
        })}
      </div>
      <pre className="mt-4 overflow-x-auto rounded-md border border-line bg-ink px-4 py-4 text-sm leading-relaxed text-paper">
        <code>{snippets[lang]}</code>
      </pre>
    </div>
  );
}
