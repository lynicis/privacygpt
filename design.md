# Design: PrivacyGPT

The locked system for every page. It is read before any page work; change it on purpose.

## System

- Genre: modern-minimal
- Shape of the first page: Index. The register itself is the hero; the head is small above it.
- Hero: Banner. The first screen holds the head, one line and its control; the register begins at the fold.
- Theme: Console (catalog). Graphite ground, Host Grotesk 500 display, Atkinson Hyperlegible Mono for what was measured, amber for a person, cool for an instrument, ok and bad for status only.
- Axes: dark/grotesk-sans/chromatic-amber · posture: restrained
- Depth of the 2026-11-18 run: full redesign of the existing site, content and wiring kept.

## Meaning

- Amber (`--color-signal`) is a person or the one primary action. Blue (`--color-cool`) is an instrument or a measurement. Green (`--color-ok`) and red (`--color-bad`) mark status; never decoration.
- A panel is a 1px rule around `--color-paper-2`; panels that sit together share one border. Depth is lightness, not shadow.
- Every figure uses the measured face with tabular numerals. A number carries its unit or its label.
- Labels are the body face, sentence case, one step smaller. No tracked capitals, no eyebrows.

## Tokens

`src/tokens.css` is the source of truth. The roles:

```css
:root {
  --color-paper: oklch(17% 0.008 250);   --color-paper-2: oklch(21% 0.009 250); --color-paper-3: oklch(13.5% 0.007 250);
  --color-ink: oklch(95% 0.005 250);     --color-ink-2: oklch(83% 0.008 250);   --color-muted: oklch(71% 0.01 250);
  --color-rule: oklch(31% 0.01 250);     --color-rule-2: oklch(42% 0.012 250);
  --color-signal: oklch(82% 0.15 80);    --color-signal-ink: oklch(18% 0.04 75);
  --color-cool: oklch(77% 0.12 245);     --color-ok: oklch(76% 0.15 150);        --color-bad: oklch(70% 0.17 25);
  --font-display: "Host Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-body: var(--font-display);
  --font-outlier: "Atkinson Hyperlegible Mono", ui-monospace, monospace;
  --radius-card: 10px; --radius-pill: 6px; --rule-hair: 1px; --shadow-card: none;
}
```

Spacing, type, easing and duration scales live in `src/tokens.css`. Page-level helpers live in `src/styles.css`: `.shell`, `.section`, `.panel`, `.panels`, `.measured`, `.reading`, `.label`, `.head-block`, `.reg`, `.chip`, `.bar`.

## Waivers

The register and the document pages are one system; these are its standing exceptions, not per-page debts.

- 44c: Banner posture. The first screen holds the head and its control; the register or record starts at the fold.
- 59: sections part by 1px rules and bands, not 120px of air.
- 71: field titles inside a record are row labels, not section heads.
- 72: readings cells carry 20px of padding; the figure box was measured, not the cell.
- 77: a register table and a 58 to 68ch document measure are the body, not thin sections.
- 78: tables and item rows are the lead object; their heads are controls.
- 79: a document starts at the top and leaves the fold as reading space.
- 49b: post titles are content and keep their words at 320.

## Controls

- Primary: amber fill, `--color-signal-ink` text, 6px radius, 40px tall (48 on the home hero and marketing bands).
- Secondary: 1px `--color-rule-2` outline on `--color-paper-2`, same radius and height. One filled primary per screen.
- Inputs: `--color-paper-3` fill, 1px `--color-rule-2`, 40px; focus is an outline, never a border change.

## Motion

Calm. State changes only, `--dur-micro` and `--dur-short`, `--ease-out`; no reveals, no parallax, no hover lift. Under reduced motion every transition ends at once.

## Exports

`src/tokens.css` in this project, consumed by `src/styles.css`.
