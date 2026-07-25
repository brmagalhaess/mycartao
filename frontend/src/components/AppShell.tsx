"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type NavKey =
  | "cards"
  | "portfolio"
  | "avatarApi"
  | "smart"
  | "analytics"
  | "billing"
  | "settings"
  | "admin";

const ICONS: Record<NavKey, ReactNode> = {
  cards: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19" />
    </svg>
  ),
  portfolio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </svg>
  ),
  avatarApi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="10" r="3.2" />
      <path d="M5.8 19.4a7 7 0 0 1 12.4 0" />
    </svg>
  ),
  smart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H13L13 2Z" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </svg>
  ),
  billing: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" />
    </svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
      <path d="M12 2.5 4.5 5.5v6c0 4.7 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.8 7.5-9.5v-6L12 2.5Z" />
      <path d="m9 12 2 2 4-4.5" />
    </svg>
  ),
};

const NAV: ReadonlyArray<{ href: string; key: NavKey }> = [
  { href: "/app", key: "cards" },
  { href: "/app/portfolio", key: "portfolio" },
  { href: "/app/api", key: "avatarApi" },
  { href: "/app/smart", key: "smart" },
  { href: "/app/analytics", key: "analytics" },
  { href: "/app/billing", key: "billing" },
  { href: "/app/settings", key: "settings" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/app") {
    return pathname === "/app" || pathname.startsWith("/app/cards");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItems({ vertical }: { vertical: boolean }) {
  const pathname = usePathname();
  const { dict } = useI18n();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/v1/auth/whoami")
      .then(async (res) => {
        if (!res.ok || cancelled) return;
        const user = (await res.json()) as { plan: string };
        if (!cancelled) setIsAdmin(user.plan === "admin");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const items: Array<{ href: string; key: NavKey }> = [...NAV];
  if (isAdmin) items.push({ href: "/admin", key: "admin" });

  const base = vertical
    ? "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition"
    : "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition";

  return (
    <>
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? `${base} bg-teal/10 text-teal-deep`
                : `${base} text-ink-soft hover:bg-ink/5 hover:text-ink`
            }
          >
            {ICONS[item.key]}
            {dict.appNav[item.key]}
          </Link>
        );
      })}
    </>
  );
}

function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const { dict } = useI18n();
  const [loggingOut, setLoggingOut] = useState(false);

  async function onLogout() {
    setLoggingOut(true);
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      disabled={loggingOut}
      className={className}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
      {loggingOut ? dict.common.loggingOut : dict.common.logout}
    </button>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="atmosphere min-h-screen text-ink">
      <div className="atmosphere-pattern min-h-screen lg:grid lg:grid-cols-[236px_1fr]">
        {/* Sidebar — desktop */}
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-paper/80 backdrop-blur-md lg:flex">
          <div className="px-5 pb-2 pt-6">
            <Link
              href="/app"
              className="font-display text-xl font-semibold tracking-tight text-ink transition hover:text-teal-deep"
            >
              MyCartao
            </Link>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
            <NavItems vertical />
          </nav>
          <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-4">
            <LanguageSwitcher compact />
            <LogoutButton className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-ink-soft transition hover:text-ink disabled:opacity-60" />
          </div>
        </aside>

        {/* Header — mobile */}
        <div className="lg:hidden">
          <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md">
            <div className="flex items-center justify-between px-5 pb-2 pt-3.5">
              <Link
                href="/app"
                className="font-display text-lg font-semibold tracking-tight text-ink"
              >
                MyCartao
              </Link>
              <div className="flex items-center gap-3">
                <LanguageSwitcher compact />
                <LogoutButton className="flex items-center gap-1.5 text-sm font-medium text-ink-soft disabled:opacity-60" />
              </div>
            </div>
            <nav className="scrollbar-none flex gap-1.5 overflow-x-auto px-4 pb-3">
              <NavItems vertical={false} />
            </nav>
          </header>
        </div>

        <main className="min-w-0">
          <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
