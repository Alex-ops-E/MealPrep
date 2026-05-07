/**
 * Design tokens derived from the sibling web artifact.
 * Source: artifacts/grocery-agent-web/src/index.css
 *
 * All HSL values converted to hex exactly as they appear in index.css.
 * The `gradientStart`/`gradientEnd` pair is the brand orange→pink gradient
 * used in the web app's dish-match component (Tailwind orange-500 → pink-500).
 * It is NOT a CSS variable override — it is additive product branding.
 */

const colors = {
  /** Light mode — matches :root block in index.css */
  light: {
    text: "#020817",
    tint: "#2563EB",
    // --background: hsl(210, 40%, 98%)
    background: "#F8FAFC",
    // --foreground: hsl(222, 84%, 5%)
    foreground: "#020817",
    // --card: hsl(0, 0%, 100%)
    card: "#FFFFFF",
    cardForeground: "#020817",
    // --primary: hsl(221, 83%, 53%)
    primary: "#2563EB",
    primaryForeground: "#F8FAFC",
    // --secondary: hsl(210, 40%, 96%)
    secondary: "#F1F5F9",
    // --secondary-foreground: hsl(222, 47%, 39%)
    secondaryForeground: "#3D5A99",
    // --muted: hsl(210, 40%, 96%)
    muted: "#F1F5F9",
    // --muted-foreground: hsl(215, 16%, 47%)
    mutedForeground: "#64748B",
    // --accent: hsl(142, 76%, 36%)
    accent: "#16A34A",
    accentForeground: "#F8FAFC",
    // --destructive: hsl(0, 84%, 60%)
    destructive: "#EF4444",
    destructiveForeground: "#F8FAFC",
    // --border: hsl(214, 32%, 91%)
    border: "#E2E8F0",
    input: "#E2E8F0",
    // Brand gradient — Tailwind orange-500 → pink-500 (dish-match, CTAs)
    gradientStart: "#F97316",
    gradientEnd: "#EC4899",
  },
  /** Dark mode — matches .dark block in index.css */
  dark: {
    text: "#F8FAFC",
    tint: "#3B82F6",
    // --background: hsl(222, 84%, 5%)
    background: "#020817",
    // --foreground: hsl(210, 40%, 98%)
    foreground: "#F8FAFC",
    // --card: hsl(222, 47%, 11%)
    card: "#0F172A",
    cardForeground: "#F8FAFC",
    // --primary: hsl(217, 91%, 60%)
    primary: "#3B82F6",
    // --primary-foreground: hsl(222, 84%, 5%)
    primaryForeground: "#020817",
    // --secondary: hsl(217, 32%, 17%)
    secondary: "#1E293B",
    secondaryForeground: "#F8FAFC",
    // --muted: hsl(217, 32%, 17%)
    muted: "#1E293B",
    // --muted-foreground: hsl(215, 20%, 65%)
    mutedForeground: "#94A3B8",
    // --accent: hsl(142, 76%, 36%)
    accent: "#16A34A",
    accentForeground: "#F8FAFC",
    // --destructive: hsl(0, 63%, 31%)
    destructive: "#7F1D1D",
    destructiveForeground: "#F8FAFC",
    // --border: hsl(217, 32%, 17%)
    border: "#1E293B",
    input: "#1E293B",
    // Brand gradient — Tailwind orange-500 → pink-500 (dish-match, CTAs)
    gradientStart: "#F97316",
    gradientEnd: "#EC4899",
  },
  radius: 12,
};

export default colors;
