"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await apiFetch("/api/v1/auth/magic-link", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          detail?: string;
        } | null;
        setStatus("error");
        setMessage(
          data?.detail ?? "Não foi possível enviar o link. Tente de novo.",
        );
        return;
      }

      setStatus("sent");
      setMessage(
        "Link enviado. Abra o e-mail e clique para entrar. Em dev, o link também aparece no log do backend.",
      );
    } catch {
      setStatus("error");
      setMessage(
        "Não foi possível falar com o servidor. Atualize a página e tente de novo.",
      );
    }
  }

  return (
    <div className="atmosphere min-h-screen text-ink">
      <div className="atmosphere-pattern flex min-h-screen flex-col">
        <header className="mx-auto flex w-full max-w-lg items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-tight text-ink"
          >
            MyCartao
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-ink-soft">
            Preços
          </Link>
        </header>

        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 pb-16">
          <h1 className="animate-rise font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Entrar com magic link
          </h1>
          <p className="animate-rise-delay mt-3 max-w-md text-ink-soft/90">
            Sem senha. Enviamos um link único para o seu e-mail.
          </p>

          <form
            onSubmit={onSubmit}
            className="animate-rise-delay-2 mt-8 space-y-4"
          >
            <label className="block text-sm font-medium text-ink-soft">
              E-mail
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-md border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-teal"
                placeholder="voce@empresa.com"
              />
            </label>
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-md bg-teal px-4 py-3 text-base font-semibold text-paper transition hover:bg-teal-deep disabled:opacity-60"
            >
              {status === "loading" ? "Enviando…" : "Enviar link de acesso"}
            </button>
          </form>

          {message ? (
            <p
              role="status"
              className={`mt-5 text-sm leading-relaxed ${
                status === "error" ? "text-red-800" : "text-teal-deep"
              }`}
            >
              {message}
            </p>
          ) : null}
        </main>
      </div>
    </div>
  );
}
