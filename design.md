# Design — Kasir POS

A locked design system for this app. Every page redesign reads this file before
emitting code. Do not regenerate per page — extend or amend this file when the
system needs to grow.

## Genre
modern-minimal

## Macrostructure family
All pages are app pages. One family: Workbench.

- App pages: Workbench (sidebar nav + topbar breadcrumb + scrollable main)
  — variation knobs: content density, section count, form complexity

## Theme
- `--color-paper`      oklch(98.5% 0.003 260)
- `--color-paper-2`    oklch(99.5% 0.001 260)
- `--color-paper-3`    oklch(96% 0.005 260)
- `--color-ink`        oklch(13% 0.01 260)
- `--color-ink-2`      oklch(40% 0.02 260)
- `--color-ink-3`      oklch(62% 0.015 260)
- `--color-rule`       oklch(92% 0.006 260)
- `--color-accent`     oklch(52% 0.22 275)
- `--color-accent-ink` oklch(99% 0.005 275)
- `--color-focus`      oklch(52% 0.22 275 / 0.25)

## Typography
- Display: Geist, weight 600, style normal
- Body:    Inter, weight 400/500
- Mono:    Geist Mono, weight 400
- Display tracking: -0.025em
- Type scale anchor: text-display = clamp(1.5rem, 2vw + 0.75rem, 2rem)

## Spacing
4-point named scale. The values are in `tokens.css`. Pages must use named
tokens (`var(--space-md)`), never raw values.

## Motion
- Easings: cubic-bezier(0.16, 1, 0.3, 1) named `--ease-out`
- Reveal pattern: none — content is just there
- Reduced-motion fallback: opacity-only, ≤ 150 ms.

## Microinteractions stance
- Silent success — no celebratory toasts
- Focus ring: instant, 2px solid, 3:1 contrast
- Hover delay 800ms on tooltips, focus delay 0ms
- Optimistic updates where possible; confirm() only for irreversible actions

## CTA voice
- Primary CTA: filled pill (`border-radius: 8px`), medium weight, concise labels
- Secondary CTA: outlined pill, same radius
- Ghost CTA: transparent, muted text → ink on hover

## Per-page allowances
- App pages MUST NOT use enrichment — function carries the page.
- Every page uses the Workbench shell (sidebar + topbar).

## What pages MUST share
- The sidebar wordmark and nav structure.
- The accent colour and its placement (≤ 5% per viewport).
- The display + body + mono fonts.
- The CTA voice (button shape, border-radius, padding rhythm).
- Section heading rhythm (h1 for page title, h2 for sections, h3 for cards).

## What pages MAY differ on
- Content density (table-heavy vs. stat-heavy vs. form-heavy)
- Section count and order
- Form complexity (simple single-form vs. multi-step)

## Exports

### tokens.css
See `tokens.css` at project root.

### Tailwind v4 @theme
```css
@theme {
  --color-paper:      oklch(98.5% 0.003 260);
  --color-paper-2:    oklch(99.5% 0.001 260);
  --color-paper-3:    oklch(96% 0.005 260);
  --color-ink:        oklch(13% 0.01 260);
  --color-ink-2:      oklch(40% 0.02 260);
  --color-ink-3:      oklch(62% 0.015 260);
  --color-rule:       oklch(92% 0.006 260);
  --color-accent:     oklch(52% 0.22 275);
  --color-accent-ink: oklch(99% 0.005 275);
  --font-display:     "Geist", sans-serif;
  --font-body:        "Inter", sans-serif;
  --font-mono:        "Geist Mono", monospace;
  --spacing-md:       1.5rem;
  --text-md:          1.125rem;
  --ease-out:         cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG tokens.json
```json
{
  "color": {
    "paper":      { "$value": "oklch(98.5% 0.003 260)", "$type": "color" },
    "ink":        { "$value": "oklch(13% 0.01 260)", "$type": "color" },
    "accent":     { "$value": "oklch(52% 0.22 275)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Geist", "$type": "fontFamily" },
    "body":    { "$value": "Inter", "$type": "fontFamily" }
  },
  "space": {
    "md": { "$value": "1.5rem", "$type": "dimension" }
  }
}
```

### shadcn/ui CSS variables
```css
:root {
  --background:         98.5% 0.003 260;
  --foreground:         13% 0.01 260;
  --primary:            52% 0.22 275;
  --primary-foreground: 99% 0.005 275;
  --muted:              96% 0.005 260;
  --muted-foreground:   62% 0.015 260;
  --border:             92% 0.006 260;
  --input:              92% 0.006 260;
  --ring:               52% 0.22 275 / 0.25;
  --radius:             8px;
}
```
