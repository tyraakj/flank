# UI Context

## Theme

Dark default. The visual language is a dense technical workspace optimized for desktop data reading — near-black backgrounds, layered surfaces, and high-contrast elements for data-dense report tables.

All colors are defined as CSS custom properties in `apps/app/app/globals.css` using HSL or OKLCH variables and mapped to Tailwind tokens. Components must use these semantic tokens — no hardcoded hex values or raw Tailwind color classes like `zinc-*`.

## Color Tokens

| Role | CSS Variable | Notes |
|---|---|---|
| Page background | `--background` | Near-black base |
| Card / surface | `--card` | Slightly elevated surface |
| Muted surface | `--muted` | For secondary backgrounds |
| Foreground | `--foreground` | Primary text |
| Muted foreground | `--muted-foreground` | Secondary / label text |
| Border | `--border` | Default separator |
| Input | `--input` | Form element backgrounds |
| Primary | `--primary` | Brand action color |
| Primary foreground | `--primary-foreground` | Text on primary |
| Destructive | `--destructive` | Error / danger states |
| Ring | `--ring` | Focus ring |
| Chart 1–5 | `--chart-1` … `--chart-5` | Data visualization series |

Define tokens at `:root` for the dark default. Avoid a light-theme flash by not including a light `:root` variant.

## Typography

| Role | Font | How loaded |
|---|---|---|
| UI text | Inter (or Geist Sans) | `next/font/google`, applied as CSS variable on `<html>` |
| Code / mono | Geist Mono | `next/font/google`, applied as CSS variable on `<html>` |

Body uses the UI font with `antialiased`. Tabular numerals (`font-variant-numeric: tabular-nums`) on all pricing and numeric table cells.

## Border Radius

Radius scales with surface depth.

| Context | Class |
|---|---|
| Inline / badge / chip | `rounded-md` |
| Cards / panels / table containers | `rounded-xl` |
| Modal / sheet / overlay | `rounded-2xl` |

## Component Conventions

### shadcn/ui Primitives

Generated into `apps/app/components/ui/`. Do not modify generated files after creation. Compose product behavior in `apps/app/components/flank/` instead.

Generated components in use: `Button`, `Card`, `Input`, `Textarea`, `Dialog`, `DropdownMenu`, `Tabs`, `Tooltip`, `Popover`, `Select`, `Checkbox`, `Switch`, `Badge`, `Skeleton`, `ScrollArea`, `Separator`, `Sheet`, `Table`, `Sonner`.

### Icons

Lucide React. Stroke-based icons only. Standard sizes: `h-4 w-4` inline, `h-5 w-5` for buttons, `h-8 w-8` for feature / empty-state icons.

### Confidence Display (`components/flank/confidence.tsx`)

Rendered as a labelled dot plus accessible text and tooltip. Three bands:

| Band | Score range | Visual |
|---|---|---|
| High | 80–100 | Solid dot, no tooltip needed |
| Normal | 60–79 | Dot, tooltip on hover |
| Low | 40–59 | Muted dot, inline reason label always visible |
| Insufficient | 0–39 | Warning dot, inline reason always visible, never presented as fact |

Low and insufficient confidence must always show the reason inline. Never silently display insufficient confidence as if it were normal.

### Support Status Display (`components/flank/support-status.tsx`)

Rendered as distinct icon shapes plus label. Color may reinforce but cannot be the only signal (accessibility requirement).

| Status | Shape | Label |
|---|---|---|
| `yes` | Filled check circle | "Yes" |
| `partial` | Half-filled circle | "Partial" |
| `no` | X circle | "No" |
| `unknown` | Dash circle | "Unknown" |

### Data Table (`components/flank/data-table.tsx`)

- Sticky top header row
- Pinned first column with its own background and right border
- Compact row height with tabular numerals
- Scroll shadow affordance on horizontal scroll
- Horizontal scrolling contained inside the table region — never the full viewport
- Use semantic `<table>` elements, not div grids

### Matrix (`components/flank/matrix.tsx`)

Reused for Pricing (S5) and Features (S6).

- Fixed minimum cell width to prevent unreadable compression
- Target column pinned left on both matrices
- Hover state on cells reveals evidence excerpt in a tooltip
- Click on a cell with a source link opens the source in a new tab

## Report State Treatments (`components/flank/report-state.tsx`)

Every screen must handle these states explicitly. Do not use a centered spinner on data-dense screens.

| State | Treatment |
|---|---|
| Loading | Layout-matched skeletons matching final content dimensions |
| Empty | Distinct copy per section + specific recovery action |
| Partial | Available sections render normally; missing sections show "still working" or "couldn't gather" markers |
| Low confidence | Flagged inline with reason — never silently presented as fact |
| Failed | Stage-level reason in plain language + targeted retry action |
| Quota reached | Blocked with count and upgrade path |
| Stale | Age warning banner with Re-run action |

## Layout Patterns

- **Workspace shell**: full-viewport layout with top navbar, left sidebar navigation, and main content area.
- **Report tabs**: `Tabs` component anchored below the report header; tab content fills the remaining viewport.
- **Competitor drawer**: `Sheet` slide-over from the right, full height, triggered from table row click.
- **Modals and dialogs**: `Dialog`, centered, `rounded-2xl`, dark background.
- **Positioning map**: SVG or canvas 2×2 plot with logo overlays; whitespace quadrant shading.
- **Progress screen (S2)**: full-screen, vertical stage list with live state badges, competitor logo grid, and log strip at the bottom.

## Run Progress Indicators

Stage states rendered as badges on S2:

| State | Badge style |
|---|---|
| `queued` | Muted, gray |
| `running` | Animated pulse, primary color |
| `retrying` | Warning color, retry count |
| `done` | Success color, check icon |
| `failed` | Destructive color, error icon |
| `skipped` | Muted, dash icon |

## Accessibility

- Every interactive element has a visible keyboard focus ring using `--ring`.
- Support status, confidence level, and stage state must never rely on color alone.
- Source links open in a new tab with `rel="noopener noreferrer"` and a screen-reader label indicating the link opens externally.
- Use `aria-live` regions for live run progress updates on S2.
