"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_LABELS,
  isLocale,
  type Locale,
} from "@/lib/i18n";
import { useI18n } from "@/components/I18nProvider";

export default function LanguageSwitcher({
  compact = false,
}: {
  compact?: boolean;
}) {
  const router = useRouter();
  const { locale, dict } = useI18n();
  const [pending, startTransition] = useTransition();

  function onChange(value: string) {
    if (!isLocale(value)) return;
    const oneYear = 60 * 60 * 24 * 365;
    document.cookie = `${LOCALE_COOKIE}=${value}; path=/; max-age=${oneYear}; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <label className="inline-flex items-center gap-1.5 text-sm text-ink-soft">
      <span className="sr-only">{dict.common.language}</span>
      <select
        value={locale}
        disabled={pending}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer rounded-md border border-line bg-paper/70 px-2 py-1.5 text-sm font-medium text-ink-soft outline-none transition hover:border-teal/40 focus:border-teal disabled:opacity-60"
      >
        {LOCALES.map((code: Locale) => (
          <option key={code} value={code}>
            {compact ? code.toUpperCase() : LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
