# PROMPT: Restyle Pramaan to a warm orange, black and grey minimalist design

Paste this whole file into Antigravity as a **new message** in the existing Pramaan project. Attach the four reference screenshots (the orange and black dashboard shots) to the same message.

---

## 0. What this task is

The app already works. **Change only the visual design.** Do not change routes, data, API calls, business logic, permissions, seed data or test expectations. If a test breaks only because of a class name or markup change, update the test, not the behaviour.

This message **replaces the colour direction** in `PROMPT_ANTIGRAVITY.md` Section 7 (the single indigo accent and "no funky colours" rule). Everything else in that section still applies: minimalist, calm, uncluttered, one topic per page, light and dark themes, WCAG AA contrast, keyboard access, `prefers-reduced-motion`. `SECURITY.md` and `CODE_QUALITY.md` remain binding (design tokens only, no hard-coded hex in components, both themes checked, conventional commits).

**Originality rule.** The attached screenshots are **inspiration for the visual language only**. Do not copy their exact layouts, text, artwork, product name ("Ranker") or numbers. Build original components in Pramaan's own context.

---

## 1. The visual language to reproduce (read the screenshots closely)

Describe it to yourself as: **"warm black, soft grey, white floating cards, one burnt-orange gradient, big confident numerals."**

1. **Surfaces.** Light theme: a soft warm grey canvas with clean white cards that look like they float (large radius, very soft diffuse shadow). Dark theme: near-black warm canvas with slightly lighter charcoal cards. In both themes there is one **dark feature card** (near-black) that holds a gauge, as in the "Content Score" and "Organic overlap" cards.
2. **One accent gradient.** Orange to peach, used for: gauge arcs, chart bars, the sheen on the primary button, small chips, and decorative glows. It is never used as a large flat background and never for long text.
3. **Big numerals.** Statistics are shown very large and bold with a small superscript-style unit (for example `38` with a small `%`), a tiny label underneath, and optionally a small delta chip with an arrow.
4. **Gauge.** A semicircle or three-quarter circular arc in the orange gradient over a faint track, a dotted outer ring, the number centred, a small caption below. Lives on the dark feature card.
5. **Bar charts.** Rounded vertical bars filled with a vertical orange gradient that **fades toward the base** (peach to near transparent). Calm, no gridline clutter.
6. **Pill controls.** Tab rows inside a rounded container; the **active tab is a solid pill** (black with white text in light theme; off-white with dark text in dark theme). Filter dropdowns, date-range buttons and search fields are also fully rounded pills.
7. **Primary button.** Solid black pill with white text, with a subtle orange gradient sheen or edge (dark theme: orange gradient fill with dark text). Secondary buttons are outlined pills. One primary button per view.
8. **Progress pill.** A single lime-green pill with a percentage (as in "77%") for progress. Use the lime accent **only** for progress and success, sparingly.
9. **Atmosphere.** Behind hero and feature areas: a large soft **black-and-orange glow ellipse** and a few **staggered horizontal gradient bars**, purely decorative. Floating cards at a slight 3D tilt appear **only in the Home hero**.
10. **Typography.** Clean modern grotesque sans (Inter or Geist; keep Inter if already loaded). Headlines are large, bold, tight tracking, high contrast (white on dark, near-black on light). Body is muted. Numerals use tabular figures.
11. **Density.** Generous whitespace, few elements per view, no borders where a soft surface difference will do.

---

## 2. Design tokens (replace the existing token file; components must use tokens only)

Define all of these as CSS variables in one place (for example `src/styles/tokens.css`) and map them in Tailwind. Remove the old indigo tokens.

