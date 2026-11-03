# Wave 909: readable, interactive marketing pages

Israel requested a modest design improvement across every website page, making the site easier to follow and more modern and interactive. This builds on the daylight imagery from wave 907.

## Changes
- Shared light technical introductions, quieter card depth, readable line lengths, and a reading-progress accent.
- Real section links with scroll tracking on long information and partner pages; the links also work without JavaScript.
- Home photograph controls, visible statistic sources, integer count animations and accessible focus after changing the mission panel.
- Clearer About, Problem, Solution and Services layouts, keyboard story tabs and an enlarged platform preview.
- Searchable partner discovery; all partner detail pages share readable role cards, keyboard journey tabs and an enlarged network diagram.
- Clearer contact enquiry choices, field labels and validation, character count and success focus.
- Registration stage progress, selected-option affordances, password-match feedback and accessible consent cards.
- Legal page document cards, company-field structure and section links; legal wording is unchanged.

## Boundaries
No photographic, portrait, brand or diagram asset files changed. Factual content, figures, legal text, external destinations and submission endpoints are preserved. Search counts describe existing rendered roles, not invented business activity. No real enquiry or account is submitted by verification.

## Validation
Project notice `NOTICE_2026-11-03_all-testing-on-github-actions.md` requires verification in GitHub Actions. No local test, build, audit or screenshot gate was run. The Pages workflow now builds, checks every page at phone and desktop widths, checks keyboard and form interactions, and saves screenshots before deploying. Results and live verification will be recorded after the run.

The first CI run (41653936127, source f3d9ac4) passed all accessibility checks and every interaction except section navigation. It caught a slash mismatch in the new navigation: prerender and a direct trailing-slash request chose different markup. Route lookup now normalizes the slash. The standalone 404 also lacked a main landmark, now added.

The inherited contact hydration error came from query-specific crawls overwriting the same static contact file. Prerender now excludes query variants, and contact applies a deep-linked enquiry only after canonical HTML hydration. Direct-query checks cover this repair. The next CI run must prove all fixes before publication.

Screenshot review found the mobile account button overlaid password guidance. It now follows the completed account fields in normal document flow; the one-question survey retains its useful sticky controls. The Services capture now requests an image source sized for its full-width display. Browser checks cover account-field overlap and normal desktop motion as well as reduced motion.

The second run (41654981233, source d794abf) passed all 58 regular page checks and all 16 interaction checks, including contact deep links with no hydration errors. Only the standalone static 404 still failed its main-landmark check: updating React's 404 did not update the separate postbuild HTML. Both versions now match. The final run includes that correction and the screenshot-review improvements above.

The third build (41656037505, source 768d649) passed the complete browser gate. The final workflow also runs the repository's existing wave 412 rendered-pixel gate: it measures contrast where axe cannot resolve photographs or translucent backgrounds, verifies light surfaces, and checks first-screen content does not disappear during hydration. Its output is preserved with the browser evidence.

Reading the saved log from 41656968206 caught a CI propagation error: piping through `tee` hid the colour script's nonzero exit. Explicit `pipefail` now makes the script authoritative. No measured contrast pair failed, but 11 samples were unresolved: clipped horizontal mobile section links and two small tab numerals. Mobile section navigation now uses a native disclosure with real links, Escape/outside-close and heading focus; the numerals are larger and heavier. The same strict gate is rerun without exclusions or reduced thresholds.

Run 41659417245 passed all 60 page checks and the responsive interactions. Its desktop-motion assertion used a raw selector that now found both the hidden phone link and the visible desktop link. It now selects the accessible visible link and still requires the expected active section after scrolling. The independent colour gate runs even if the browser gate fails, so one run reports both results; either failure still blocks deployment.

The static hydration repair also needs to reapply a query-provided role after mount because form default values only initialize once. That prefill is now preserved and explicitly checked. Browser verification blocks every POST request, including cross-origin public enquiry endpoints; no real form submission is part of this design pass.
