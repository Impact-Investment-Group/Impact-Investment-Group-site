# Wave 1293: complete data-service credits

Status: complete, 14 November 2026. Website source `d4c6b40547adb32d020a1057b6d6d259f363e305` passed the complete Pages and CodeQL workflows, was published, and passed exact served-file comparison plus focused live review. Earlier failed attempts remain documented below.

The homepage's "Powered by authoritative UK data" section now uses the same single-row continuous carousel as the local-authority strip. It contains 42 evidenced service and publisher credits instead of five. Plates are 224 x 112 CSS pixels on phones and 256 x 128 on larger screens. The original heading and source link remain.

The inventory includes direct APIs, bulk-file publishers and upstream dataset contributors. It does not claim that every publisher is a separate live API connection. Google Places/Street View, PlanIt and RQIA are excluded because current readiness or acquired-data evidence was not established. Ordnance Survey is credited for the evidenced open datasets, independently of its optional paid API. Infrastructure and AI-model providers are outside this data-credit section.

Eleven entries use existing or officially sourced artwork; the remaining 31 use readable publisher names. This is not a claim that 42 official logos have been acquired. `scripts/fixtures/data-service-inventory.json` records the source evidence and presentation for every entry. `WAVE1293_LOGO_SOURCES.json` records new artwork provenance and colour adaptations. The reused Zoopla website wordmark is used instead of a plain-text SVG candidate.

Visible pause controls have been removed from both logo carousels. Mouse hover stops movement. Keyboard focus or touch enters a single, natively scrollable row with decorative duplicates hidden. Leaving focus restores the moving lane and clears its native scroll offset. In normal motion mode the moving, unfocused lane uses `overflow: clip`, so it cannot retain competing native keyboard scrolling. Reduced-motion and no-JavaScript visitors get the same accessible static row. Offscreen and hidden-tab suspension remain in the existing motion hook. The change does not affect demand-map motion controls.

The source disclaimer now reads: "Data used under licence. These publishers do not endorse this platform." The OpenStreetMap contributor and ODbL credits remain. Provider descriptions are available in the accessible list and the tile title.

The existing Tailwind framework, bone-white colours, larger council-logo treatment, heading and simple strip layout remain. This wave adds no provider directory, filters or extra panel below either carousel. It does not change the platform's data connections, backend, keys, model providers, pricing or hosting. Buddy's simultaneous rebuild is recorded separately under wave 1294.

## Source and copy record

The provider evidence inventory was reviewed on 14 November 2026 against platform source `bfe11969f` and the public demand-provenance endpoint. It records direct service implementations and published source metadata rather than inferring readiness from configuration names. Three demand datasets retain provenance-pending status; this wave invents no replacement provenance or figures.

All added publisher names and concise dataset descriptions are recorded exactly in `scripts/fixtures/data-service-inventory.json` and rendered from `src/content/trust.ts`. That inventory lives under `scripts/` so the existing sparse CI checkout includes the evidence used by its assertions. The heading remains "Powered by authoritative UK data". The only other changed public copy is the licence disclaimer quoted above. No API availability, endorsement or partnership claim is added.

The initial implementation is included in combined website commit `ac6347fcd33b448a8bc24a34c64a810d7de98d9c`. The carousel correction is included in `8fa5116ac706889d5a00404f705efdbd590b96ec`; this commit also contains the separately scoped Buddy follow-up.

## Verification and first CI correction

- `scripts/site-authorities.py` retains the complete 382-council asset, ordering, size, motion, wrap and far-end reachability checks. It replaces removed button assertions with hover/focus/touch reading checks and checks scroll-offset reset when motion resumes.
- The same CI script now verifies all 42 provider credits against the evidence inventory, large consistent plates, accessible names/descriptions, artwork decoding (including later entries), mobile and desktop movement, reduced-motion and no-JavaScript reachability, source attribution, and no visible control buttons.
- `scripts/wave909-experience.py` checks the expanded carousel and original homepage layout during its existing responsive page journeys.
- No local tests, builds, audits or screenshot runner were executed. Final CI, screenshot review and publication verification are recorded below.

