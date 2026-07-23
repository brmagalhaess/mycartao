import Link from "next/link";

export default function HomePage() {
  return (
    <div className="atmosphere min-h-screen text-ink">
      <div className="atmosphere-pattern min-h-screen">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5 sm:px-8">
          <span className="text-sm font-medium tracking-wide text-ink-soft/80">
            mycartao.com
          </span>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link
              href="/developers"
              className="text-ink-soft transition hover:text-teal"
            >
              Developers
            </Link>
            <Link
              href="/pricing"
              className="text-ink-soft transition hover:text-teal"
            >
              Preços
            </Link>
            <Link
              href="/login"
              className="rounded-md bg-ink px-4 py-2 text-paper transition hover:bg-ink-soft"
            >
              Entrar
            </Link>
          </nav>
        </header>

        <main className="relative mx-auto flex min-h-[calc(100vh-4.5rem)] w-full max-w-6xl flex-col justify-center px-6 pb-16 pt-8 sm:px-8 lg:pb-24">
          <div
            aria-hidden
            className="animate-float pointer-events-none absolute -right-8 top-16 h-64 w-64 rounded-full bg-teal/10 blur-3xl sm:right-8 sm:h-80 sm:w-80"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-24 left-0 h-48 w-48 rounded-full bg-sand/40 blur-3xl sm:left-12"
          />

          <p className="animate-rise font-display text-5xl font-semibold tracking-tight text-ink sm:text-7xl lg:text-8xl">
            MyCartao
          </p>
          <h1 className="animate-rise-delay mt-6 max-w-2xl font-display text-2xl font-medium leading-snug text-ink-soft sm:text-4xl sm:leading-tight">
            Seu cartão de presença, sempre à mão.
          </h1>
          <p className="animate-rise-delay-2 mt-5 max-w-xl text-base leading-relaxed text-ink-soft/85 sm:text-lg">
            Crie um link com QR, Presence Mode e portfólio — compartilhe em
            segundos, sem cartão de papel.
          </p>
          <div className="animate-rise-delay-2 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-teal px-6 py-3 text-base font-semibold text-paper transition hover:bg-teal-deep"
            >
              Começar grátis
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-md border border-line bg-paper/60 px-6 py-3 text-base font-medium text-ink transition hover:border-teal/40 hover:bg-paper"
            >
              Ver planos
            </Link>
            <Link
              href="/developers"
              className="inline-flex items-center justify-center px-2 py-3 text-base font-medium text-ink-soft transition hover:text-teal sm:ml-1"
            >
              Developers →
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
