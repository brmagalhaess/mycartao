"use client";

import Link from "next/link";
import {
  CUSTOM_LINK_ICONS,
  type CustomLink,
  newCustomLink,
  reindexCustomLinks,
} from "@/lib/custom-links";

type Props = {
  links: CustomLink[];
  onChange: (links: CustomLink[]) => void;
  disabled?: boolean;
  isPro: boolean;
};

const ICON_LABELS: Record<(typeof CUSTOM_LINK_ICONS)[number], string> = {
  link: "Link",
  globe: "Site",
  calendar: "Agenda",
  shop: "Loja",
  video: "Vídeo",
  music: "Música",
};

export default function CustomLinksEditor({
  links,
  onChange,
  disabled = false,
  isPro,
}: Props) {
  const locked = disabled || !isPro;

  function updateAt(index: number, patch: Partial<CustomLink>) {
    onChange(
      links.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    );
  }

  function addLink() {
    if (locked || links.length >= 20) return;
    onChange(reindexCustomLinks([...links, newCustomLink()]));
  }

  function removeAt(index: number) {
    if (locked) return;
    onChange(reindexCustomLinks(links.filter((_, i) => i !== index)));
  }

  function move(index: number, delta: number) {
    if (locked) return;
    const next = index + delta;
    if (next < 0 || next >= links.length) return;
    const copy = [...links];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    onChange(reindexCustomLinks(copy));
  }

  return (
    <section className="space-y-4">
      <h2 className="section-title">Links</h2>
      <p className="text-sm text-ink-soft">
        Botões personalizados no cartão público (Pro).
      </p>

      {locked ? (
        <div className="rounded-md border border-line bg-paper/70 px-4 py-3 text-sm text-ink-soft">
          <p>
            Links personalizados estão disponíveis no plano Pro. Adicione botões
            para site, agenda, loja e mais no cartão público.
          </p>
          <Link
            href="/app/billing"
            className="mt-2 inline-block font-medium text-teal transition hover:text-teal-deep"
          >
            Ver planos e assinar Pro →
          </Link>
        </div>
      ) : (
        <>
          {links.length === 0 ? (
            <p className="text-sm text-ink-soft/80">
              Nenhum link ainda. Adicione até 20 links.
            </p>
          ) : null}

          <ul className="space-y-4">
            {links.map((link, index) => (
              <li
                key={link.id}
                className="space-y-3 border-b border-line pb-4 last:border-b-0"
              >
                <label className="block text-sm font-medium text-ink-soft">
                  Título
                  <input
                    value={link.title}
                    onChange={(e) => updateAt(index, { title: e.target.value })}
                    maxLength={60}
                    placeholder="Ex.: Meu site"
                    className="mt-2 w-full rounded-md border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-teal"
                  />
                </label>

                <label className="block text-sm font-medium text-ink-soft">
                  URL
                  <input
                    value={link.url}
                    onChange={(e) => updateAt(index, { url: e.target.value })}
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    placeholder="https://"
                    className="mt-2 w-full rounded-md border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-teal"
                  />
                </label>

                <label className="block text-sm font-medium text-ink-soft">
                  Ícone
                  <select
                    value={link.icon ?? ""}
                    onChange={(e) =>
                      updateAt(index, {
                        icon: e.target.value || undefined,
                      })
                    }
                    className="mt-2 w-full rounded-md border border-line bg-paper px-4 py-3 text-base text-ink outline-none transition focus:border-teal"
                  >
                    <option value="">Nenhum</option>
                    {CUSTOM_LINK_ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {ICON_LABELS[icon]}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded-md border border-line bg-paper/70 px-3 py-1.5 text-sm font-medium text-ink transition hover:border-teal/40 disabled:opacity-40"
                    aria-label="Mover para cima"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === links.length - 1}
                    className="rounded-md border border-line bg-paper/70 px-3 py-1.5 text-sm font-medium text-ink transition hover:border-teal/40 disabled:opacity-40"
                    aria-label="Mover para baixo"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    className="rounded-md border border-line bg-paper/70 px-3 py-1.5 text-sm font-medium text-red-800 transition hover:border-red-300"
                  >
                    Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={addLink}
            disabled={links.length >= 20}
            className="rounded-md border border-line bg-paper/70 px-4 py-2 text-sm font-medium text-ink transition hover:border-teal/40 disabled:opacity-40"
          >
            Adicionar link
          </button>
        </>
      )}
    </section>
  );
}
