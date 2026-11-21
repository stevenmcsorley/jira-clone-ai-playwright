---
name: Ossicone
description: A workbench for planning and tracking work: warm graphite or warm paper, one signal colour, flat ruled panels, Geist.
colors:
  signal-dark: "#e0a43a"
  signal-dark-hover: "#c98f2c"
  signal-dark-text: "#ecc070"
  signal-on-fill-dark: "#17150f"
  signal-light: "#8a5a00"
  signal-light-hover: "#704800"
  signal-light-focus: "#b57a12"
  signal-light-wash: "#fbf3e1"
  page-dark: "#121211"
  panel-dark: "#1a1a18"
  panel-raised-dark: "#1d1d1b"
  rule-dark: "#2a2a27"
  rule-strong-dark: "#3b3b37"
  text-dark: "#efede5"
  text-secondary-dark: "#dfdcd2"
  text-muted-dark: "#9b988f"
  page-light: "#f7f6f2"
  panel-light: "#ffffff"
  panel-sunk-light: "#efede7"
  rule-light: "#e2dfd6"
  rule-strong-light: "#cdc9bd"
  text-light: "#181816"
  text-secondary-light: "#3f3e38"
  text-muted-light: "#6f6c63"
  alert-dark: "#ee806f"
  success-dark: "#86c98f"
  caution-dark: "#e3c64a"
typography:
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "2rem"
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
    fontFeature: "tnum"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: "1rem"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
rounded:
  badge: "3px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  row-x: "16px"
  row-y: "8px"
  page-x: "24px"
  page-y: "24px"
  stack: "24px"
  touch: "44px"
components:
  button-primary:
    backgroundColor: "{colors.signal-light}"
    textColor: "{colors.page-light}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.signal-light-hover}"
  button-primary-dark:
    backgroundColor: "{colors.signal-dark}"
    textColor: "{colors.signal-on-fill-dark}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-primary-dark-hover:
    backgroundColor: "{colors.signal-dark-hover}"
  button-secondary:
    backgroundColor: "{colors.panel-light}"
    textColor: "{colors.text-secondary-light}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-secondary-dark:
    backgroundColor: "{colors.panel-dark}"
    textColor: "{colors.text-secondary-dark}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  panel:
    backgroundColor: "{colors.panel-light}"
    rounded: "{rounded.lg}"
  panel-dark:
    backgroundColor: "{colors.panel-dark}"
    rounded: "{rounded.lg}"
  list-row:
    height: "44px"
    padding: "8px 16px"
    typography: "{typography.body}"
  nav-tab:
    textColor: "{colors.text-muted-light}"
    height: "40px"
    padding: "0 12px"
    typography: "{typography.body}"
  nav-tab-active:
    textColor: "{colors.text-light}"
  issue-type-glyph:
    backgroundColor: "{colors.rule-light}"
    textColor: "{colors.text-secondary-light}"
    rounded: "{rounded.badge}"
    size: "16px"
  timer-bar:
    backgroundColor: "{colors.panel-sunk-light}"
    textColor: "{colors.text-secondary-light}"
    padding: "6px 16px"
---

# Design System: Ossicone

## Overview

**Creative North Star: "The Workbench"**

Ossicone is a tool used for hours by one developer and the agents around them, so it behaves like a bench: surfaces are flat, ruled with 1px hairlines, and quiet, and a single warm signal colour marks what is yours, in progress, or primary. Nothing floats. There are no gradients and no resting shadows; depth is a step in tone (page, then panel) plus a rule.

Two themes share one structure. Dark (the default, set by a `.dark` class on the root) is warm graphite with amber as the signal. Light is warm paper and ink with brass as the signal. Neither is blue, and neither has a decorative second hue; green, red, yellow and orange exist only as status meaning.

The app's historical Tailwind class names were deliberately reinterpreted instead of renamed, so the whole codebase re-skinned through `frontend/src/index.css`: `blue` is the signal scale (brass in light, amber in dark), `gray` is warm paper/graphite and inverts in dark, `slate` is the always-dark warm graphite family, and `purple` and `indigo` read as warm neutrals. Write new work with these tokens as they are; do not reach for a literal hue name to mean its own colour.

**Key Characteristics:**
- One signal colour per theme, used for the active tab, the primary button, the running timer dot, the mark's knobs, focus rings and links.
- Hairline-ruled flat panels at 8px radius; lists divided by 1px rules, not cards inside cards.
- Geist throughout with tabular figures on the body; monospace only for issue keys and the timer.
- Monochrome line icons (lucide, 1.5 stroke) and monochrome issue-type glyphs; only a bug carries red.
- Dense and calm: 14px body, 44px touch rows.

## Colors

Warm graphite and warm paper neutrals with one amber/brass signal; status colours are small and functional.

