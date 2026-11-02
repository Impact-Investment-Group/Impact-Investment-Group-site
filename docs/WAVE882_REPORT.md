# Wave 882: the website's tinted backgrounds become a bone white

Callum, 2 Nov 2026, 19:50 UK, with a swatch `#F5EEE9`: the site should stop using the warm pinkish backgrounds and use "a whiter bone white ish colour". Ruling R-OP-1102-7. Brief `Briefs/CLAUDE_CODE_wave882_site-backgrounds-bone-white.md` in the Context Library. Base `8c9d8ee` (wave 838). Built on machine 3, a shared two-CPU cloud box.

## What shipped

| Token | Was | Now | Job |
|---|---|---|---|
| `--bg-tint` | `#FEF8F5` | `#F9F9F4` | the band: `bg-page-alt`, `bg-mist-bg`, `--muted`, `--sidebar`, `panel-deep`, `.section-light` |
| `--bg-cream` | `#F8F0EC` | `#F2F2EC` | the cream card: `bg-cream-card` |

Why these two: both sit in the page's own family (`--bg-canvas` `#FDFDFB`): red equal to green, blue a little below, so there is no pink and the cast is a faint warm bone, not grey. The band is whiter than the swatch and still a visible hard edge against the page (relative luminance about 0.944 against the page's 0.981, a gap a little wider than the old band's). The card is one step deeper (about 0.884, the same luminance as the old card), so every ink that passed on the old card passes on the new one by the same margin and the card still separates from the band. Two hexes rather than one, because one hex for both would leave the About page's `bg-cream-card` tiles invisible on the band.

`--bg-canvas`, every orange, teal and navy value, `--brand-primary-soft` and `--dv-track` are unchanged.

- `src/styles.css`: the two values, with a comment naming R-OP-1102-7.
- `scripts/wave443-contrast.mjs`: the parity pin takes the two new values, its comment says the two beds are now the site's own (no longer the platform's, by the same ruling as 881); `fef8f5`, `f8f0ec` and their `rgb()` forms join the retired list.
- `CLAUDE.md` section 2: the two hexes in the token blocks, the band and cream card columns of the light-grounds table, the band and cream card figures in the hard accessibility rules table and the one teal-on-tint figure for the cream card, each re-read off this wave's script output. Nothing else.

No component edited, no user-facing string added or changed, no hex in a component.

## Contrast, `node scripts/wave443-contrast.mjs`

62 pairs, `failures: []`, `sourceHits: []`; with `--build dist/client` after the build, `buildHits: []`, failures `[]`. The rows for the two beds as printed:

| Foreground | Band `#F9F9F4` | Cream card `#F2F2EC` | Floor |
|---|---|---|---|
| ink `#14366A` | 11.26 | 10.58 | 4.5 |
| ink-muted `#4E5A6E` | 6.60 | 6.21 | 4.5 |
| orange-700 `#BB441B` | 5.03 | 4.72 | 4.5 |
| teal-600 `#267977` | 4.87 | 4.58 | 4.5 |
| destructive `#C92A2A` | 5.17 | 4.86 | 4.5 |
| orange-500 `#E15E31` | 3.40 | 3.20 | 3 |
| teal-500 `#258D8A` | 3.78 | 3.56 | 3 |
| teal-600 on the 12% teal tint | 4.18 | 3.92 | 3 |
| teal-600 on the 18% teal hover | 3.85 | 3.63 | 3 |
| orange-600 on the 12% orange tint | 3.78 | 3.58 | 3 |
| orange-600 on the 18% orange hover | 3.53 | 3.34 | 3 |
| ink-soft `#647289` (info) | 4.61 | 4.34 | none |
| teal-400 `#70CECC` (info) | 1.75 | 1.64 | none |
| orange-600 `#CC4A22` (info) | 4.35 | 4.09 | none |

Every asserted pair passes; ink-soft stays off the cream card for body copy, as before.

## Census of every bed use

