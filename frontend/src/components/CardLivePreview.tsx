"use client";

import { CSSProperties, useMemo } from "react";
import { themeStyleVars, type CardTheme } from "@/lib/card-theme";

type Props = {
  displayName: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string | null;
  theme: CardTheme;
  brandColor?: string | null;
  buttons?: string[];
};

export default function CardLivePreview({
  displayName,
  headline,
  bio,
  avatarUrl,
  theme,
  brandColor,
  buttons = ["WhatsApp", "Salvar contato"],
}: Props) {
  const style = useMemo(
    () => themeStyleVars(theme, brandColor) as CSSProperties,
    [theme, brandColor],
  );
  const name = displayName.trim() || "Seu nome";
  const role = headline?.trim() || "Sua headline";

  return (
    <div
      className={`card-theme card-theme-${theme} overflow-hidden rounded-2xl border shadow-[0_20px_40px_-24px_rgba(12,42,46,0.35)]`}
      style={{ ...style, borderColor: "var(--card-line)" }}
      data-theme={theme}
    >
      <div className="card-theme-surface p-6">
        <div className="flex flex-col items-center text-center">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-20 w-20 rounded-full object-cover ring-4"
              style={{ ["--tw-ring-color" as string]: "var(--card-ring)" }}
            />
          ) : (
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full font-display text-2xl font-semibold"
              style={{
                background:
                  "color-mix(in srgb, var(--card-accent) 18%, transparent)",
                color: "var(--card-accent)",
              }}
            >
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <p
            className={`mt-4 font-semibold tracking-tight ${
              theme === "bold" || theme === "classic"
                ? "font-sans text-xl"
                : "font-display text-xl"
            }`}
          >
            {name}
          </p>
          <p className="mt-1 text-sm opacity-75">{role}</p>
          {bio?.trim() ? (
            <p className="mt-3 line-clamp-2 text-xs leading-relaxed opacity-70">
              {bio}
            </p>
          ) : null}
          <div className="mt-5 w-full space-y-2">
            {buttons.slice(0, 2).map((label) => (
              <span
                key={label}
                className="flex w-full items-center justify-center rounded-xl border px-3 py-2 text-xs font-semibold"
                style={{
                  borderColor: "var(--card-line)",
                  background:
                    "color-mix(in srgb, var(--card-accent) 10%, transparent)",
                }}
              >
                {label}
              </span>
            ))}
            <span
              className="flex w-full items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold text-white"
              style={{ background: "var(--card-accent)" }}
            >
              Salvar contato
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
