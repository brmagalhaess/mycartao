export type CustomLink = {
  id: string;
  title: string;
  url: string;
  icon?: string;
  sort: number;
};

export const CUSTOM_LINK_ICONS = [
  "link",
  "globe",
  "calendar",
  "shop",
  "video",
  "music",
] as const;

export type CustomLinkIcon = (typeof CUSTOM_LINK_ICONS)[number];

export function sortCustomLinks(links: CustomLink[]): CustomLink[] {
  return [...links].sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title));
}

export function parseCustomLinks(
  fields: Record<string, unknown> | null | undefined,
): CustomLink[] {
  if (!fields || !Array.isArray(fields.custom_links)) {
    return [];
  }

  const parsed: CustomLink[] = [];
  for (const item of fields.custom_links) {
    if (!item || typeof item !== "object") continue;
    const raw = item as Record<string, unknown>;
    const id = typeof raw.id === "string" ? raw.id.trim() : "";
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    const url = typeof raw.url === "string" ? raw.url.trim() : "";
    if (!id || !title || !url) continue;

    const icon =
      typeof raw.icon === "string" && raw.icon.trim()
        ? raw.icon.trim()
        : undefined;
    const sort =
      typeof raw.sort === "number" && Number.isInteger(raw.sort) && raw.sort >= 0
        ? raw.sort
        : parsed.length;

    parsed.push({ id, title, url, icon, sort });
  }

  return sortCustomLinks(parsed);
}

export function newCustomLink(
  partial?: Partial<Pick<CustomLink, "title" | "url" | "icon">>,
): CustomLink {
  return {
    id: crypto.randomUUID(),
    title: partial?.title ?? "",
    url: partial?.url ?? "https://",
    icon: partial?.icon,
    sort: 0,
  };
}

/** Reindex `sort` to 0..n-1 after add/remove/reorder. */
export function reindexCustomLinks(links: CustomLink[]): CustomLink[] {
  return links.map((link, index) => ({ ...link, sort: index }));
}
