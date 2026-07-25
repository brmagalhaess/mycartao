import Link from "next/link";
import LandingCardPreview from "@/components/LandingCardPreview";

const STEPS = [
  {
    n: "1",
    title: "Crie seu cartão",
    text: "Foto, nome, contatos e tema em poucos minutos. Sem design, sem código.",
  },
  {
    n: "2",
    title: "Compartilhe em segundos",
    text: "Um link, um QR ou o Presence Mode em tela cheia — direto do seu celular.",
  },
  {
    n: "3",
    title: "Vire contato salvo",
    text: "Quem recebe toca em “Salvar contato” e você entra na agenda, com nome e empresa certos.",
  },
];

const FEATURES = [
  {
    title: "QR + Presence Mode",
    text: "Tela cheia com foto e QR para eventos e balcões. A pessoa aponta a câmera e pronto.",
  },
  {
    title: "Link personalizado",
    text: "No Pro, seu cartão vive em /c/seu-nome — fácil de falar, fácil de lembrar.",
  },
  {
    title: "Portfólio integrado",
    text: "Projetos, serviços e preços no mesmo link do cartão. Sem montar site.",
  },
  {
    title: "Smart Card",
    text: "Um único link que decide o destino por regras: horário comercial vai ao WhatsApp, fora dele ao portfólio.",
  },
  {
    title: "Analytics",
    text: "Veja quantas pessoas abriram seu cartão e quando. 7 dias no Free, 90 no Pro.",
  },
  {
    title: "API de avatar grátis",
    text: "Sua foto em qualquer site via URL pública por e-mail, estilo Gravatar.",
  },
];

const FREE_ITEMS = ["1 cartão + QR", "Portfólio (3 itens)", "API de avatar"];
const PRO_ITEMS = [
  "Slug personalizado",
  "Smart Card + botões",
  "Sem branding",
];

export default function HomePage() {
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
            <nav className="flex items-center gap-5 text-sm font-medium">
              <a
                href="#recursos"
                className="hidden text-ink-soft transition hover:text-teal sm:inline"
              >
                Recursos
              </a>
              <Link
                href="/pricing"
                className="text-ink-soft transition hover:text-teal"
              >
                Preços
              </Link>
              <Link
                href="/developers"
                className="hidden text-ink-soft transition hover:text-teal sm:inline"
              >
                Developers
              </Link>
              <Link
                href="/login"
                className="rounded-md bg-ink px-4 py-2 text-paper transition hover:bg-ink-soft"
              >
                Entrar
              </Link>
            </nav>
          </div>
        </header>

        <main>
          <section className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:pb-28 lg:pt-24">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 top-10 h-72 w-72 rounded-full bg-teal/10 blur-3xl"
            />
            <div>
              <p className="animate-rise inline-flex items-center gap-2 rounded-full border border-line bg-paper/70 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-teal">
                Cartão de presença digital
              </p>
              <h1 className="animate-rise mt-6 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                Um link.
                <br />
                Todos os seus contatos.
              </h1>
              <p className="animate-rise-delay mt-6 max-w-lg text-lg leading-relaxed text-ink-soft/90">
                Crie seu cartão digital com QR, portfólio e botão “Salvar
                contato”. Compartilhe em segundos — no evento, na bio, na
                assinatura de e-mail.
              </p>
              <div className="animate-rise-delay-2 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md bg-teal px-7 py-3.5 text-base font-semibold text-paper transition hover:bg-teal-deep"
                >
                  Criar meu cartão grátis
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-md border border-line bg-paper/60 px-7 py-3.5 text-base font-medium transition hover:border-teal/40 hover:bg-paper"
                >
                  Ver planos
                </Link>
              </div>
              <p className="animate-rise-delay-2 mt-4 text-sm text-ink-soft/75">
                Grátis para sempre no plano Free. Sem cartão de crédito.
              </p>
            </div>

            <div className="animate-rise-delay-2">
              <LandingCardPreview />
            </div>
          </section>

          <section className="border-t border-line bg-paper/50">
            <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 sm:py-20">
              <h2 className="animate-rise font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Como funciona
              </h2>
              <div className="mt-10 grid gap-10 sm:grid-cols-3">
                {STEPS.map((step) => (
                  <div key={step.n} className="animate-rise-delay">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal/12 font-display text-base font-semibold text-teal">
                      {step.n}
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

          <section id="recursos" className="border-t border-line">
            <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-8 sm:py-20">
              <h2 className="animate-rise font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Tudo que o papel não faz
              </h2>
              <p className="animate-rise-delay mt-4 max-w-xl text-ink-soft/90">
                Do primeiro aperto de mão ao contato salvo na agenda — com
                analytics no caminho.
              </p>
              <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((f) => (
                  <div
                    key={f.title}
                    className="rounded-xl border border-line bg-paper/80 p-6 transition hover:border-teal/35 hover:shadow-[0_12px_32px_-16px_rgba(12,42,46,0.25)]"
                  >
                    <h3 className="font-display text-lg font-semibold">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-soft/90">
                      {f.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-t border-line bg-paper/50">
            <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2 sm:px-8 sm:py-20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal">
                  Free · R$ 0
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                  Comece hoje, grátis
                </h2>
                <ul className="mt-5 space-y-2 text-ink-soft">
                  {FREE_ITEMS.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden className="text-teal">
                        ·
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/70">
                  Pro · R$ 19,90/mês
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight">
                  Para quem vive de contato
                </h2>
                <ul className="mt-5 space-y-2 text-ink-soft">
                  {PRO_ITEMS.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden className="text-teal">
                        ·
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/pricing"
                  className="mt-6 inline-flex items-center text-sm font-semibold text-teal transition hover:text-teal-deep"
                >
                  Comparar planos →
                </Link>
              </div>
            </div>
          </section>

          <section className="border-t border-line">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight">
                  Para desenvolvedores
                </h2>
                <p className="mt-2 max-w-md text-sm text-ink-soft/90">
                  Avatar público por e-mail, estilo Gravatar — grátis, sem
                  chave de API.
                </p>
              </div>
              <code className="rounded-md border border-line bg-ink px-4 py-3 text-xs text-paper/90 sm:text-sm">
                /api/v1/public/avatar?email=voce@exemplo.com
              </code>
              <Link
                href="/developers"
                className="inline-flex shrink-0 items-center justify-center rounded-md border border-line bg-paper/70 px-5 py-2.5 text-sm font-semibold transition hover:border-teal/40"
              >
                Ver documentação
              </Link>
            </div>
          </section>

          <section className="border-t border-line bg-ink text-paper">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-6 py-16 sm:px-8 sm:py-20">
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Seu próximo contato começa com um link.
              </h2>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md bg-sand px-7 py-3.5 text-base font-semibold text-ink transition hover:bg-sand-warm"
              >
                Criar meu cartão grátis
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t border-line">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-ink-soft/80 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span className="font-display font-semibold text-ink">
              MyCartao
            </span>
            <nav className="flex flex-wrap gap-5">
              <Link href="/pricing" className="transition hover:text-teal">
                Preços
              </Link>
              <Link href="/developers" className="transition hover:text-teal">
                Developers
              </Link>
              <Link href="/login" className="transition hover:text-teal">
                Entrar
              </Link>
            </nav>
            <span>© {new Date().getFullYear()} MyCartao</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
