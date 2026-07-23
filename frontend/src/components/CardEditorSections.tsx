"use client";

import Link from "next/link";

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

type ProfileSectionProps = {
  title: string;
  displayName: string;
  headline: string;
  avatarPreview: string | null;
  uploading: boolean;
  onTitle: (value: string) => void;
  onDisplayName: (value: string) => void;
  onHeadline: (value: string) => void;
  onUpload: (file: File | null) => void;
};

export function ProfileSection({
  title,
  displayName,
  headline,
  avatarPreview,
  uploading,
  onTitle,
  onDisplayName,
  onHeadline,
  onUpload,
}: ProfileSectionProps) {
  return (
    <section className="space-y-5">
      <h2 className="section-title">Perfil</h2>

      <label className="block text-sm font-medium text-ink-soft">
        Título do cartão
        <input
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          required
          className="input-field"
        />
      </label>

      <label className="block text-sm font-medium text-ink-soft">
        Nome de exibição
        <input
          value={displayName}
          onChange={(e) => onDisplayName(e.target.value)}
          className="input-field"
        />
      </label>

      <label className="block text-sm font-medium text-ink-soft">
        Headline
        <input
          value={headline}
          onChange={(e) => onHeadline(e.target.value)}
          className="input-field"
          placeholder="Ex.: Designer · São Paulo"
        />
      </label>

      <div>
        <p className="text-sm font-medium text-ink-soft">Avatar</p>
        {avatarPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarPreview}
            alt="Avatar"
            className="mt-3 h-24 w-24 rounded-full object-cover ring-2 ring-sand/70"
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
    </section>
  );
}

type ContactsSectionProps = {
  fields: Record<string, string>;
  onUpdateField: (key: string, value: string) => void;
};

export function ContactsSection({
  fields,
  onUpdateField,
}: ContactsSectionProps) {
  return (
    <section className="space-y-4 border-t border-line pt-8">
      <h2 className="section-title">Contatos</h2>
      {FIELD_KEYS.map(({ key, label }) => (
        <label key={key} className="block text-sm font-medium text-ink-soft">
          {label}
          <input
            value={fields[key] ?? ""}
            onChange={(e) => onUpdateField(key, e.target.value)}
            className="input-field"
          />
        </label>
      ))}
    </section>
  );
}

type ThemeSectionProps = {
  theme: string;
  onTheme: (value: string) => void;
};

export function ThemeSection({ theme, onTheme }: ThemeSectionProps) {
  return (
    <section className="space-y-4 border-t border-line pt-8">
      <h2 className="section-title">Tema</h2>
      <p className="text-sm text-ink-soft">
        Ajuste rápido. Aparência completa (temas Pro, cor da marca e link) fica
        em Configurações.
      </p>
      <label className="block text-sm font-medium text-ink-soft">
        Visual do cartão
        <select
          value={theme}
          onChange={(e) => onTheme(e.target.value)}
          className="input-field"
        >
          {THEMES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <Link
        href="/app/settings"
        className="inline-block text-sm font-medium text-teal hover:text-teal-deep"
      >
        Abrir Configurações →
      </Link>
    </section>
  );
}

export { FIELD_KEYS };