The first [Pages run, 43533444374](https://github.com/Impact-Investment-Group/Impact-Investment-Group-site/actions/runs/43533444374), tested `ac6347fcd33b448a8bc24a34c64a810d7de98d9c`. Its carousel gate reported three real failures: the council desktop journey and both moving data-source journeys retained horizontal scroll offsets after focus left the lane. The log shows the offset increasing after the attempted reset, ending at 34 or 35 pixels. The static reduced-motion and no-JavaScript journeys passed in that attempt.

The diagnosis was a native keyboard-scroll animation continuing inside `overflow: hidden`, which still establishes a scroll container. The blur handler's simple `scrollLeft = 0` write could then be overwritten. The correction scopes `overflow: clip` to hydrated, unfocused, focusable carousels when the visitor has not requested reduced motion. Focused reading, reduced motion and no-JavaScript modes retain native scrolling. The blur handler also requests an explicit instant reset for engines without clipping support.

The exact-zero scroll assertion remains and is repeated after the resumed-animation sample to catch a later drift. No timeout, tolerance, performance ceiling or existing catalogue coverage was relaxed. The replacement run tested `8fa5116ac706889d5a00404f705efdbd590b96ec`, with the observed results below.

First-run evidence: `05-Artifacts/buddy-quality-2026-11-14/ci-Impact-Investment-Group-site-ac6347fcd-43533444374/build_22_Check the complete local authority carousel.txt` in the project artifact folder.

## Observed replacement results

[Pages run 43535517460](https://github.com/Impact-Investment-Group/Impact-Investment-Group-site/actions/runs/43535517460) completed with a failed build job and skipped deployment. Its complete carousel gate passed: 12 recorded checks, comprising built catalogue/artwork validation, moving desktop and phone journeys, focus/hover/touch reading, and reduced-motion/no-JavaScript reachability. The earlier scroll-reset failures no longer occur on this exact source.

The same run passed the static build, Firefox/WebKit scrolling, pricing and lightweight-motion checks, 64 page checks, 47 interactive journeys, partner ecosystem checks, 34 recorded Buddy checks, six single-actor placement journeys and four renderer-proof sets. These results do not make the overall run green. Its later rendered-contrast step failed at the homepage Resident label and the Legal page registered-office Copy label. [CodeQL run 43535515312](https://github.com/Impact-Investment-Group/Impact-Investment-Group-site/actions/runs/43535515312) passed all three analysis jobs on the same commit.

The contrast log reported 3.37:1 for the Resident label and 1.57:1 for Copy, against the existing 4.5:1 floor. The exact contrast-stage screenshots were written outside the uploaded artifact directory and are unavailable in that artifact. Independent same-head UI captures do show a genuine obstruction: the resting corner Buddy covers the Resident label in `buddy/home-original-layout-1280.png` and the registered-office Copy button in `legal-1280.png`. These images support a Buddy placement correction, not a claim that the text colours themselves changed. The later combined source resolved that obstruction and passed the final gate recorded below; the contrast threshold was not lowered.

Downloaded evidence is under `05-Artifacts/buddy-quality-2026-11-14/website-experience-8fa5116ac/`; raw run/job records and logs are under `ci-Impact-Investment-Group-site-8fa5116ac-43535517460/`. Artifact `14090256513` is the exact-head website experience archive.

## Carousel screenshot review

The following CI images were opened and inspected:

- `authorities/carousel-1280.png` and `carousel-390.png`: the council strip remains one slim row with larger marks and no added controls or directory underneath.
- `authorities/data-moving-1280.png` and `data-moving-390.png`: the data heading remains centred, large equal-size plates preserve logo proportions, the lane edges show the expected carousel cutoff, and the attribution remains below.
- `authorities/data-no-js-1280.png`, `data-no-js-390.png` and `data-reduced-motion-320.png`: the final publisher can be reached, long publisher names wrap within their plates, the focused row is outlined and no duplicate second lane is shown.

This visual review covers those screenshots, not an assertion that every logo was separately visually approved. The CI gate additionally checked every artwork file and decoded each image credit as it reached the visible lane. The evidence inventory continues to distinguish the 11 artwork entries from the 31 publisher-name entries.

## Final acceptance and publication

This Medium public-presentation change is complete. The inventory, source provenance, shared carousel and relevant assertions were reviewed. The first native-scroll finding was fixed in product code; later combined release attempts fixed Buddy corner clearance and its menu automation journey. No timeout, tolerance, catalogue coverage or performance ceiling was relaxed.

Final source `d4c6b40547adb32d020a1057b6d6d259f363e305` passed [Pages 43594000546](https://github.com/Impact-Investment-Group/Impact-Investment-Group-site/actions/runs/43594000546), including deployment, and [CodeQL 43594000566](https://github.com/Impact-Investment-Group/Impact-Investment-Group-site/actions/runs/43594000566), all three analysis jobs. Its complete carousel gate passed all 12 checks. The full run also passed 64 page checks, 47 interactions, 34 Buddy checks, six placement journeys plus two corner regressions, four artwork proof sets and every rendered-contrast assertion across 32 shots. All 289 incomplete contrast nodes were measured, with none unmeasured. The complete Buddy and failed-attempt chronology is in `WAVE1294_REPORT.md` and Context CI-Runs.

Final experience artifact `14114023024` is retained at `05-Artifacts/buddy-quality-2026-11-14/website-experience-d4c6b4054/`. The final desktop/phone council and data strips, reduced-motion/no-JavaScript far-end credits, and relevant surrounding page images were opened and reviewed. They preserve the simple row, larger proportionate marks, readable name plates and licence attribution. No pause button or additional directory appears. The catalogue continues to contain 382 councils and 42 evidenced data-service/publisher credits, with 11 artwork entries and 31 readable name plates.

At 12:33:34 UTC, all 25 selected hosted files matched exact Pages artifact `14113958466` byte for byte: root HTML, six critical JavaScript files, two CSS files, all 11 data logos, four Buddy assets and the authority catalogue. The verifier required a successful exact-head deployment, checked the archive digest, and requested cache-busted public URLs. Evidence: `05-Artifacts/buddy-quality-2026-11-14/served-website-d4c6b4054-43594000546/report.json`.

A fresh native Chrome view of the public homepage then confirmed the large data-source carousel and, after real wheel scrolling, the original simple council strip. Both had no visible pause button. The observation is recorded in `live-website-verification.json` in the same artifact folder; responsive/static/far-end reachability is proved separately by CI. No AI question or business form was submitted.

MANUAL (Callum): no key, data operation, infrastructure or policy action is required for this wave.

MANUAL (Cowork): no production data operation is required. CI, image review, exact publication and focused live verification are complete. The existing GitHub Pages workflow remains the hosting and publication route.