### Primary
- **Amber Signal** (dark: `{colors.signal-dark}`): primary fills, active-tab rule, running-timer dot, mark knobs, foreground links. Hover fill `{colors.signal-dark-hover}`; text-on-dark accents step up to `{colors.signal-dark-text}`. Text on an amber fill is the near-black `{colors.signal-on-fill-dark}`, never white.
- **Brass Signal** (light: `{colors.signal-light}`): the same roles on paper. Hover `{colors.signal-light-hover}`; focus ring `{colors.signal-light-focus}`; tints from `{colors.signal-light-wash}` (blue-50) to blue-300 `#e1b565`. Text on a brass fill is white.

### Neutral
- **Graphite Page** (`{colors.page-dark}`): dark page ground (gray-50 in dark). **Graphite Panel** (`{colors.panel-dark}`): every `bg-white` surface is remapped to this in dark. **Raised Graphite** (`{colors.panel-raised-dark}`) is for sunk or secondary fills and chart tooltips. **Graphite Rule** (`{colors.rule-dark}`) is the 1px hairline; `{colors.rule-strong-dark}` is the stronger border for buttons and inputs.
- **Off-white Ink** (`{colors.text-dark}`): primary text in dark; `{colors.text-secondary-dark}` for secondary; `{colors.text-muted-dark}` for hints and metadata.
- **Warm Paper** (`{colors.page-light}`): light page ground; panels are white (`{colors.panel-light}`); sunk fills `{colors.panel-sunk-light}`; rules `{colors.rule-light}` with `{colors.rule-strong-light}` for controls.
- **Graphite Ink** (`{colors.text-light}`): primary text in light; `{colors.text-secondary-light}` secondary; `{colors.text-muted-light}` muted.

### Status (functional only)
- Dark foregrounds are opaque and lifted for legibility: red `{colors.alert-dark}`, green `{colors.success-dark}`, yellow `{colors.caution-dark}`. Their tinted backgrounds are the same hue at 10%, 16% and 28% alpha (the 50, 100 and 200 steps). The signal and the neutral decorative scales use the same alpha steps (amber 224 164 58; warm neutral 155 152 143).

### Named Rules
**The One Signal Rule.** One amber (dark) or brass (light) accent marks what is yours, in progress, or primary. Status hues report state; they never decorate.
**The Reinterpreted Scale Rule.** Class names keep their historical meaning in code and take their palette meaning from `index.css`. A new surface uses `blue` for the signal, `gray` for neutrals, and never hard-codes a hex that a scale step already holds.
**The Opaque Foreground Rule.** In dark, text and icon colours come from the opaque foreground override layer, not from the translucent tint steps. Tints are for backgrounds only.
**The Dark Text On Amber Rule.** Fills in the signal colour carry `{colors.signal-on-fill-dark}` text in dark.

## Typography

**Display / Body Font:** Geist, variable 100 to 900, self-hosted from `/fonts` (latin and latin-ext woff2, `font-display: swap`), falling back to the system UI stack.
**Label/Mono Font:** the system monospace stack, only for issue keys (`PROJ-12`) and the running timer.

**Character:** A neutral, precise grotesque in a small, even ramp. Figures are tabular (`font-variant-numeric: tabular-nums` on `body`) so counts, times and keys align down a ruled list.

### Hierarchy
- **Title** (600, 1.5rem, 2rem, tracking -0.025em): the page title, one per page (Today).
- **Headline** (600, 1rem, 1.5rem): panel and section headings.
- **Body** (400 and 500, 0.875rem, 1.25rem): list rows, controls, nav tabs, the working size of the app.
- **Label** (500, 0.75rem, 1rem): metadata, hints, counts, priority text. Sentence case, no uppercase, no added tracking.
- **Mono** (0.75rem; 1rem semibold for the timer): issue keys in muted text; the elapsed time at base size.

### Named Rules
**The Mono Is For Keys Rule.** Monospace appears only on issue keys, project key chips and the timer.
**The Ramp Is Short Rule.** Five sizes carry the app: 12, 14, 16, 24 (plus 18 and 20 for dialogs). Do not invent display sizes.

## Layout

Two-level navigation: a workspace bar (mark, Today, Projects, Agents, search, create, bell, theme, avatar) and, inside a project, a second strip (project key chip, name, Board, Backlog, Issues, Insights, Docs, Settings), with an optional third row of sub-tabs for Insights and Docs. Each bar is a bottom-ruled 1px strip with 24px side padding (12px on phones). Page content sits in a centred column (`max-w-5xl` on Today) with 24px vertical stack between panels; the board uses the full width. Lists use rows at least 44px tall on touch (40px on tabs at md and up), 16px inner side padding, divided by 1px rules. On narrow screens the workspace tabs drop to their own full-width row, search collapses to an icon that opens a dialog, and row metadata (priority, project) is hidden below sm and md respectively. Spacing is the default Tailwind 4px step; rows use 16/8, panels 16, gaps 12 to 24.

