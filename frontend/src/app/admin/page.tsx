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

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [forbidden, setForbidden] = useState(false);

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

    const res = await apiFetch("/api/v1/admin/users");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (res.status === 403) {
      setForbidden(true);
      return;
    }
    if (!res.ok) {
      setError("Não foi possível listar usuários.");
      return;
    }
    setUsers((await res.json()) as AdminUser[]);
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
      setError(data?.detail ?? "Falha ao atualizar plano.");
      return;
    }
    setMessage("Plano atualizado.");
    await load();
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
            Usuários e planos.
          </p>

          {error ? (
            <p role="alert" className="mt-6 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mt-6 text-sm text-teal-deep">{message}</p>
          ) : null}

          {users === null && !error ? (
            <p className="mt-10 text-sm text-ink-soft">Carregando…</p>
          ) : null}

          {users ? (
            <div className="mt-10 overflow-x-auto">
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
        </main>
      </div>
    </div>
  );
}
