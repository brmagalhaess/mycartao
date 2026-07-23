export type CardTheme = "minimal" | "classic" | "bold" | "sand" | "ink";

export const FREE_THEMES: { value: CardTheme; label: string; blurb: string }[] = [
  { value: "minimal", label: "Minimal", blurb: "Limpo e claro" },
  { value: "classic", label: "Clássico", blurb: "Mais tipografia e linhas" },
  { value: "bold", label: "Bold", blurb: "Contraste forte" },
];

export const PRO_THEMES: { value: CardTheme; label: string; blurb: string }[] = [
  { value: "sand", label: "Areia", blurb: "Quente e acolhedor (Pro)" },
  { value: "ink", label: "Ink", blurb: "Escuro editorial (Pro)" },
];

export function themeStyleVars(
  theme: CardTheme,
  brandColor?: string | null,
): Record<string, string> {
  const brand = brandColor && /^#[0-9a-fA-F]{6}$/.test(brandColor)
    ? brandColor
    : null;

  const bases: Record<CardTheme, Record<string, string>> = {
    minimal: {
      "--card-bg": "#faf8f5",
      "--card-fg": "#0c2a2e",
      "--card-accent": brand || "#0f766e",
      "--card-line": "rgba(12, 42, 46, 0.12)",
      "--card-ring": "#e8d5b5",
    },
    classic: {
      "--card-bg": "#f7f3eb",
      "--card-fg": "#1a2e32",
      "--card-accent": brand || "#0a5550",
      "--card-line": "rgba(12, 42, 46, 0.22)",
      "--card-ring": "#d4b896",
    },
    bold: {
      "--card-bg": "#eef5f3",
      "--card-fg": "#042f2e",
      "--card-accent": brand || "#0f766e",
      "--card-line": "rgba(4, 47, 46, 0.18)",
      "--card-ring": "#0f766e",
    },
    sand: {
      "--card-bg": "#f3e6d4",
      "--card-fg": "#3b2a1a",
      "--card-accent": brand || "#b45309",
      "--card-line": "rgba(59, 42, 26, 0.16)",
      "--card-ring": "#e8d5b5",
    },
    ink: {
      "--card-bg": "#0c2a2e",
      "--card-fg": "#faf8f5",
      "--card-accent": brand || "#e8d5b5",
      "--card-line": "rgba(250, 248, 245, 0.16)",
      "--card-ring": "#0f766e",
    },
  };

  return bases[theme] || bases.minimal;
}
