import Link from "next/link";

const NAV = [
  { href: "/app", label: "Cartões" },
  { href: "/app/portfolio", label: "Portfólio" },
  { href: "/app/analytics", label: "Analytics" },
  { href: "/app/billing", label: "Cobrança" },
  { href: "/app/settings", label: "Configurações" },
] as const;

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="atmosphere min-h-screen text-ink">
      <div className="atmosphere-pattern min-h-screen">
        <header className="border-b border-line/80 bg-paper/70 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href="/app"
              className="font-display text-xl font-semibold tracking-tight text-ink"
            >
              MyCartao
            </Link>
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
              <Link
                href="/"
                className="text-ink-soft/70 transition hover:text-ink"
              >
                Sair
              </Link>
            </nav>
          </div>
        </header>
        <div className="mx-auto w-full max-w-5xl px-6 py-8 sm:py-10">
          {children}
        </div>
      </div>
    </div>
  );
}
