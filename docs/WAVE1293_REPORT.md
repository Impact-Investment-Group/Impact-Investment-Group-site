# Wave 1293: complete data-service credits

Status: implementation prepared; CI and publication evidence pending.

The homepage's "Powered by authoritative UK data" section now uses the same single-row continuous carousel as the local-authority strip. It contains 42 evidenced service and publisher credits instead of five. Plates are 224 x 112 CSS pixels on phones and 256 x 128 on larger screens. The original heading and source link remain.

The inventory includes direct APIs, bulk-file publishers and upstream dataset contributors. It does not claim that every publisher is a separate live API connection. Google Places/Street View, PlanIt and RQIA are excluded because current readiness or acquired-data evidence was not established. Ordnance Survey is credited for the evidenced open datasets, independently of its optional paid API. Infrastructure and AI-model providers are outside this data-credit section.

Eleven entries use existing or officially sourced artwork; the remaining 31 use readable publisher names. This is not a claim that 42 official logos have been acquired. `scripts/fixtures/data-service-inventory.json` records the source evidence and presentation for every entry. `WAVE1293_LOGO_SOURCES.json` records new artwork provenance and colour adaptations. The reused Zoopla website wordmark is used instead of a plain-text SVG candidate.

Visible pause controls have been removed from both logo carousels. Mouse hover stops movement. Keyboard focus or touch enters a single, natively scrollable row with decorative duplicates hidden. Leaving focus restores the moving lane and clears its native scroll offset. Reduced-motion and no-JavaScript visitors get the same accessible static row. Offscreen and hidden-tab suspension remain in the existing motion hook. The change does not affect demand-map motion controls.

The source disclaimer now reads: "Data used under licence. These publishers do not endorse this platform." The OpenStreetMap contributor and ODbL credits remain. Provider descriptions are available in the accessible list and the tile title.

## Verification prepared

- `scripts/site-authorities.py` retains the complete 382-council asset, ordering, size, motion, wrap and far-end reachability checks. It replaces removed button assertions with hover/focus/touch reading checks and checks scroll-offset reset when motion resumes.
- The same CI script now verifies all 42 provider credits against the evidence inventory, large consistent plates, accessible names/descriptions, artwork decoding (including later entries), mobile and desktop movement, reduced-motion and no-JavaScript reachability, source attribution, and no visible control buttons.
- `scripts/wave909-experience.py` checks the expanded carousel and original homepage layout during its existing responsive page journeys.
- No local tests, builds, audits or screenshot runner were executed. CI must pass and screenshots must be reviewed before this report can describe the change as verified or published.

## Publication evidence

Pending the root operator's source commit, GitHub Actions results, screenshot review and exact deployed artifact verification.
