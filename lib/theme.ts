// Theme system: each theme is a set of CSS custom properties applied to the
// app root. Every component reads from these tokens (var(--tp-*)) rather than
// hard-coded colors, so switching themes restyles the whole app.

export type ThemeId = "midnight-gold" | "emerald-night"

export interface ThemeDef {
  id: ThemeId
  label: string
  // swatch colors shown in the theme picker
  swatch: [string, string]
  tokens: Record<string, string>
}

export const THEMES: ThemeDef[] = [
  {
    id: "midnight-gold",
    label: "Midnight Gold",
    swatch: ["#0B0F1A", "#F4C430"],
    tokens: {
      "--tp-bg": "#0B0F1A",
      "--tp-bg-2": "#0E1424",
      "--tp-surface": "#161C2C",
      "--tp-surface-2": "#1E2740",
      "--tp-border": "#25304A",
      "--tp-text": "#F5F7FA",
      "--tp-muted": "#8A93A8",
      "--tp-accent": "#F4C430",
      "--tp-accent-2": "#E8B324",
      "--tp-on-accent": "#0B0F1A",
      "--tp-glow": "244, 196, 48",
      "--tp-pending": "#F4C430",
      "--tp-won": "#2FBF71",
      "--tp-lost": "#E5484D",
      "--tp-void": "#6B7280",
    },
  },
  {
    id: "emerald-night",
    label: "Emerald Night",
    swatch: ["#05140E", "#34D399"],
    tokens: {
      "--tp-bg": "#05140E",
      "--tp-bg-2": "#081C13",
      "--tp-surface": "#0C2419",
      "--tp-surface-2": "#123324",
      "--tp-border": "#1C4535",
      "--tp-text": "#EAF6EF",
      "--tp-muted": "#7FA593",
      "--tp-accent": "#34D399",
      "--tp-accent-2": "#10B981",
      "--tp-on-accent": "#04130C",
      "--tp-glow": "52, 211, 153",
      "--tp-pending": "#FBBF24",
      "--tp-won": "#22C55E",
      "--tp-lost": "#F87171",
      "--tp-void": "#64748B",
    },
  },
]

export function getTheme(id: ThemeId): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

export function themeStyle(id: ThemeId): React.CSSProperties {
  return getTheme(id).tokens as React.CSSProperties
}
