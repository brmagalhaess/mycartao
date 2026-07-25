/** Public tools reachable from one base link via ?tool= */
export const PUBLIC_TOOLS = [
  {
    id: "card",
    label: "Cartão",
    param: null as string | null,
    hint: "Página padrão do seu cartão",
  },
  {
    id: "portfolio",
    label: "Portfólio",
    param: "portfolio",
    hint: "?tool=portfolio",
  },
  {
    id: "presence",
    label: "Presence",
    param: "presence",
    hint: "?tool=presence",
  },
  {
    id: "smart",
    label: "Smart",
    param: "smart",
    hint: "?tool=smart",
  },
] as const;

export type PublicToolId = (typeof PUBLIC_TOOLS)[number]["id"];

/** Build the single public URL, optionally pointing at a tool. */
export function publicToolUrl(
  origin: string,
  publicKey: string,
  tool: PublicToolId = "card",
): string {
  const base = `${origin.replace(/\/$/, "")}/c/${publicKey}`;
  if (tool === "card") return base;
  return `${base}?tool=${tool}`;
}

export function isPublicToolId(value: string | null | undefined): value is PublicToolId {
  return (
    value === "card" ||
    value === "portfolio" ||
    value === "presence" ||
    value === "smart"
  );
}
