"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import ShareLinksBlock from "@/components/ShareLinksBlock";

type PortfolioItem = {
  id: string;
  type: "project" | "service";
  title: string;
  description: string | null;
  price: string | number | null;
  category: string | null;
  sort_order: number;
};

type Profile = {
  id: string;
  slug: string | null;
};

export default function PortfolioManagePage() {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioItem[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plan, setPlan] = useState("free");
  const [origin, setOrigin] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"project" | "service">("project");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");

  const isPro = plan === "pro" || plan === "admin";

  async function load() {
    const who = await apiFetch("/api/v1/auth/whoami");
    if (who.status === 401) {
      router.replace("/login");
      return;
    }
    if (who.ok) {
      const user = (await who.json()) as { plan: string };
      setPlan(user.plan);
    }

    const meRes = await apiFetch("/api/v1/me");
    if (meRes.status === 401) {
      router.replace("/login");
      return;
    }
    if (meRes.ok) {
      setProfile((await meRes.json()) as Profile);
    }

    const res = await apiFetch("/api/v1/portfolio");
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (!res.ok) {
      setError("Não foi possível listar o portfólio.");
      return;
    }
    setItems((await res.json()) as PortfolioItem[]);
  }

  useEffect(() => {
    setOrigin(window.location.origin);
    let cancelled = false;
    load().catch(() => {
      if (!cancelled) setError("Falha de rede ao carregar portfólio.");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");
    try {
      const body: Record<string, unknown> = {
        type,
        title: title.trim() || "Novo item",
        description: description.trim() || null,
        category: category.trim() || null,
        sort_order: items?.length ?? 0,
      };
      if (price.trim()) body.price = price.trim();

      const res = await apiFetch("/api/v1/portfolio", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          detail?: string;
          code?: string;
        } | null;
        setError(
          data?.code === "portfolio_limit_reached"
            ? "Limite Free atingido (3 itens). Assine o Pro."
            : (data?.detail ?? "Não foi possível criar o item."),
        );
        return;
      }
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("");
      setMessage("Item criado.");
      await load();
    } catch {
      setError("Falha de rede ao criar item.");
    } finally {
      setCreating(false);
    }
  }

  async function onDelete(id: string) {
    setError("");
    setMessage("");
    const res = await apiFetch(`/api/v1/portfolio/${id}`, { method: "DELETE" });
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (!res.ok && res.status !== 204) {
      setError("Não foi possível remover o item.");
      return;
    }
    setMessage("Item removido.");
    await load();
  }

  return (
    <main>
      <h1 className="animate-rise font-display text-3xl font-semibold sm:text-4xl">
        Portfólio
      </h1>
      <p className="animate-rise-delay mt-2 text-ink-soft">
        Gerencie projetos e serviços e compartilhe o link público.
      </p>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-6 text-sm text-teal-deep">{message}</p>
      ) : null}

      {origin && profile ? (
        <div className="mt-10 max-w-2xl border-b border-line pb-10">
          <ShareLinksBlock
            kind="portfolio"
            commonPath={`/p/${profile.id}`}
            personalizedPath={profile.slug ? `/p/${profile.slug}` : null}
            isPro={isPro}
            origin={origin}
          />
        </div>
      ) : null}

      <form
        onSubmit={onCreate}
        className="mt-10 max-w-lg space-y-4 border-b border-line pb-10"
      >
        <h2 className="font-display text-xl font-medium">Novo item</h2>
        <label className="block text-sm">
          <span className="font-medium text-ink-soft">Título</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-paper/80 px-3 py-2 text-ink"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink-soft">Tipo</span>
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as "project" | "service")
            }
            className="mt-1 w-full rounded-md border border-line bg-paper/80 px-3 py-2"
          >
            <option value="project">Projeto</option>
            <option value="service">Serviço</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink-soft">Descrição</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-line bg-paper/80 px-3 py-2"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-ink-soft">Preço (opcional)</span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="99.90"
              className="mt-1 w-full rounded-md border border-line bg-paper/80 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink-soft">Categoria</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border border-line bg-paper/80 px-3 py-2"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={creating}
          className="rounded-md bg-teal px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-teal-deep disabled:opacity-60"
        >
          {creating ? "Criando…" : "Adicionar"}
        </button>
      </form>

      {items === null && !error ? (
        <p className="mt-8 text-sm text-ink-soft">Carregando…</p>
      ) : null}

      {items && items.length === 0 ? (
        <p className="mt-8 text-ink-soft">Nenhum item ainda.</p>
      ) : null}

      {items && items.length > 0 ? (
        <ul className="mt-8 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-4 border-b border-line py-4"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm text-ink-soft">
                  {item.type === "service" ? "Serviço" : "Projeto"}
                  {item.category ? ` · ${item.category}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="text-sm font-medium text-ink-soft transition hover:text-red-800"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  );
}
