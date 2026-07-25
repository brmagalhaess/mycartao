type FaqItem = { q: string; a: string };

export default function LandingFaq({
  title,
  items,
}: {
  title: string;
  items: FaqItem[];
}) {
  return (
    <section className="border-t border-line">
      <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:px-8 sm:py-20">
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <div className="mt-8 divide-y divide-line">
          {items.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-ink transition hover:text-teal [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden
                  className="shrink-0 text-teal transition group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 pr-8 leading-relaxed text-ink-soft/90">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
