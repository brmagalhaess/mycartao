"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, toMediaSrc } from "@/lib/api";
import {
  type CustomLink,
  parseCustomLinks,
} from "@/lib/custom-links";
import CustomLinksEditor from "@/components/CustomLinksEditor";
import ShareLinksBlock from "@/components/ShareLinksBlock";
import {
  ContactsSection,
  FIELD_KEYS,
  ProfileSection,
  ThemeSection,
} from "@/components/CardEditorSections";

type Card = {
  id: string;
  title: string;
  layout: string | null;
  fields: Record<string, string>;
  is_primary: boolean;
};

type Profile = {
  id: string;
  display_name: string | null;
  headline: string | null;
  theme: string | null;
  avatar_key: string | null;
  slug: string | null;
};

type Props = {
  cardId: string;
};

function strField(fields: Record<string, unknown>, key: string): string {
  const value = fields[key];
  return typeof value === "string" ? value : "";
}

function buildSaveFields(
  fields: Record<string, string>,
  avatarPreview: string | null,
  customLinks: CustomLink[],
  isPro: boolean,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    ...fields,
    ...(avatarPreview ? { avatar: avatarPreview } : {}),
  };
  if (isPro) {
    payload.custom_links = customLinks
      .filter((link) => link.title.trim() && link.url.trim())
      .map((link, index) => ({
        id: link.id,
        title: link.title.trim(),
        url: link.url.trim(),
        ...(link.icon ? { icon: link.icon } : {}),
        sort: index,
      }));
  }
  return payload;
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
  const [plan, setPlan] = useState("free");
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [slug, setSlug] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  const isPro = plan === "pro" || plan === "admin";

  useEffect(() => {
    setOrigin(window.location.origin);
    let cancelled = false;

    async function load() {
      const whoRes = await apiFetch("/api/v1/auth/whoami");
      if (whoRes.status === 401) {
        router.replace("/login");
        return;
      }
      if (whoRes.ok) {
        const user = (await whoRes.json()) as { plan: string };
        if (!cancelled) setPlan(user.plan ?? "free");
      }

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
      setSlug(profile.slug);
      setDisplayName(profile.display_name ?? "");
      setHeadline(profile.headline ?? "");
      setTheme(profile.theme ?? "minimal");
      setFields(
        Object.fromEntries(
          FIELD_KEYS.map(({ key }) => [key, strField(card.fields, key)]),
        ),
      );
      setCustomLinks(parseCustomLinks(card.fields));
      const avatar =
        typeof card.fields.avatar === "string"
          ? toMediaSrc(card.fields.avatar)
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
        setError(data?.detail ?? "Falha no upload do avatar.");
        return;
      }

      const data = (await res.json()) as { url: string; id: string };
      const mediaUrl = toMediaSrc(data.url);
      const saveFields = buildSaveFields(
        fields,
        mediaUrl,
        customLinks,
        isPro,
      );

      const cardRes = await apiFetch(`/api/v1/cards/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title.trim() || "Meu cartão",
          fields: saveFields,
        }),
      });

      if (cardRes.status === 401) {
        router.replace("/login");
        return;
      }
      if (!cardRes.ok) {
        const errData = (await cardRes.json().catch(() => null)) as {
          detail?: string;
          code?: string;
        } | null;
        setError(
          errData?.code === "custom_links_pro_only"
            ? "Links personalizados exigem plano Pro."
            : (errData?.detail ??
              "Avatar enviado, mas não foi possível salvar no cartão."),
        );
        return;
      }

      setAvatarPreview(mediaUrl);
      setFields({ ...fields, avatar: mediaUrl });
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
          fields: buildSaveFields(fields, avatarPreview, customLinks, isPro),
        }),
      });

      if (cardRes.status === 401) {
        router.replace("/login");
        return;
      }
      if (!cardRes.ok) {
        const data = (await cardRes.json().catch(() => null)) as {
          detail?: string;
          code?: string;
        } | null;
        setError(
          data?.code === "custom_links_pro_only"
            ? "Links personalizados exigem plano Pro. Remova os links ou assine o Pro."
            : (data?.detail ?? "Não foi possível salvar o cartão."),
        );
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
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Editar cartão
          </h1>
          <p className="mt-2 max-w-md text-ink-soft">
            Perfil, contatos, links Pro e tema — salve para atualizar o cartão
            público.
          </p>
        </div>
        <Link
          href={`/app/cards/${cardId}/qr`}
          className="inline-flex items-center justify-center rounded-md border border-line bg-paper/70 px-4 py-2 text-sm font-medium text-ink transition hover:border-teal/40"
        >
          QR e impressão
        </Link>
      </div>

      <form onSubmit={onSubmit} className="mt-10 max-w-xl space-y-0">
        <ProfileSection
          title={title}
          displayName={displayName}
          headline={headline}
          avatarPreview={avatarPreview}
          uploading={uploading}
          onTitle={setTitle}
          onDisplayName={setDisplayName}
          onHeadline={setHeadline}
          onUpload={onUpload}
        />

        <ContactsSection fields={fields} onUpdateField={updateField} />

        <div className="border-t border-line pt-8">
          <CustomLinksEditor
            links={customLinks}
            onChange={setCustomLinks}
            disabled={!isPro}
            isPro={isPro}
          />
        </div>

        <ThemeSection theme={theme} onTheme={setTheme} />

        <div className="border-t border-line pt-8">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-teal px-5 py-3 text-sm font-semibold text-paper transition hover:bg-teal-deep disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>

          {message ? (
            <p role="status" className="mt-4 text-sm text-teal-deep">
              {message}
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="mt-4 text-sm text-red-800">
              {error}
            </p>
          ) : null}
        </div>
      </form>

      {origin ? (
        <div className="mt-14 max-w-xl border-t border-line pt-10">
          <ShareLinksBlock
            kind="card"
            commonPath={`/c/${cardId}`}
            personalizedPath={slug ? `/c/${slug}` : null}
            isPro={isPro}
            origin={origin}
          />
        </div>
      ) : null}
    </div>
  );
}
