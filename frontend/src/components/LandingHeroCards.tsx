"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/I18nProvider";

const ACCENTS = [
  "from-teal to-teal-deep",
  "from-ink to-teal-deep",
  "from-teal-deep to-ink",
  "from-teal to-ink",
  "from-ink to-teal",
  "from-teal-deep to-teal",
];

const SOCIAL_ICONS = [
  // verified
  <svg key="v" viewBox="0 0 24 24" className="h-[18px] w-[18px] text-teal" fill="currentColor">
    <path d="M12 2 9.6 4.1l-3.2-.3-.3 3.2L4 9.6 6.1 12 4 14.4l2.1 2.6.3 3.2 3.2-.3L12 22l2.4-2.1 3.2.3.3-3.2 2.1-2.6L17.9 12 20 9.6l-2.1-2.6-.3-3.2-3.2.3L12 2Zm-1.2 13.6-3-3 1.4-1.4 1.6 1.6 4-4.2 1.4 1.4-5.4 5.6Z" />
  </svg>,
  // whatsapp-ish phone
  <svg key="w" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16.5v3a1.5 1.5 0 0 1-1.65 1.5A17.5 17.5 0 0 1 3 5.65 1.5 1.5 0 0 1 4.5 4h3A1.5 1.5 0 0 1 9 5.3c.12.9.35 1.79.68 2.63a1.5 1.5 0 0 1-.34 1.58l-1.27 1.27a15.5 15.5 0 0 0 5.15 5.15l1.27-1.27a1.5 1.5 0 0 1 1.58-.34c.84.33 1.72.56 2.63.68A1.5 1.5 0 0 1 21 16.5Z" />
  </svg>,
  // instagram
  <svg key="i" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
  </svg>,
  // linkedin-ish briefcase
  <svg key="l" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>,
  // site
  <svg key="g" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>,
];

function initials(name: string): string {
  const parts = name.split(" ");
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

function ProfileCard({
  persona,
  accent,
  offset,
}: {
  persona: { name: string; role: string; bio: string };
  accent: string;
  offset?: boolean;
}) {
  const { dict } = useI18n();
  const t = dict.landing;

  return (
    <article
      className={`w-full max-w-[300px] rounded-2xl border border-line bg-paper p-6 shadow-[0_30px_60px_-25px_rgba(12,42,46,0.35)] sm:p-7 ${
        offset ? "sm:mt-12" : ""
      }`}
    >
      <span
        aria-hidden
        className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br font-display text-xl font-semibold text-paper ${accent}`}
      >
        {initials(persona.name)}
      </span>
      <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">
        {persona.name}
      </h3>
      <p className="mt-0.5 text-sm text-ink-soft">{persona.role}</p>
      <div className="mt-3 flex items-center gap-2.5 text-ink-soft/80">
        {SOCIAL_ICONS}
      </div>
      <p className="mt-4 min-h-[60px] text-sm leading-relaxed text-ink-soft/90">
        {persona.bio}
      </p>
      <div className="mt-5 space-y-2.5">
        <span className="flex w-full items-center justify-center rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition hover:border-teal/50">
          {t.cardContact}
        </span>
        <span className="flex w-full items-center justify-center rounded-md bg-teal px-4 py-2 text-sm font-semibold text-paper">
          {t.cardSave}
        </span>
      </div>
    </article>
  );
}

export default function LandingHeroCards() {
  const { dict } = useI18n();
  const personas = dict.landing.personas;
  const pairCount = Math.floor(personas.length / 2);

  const [pair, setPair] = useState(0);
  const [visible, setVisible] = useState(true);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      fadeTimer.current = setTimeout(() => {
        setPair((p) => (p + 1) % pairCount);
        setVisible(true);
      }, 450);
    }, 6000);
    return () => {
      clearInterval(id);
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [pairCount]);

  function goTo(target: number) {
    if (target === pair) return;
    setVisible(false);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => {
      setPair(target);
      setVisible(true);
    }, 300);
  }

  const first = personas[pair * 2];
  const second = personas[pair * 2 + 1];

  return (
    <div>
      <div
        className={`flex flex-col items-center gap-6 transition-opacity duration-500 sm:flex-row sm:items-start sm:justify-center ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <ProfileCard persona={first} accent={ACCENTS[pair * 2]} />
        <ProfileCard persona={second} accent={ACCENTS[pair * 2 + 1]} offset />
      </div>
      <div className="mt-7 flex justify-center gap-2">
        {Array.from({ length: pairCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all ${
              i === pair ? "w-6 bg-teal" : "w-2 bg-ink/15 hover:bg-ink/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
