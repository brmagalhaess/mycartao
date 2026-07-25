const QR_CELLS = [
  1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1,
  0, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0,
];

export default function LandingCardPreview() {
  return (
    <div className="animate-float relative mx-auto w-full max-w-sm">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2rem] bg-teal/10 blur-2xl"
      />
      <div className="relative rounded-2xl border border-line bg-paper p-7 shadow-[0_24px_60px_-24px_rgba(12,42,46,0.35)]">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-semibold tracking-tight text-ink">
            MyCartao
          </span>
          <span className="rounded-full bg-teal/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-teal">
            Pro
          </span>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/15 font-display text-2xl font-semibold text-teal">
            A
          </div>
          <div>
            <p className="font-display text-xl font-semibold tracking-tight text-ink">
              Ana Silva
            </p>
            <p className="text-sm text-ink-soft/85">Designer · São Paulo</p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {["WhatsApp", "Portfólio", "Agendar conversa"].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-md border border-line bg-mist/60 px-4 py-2.5 text-sm font-medium text-ink"
            >
              {label}
              <span aria-hidden className="text-teal">
                →
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="rounded-md bg-teal px-4 py-2.5 text-sm font-semibold text-paper">
            Salvar contato
          </div>
          <div
            aria-hidden
            className="grid shrink-0 grid-cols-7 gap-[3px] rounded-md border border-line bg-paper p-2"
          >
            {QR_CELLS.map((on, i) => (
              <span
                key={i}
                className={`h-[5px] w-[5px] rounded-[1px] ${on ? "bg-ink" : "bg-transparent"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
