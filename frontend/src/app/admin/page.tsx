"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type AdminUser = {
  id: string;
  email: string;
  plan: string;
};

type Plan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  amount_cents: number;
  currency: string;
  interval: string;
  entitlement: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
};

const emptyForm = {
  code: "",
  name: "",
  description: "",
  amount_cents: 1990,
  currency: "brl",
  interval: "month",
  entitlement: "pro",
  is_active: true,
  is_default: false,
  sort_order: 0,
  sync_stripe: true,
};

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `R$ ${(cents / 100).toFixed(2)}`;
  }
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const who = await apiFetch("/api/v1/auth/whoami");
    if (who.status === 401) {
      router.replace("/login");
      return;
    }
    if (who.ok) {
      const user = (await who.json()) as { plan: string };
      if (user.plan !== "admin") {
        setForbidden(true);
        return;
      }
    }

    const [usersRes, plansRes] = await Promise.all([
      apiFetch("/api/v1/admin/users"),
      apiFetch("/api/v1/admin/plans"),
    ]);
    if (usersRes.status === 401 || plansRes.status === 401) {
      router.replace("/login");
      return;
    }
    if (usersRes.status === 403 || plansRes.status === 403) {
      setForbidden(true);
      return;
    }
    if (!usersRes.ok || !plansRes.ok) {
      setError("Não foi possível carregar o painel admin.");
      return;
    }
    setUsers((await usersRes.json()) as AdminUser[]);
    setPlans((await plansRes.json()) as Plan[]);
  }

  useEffect(() => {
    let cancelled = false;
    load().catch(() => {
      if (!cancelled) setError("Falha de rede.");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function changePlan(id: string, plan: string) {
    setError("");
    setMessage("");
    const res = await apiFetch(`/api/v1/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ plan }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        detail?: string;
      } | null;
      setError(data?.detail ?? "Falha ao atualizar plano do usuário.");
      return;
    }
    setMessage("Plano do usuário atualizado.");
    await load();
  }

  function startEdit(p: Plan) {
    setEditingId(p.id);
    setForm({
      code: p.code,
      name: p.name,
      description: p.description ?? "",
      amount_cents: p.amount_cents,
      currency: p.currency,
      interval: p.interval,
      entitlement: p.entitlement,
      is_active: p.is_active,
      is_default: p.is_default,
      sort_order: p.sort_order,
      sync_stripe: true,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function savePlan(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        code: form.code.trim().toLowerCase(),
        name: form.name.trim(),
        description: form.description.trim() || null,
      };
      const res = editingId
        ? await apiFetch(`/api/v1/admin/plans/${editingId}`, {
            method: "PATCH",
            body: JSON.stringify({
              name: payload.name,
              description: payload.description,
              amount_cents: payload.amount_cents,
              currency: payload.currency,
              interval: payload.interval,
              entitlement: payload.entitlement,
              is_active: payload.is_active,
              is_default: payload.is_default,
              sort_order: payload.sort_order,
              sync_stripe: payload.sync_stripe,
            }),
          })
        : await apiFetch("/api/v1/admin/plans", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          detail?: string;
        } | null;
        setError(data?.detail ?? "Falha ao salvar plano.");
        return;
      }
      setMessage(
        editingId
          ? "Plano atualizado (Stripe sincronizado se marcado)."
          : "Plano criado na Stripe e no banco.",
      );
      resetForm();
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (forbidden) {
    return (
      <div className="atmosphere flex min-h-screen items-center justify-center px-6 text-ink">
        <div className="text-center">
          <p className="font-display text-2xl font-semibold">Acesso negado</p>
          <p className="mt-2 text-ink-soft">
            Esta área é exclusiva para administradores.
          </p>
          <Link
            href="/app"
            className="mt-6 inline-block text-sm font-medium text-teal hover:underline"
          >
            Voltar ao app
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="atmosphere min-h-screen text-ink">
      <div className="atmosphere-pattern min-h-screen">
        <header className="border-b border-line/80 bg-paper/70 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/app" className="font-display text-xl font-semibold">
              MyCartao
            </Link>
            <Link
              href="/app"
              className="text-sm font-medium text-ink-soft hover:text-teal"
            >
              ← App
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-6 py-8 sm:py-10">
          <h1 className="animate-rise font-display text-3xl font-semibold sm:text-4xl">
            Admin
          </h1>
          <p className="animate-rise-delay mt-2 text-ink-soft">
            Usuários e planos Stripe.
          </p>

          {error ? (
            <p role="alert" className="mt-6 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mt-6 text-sm text-teal-deep">{message}</p>
          ) : null}

          <section className="mt-12">
            <h2 className="font-display text-2xl font-semibold">Planos</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Criar/editar cria ou atualiza Product/Price na Stripe
              automaticamente.
            </p>

            {plans ? (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-soft/70">
                      <th className="py-3 pr-4 font-medium">Nome</th>
                      <th className="py-3 pr-4 font-medium">Preço</th>
                      <th className="py-3 pr-4 font-medium">Stripe Price</th>
                      <th className="py-3 pr-4 font-medium">Flags</th>
                      <th className="py-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((p) => (
                      <tr key={p.id} className="border-b border-line/70">
                        <td className="py-3 pr-4">
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-ink-soft">{p.code}</div>
                        </td>
                        <td className="py-3 pr-4">
                          {formatMoney(p.amount_cents, p.currency)}/
                          {p.interval === "year" ? "ano" : "mês"}
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs">
                          {p.stripe_price_id ?? "—"}
                        </td>
                        <td className="py-3 pr-4 text-xs text-ink-soft">
                          {p.is_active ? "ativo" : "inativo"}
                          {p.is_default ? " · default" : ""}
                        </td>
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => startEdit(p)}
                            className="text-sm font-medium text-teal hover:underline"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-6 text-sm text-ink-soft">Carregando planos…</p>
            )}

            <form
              onSubmit={savePlan}
              className="mt-8 grid gap-4 rounded-lg border border-line/80 bg-paper/50 p-5 sm:grid-cols-2"
            >
              <h3 className="sm:col-span-2 font-display text-lg font-semibold">
                {editingId ? "Editar plano" : "Novo plano"}
              </h3>
              {!editingId ? (
                <label className="block text-sm">
                  Código
                  <input
                    required
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value }))
                    }
                    className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2"
                    placeholder="pro"
                  />
                </label>
              ) : (
                <div className="text-sm text-ink-soft">
                  Código: <span className="font-mono text-ink">{form.code}</span>
                </div>
              )}
              <label className="block text-sm">
                Nome
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                Descrição
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                Preço (centavos)
                <input
                  type="number"
                  min={0}
                  required
                  value={form.amount_cents}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      amount_cents: Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2"
                />
                <span className="mt-1 block text-xs text-ink-soft">
                  Ex.: 1990 = {formatMoney(form.amount_cents || 0, form.currency)}
                </span>
              </label>
              <label className="block text-sm">
                Moeda
                <input
                  value={form.currency}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, currency: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                Intervalo
                <select
                  value={form.interval}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, interval: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2"
                >
                  <option value="month">Mensal</option>
                  <option value="year">Anual</option>
                </select>
              </label>
              <label className="block text-sm">
                Entitlement
                <select
                  value={form.entitlement}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, entitlement: e.target.value }))
                  }
                  className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-2"
                >
                  <option value="pro">pro</option>
                  <option value="free">free</option>
                </select>
              </label>
              <div className="flex flex-wrap gap-4 text-sm sm:col-span-2">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_active: e.target.checked }))
                    }
                  />
                  Ativo
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, is_default: e.target.checked }))
                    }
                  />
                  Default no checkout
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.sync_stripe}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sync_stripe: e.target.checked }))
                    }
                  />
                  Sincronizar Stripe
                </label>
              </div>
              <div className="flex gap-3 sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-paper disabled:opacity-60"
                >
                  {saving
                    ? "Salvando…"
                    : editingId
                      ? "Salvar alterações"
                      : "Criar plano"}
                </button>
                {editingId ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-md border border-line px-4 py-2 text-sm"
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          </section>

          <section className="mt-16">
            <h2 className="font-display text-2xl font-semibold">Usuários</h2>
            {users === null && !error ? (
              <p className="mt-6 text-sm text-ink-soft">Carregando…</p>
            ) : null}
            {users ? (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-soft/70">
                      <th className="py-3 pr-4 font-medium">E-mail</th>
                      <th className="py-3 pr-4 font-medium">Plano</th>
                      <th className="py-3 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-line/70">
                        <td className="py-3 pr-4">{u.email}</td>
                        <td className="py-3 pr-4 capitalize">{u.plan}</td>
                        <td className="py-3">
                          <select
                            value={u.plan}
                            onChange={(e) => changePlan(u.id, e.target.value)}
                            className="rounded-md border border-line bg-paper/80 px-2 py-1.5"
                          >
                            <option value="free">free</option>
                            <option value="pro">pro</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </main>
      </div>
    </div>
  );
}