| Token | Light | Dark |
|---|---|---|
| `--bg` canvas | `#EFEDEA` | `#0D0C0B` |
| `--surface` card | `#FFFFFF` | `#171513` |
| `--surface-2` inset | `#F6F4F1` | `#1F1C19` |
| `--surface-dark` feature card (both themes) | `#14110F` | `#1B1815` |
| `--border` | `#E3DFDA` | `#2B2723` |
| `--text` | `#14110F` | `#F4F1EC` |
| `--text-muted` | `#6B645C` | `#A39B91` |
| `--orange-300` peach | `#FFC9A3` | `#FFC9A3` |
| `--orange-500` | `#FF8A4C` | `#FF8A4C` |
| `--orange-600` | `#F26B2A` | `#FF7A3D` |
| `--orange-text` (orange used as **text** or thin icon on the page background) | `#B84A12` | `#FF9A62` |
| `--on-orange` (text on orange fills) | `#14110F` | `#14110F` |
| `--grad-accent` | `linear-gradient(135deg,#FFB27F 0%,#FF8A4C 45%,#F26B2A 100%)` | same |
| `--grad-bar` (bars fade) | `linear-gradient(180deg,#FF8A4C 0%,rgba(255,201,163,.25) 100%)` | `linear-gradient(180deg,#FF8A4C 0%,rgba(255,138,76,.12) 100%)` |
| `--lime` progress/success fill | `#B9E04B` | `#B9E04B` |
| `--on-lime` | `#14110F` | `#14110F` |
| `--success-text` | `#1F7A3D` | `#6EDB8F` |
| `--danger` (errors, destructive only) | `#C2321F` | `#FF8F80` |
| `--glow` ellipse | radial orange to transparent at 55% opacity | radial orange to transparent at 45% opacity |

**Contrast rules (mandatory).** Orange fills always carry **dark text** (`--on-orange`). Never put white text on orange. Never use `--orange-500` or `--orange-600` as small text on the light canvas; use `--orange-text`. Verify every text/background pair reaches **4.5:1** (3:1 for large text and UI icons) in both themes and fix any that fail.

Radius: cards 20 px, inputs/buttons/chips/tabs fully rounded (999 px), inner blocks 12 px. Shadows (light theme only): `0 10px 30px rgba(20,17,15,.08)` for floating cards; none in dark theme (use border and surface contrast instead).

---

## 3. New reusable components (build in `components/ui/`, typed, themed, documented with a short TSDoc)

1. **`StatCard`**: `label`, `value` (string or number), optional `unit` (rendered small, raised), optional `delta` (arrow chip), optional `hint`, optional `children` (for a mini chart). White surface card.
2. **`GaugeCard`**: dark feature card with an SVG arc in `--grad-accent`, dotted outer ring, centred value, caption. Props: `value`, `max`, `label`, `caption`. Accessible: `role="img"` plus `aria-label="<label>: <value> of <max>"`, and the number is also real text.
3. **`BarChart`**: rounded bars using `--grad-bar`, small muted labels, hover/focus tooltip, and a visually hidden data table as the accessible alternative. Props: `data: {label, value}[]`.
4. **`PillTabs`**: tab row in a rounded container; active pill as described; arrow-key navigation; `role="tablist"`.
5. **`Chip`**: variants `neutral`, `accent` (orange tint), `success` (lime), `outline`, `dark`; optional leading dot or icon.
6. **`ProgressPill`**: lime pill with a percentage and a thin track.
7. **`PillSelect` and `SearchPill`**: rounded filter dropdown and search input for tables.
8. **`GlowBackdrop`**: absolutely positioned, `aria-hidden`, `pointer-events: none`, `z-index` below content; renders the black-and-orange ellipse using `radial-gradient` (**not** a large CSS `filter: blur`, for performance) plus 3 to 5 staggered rounded gradient bars. Static: no animation.
9. **`FloatingCards`**: for the Home hero only; two or three overlapping cards with a gentle CSS 3D tilt (`transform: perspective(900px) rotateX(..) rotateY(..) rotateZ(..)`), disabled (flat) on small screens and when `prefers-reduced-motion` is set.

Rebuild existing buttons, inputs, cards, sidebar items, badges and tables on top of these tokens and primitives so the whole app feels consistent.

---

## 4. Page-by-page redesign (keep one topic per page; do not add content, only re-present it)

**Global shell.** Slimmer sidebar on warm surface: logo mark as a small orange-gradient rounded square, group labels in small caps muted, nav items as rounded rows; the **active item is a pill** (dark theme: orange tint with `--orange-text`; light theme: black pill with white text). Top bar: left "Demo data is fictional" chip; right Confidential status chip, role selector as a **PillSelect**, theme toggle. Keep the sidebar collapsible and the mobile drawer.

**Home (`/`).** Hero on `--bg` with `GlowBackdrop`. Left: eyebrow chip ("CodeNexus India 2026 · Round 2 Solo Build"), large bold headline, muted core-promise line, primary button "Try a sample review" and outlined "Open Brand Hub". Right (desktop only): `FloatingCards` showing three real figures **computed from the app's own seed data** (for example number of brand kits, active rules, sample drafts). If a number is not computed from real data, label the card "Sample". Below: the three commitments as three quiet `StatCard`-style cards with line icons.

