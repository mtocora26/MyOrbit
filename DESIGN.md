---
name: MyOrbit
description: La carrera como una red de rutas. Cada categoría es una línea de color, cada entrega una estación, "ahora" el marcador que avanza.
colors:
  paper: "#eef1f6"
  card: "#ffffff"
  wash: "#e6eaf1"
  line: "#d7dde8"
  line-strong: "#b4bdce"
  ink: "#121a2b"
  ink-2: "#465066"
  ink-3: "#5c667b"
  night: "#0e1626"
  navy: "#1d3461"
  coral: "#ff6b4a"
  coral-ink: "#c23a1d"
  coral-wash: "#ffe9e3"
  blue: "#2e90fa"
  blue-ink: "#1262b3"
  blue-wash: "#e1f0ff"
  green: "#12b76a"
  green-ink: "#067647"
  green-wash: "#dcf5e8"
  amber: "#f79009"
  amber-ink: "#a8470a"
  amber-wash: "#fff0d1"
  violet: "#7a5af8"
  violet-ink: "#5a3de0"
  violet-wash: "#ece8ff"
  danger: "#b42318"
  danger-line: "#f1948a"
  danger-wash: "#fde8e6"
  paper-dark: "#0a111f"
  card-dark: "#111a2d"
  wash-dark: "#18233a"
  line-dark: "#243250"
  line-strong-dark: "#3a4a6c"
  ink-dark: "#e9edf6"
  ink-2-dark: "#aab4c8"
  ink-3-dark: "#8c98b0"
  coral-dark: "#ff7a5c"
  coral-ink-dark: "#ff9f88"
typography:
  display:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.375
  label:
    fontFamily: "Barlow, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1
  route-code:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.025em"
rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px"
  button-primary:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.night}"
    rounded: "{rounded.md}"
    padding: "12px 20px"
  button-strong:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  button-quiet:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  fab:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.night}"
    rounded: "{rounded.full}"
    size: "56px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px"
  route-badge:
    backgroundColor: "{colors.coral-wash}"
    textColor: "{colors.coral-ink}"
    typography: "{typography.route-code}"
    rounded: "{rounded.sm}"
    padding: "4px 6px"
  bottom-sheet:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 20px 32px"
  bottom-nav:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-3}"
    height: "56px"
---

# Design System: MyOrbit

## Overview

**Creative North Star: "La red de rutas"**

The student's term is a transit network. Each subject or category is a coloured line, each deadline a station, and "ahora" a marker moving along the line. The system is a signage voice on a cool navy-tinged ground: flat panels split by hairlines, condensed tabular numerals for times, square route badges, dots on a 3px line. It refuses the stack of same-size white rounded cards with coloured icon tiles and a gradient hero.

Density is phone-first and one-handed: 44px touch targets, 13-16px working text, bottom navigation with a raised central add. Both a light ground (cool pale) and a dark ground (deep navy) ship; the same semantic token names carry both.

State is carried by shape as well as colour: a filled station is done, a hollow one is pending, a dashed ring or dashed line is overdue; priority is read by the count of three rising bars.

**Key Characteristics:**
- Flat panels with 1px hairlines; no shadows, no gradients, no icon tiles.
- Coral is the principal line and the only action colour; blue, green, violet, amber are route colours.
- Barlow Condensed for headings, times and route codes; Barlow for everything else.
- Light and dark themes via semantic tokens; dark follows the system or `data-theme`.
- Shape redundancy for every status.

**Build vs. contract (recorded deviations).**
- The dark ground ships as `#0a111f` (paper-dark), not the contract's `#0E1626`. The contract value survives as `night` (`#0e1626` in light theme, `#060b15` in dark), used as the text colour on coral and as the scrim.
- Home uses a vertical station rail (stations stacked down a 3px line, dashed when overdue) rather than the contract's horizontal Day Line, an adaptation for one-handed phone scrolling. The "Ahora" marker heads the rail with a pulse.
- Agenda, Grades and Radar render pre-existing mock data; their values are not part of the system.
- Magenta, named in the contract as a route colour, exists only in the user-pickable category palette (`#EE46BC`), not as a theme token.

## Colors

A cool pale or deep navy ground with one hot coral line, and four route hues each in three tiers (solid, ink, wash). Tokens swap per theme; components use only semantic names.

