/**
 * Browser-chrome colors (`<meta name="theme-color">`). A meta tag cannot use CSS variables, so the literals live
 * here, in one place for ThemeScript, ThemeToggle and BaseLayout. Keep them equal to `--background` in
 * src/styles/global.css (light `:root`, dark `.dark`). OG cards (og.ts) hard-code their own hexes (satori has no CSS vars).
 */
export const THEME_COLOR = { light: '#ffffff', dark: '#000000' } as const;
