"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source: string;
  created_at: string | null;
};

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const res = await apiFetch("/api/v1/leads");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (!res.ok) {
      setError("Não foi possível carregar os leads.");
      return;
    }
    setLeads((await res.json()) as Lead[]);
  }

  useEffect(() => {
    load().catch(() => setError("Falha de rede."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function onDelete(id: string) {
    if (!window.confirm("Excluir este lead?")) return;
    setBusyId(id);
    try {
      const res = await apiFetch(`/api/v1/leads/${id}`, { method: "DELETE" });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        setError("Não foi possível excluir.");
        return;
      }
      setLeads((prev) => (prev ? prev.filter((l) => l.id !== id) : prev));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="max-w-3xl">
      <h1 className="animate-rise font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        Leads
      </h1>
      <p className="animate-rise-delay mt-2 text-ink-soft">
        Contatos deixados no seu cartão público. Ative ou desative em
        Configurações.
      </p>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {leads === null && !error ? (
        <p className="mt-10 text-sm text-ink-soft">Carregando…</p>
      ) : null}

      {leads && leads.length === 0 ? (
        <p className="mt-10 text-sm text-ink-soft">
          Nenhum lead ainda. Compartilhe seu cartão e peça para deixarem
          contato.
        </p>
      ) : null}

      {leads && leads.length > 0 ? (
        <ul className="mt-8 space-y-4">
          {leads.map((lead) => (
            <li
              key={lead.id}
              className="rounded-2xl border border-line bg-paper/70 px-5 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-semibold">
                    {lead.name}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {[lead.email, lead.phone].filter(Boolean).join(" · ") ||
                      "Sem e-mail/telefone"}
                  </p>
                  {lead.message ? (
                    <p className="mt-2 text-sm text-ink">{lead.message}</p>
                  ) : null}
                  <p className="mt-2 text-xs uppercase tracking-wide text-ink-soft/70">
                    {lead.source}
                    {lead.created_at
                      ? ` · ${new Date(lead.created_at).toLocaleString("pt-BR")}`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(lead.id)}
                  disabled={busyId === lead.id}
                  className="rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-red-800/40 hover:text-red-800 disabled:opacity-60"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