**New review (`/app/new`).** A single centred card on the canvas. Purpose Card fields in two columns on desktop. Pill selects for brand kit and content type. Primary pill button "Run review"; "Use sample" as a text button.

**Review and findings (`/app/review/:id`).** Top row of three cards: `StatCard` "Findings" (count), `StatCard` "Blockers" (count), and a dark `GaugeCard` "Evidence coverage" (computed: share of findings that carry a valid rule or fact ID; this should read 100%). Under it a `ProgressPill` showing workflow progress through the content states. Then `PillTabs`: **Findings | Suggestions | History | Sources**. Finding cards are white surface cards: severity chip, category, status, highlighted excerpt (warm orange tint highlight, plus underline so colour is not the only cue), and "Why flagged" and "Source" as collapsed sections. Diff view uses `+`/`-` markers with soft tints.

**Review queue (`/app/queue`).** Header with title, `SearchPill`, `PillSelect` filters (status, severity) and a black primary "New review" button. Table in a white card with rounded rows, status chips and an assignee column; stacked cards on mobile.

**Brand Hub (`/app/hub`).** `PillTabs` (Rules, Facts, Glossary, Claims). A row of small `StatCard`s (counts of active rules, facts, expired facts). Entries as clean rows with monospace ID chips.

**Audit and disclosure (`/app/audit`).** Two sections via `PillTabs` (Audit log, AI disclosure ledger). Confidential Mode shown as a clear chip and a calm explanatory sentence.

**Insights (`/app/insights`).** One dark `GaugeCard` for rule clarity (computed from the seeded events), one `BarChart` of top repeated violations, and a short "unclear rules" list. Keep the visible label "Simulated data" on every chart that uses simulated events.

**Plan pages (`/plan/*`).** Quieter than the app pages: the same canvas, content in a centred column (max 880 px), page title as a large bold headline. Use `StatCard` big numerals for the evidence statistics (for example the percentages in the Evidence page) **with their source and caveat kept directly under each number**. Personas, modules and risks as clean cards; the permission matrix as a table card; workflow as a vertical stepper with small orange step markers. Use `GlowBackdrop` only on the first screen of a page, at low intensity.

**404 and error pages.** Minimal, centred, one button.

---

## 5. Rules that protect honesty and quality

1. **No fabricated numbers.** Every numeral is computed from the real data, taken from the plan text with its source, or explicitly labelled "Sample" or "Simulated". Never copy numbers from the reference screenshots.
2. **Decoration never carries meaning.** Glows, bars and tilted cards are `aria-hidden` and carry no information.
3. **Colour is never the only signal.** Severity and status also use text and icons.
4. **Performance.** No heavy blur filters on large areas, no images for backgrounds, no animation loops. Keep the Lighthouse performance and accessibility scores at 90+ on Home and Review pages if possible.
5. **Both themes designed, not inverted.** Check every page in light and dark at 375 px, 768 px and 1280 px widths.
6. **Do not break the product:** the core loop (choose kit, purpose card, run review, decide, approve, certificate, audit) must still work end to end after the restyle. Run the Playwright smoke test and `axe`.
7. **No emoji, no stock illustrations, no neon.** Orange appears as a gradient accent only.

---

## 6. How to work

1. **Plan first (short):** list the primitives to build and the order. Then start.
2. Order: tokens and theme → primitives (`StatCard`, `GaugeCard`, `BarChart`, `PillTabs`, `Chip`, `ProgressPill`, `PillSelect`, `SearchPill`, `GlowBackdrop`, `FloatingCards`) → shell and sidebar → Home → Review page → Queue → New review → Hub → Audit → Insights → Plan pages → polish.
3. After each step: run `eslint`, `prettier`, `tsc --noEmit`, `vitest`, and open the page in the browser in both themes. Take a screenshot of each finished page and check it against the screenshots for feel (not for copying).
4. Commit small and often (`refactor(ui): ...`, `feat(ui): ...`). Do not commit secrets or build output.
5. When done: update `docs/FEATURES_COMPLETED.md` only if something changed, add a short "Design system" section to `docs/ARCHITECTURE.md` (tokens, primitives, accessibility notes), and confirm no hard-coded hex values remain in components.

### Definition of done
Home, Review and Insights clearly echo the reference style (warm black or soft grey canvas, floating white cards, dark gauge card with an orange arc, big numerals, orange fading bars, pill tabs and a black pill primary button), in **both** themes, with AA contrast, a working core loop, green CI, and no invented statistics.
