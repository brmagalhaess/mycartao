import Link from "next/link";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n/server";

export default async function PricingPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const t = dict.pricing;

  return (
    <div className="atmosphere min-h-screen text-ink">
      <div className="atmosphere-pattern min-h-screen">
        <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5 sm:px-8">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight"
          >
            MyCartao
          </Link>
          <div className="flex items-center gap-4">
            <LanguageSwitcher compact />
            <Link
              href="/login"
              className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink-soft"
            >
              {dict.common.login}
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-6 pb-20 pt-10 sm:px-8">
          <h1 className="animate-rise font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {t.title}
          </h1>
          <p className="animate-rise-delay mt-4 max-w-xl text-lg text-ink-soft/90">
            {t.lead}
          </p>

          <div className="animate-rise-delay-2 mt-14 grid gap-10 sm:grid-cols-2 sm:gap-12">
            <section>
              <h2 className="font-display text-2xl font-semibold">Free</h2>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                R$&nbsp;0
                <span className="ml-1 text-base font-normal text-ink-soft">
                  {t.perMonth}
                </span>
              </p>
              <ul className="mt-6 space-y-2.5 text-ink-soft">
                {t.free.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="text-teal">
                      ·
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="mt-8 inline-flex rounded-md border border-line bg-paper/70 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-teal/40"
              >
                {t.freeCta}
              </Link>
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-teal-deep">
                Pro
              </h2>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                R$&nbsp;19,90
                <span className="ml-1 text-base font-normal text-ink-soft">
                  {t.perMonth}
                </span>
              </p>
              <ul className="mt-6 space-y-2.5 text-ink-soft">
                {t.pro.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="text-teal">
                      ·
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="mt-8 inline-flex rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-teal-deep"
              >
                {t.proCta}
              </Link>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
