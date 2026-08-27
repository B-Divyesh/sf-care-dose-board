# Dose Witness visual thesis

## Direction: the night-watch medicine board

Dose Witness borrows the useful parts of night-market neon signage: one glance should reveal what is open, complete, or needs attention. The visual world is a dark ink-blue evening, paper schedule slips, enamel sign edges, and restrained pools of cyan, lime, amber, and coral light. This is not nightlife decoration; it is a household handoff board that stays legible during an early-morning or late-night care shift.

The generated hero shows an abstract bedside dose board under a small neon canopy. It explains the product’s core promise—many caregivers orienting around one visible record—without depicting a real patient, suggesting clinical authority, or showing medication brands.

## Tokens

The product is intentionally single-mode. A consistently dark, explicitly painted background reduces glare at night and lets status colors behave like illuminated signs. Every status also has a word and icon; color is never the only signal.

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Background | `--ink-950` | `#071319` | App canvas |
| Raised background | `--ink-900` | `#0D2028` | Navigation and panels |
| Surface | `--ink-800` | `#15313B` | Dose slips and dialogs |
| Paper | `--paper` | `#F5F0DE` | High-emphasis schedule cards |
| Primary text | `--text` | `#F8F5E9` | Text on dark surfaces |
| Muted text | `--muted` | `#B7CAD0` | Secondary copy (7.8:1 on background) |
| Ink text | `--paper-ink` | `#10242B` | Text on paper |
| Action | `--cyan` | `#45E6E1` | Primary actions and focus |
| Given | `--lime` | `#B9F56A` | Recorded-as-given |
| Uncertain | `--amber` | `#FFC65A` | Needs confirmation |
| Skipped/danger | `--coral` | `#FF7A6B` | Skipped and destructive actions |
| Outline | `--line` | `#31515B` | Boundaries |

Status fills use very dark tinted surfaces with the light color reserved for text, icons, and outlines, preserving at least 4.5:1 contrast. The cyan focus ring is three pixels wide with a dark offset.

## Type

- Display and labels: **Arial Narrow**, `Aptos Narrow`, `Roboto Condensed`, system sans-serif. Tall condensed capitals echo hand-painted market boards while remaining locally available and payload-free.
- Body and controls: **Atkinson Hyperlegible**, `Segoe UI`, system sans-serif. The installed system fallback is deliberate: no font download, excellent glyph distinction, and reliable offline rendering.
- Scale: 14px metadata, 16px secondary, 18px body/control, 22px section, fluid 32–48px display. Body text is never below 16px. Times and numeric history use tabular figures.

## Spacing and shape

Spacing follows a 4px base with primary intervals of 8, 12, 16, 24, 32, and 48px. Touch targets are at least 48px. Dose slips use clipped corners rather than generic rounded rectangles; the cut edge evokes a paper ticket pinned to a community board. Corner radius is restrained (4–12px), with a 999px radius reserved for compact status lozenges only.

On phones, decoration and secondary summaries disappear before controls shrink. Navigation becomes a bottom dock inside the safe area. The dose action row stacks only below 420px, remaining comfortably tappable at 390px.

## Interaction grammar

- “Record dose” opens a sheet from the dose slip’s location. The selected status is a three-way segmented choice with a word and symbol.
- Recording flips the slip from paper to a dark, status-tinted witnessed record and announces the change in a live region.
- Potentially destructive operations identify the medication and require confirmation. Recent status changes can be revised directly from the record.
- Offline, update, saved, error, and undo feedback appear as concise signboard toasts.

## Motion

UI transitions last 180–240ms and use only opacity and transform. Dose state changes use a single 220ms “sign warming on” fade; sheets rise from the bottom on narrow screens. Nothing loops or flashes. Under `prefers-reduced-motion: reduce`, transforms and smooth scrolling are removed and changes become instant opacity swaps.

## Asset plan and provenance

- `public/art/dose-watch.webp`: original generated editorial hero, used on the first-run state only; responsive, explicit dimensions, under 300 KB.
- App icons and interface marks: original hand-authored SVG/CSS geometry, not icon-library assets.

### Prompt sheet

**Subject:** an abstract household medication handoff board with four blank paper dose tickets, a small analog clock, and three distinct glowing witness marks gathering around one central confirmed mark; no people, no readable medicine labels. **World:** intimate night kitchen or bedside corner interpreted as a quiet Southeast Asian night-market stall. **Materials:** dark painted wood, enamel sign trim, slightly fibrous cream paper, frosted colored glass. **Light:** low ambient ink-blue light with restrained cyan and lime edge glow, one amber practical lamp, gentle shadows. **Lens/composition:** isometric editorial still life, centered board, generous clean negative space, crisp silhouettes, no photographic depth blur. **Palette words:** midnight ink, oxidized teal, warm paper, electric cyan, witness lime, caution amber, muted coral. **Negative list:** no text, no letters, no numbers, no logos, no watermark, no brands, no people, no hands, no pills spilling, no syringes, no hospital room, no gradients, no glossy 3D app icons.

Generated with the factory Azure image model (`factory-image`) on 2026-08-27. The artwork is original to Dose Witness and shipped under the repository’s MIT license. Generated-imagery disclosure appears in the footer.
