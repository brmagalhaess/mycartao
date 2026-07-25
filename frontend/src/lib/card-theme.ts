export type CardTheme = "minimal" | "classic" | "bold" | "sand" | "ink";

export const FREE_THEMES: { value: CardTheme; label: string; blurb: string }[] = [
  { value: "minimal", label: "Minimal", blurb: "Limpo, branco e teal" },
  { value: "classic", label: "Clássico", blurb: "Papel creme e tipografia" },
  { value: "bold", label: "Bold", blurb: "Alto contraste e blocos" },
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
      "--card-bg": "#ffffff",
      "--card-fg": "#0c2a2e",
      "--card-accent": brand || "#0f766e",
      "--card-line": "rgba(12, 42, 46, 0.10)",
      "--card-ring": brand || "#99f6e4",
    },
    classic: {
      "--card-bg": "#f3ebe0",
      "--card-fg": "#2a1f14",
      "--card-accent": brand || "#8b5a2b",
      "--card-line": "rgba(42, 31, 20, 0.28)",
      "--card-ring": "#d4b896",
    },
    bold: {
      "--card-bg": "#042f2e",
      "--card-fg": "#ecfdf5",
      "--card-accent": brand || "#2dd4bf",
      "--card-line": "rgba(236, 253, 245, 0.22)",
      "--card-ring": brand || "#2dd4bf",
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
