"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AvatarCodeExamples from "@/components/AvatarCodeExamples";

export default function DevelopersPage() {
  const [origin, setOrigin] = useState("https://SEU_DOMINIO");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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
          <nav className="flex items-center gap-5 text-sm font-medium">
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

        <main className="mx-auto max-w-5xl px-6 pb-20 pt-10 sm:px-8">
          <p className="animate-rise text-sm font-medium tracking-wide text-teal">
            Grátis · API pública
          </p>
          <h1 className="animate-rise font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Developers
          </h1>
          <p className="animate-rise-delay mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft/90">
            Exiba o avatar do perfil MyCartao pelo e-mail cadastrado — grátis,
            sem plano Pro. Endpoint:{" "}
            <code className="rounded bg-paper/80 px-1.5 py-0.5 text-sm text-teal-deep">
              GET /api/v1/public/avatar?email=&amp;s=
            </code>
            . Sem foto, um placeholder SVG é servido.
          </p>

          <section className="animate-rise-delay-2 mt-12">
            <h2 className="font-display text-2xl font-semibold">Endpoint</h2>
            <p className="mt-3 max-w-2xl text-ink-soft/90">
              O parâmetro <code className="text-sm">email</code> deve ser o
              mesmo cadastrado no MyCartao. Opcional{" "}
              <code className="text-sm">s</code> (80–512, default 200).
            </p>
            <pre className="mt-5 overflow-x-auto rounded-md border border-line bg-ink px-4 py-3 text-sm leading-relaxed text-paper">
              <code>
                GET {origin}/api/v1/public/avatar?email=voce@email.com&amp;s=200
              </code>
            </pre>
            <p className="mt-4 text-sm text-ink-soft">
              Já tem conta? Entre e abra{" "}
              <Link
                href="/app/api"
                className="font-medium text-teal hover:text-teal-deep"
              >
                API Avatar
              </Link>{" "}
              no painel para copiar sua URL sem sair da sessão.
            </p>
          </section>

          <section className="animate-rise-delay-2 mt-14">
            <h2 className="font-display text-2xl font-semibold">Exemplos</h2>
            <div className="mt-6">
              <AvatarCodeExamples origin={origin} />
            </div>
          </section>

          <p className="mt-14 text-sm text-ink-soft/75">
            Links personalizados no cartão são recurso{" "}
            <Link
              href="/pricing"
              className="font-medium text-teal hover:text-teal-deep"
            >
              Pro
            </Link>
            . A API de avatar permanece grátis.
          </p>
        </main>
      </div>
    </div>
  );
}