### Primary
- **Coral Line** (`coral`, #ff6b4a light, #ff7a5c dark): the principal line. Primary buttons, FAB, active-tab bar, focus ring, selected checkbox/toggle, "ahora" marker, selection highlight, caret.
- **Coral Ink** (`coral-ink`, #c23a1d light, #ff9f88 dark): coral as text (links, section actions, active nav icon, "Ahora"); the AA-safe tier.
- **Coral Wash** (`coral-wash`): tinted fill behind coral route badges.

### Secondary (route colours)
- **Blue Route** (`blue` #2e90fa), **Green Route** (`green` #12b76a), **Violet Route** (`violet` #7a5af8), **Amber Route** (`amber` #f79009): category lines and statuses. Each has `-ink` for text and `-wash` for badge fills. Priority uses coral (alta), amber (media), green (baja).
- **Danger** (`danger` #b42318, `danger-line`, `danger-wash`): overdue and destructive; always paired with a dashed shape or the word "Vencida".

### Neutral
- **Paper** (`paper` #eef1f6 / #0a111f): screen ground.
- **Card** (`card` #ffffff / #111a2d): panels, nav, sheets, inputs.
- **Wash** (`wash` #e6eaf1 / #18233a): quiet buttons, skeletons, progress tracks, pressed state.
- **Line / Line Strong** (`line` #d7dde8, `line-strong` #b4bdce; dark #243250, #3a4a6c): hairlines and control outlines.
- **Ink, Ink-2, Ink-3** (#121a2b, #465066, #5c667b; dark #e9edf6, #aab4c8, #8c98b0): primary, secondary, tertiary text.
- **Night** (`night` #0e1626 / #060b15) and **Navy** (`navy` #1d3461 / #2a4a86): dark text on coral, scrim, and the brand navy.
- **Strong** (`strong`, equals ink; `on-strong`): inverted button/badge pair.

Dark-theme values for the remaining tokens are in `src/index.css`; the frontmatter lists only the dark values that differ in kind (ground, text, line, coral).

### Named Rules
**The One Line Rule.** Coral is the only action colour. Route colours mark category and status, never buttons.
**The Ink Tier Rule.** Coloured text uses the `-ink` tier, coloured fills use the solid or `-wash` tier; never solid route hues for small text.

## Typography

**Display Font:** Barlow Condensed (500/600/700; fallback Barlow, system-ui)
**Body Font:** Barlow (400/500/600/700; fallback system-ui, sans-serif)

**Character:** Station-signage condensed headings over a friendly humanist body. Times and counts use condensed tabular figures (`.num`), like a departures board.

### Hierarchy
- **Display** (600, 26px, 1, tracking-tight): screen titles in ScreenHeader. Larger hero figures (32-56px) are condensed numerals on Home and Grades.
- **Headline** (600, 20-24px, 1): section titles, sheet titles, empty-state titles (22px).
- **Title** (600, 15-17px, ~1.25): row titles and button text.
- **Body** (400, 14px, 1.375): descriptions; inputs are 16px (forced on phones to stop iOS zoom).
- **Label** (600, 13px): meta, category names, nav labels. 13px is the floor.
- **Route Code** (Barlow Condensed 600, 13px, uppercase, +0.025em): the square badge text.

### Named Rules
**The Departure Board Rule.** Times, dates and counts use condensed tabular numerals (`.num`).
**The Thirteen Floor Rule.** No text under 13px.

## Layout

Hybrid app: one design, two shells.

- **Below 1024px (phone, small tablet):** single column inside an app shell: header, scrolling body, bottom nav (content max 760px). Horizontal padding 16px; panel padding 16px; row gaps 8-12px; section titles 8px above their content. Safe-area inset is respected under the nav.
- **1024px and up (desktop):** the bottom nav is replaced by a 232px left sidebar (logo, "Añadir", the five destinations as a vertical list with a coral tick on the active one, theme toggle, profile). Content sits in a column up to 1180px with 32px side padding and 44px display titles. Home becomes two columns (stations 1.6fr, habits plus academic summary 1fr). Tasks, Agenda and Habits stay a single readable column (max 760px) so rails never break across columns; Universidad lays subjects in two columns. Sub-screens (detail, profile, admin, radar) cap at 820px, left-aligned with the sidebar content edge. The quick-add sheet becomes a centred 480px dialog that fades and scales from 0.96 instead of sliding up.
- Touch targets are at least 44px on both shells (checkboxes and icon buttons use negative margins to enlarge the hit area without moving the visual).
- Home reads top to bottom: greeting and theme toggle, progress, "Ahora" marker and vertical station rail, habits line, academic summary.

**Theme switching.** Light and dark are user-switchable from the sidebar (desktop), the Home header (phone) and Perfil, all bound to one global store (`useTheme`). The choice persists in `localStorage` (`myorbit.theme`); with no stored choice the app follows the system setting. `theme-color` meta follows the active theme.

## Elevation & Depth

Flat. Depth comes from tonal layering (paper, card, wash) and 1px hairlines; there are no box shadows or gradients anywhere in the source. The only layering effects are the bottom sheet over a `night/60` scrim and the FAB's 4px card-coloured ring that cuts it out of the nav.

### Named Rules
**The Hairline Rule.** Separate with a 1px `line` border, never a shadow.

## Shapes

Small, near-square radii like signage: 2px for progress bars and category chips, 4px for route badges and toggle knob, 6px (`rounded-md`) as the default for panels, inputs and buttons, 8px for the sheet's top corners. Circles are reserved for stations (checkbox, markers), the FAB, and the sheet handle. Status stations: hollow circle = pending, filled coral with check = done, dashed ring/line = overdue. Priority is three bars of rising height.

## Components

### Buttons
- **Shape:** 6px radius, 44px minimum height on touch controls.
- **Primary:** coral fill, `night` text, 12px 20px padding (empty-state action, FAB, add).
- **Strong / Quiet:** ink fill with inverted text for confirm; wash fill with ink-2 text for cancel/secondary.
- **Press:** every button and `role=button` scales to 0.97 on press (160ms, ease-out); FAB 0.95.
- **Focus:** global 2px coral outline, 2px offset.

### Cards / Containers
6px radius, 1px `line` border, `card` fill, 16px padding, no shadow. Clickable cards are keyboard-operable and press to 0.985.

### Inputs / Fields
`card` fill, 1px `line` border, 6px radius, 12px padding, 16px text; focus shifts the border to coral. Category picker pairs a select with a 44px "+" and an 8-swatch colour radiogroup of 3px-radius squares.

### Navigation
Bottom bar on `card` with a top hairline: Hoy, Tareas, [add], Agenda, Uni, Más. Inactive icons and labels `ink-3`, active label `ink` with coral-ink icon and a 3px coral bar sliding in from the centre (300ms). Central add is a 56px coral circle raised 20px with a 4px card-coloured ring. Icons are 22px stroke SVG at 1.9 weight.

### Route Badge
Square-cornered (4px) code in Barlow Condensed uppercase, wash fill plus ink text of the same hue (`Vencida` uses danger). Category badge is a 10px square of the line colour plus the name.

### Bottom Sheet
Card fill, 8px top corners, top hairline, 40x4 handle, 24px condensed title. Enters 320ms with the drawer curve, exits 200ms ease-out; scrim fades 200ms. Escape and scrim tap close.

### Empty State
A dashed 3px line with one hollow coral station, a condensed 22px title, optional 28ch sub-line and primary action. No emoji.

### Motion
Ease-out `cubic-bezier(0.23, 1, 0.32, 1)` for responses, drawer `cubic-bezier(0.32, 0.72, 0, 1)` for sheets, in-out `cubic-bezier(0.77, 0, 0.175, 1)`. List entrances (`orbit-rise`: 6px rise and fade, 320ms, 45ms stagger per index); "ahora" pulse 2.2s; progress width 500ms, ring 600ms. Nothing scales from 0. Reduced motion collapses all durations to 0.01ms.

## Do's and Don'ts

### Do:
- **Do** use semantic tokens (`bg-card`, `text-ink-2`, `border-line`) so both themes work.
- **Do** carry status by shape (hollow, filled, dashed; bar count) as well as colour.
- **Do** keep touch targets at 44px and text at 13px or above.
- **Do** separate with hairlines and tonal steps; keep exits faster than entrances.
- **Do** use condensed tabular numerals for times, dates and counts.

### Don't:
- **Don't** add box shadows or gradients.
- **Don't** use coloured icon tiles or stacks of identical rounded white cards.
- **Don't** use emoji or decorative glyphs for state or empty views.
- **Don't** use solid route hues for small text; use the `-ink` tier.
- **Don't** hardcode hex in components except the user-chosen category colours.
