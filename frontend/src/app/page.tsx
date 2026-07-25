import Link from "next/link";

import LandingCardPreview from "@/components/LandingCardPreview";
import LandingHeroCards from "@/components/LandingHeroCards";
import LandingFaq from "@/components/LandingFaq";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

export default async function HomePage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.landing;
  const c = dict.common;

  return (
    <div className="atmosphere min-h-screen text-ink">
      <div className="atmosphere-pattern min-h-screen">
        <header className="sticky top-0 z-20 border-b border-line/60 bg-paper/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 sm:px-8">
            <Link
              href="/"
              className="font-display text-lg font-semibold tracking-tight"
            >
              MyCartao
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium sm:gap-5">
              <a
                href="#recursos"
                className="hidden text-ink-soft transition hover:text-teal sm:inline"
              >
                {c.features}
              </a>
              <Link
                href="/pricing"
                className="text-ink-soft transition hover:text-teal"
              >
                {c.pricing}
              </Link>
              <Link
                href="/developers"
                className="hidden text-ink-soft transition hover:text-teal sm:inline"
              >
                {c.developers}
              </Link>
              <LanguageSwitcher compact />
              <Link
                href="/login"
                className="rounded-md bg-ink px-4 py-2 text-paper transition hover:bg-ink-soft"
              >
                {c.login}
              </Link>
            </nav>
          </div>
        </header>

        <main>
          <section className="relative overflow-hidden border-b border-line/60 bg-gradient-to-br from-sand/60 via-paper to-mist/70">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-teal/10 blur-3xl"
            />
            <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-16 pt-14 sm:px-8 lg:grid-cols-[1fr_auto] lg:gap-16 lg:pb-24 lg:pt-20">
              <div className="text-center lg:text-left">
                <p className="animate-rise inline-flex items-center rounded-full border border-line bg-paper/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-teal">
                  {t.badge}
                </p>
                <h1 className="animate-rise mt-6 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl lg:text-6xl xl:text-7xl">
                  {t.heroTitle}
                </h1>
                <p className="animate-rise-delay mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-soft/90 lg:mx-0">
                  {t.heroSub}
                </p>
                <div className="animate-rise-delay-2 mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-md bg-teal px-7 py-3.5 text-base font-semibold text-paper transition hover:bg-teal-deep"
                  >
                    {c.startFree}
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-md border border-line bg-paper/60 px-7 py-3.5 text-base font-medium transition hover:border-teal/40 hover:bg-paper"
                  >
                    {c.seePlans}
                  </Link>
                </div>
                <p className="animate-rise-delay-2 mt-4 text-sm text-ink-soft/75">
                  {t.heroNote}
                </p>
              </div>
              <div className="animate-rise-delay-2 w-full lg:w-auto">
                <LandingHeroCards />
              </div>
            </div>
          </section>

          <section className="bg-paper/50">
            <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
                {t.worksEverywhere}
              </p>
              <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 font-display text-lg font-medium text-ink-soft/70">
                {t.channels.map((channel) => (
                  <li key={channel}>{channel}</li>
                ))}
              </ul>
            </div>
          </section>

          <section
            id="recursos"
            className="mx-auto grid w-full max-w-6xl items-center gap-14 px-6 py-16 sm:px-8 sm:py-24 lg:grid-cols-2"
          >
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-4xl">
                {t.updateOnceTitle}
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft/90">
                {t.updateOnceText}
              </p>
              <h2 className="mt-12 font-display text-2xl font-semibold tracking-tight sm:text-4xl">
                {t.profileTitle}
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft/90">
                {t.profileText}
              </p>
            </div>
            <LandingCardPreview />
          </section>

          <section className="border-t border-line bg-paper/50">
            <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 sm:py-20">
              <div className="grid items-center gap-10 lg:grid-cols-2">
                <div>
                  <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-4xl">
                    {t.portfolioTitle}
                  </h2>
                  <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-soft/90">
                    {t.portfolioText}
                  </p>
                  <Link
                    href="/login"
                    className="mt-8 inline-flex items-center justify-center rounded-md bg-teal px-6 py-3 text-sm font-semibold text-paper transition hover:bg-teal-deep"
                  >
                    {t.portfolioCta}
                  </Link>
                </div>
                <div className="rounded-2xl border border-line bg-paper p-6 shadow-[0_24px_60px_-24px_rgba(12,42,46,0.3)]">
                  <p className="font-mono text-sm text-teal">
                    mycartao.com/p/ana-silva
                  </p>
                  <div className="mt-5 space-y-3">
                    {[
                      ["Identidade visual — Café Aurora", "R$ 2.400"],
                      ["Consultoria de marca", "R$ 350/h"],
                      ["Portfólio editorial 2026", ""],
                    ].map(([title, price]) => (
                      <div
                        key={title}
                        className="flex items-center justify-between rounded-md border border-line bg-mist/50 px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-ink">{title}</span>
                        {price ? (
                          <span className="font-medium text-teal">{price}</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-line">
            <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 sm:py-20">
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {t.stepsTitle}
              </h2>
              <div className="mt-10 grid gap-10 sm:grid-cols-3">
                {t.steps.map((step, i) => (
                  <div key={step.title}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal/12 font-display text-base font-semibold text-teal">
                      {i + 1}
                    </span>
                    <h3 className="mt-4 font-display text-lg font-semibold">
                      {step.title}
                    </h3>
                    <p className="mt-2 leading-relaxed text-ink-soft/90">
                      {step.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-line bg-ink text-paper">
            <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 sm:px-8 sm:py-20 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-sand">
                  {t.devTitle}
                </p>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-paper/85">
                  {t.devText}
                </p>
                <Link
                  href="/developers"
                  className="mt-7 inline-flex items-center justify-center rounded-md bg-sand px-6 py-3 text-sm font-semibold text-ink transition hover:bg-sand-warm"
                >
                  {t.devCta}
                </Link>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-paper/15 bg-black/30 p-5 text-xs leading-relaxed text-paper/90 sm:text-sm">
                <code>{`const avatar = (email) =>
  \`/api/v1/public/avatar?email=\${encodeURIComponent(email)}&s=160\`;

// <img src={avatar("voce@exemplo.com")} />`}</code>
              </pre>
            </div>
          </section>

          <LandingFaq title={t.faqTitle} items={t.faq} />

          <section className="border-t border-line bg-paper/60">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-16 text-center sm:px-8 sm:py-20">
              <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.finalCta}
              </h2>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md bg-teal px-7 py-3.5 text-base font-semibold text-paper transition hover:bg-teal-deep"
              >
                {c.startFree}
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-ink-soft/80 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span className="font-display font-semibold text-ink">
              MyCartao
            </span>
            <nav className="flex flex-wrap items-center gap-5">
              <Link href="/pricing" className="transition hover:text-teal">
                {c.pricing}
              </Link>
              <Link href="/developers" className="transition hover:text-teal">
                {c.developers}
              </Link>
              <Link href="/login" className="transition hover:text-teal">
                {c.login}
              </Link>
              <LanguageSwitcher />
            </nav>
            <span>© {new Date().getFullYear()} MyCartao</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