## Elevation & Depth

Flat by default. Depth is tonal and ruled: page, then panel (white in light, `{colors.panel-dark}` in dark), each edged by a 1px hairline. Menus (user menu) are the same panel with a stronger rule, not a shadow. Scrims are translucent black (50 to 75%). Drag state is communicated by opacity and scale, not shadow. Focus is a 2px ring in the signal colour with a 2px offset (offset colour matches the panel in dark).

### Named Rules
**The Flat Panel Rule.** No gradients and no resting shadows. A surface is separated by tone and a 1px rule.

## Shapes

Eight-pixel radius is the panel and button shape (`rounded-lg`); controls inside rows use 6px; inputs and buttons are 8px. Chips, counts and avatars are fully round. Issue-type glyphs are 16px squares at 3px radius. The project key is a bordered 4px chip. Borders are always 1px. The mark is two round-capped stalks topped by two circles: ink stalks, signal knobs.

## Components

### Buttons
- **Shape:** 8px radius, 8px by 16px padding, 14px medium text, focus ring in the signal colour with offset, 50% opacity when disabled, colour transition only.
- **Primary (`btn-primary`):** brass fill with white text in light; amber fill with `{colors.signal-on-fill-dark}` text in dark. Hover steps one stop darker.
- **Secondary (`btn-secondary`):** panel fill, 1px strong rule, secondary text; hover to the page tone.
- **Ghost (`btn-ghost`):** no fill, muted text; hover to the sunk tone and primary text.
- **Toolbar icon buttons:** 44px minimum on touch, 6px radius, hover to the sunk tone.

### Panels (`card`, sections)
- 8px radius (the `card` class is 12px), panel fill, 1px rule, no shadow. A section is a heading block (16px semibold title, 14px muted one-line purpose, bottom rule) over a ruled list.

### Inputs / Fields
- 8px radius, 1px strong rule, 12px by 8px padding, 14px text, muted placeholder; focus shifts the border to the signal and adds a 1px signal ring; disabled uses the page tone and muted text.

### Navigation
- Text tabs, 14px medium, 40px tall (44px touch), 12px side padding. Inactive muted text on a transparent 2px bottom border; hover to primary text; active has primary text and a 2px signal underline plus `aria-current="page"`. Tabs scroll horizontally if they overflow.

### Active Timer Bar
- A full-width status strip above the header on the sunk tone: a pulsing 8px signal dot while running (muted dot when paused), the elapsed time in semibold monospace, the issue key in muted text, a bordered "Stop" button with a filled square icon, and a close icon button.

### Issue Type Glyph
- A 16px, 3px-radius square holding a 10px filled glyph: bookmark for story, check for task, lightning for epic, all neutral (gray-200 fill, gray-700 mark). The bug is a dot on a red fill with white mark, the only coloured type.

### Kanban Board
- Columns are 8px-radius, 1px-ruled, 16px-padded containers with a semibold title and a round count chip; To do uses the page tone, In progress the signal wash with a signal rule, Code review and Done the sunk tone. Cards are draggable 8px-radius panel surfaces with 1px rule and 12px padding; dragging drops opacity to 50% and scales to 95%; optimistic moves get a signal ring and wash. Every card also has a Move-to menu for touch.

### Charts
- Chart.js options are themed from `chartTheme.ts`: text `{colors.text-secondary-dark}` / `{colors.text-secondary-light}`, muted ticks, grid and border at the neutral tint (dark: 155 152 143 at 16% and 28%; light: ink at 8% and 15%), and tooltips on `{colors.panel-raised-dark}` in dark and graphite ink `{colors.text-light}` with paper text in light.

## Do's and Don'ts

### Do:
- **Do** express new surfaces with `gray` neutrals, `blue` for the one signal, and the existing remaps; both themes must be checked.
- **Do** separate with a 1px rule and a tone step; keep panels at 8px radius.
- **Do** keep monospace to issue keys and the timer, and keep figures tabular.
- **Do** keep icons monochrome line (lucide at 1.5 stroke) and issue-type glyphs neutral, with red for bug only.
- **Do** give any signal-filled control dark text in dark theme and a 44px touch target.
- **Do** theme any new chart through `applyChartTheme`.

### Don't:
- **Don't** add gradients or resting shadows.
- **Don't** add a second accent hue or use green, red, yellow or orange as decoration.
- **Don't** colour issue types or give each one a coloured square.
- **Don't** use emoji or glyph characters as icons.
- **Don't** use a pale-blue sidebar-app layout; navigation is the two ruled tab bars.
