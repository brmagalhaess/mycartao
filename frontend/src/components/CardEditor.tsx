"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

const FIELD_KEYS = [
  { key: "phone", label: "Telefone" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "E-mail" },
  { key: "company", label: "Empresa" },
  { key: "website", label: "Site" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "instagram", label: "Instagram" },
] as const;

const THEMES = [
  { value: "minimal", label: "Minimal" },
  { value: "classic", label: "Clássico" },
  { value: "bold", label: "Bold" },
] as const;

type Card = {
  id: string;
  title: string;
  layout: string | null;
  fields: Record<string, string>;
  is_primary: boolean;
};

type Profile = {
  display_name: string | null;
  headline: string | null;
  theme: string | null;
  avatar_key: string | null;
};

type Props = {
  cardId: string;
};

function strField(fields: Record<string, unknown>, key: string): string {
  const value = fields[key];
  return typeof value === "string" ? value : "";
}

export default function CardEditor({ cardId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [theme, setTheme] = useState("minimal");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const meRes = await apiFetch("/api/v1/me");
      if (meRes.status === 401) {
        router.replace("/login");
        return;
      }
      if (!meRes.ok) {
        if (!cancelled) setError("Não foi possível carregar o perfil.");
        return;
      }
      const profile = (await meRes.json()) as Profile;

      const cardRes = await apiFetch(`/api/v1/cards/${cardId}`);
      if (cardRes.status === 401) {
        router.replace("/login");
        return;
      }
      if (!cardRes.ok) {
        if (!cancelled) setError("Cartão não encontrado.");
        return;
      }
      const card = (await cardRes.json()) as Card & {
        fields: Record<string, unknown>;
      };

      if (cancelled) return;

      setTitle(card.title);
      setDisplayName(profile.display_name ?? "");
      setHeadline(profile.headline ?? "");
      setTheme(profile.theme ?? "minimal");
      setFields(
        Object.fromEntries(
          FIELD_KEYS.map(({ key }) => [key, strField(card.fields, key)]),
        ),
      );
      const avatar =
        typeof card.fields.avatar === "string"
          ? card.fields.avatar
          : null;
      setAvatarPreview(avatar);
      setLoading(false);
    }

    load().catch(() => {
      if (!cancelled) setError("Falha de rede ao carregar o editor.");
    });

    return () => {
      cancelled = true;
    };
  }, [cardId, router]);

  function updateField(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    setMessage("");

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("purpose", "avatar");

      const res = await apiFetch("/api/v1/media/upload", {
        method: "POST",
        body,
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
          data?.code === "avatar_limit_reached"
            ? "Limite de avatar do plano Free atingido."
            : (data?.detail ?? "Falha no upload do avatar."),
        );
        return;
      }

      const data = (await res.json()) as { url: string; id: string };
      const updatedFields = { ...fields, avatar: data.url };

      const cardRes = await apiFetch(`/api/v1/cards/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title.trim() || "Meu cartão",
          fields: updatedFields,
        }),
      });

      if (cardRes.status === 401) {
        router.replace("/login");
        return;
      }
      if (!cardRes.ok) {
        const errData = (await cardRes.json().catch(() => null)) as {
          detail?: string;
        } | null;
        setError(
          errData?.detail ??
            "Avatar enviado, mas não foi possível salvar no cartão.",
        );
        return;
      }

      setAvatarPreview(data.url);
      setFields(updatedFields);
      setMessage("Avatar enviado e salvo.");
    } catch {
      setError("Falha de rede no upload.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const cardRes = await apiFetch(`/api/v1/cards/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title.trim() || "Meu cartão",
          fields: {
            ...fields,
            ...(avatarPreview ? { avatar: avatarPreview } : {}),
          },
        }),
      });

      if (cardRes.status === 401) {
        router.replace("/login");
        return;
      }
      if (!cardRes.ok) {
        const data = (await cardRes.json().catch(() => null)) as {
          detail?: string;
        } | null;
        setError(data?.detail ?? "Não foi possível salvar o cartão.");
        return;
      }

      const meRes = await apiFetch("/api/v1/me", {
        method: "PATCH",
        body: JSON.stringify({
          display_name: displayName.trim() || null,
          headline: headline.trim() || null,
          theme,
        }),
      });

      if (meRes.status === 401) {
        router.replace("/login");
        return;
      }
      if (!meRes.ok) {
        const data = (await meRes.json().catch(() => null)) as {
          detail?: string;
        } | null;
        setError(data?.detail ?? "Cartão salvo, mas o perfil falhou.");
        return;
      }

      setMessage("Alterações salvas.");
    } catch {
      setError("Falha de rede ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !error) {
    return <p className="text-sm text-ink-soft">Carregando editor…</p>;
  }

  if (error && loading) {
    return (
      <p role="alert" className="text-sm text-red-800">
        {error}
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-ink-soft">
            <Link href="/app" className="transition hover:text-teal">
              ← Cartões
            </Link>
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold">
            Editar cartão
          </h1>
        </div>
        <Link
          href={`/app/cards/${cardId}/qr`}
          className="inline-flex items-center justify-center rounded-md border border-line bg-paper/70 px-4 py-2 text-sm font-medium text-ink transition hover:border-teal/40"
        >
          QR e impressão
        </Link>
      </div>

      <form onSubmit={onSubmit} className="mt-8 max-w-xl space-y-5">
        <label className="block text-sm font-medium text-ink-soft">
          Título do cartão
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-2 w-full rounded-md border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-teal"
          />
        </label>

        <label className="block text-sm font-medium text-ink-soft">
          Nome de exibição
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-teal"
          />
        </label>

        <label className="block text-sm font-medium text-ink-soft">
          Headline
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-teal"
            placeholder="Ex.: Designer · São Paulo"
          />
        </label>

        <label className="block text-sm font-medium text-ink-soft">
          Tema
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-teal"
          >
            {THEMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-sm font-medium text-ink-soft">Avatar</p>
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreview}
              alt="Avatar"
              className="mt-3 h-20 w-20 object-cover"
            />
          ) : (
            <p className="mt-2 text-sm text-ink-soft/80">Nenhuma foto ainda.</p>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            onChange={(e) => onUpload(e.target.files?.[0] ?? null)}
            className="mt-3 block w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-teal file:px-3 file:py-2 file:text-sm file:font-semibold file:text-paper"
          />
          {uploading ? (
            <p className="mt-2 text-sm text-ink-soft">Enviando…</p>
          ) : null}
        </div>

        <fieldset className="space-y-4 border-t border-line pt-5">
          <legend className="text-sm font-semibold text-ink">Contatos</legend>
          {FIELD_KEYS.map(({ key, label }) => (
            <label key={key} className="block text-sm font-medium text-ink-soft">
              {label}
              <input
                value={fields[key] ?? ""}
                onChange={(e) => updateField(key, e.target.value)}
                className="mt-2 w-full rounded-md border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-teal"
              />
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-teal px-5 py-3 text-sm font-semibold text-paper transition hover:bg-teal-deep disabled:opacity-60"
        >
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>

        {message ? (
          <p role="status" className="text-sm text-teal-deep">
            {message}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