- `--bg-tint` through `--color-page-alt`: `.section-light` (16 files: the footer, the logo, the waitlist and enquiry forms, mission-solution, the partner page and hub, the director card, and the routes index, about, contact, the-problem, legal, solutions, platform), `panel-deep` (about), the register ground rule in `styles.css`, `bg-page-alt` in the header's menu hovers and active row, page-shell's empty slot, and the home page's strip in `routes/index.tsx`.
- `--bg-tint` through `--color-mist-bg`: `bg-mist-bg` cards in partner-page and partners-hub; the gradients in partner-page, solutions and about; and four `text-[var(--color-mist-bg)]` uses in the footer's crisis island, where it is TEXT on the navy plate. It now renders `#F9F9F4` on `#14366A`: 11.26:1, against 11.31:1 before; a pass far above 4.5.
- `--bg-tint` through `--muted` and `--sidebar`: the library components in `src/components/ui/` (avatar, drawer, dropdown-menu, menubar, select, sidebar, sonner, table, tabs, toggle); `--muted-foreground` on it is the same `#4e5a6e` row as ink-muted above.
- `--bg-cream` through `--color-cream-card`: the four `bg-cream-card` surfaces in `about/director-card.tsx` and one in `routes/about.tsx`.
- `--brand-primary-soft` and `--dv-track`: declared in `:root`, used by nothing in `src` (the only other mention is the script's parity pin). Neither paints a background a visitor sees, so both are left as the brief's default says.

## Gate, measured on this tree

- `bunx tsc --noEmit -p .`: rc 0.
- `bun run lint`: rc 1, 403 problems (388 errors, 15 warnings), all inherited; neither touched lintable file (`scripts/wave443-contrast.mjs`) is in the offender list; `src/styles.css` and `CLAUDE.md` are not linted.
- `STATIC_BUILD=true BASE_PATH=/ bun run build` under `flock /tmp/iip-tests.lock`: rc 0, the prerender ran to the end. The first attempt waited 30 minutes for the box's test lock behind the platform builders and was stopped by its background time limit before it got the lock; it built nothing. The second got the lock and is the build every figure here was taken from.
- `python3 scripts/wave412-screenshots.py` under the lock, run twice on the same build:
  - run 1: 28 shots, 1 failure. 274 INCOMPLETE nodes, 273 measured, all 273 `ok`; 1 unmeasured, 1 off screen.
  - run 2: 28 shots, 1 failure, the same one. 274 INCOMPLETE nodes, 273 measured, all 273 `ok`.
  - The one failure in both: `platform @ 1280`, the "03" disc (`.hover:bg-page ... "03"`) could not be measured off the shot. It sits on `bg-page`, which this wave did not move, and it is the same node waves 777 and 838 name as red on their own bases. Not this wave's.
  - Every page in both runs: axe 0 serious colour-contrast violations, islands at most 1, no horizontal overflow, body and header light; the two reveal probes static with minimum opacity 1.000.
  - Home 1280: raw 22.62% both runs, ground 8.64% and 8.65%, 20 of 20 measured. Home 390: raw 16.35% and 16.34%, ground 7.69% and 7.68%, 18 measured plus 1 off screen. About 1280: raw 4.08%, ground 2.67%, 25 of 25. About 390: raw 5.86%, ground 3.14%, 25 of 25. Same in both runs.
  - Pixels read off the shots confirm the new grounds: text on `rgb(249, 249, 244)` throughout the partner pages' hero bands.
- Shots committed: `docs/screenshots/wave412/home-1280.png`, `home-390.png`, `about-1280.png`, `about-390.png` from run 2. The gate has no separate footer shot; it shoots whole pages, so the footer is the foot of each of those four. The other 24 shots are left at the base's.

## NOT RUN

- A clean 28-shot run: not achieved; the one failure is the inherited unmeasurable node above, on both runs.

## What the brief got wrong

- It says to commit "the footer" shots as the gate writes them; the gate writes no footer shot. The footer is inside the home and about full-page shots.
- The site `CLAUDE.md` token block and line 88 also carried band and cream-card values; they were false after the change, so they moved with the table rows.

## Open

- None for Callum. If he wants one hex for both, the alternative is `#F9F9F4` for both, with the About page's cream-card tiles then needing a rule or shadow to separate from the band.
