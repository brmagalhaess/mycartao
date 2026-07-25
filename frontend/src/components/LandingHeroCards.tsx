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
  <svg key="v" viewBox="0 0 24 24" className="h-[18px] w-[18px] text-teal" fill="currentColor">
    <path d="M12 2 9.6 4.1l-3.2-.3-.3 3.2L4 9.6 6.1 12 4 14.4l2.1 2.6.3 3.2 3.2-.3L12 22l2.4-2.1 3.2.3.3-3.2 2.1-2.6L17.9 12 20 9.6l-2.1-2.6-.3-3.2-3.2.3L12 2Zm-1.2 13.6-3-3 1.4-1.4 1.6 1.6 4-4.2 1.4 1.4-5.4 5.6Z" />
  </svg>,
  <svg key="w" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16.5v3a1.5 1.5 0 0 1-1.65 1.5A17.5 17.5 0 0 1 3 5.65 1.5 1.5 0 0 1 4.5 4h3A1.5 1.5 0 0 1 9 5.3c.12.9.35 1.79.68 2.63a1.5 1.5 0 0 1-.34 1.58l-1.27 1.27a15.5 15.5 0 0 0 5.15 5.15l1.27-1.27a1.5 1.5 0 0 1 1.58-.34c.84.33 1.72.56 2.63.68A1.5 1.5 0 0 1 21 16.5Z" />
  </svg>,
  <svg key="i" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
  </svg>,
  <svg key="l" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="18" height="13" rx="2" />
    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>,
  <svg key="g" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
  </svg>,
];

const CARD_W = 280;
const GAP = 20;

function initials(name: string): string {
  const parts = name.split(" ");
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

function ProfileCard({
  persona,
  accent,
}: {
  persona: { name: string; role: string; bio: string };
  accent: string;
}) {
  const { dict } = useI18n();

  return (
    <article
      className="w-[280px] shrink-0 rounded-2xl border border-line bg-paper p-6 shadow-[0_28px_56px_-24px_rgba(12,42,46,0.4)]"
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
      <p className="mt-4 line-clamp-3 min-h-[60px] text-sm leading-relaxed text-ink-soft/90">
        {persona.bio}
      </p>
      <span className="mt-5 flex w-full items-center justify-center rounded-md bg-teal px-4 py-2.5 text-sm font-semibold text-paper">
        {dict.landing.cardSave}
      </span>
    </article>
  );
}

export default function LandingHeroCards() {
  const { dict } = useI18n();
  const personas = dict.landing.personas;
  const n = personas.length;
  // Triple the list so we can loop the track seamlessly.
  const track = [...personas, ...personas, ...personas];
  const [index, setIndex] = useState(n); // start in the middle copy
  const [animate, setAnimate] = useState(true);
  const paused = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (paused.current) return;
      setAnimate(true);
      setIndex((i) => i + 1);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  // Keep the track in the middle copy so the loop feels endless.
  useEffect(() => {
    if (index >= n && index < n * 2) return;
    const t = window.setTimeout(() => {
      setAnimate(false);
      setIndex(n + (((index % n) + n) % n));
    }, 520);
    return () => window.clearTimeout(t);
  }, [index, n]);

  function go(dir: -1 | 1) {
    setAnimate(true);
    setIndex((i) => i + dir);
  }

  // Two cards + a peek of the next one (Gravatar-style carousel).
  const offset = index * (CARD_W + GAP);

  return (
    <div
      className="relative w-full max-w-[340px] sm:max-w-[520px] lg:max-w-[560px]"
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
    >
      <div className="hero-carousel-mask overflow-hidden">
        <div
          className="flex"
          style={{
            gap: GAP,
            transform: `translateX(-${offset}px)`,
            transition: animate
              ? "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)"
              : "none",
          }}
        >
          {track.map((persona, i) => (
            <ProfileCard
              key={`${persona.name}-${i}`}
              persona={persona}
              accent={ACCENTS[i % ACCENTS.length]}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Anterior"
          onClick={() => go(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-ink transition hover:border-teal/40 hover:text-teal"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M15 6 9 12l6 6" />
          </svg>
        </button>
        <div className="flex gap-1.5">
          {personas.map((_, i) => {
            const active = ((index % n) + n) % n === i;
            return (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  active ? "w-5 bg-teal" : "w-1.5 bg-ink/15"
                }`}
              />
            );
          })}
        </div>
        <button
          type="button"
          aria-label="Próximo"
          onClick={() => go(1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper text-ink transition hover:border-teal/40 hover:text-teal"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
