"use client";

import { FormEvent, useState } from "react";
import { apiFetch } from "@/lib/api";

type Props = {
  slugOrId: string;
  source?: "card" | "presence";
};

export default function LeadCaptureForm({ slugOrId, source = "card" }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await apiFetch(`/api/v1/public/cards/${slugOrId}/leads`, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          message: message.trim() || null,
          source,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          detail?: string;
        } | null;
        setError(data?.detail ?? "Não foi possível enviar. Tente de novo.");
        return;
      }
      setDone(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setError("Falha de rede.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center justify-center rounded-xl border px-5 py-3.5 text-sm font-semibold transition hover:scale-[1.015]"
        style={{ borderColor: "var(--card-line)" }}
      >
        Deixar contato
      </button>
    );
  }

  if (done) {
    return (
      <p
        className="mt-3 rounded-xl border px-4 py-3 text-sm"
        style={{ borderColor: "var(--card-line)" }}
        role="status"
      >
        Obrigado! Seu contato foi enviado.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-3 w-full space-y-3 rounded-xl border p-4 text-left"
      style={{ borderColor: "var(--card-line)" }}
    >
      <p className="text-sm font-semibold">Deixar contato</p>
      <label className="block text-xs font-medium opacity-70">
        Nome *
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "var(--card-line)" }}
        />
      </label>
      <label className="block text-xs font-medium opacity-70">
        E-mail
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "var(--card-line)" }}
        />
      </label>
      <label className="block text-xs font-medium opacity-70">
        Telefone
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "var(--card-line)" }}
        />
      </label>
      <label className="block text-xs font-medium opacity-70">
        Mensagem
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          style={{ borderColor: "var(--card-line)" }}
        />
      </label>
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          style={{ background: "var(--card-accent)" }}
        >
          {busy ? "Enviando…" : "Enviar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border px-3 py-2 text-sm font-medium"
          style={{ borderColor: "var(--card-line)" }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
