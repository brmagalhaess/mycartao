"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

const NAV = [
  { href: "/app", label: "Cartões" },
  { href: "/app/portfolio", label: "Portfólio" },
  { href: "/app/smart", label: "Smart" },
  { href: "/app/analytics", label: "Analytics" },
  { href: "/app/billing", label: "Cobrança" },
  { href: "/app/settings", label: "Configurações" },
] as const;

export default function AppNav() {
  const router = useRouter();
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
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-ink-soft transition hover:text-teal"
        >
          {item.label}
        </Link>
      ))}
      {isAdmin ? (
        <Link
          href="/admin"
          className="text-ink-soft transition hover:text-teal"
        >
          Admin
        </Link>
      ) : null}
      <button
        type="button"
        onClick={onLogout}
        disabled={loggingOut}
        className="text-ink-soft/70 transition hover:text-ink disabled:opacity-60"
      >
        {loggingOut ? "Saindo…" : "Sair"}
      </button>
    </nav>
  );
}
