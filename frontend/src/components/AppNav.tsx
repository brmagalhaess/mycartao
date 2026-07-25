"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useI18n } from "@/components/I18nProvider";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const NAV = [
  { href: "/app", key: "cards" },
  { href: "/app/portfolio", key: "portfolio" },
  { href: "/app/api", key: "avatarApi" },
  { href: "/app/smart", key: "smart" },
  { href: "/app/analytics", key: "analytics" },
  { href: "/app/billing", key: "billing" },
  { href: "/app/settings", key: "settings" },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/app") {
    return pathname === "/app" || pathname.startsWith("/app/cards");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { dict } = useI18n();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

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

  async function onLogout() {
    setLoggingOut(true);
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      router.replace("/");
    }
  }

  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium">
      {NAV.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "text-teal transition"
                : "text-ink-soft transition hover:text-teal"
            }
          >
            {dict.appNav[item.key]}
          </Link>
        );
      })}
      {isAdmin ? (
        <Link
          href="/admin"
          aria-current={pathname.startsWith("/admin") ? "page" : undefined}
          className={
            pathname.startsWith("/admin")
              ? "text-teal transition"
              : "text-ink-soft transition hover:text-teal"
          }
        >
          {dict.appNav.admin}
        </Link>
      ) : null}
      <LanguageSwitcher compact />
      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        className="text-ink-soft/70 transition hover:text-ink disabled:opacity-60"
      >
        {loggingOut ? dict.common.loggingOut : dict.common.logout}
      </button>
    </nav>
  );
}
