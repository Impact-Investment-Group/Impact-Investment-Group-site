# Wave 907: brighter, more realistic website photography

Israel requested the golden-hour and dark photography across the marketing website be replaced with lighter, more realistic imagery. He explicitly confirmed that real team headshots must remain unchanged.

## Result

- Replaced all nine photographic source assets used across the 17 public main and partner pages audited, including the street scene's two sizes. Eight distinct scenes were edited with the built-in image tool.
- Updated 29 existing responsive variants and added three appropriate 1440px variants. All 41 delivered image files decode correctly. Source dimensions, layout, page copy and controls are unchanged.
- Neutral daylight, natural skin tones, readable shadows and more credible detail replace the amber grading. The original blueprint transitions remain. Floating digital glow was removed from the two professional photographs.
- Team portraits, brand assets, diagrams and AI characters retain their original Git blobs: 144 protected files verified. Binary raster files are byte-identical; SVG comparisons account for checkout line endings.
- The site's Imagery guidance now records Israel's daylight direction.

## Verification

Asset commit: `970e802874d07f65023da23bf83b4f3228d42f80`. Frozen tree: `1207c35b828dbff437d37d2052d5d2a27d2f811f`.

- `bun install --frozen-lockfile`: passed, no dependency changes.
- `STATIC_BUILD=true BASE_PATH=/ bun run build`: passed.
- `node scripts/pages-postbuild.mjs dist/client`: passed.
- `python scripts/wave414-responsive-images.py --check`: passed; all referenced images have their responsive variants and transparency is preserved.
- `python scripts/wave412-screenshots.py`: passed all assertions across 28 screenshots at 1280px and 390px. No colour-contrast violations; all 274 incomplete contrast nodes measured; none unmeasured. Maximum raw dark-pixel share 19.97% on the homepage, below its existing ceiling; maximum page-ground dark share 8.58%.
- Additional browser coverage: 17 pages at both widths, 34 page checks. All nine photo sources seen, no broken images and no horizontal overflow. Selected screenshots visually inspected; image framing and readable foreground text retained.

Evidence: `docs/wave907/verification.json`, `docs/wave907/visual-gate.log`, `docs/wave907/prompts.json`, and `docs/screenshots/wave907/`. The local dated artifact package also holds original images, generated PNG masters, initial findings and a before/after review.

## Findings and limits

- The contact page emitted React hydration error 418 at both widths. The same error was reproduced on the unchanged live site before deployment. Contact source is untouched; this is an inherited finding, not a successful whole-site JavaScript health claim.
- The initial protected-file check falsely flagged seven SVGs because Git blobs use LF and the Windows checkout uses CRLF. The corrected check uses Git's path-aware normalization. No protected asset was edited.
- The initial wave 906 claim collided with another session's platform tutorial wave during a context fetch. This site task was re-registered as wave 907; existing work and the original claim commit were preserved.
- The primary site and Context Library checkouts contain unrelated edits and were left intact. This work used isolated worktrees. A transient GitHub authentication error succeeded on retry.
- Retired photographs and mock-up files with no active site use were not replaced. Logos, diagrams, screenshots, AI characters and team headshots are outside the photographic refresh.

No user-facing string added or changed. No infrastructure, secrets, production data or form actions changed. Deployment verification is recorded in the Context Library and the local deployment evidence after the source push.
