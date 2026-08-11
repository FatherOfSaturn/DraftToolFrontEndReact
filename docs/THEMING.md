# Theming

The app supports runtime theme switching (Header > palette icon). Themes are
defined as CSS custom properties in `src/styles/stitch.css` under
`[data-theme="..."]` blocks, and Tailwind color utilities resolve to them via
`rgb(var(--color-<name>) / <alpha-value>)`.

## Adding a new theme

1. Add a `[data-theme="<id>"]` block in `src/styles/stitch.css` with the full
   Material palette plus the app helper vars (`--app-background`, `--glass-*`,
   `--nav-shadow`, `--glow-*`).
2. Register it in the `THEMES` list in `src/shared/theme/ThemeContext.tsx`,
   grouped under Dark or Light (affects the dropdown ordering).
3. Reuse the `arcane` (dark) or `celestial-aetheric` (light) block as a template;
   all token values must be RGB triplets.

## Per-theme fonts

Font families are tokenized too: `--font-heading`, `--font-body`, and
`--font-label` default to the original set (Hanken Grotesk / Inter / JetBrains
Mono) in `:root`. Override them in a `[data-theme]` block to change typefaces
per theme (e.g. the grimoire themes use Source Serif 4 for headings). If a new
font is used, add it to the Google Fonts link in `index.html`.

## Rules for new UI

- Never use color literals (`text-white`, `bg-black`, `bg-gray-600`, `#hex`,
  `rgba(...)`, `text-green-400`, ...) in components. They break under the light
  theme.
- Use tokens only: `text-on-surface`, `bg-surface-dim`, `text-on-primary`, etc.
- For emphasis/accent text use `accent`; for success states use `success`
  (`text-success`, `bg-success`, with `/80` style opacity modifiers as needed).
- Themed surfaces use `text-on-surface` for headings and body text.
- Helpers like `glass-panel` and `shadow-[0_0_30px_var(--glow-*)]` are
  theme-aware — prefer them over raw shadows.

## Intentional exceptions (do not theme)

- Card color badges on colored circles (`bg-gray-600 text-white`).
- Mana symbol colors and data-viz palettes (they carry semantic meaning).
- Scrim/overlay backdrops (`bg-black/40`), and `text-white` text sitting on a
  forced-dark scrim (e.g. the Mulligan Simulator's Library label over
  `from-black/80`) — that background is black in every theme.
- Color filter pips in the card-workspace filter panel: fixed deep-vibrant
  palette (`blue-600`, `red-600`, `green-700`, ...) so they stay legible in
  both dark and light themes.
- The create-lobby button (`.mana-gradient` in `DraftSetupPage`): the alternate
  themes restore a restrained primary→container gradient (night uses
  primary-container→on-primary because its `primary` is light) plus a
  `var(--glass-border)` outline, deviating from the no-gradients-in-light-themes
  rule so the button stays visible on every theme.
