"use client";

import {
  FREE_THEMES,
  PRO_THEMES,
  themeStyleVars,
  type CardTheme,
} from "@/lib/card-theme";

type Props = {
  theme: CardTheme;
  onTheme: (theme: CardTheme) => void;
  isPro: boolean;
  brandColor?: string;
};

export default function ThemePicker({
  theme,
  onTheme,
  isPro,
  brandColor,
}: Props) {
  const options = isPro ? [...FREE_THEMES, ...PRO_THEMES] : FREE_THEMES;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((t) => {
        const selected = theme === t.value;
        const swatch = themeStyleVars(t.value, brandColor);
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onTheme(t.value)}
            className={
              selected
                ? "rounded-xl border-2 border-teal p-3 text-left"
                : "rounded-xl border border-line p-3 text-left transition hover:border-teal/40"
            }
          >
            <span
              className="mb-3 flex h-12 items-end justify-between rounded-lg px-3 pb-2"
              style={{
                background: swatch["--card-bg"],
                color: swatch["--card-fg"],
                boxShadow: `inset 0 0 0 1px ${swatch["--card-line"]}`,
              }}
            >
              <span
                className="h-2 w-10 rounded-full"
                style={{ background: swatch["--card-accent"] }}
              />
              <span
                className="h-5 w-5 rounded-full"
                style={{
                  background: swatch["--card-accent"],
                  opacity: 0.85,
                }}
              />
            </span>
            <span className="block font-medium text-ink">{t.label}</span>
            <span className="mt-0.5 block text-xs text-ink-soft">{t.blurb}</span>
          </button>
        );
      })}
    </div>
  );
}
