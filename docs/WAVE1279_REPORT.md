# Wave 1279: Buddy play and character motion

The floating Buddy is larger and uses varied gestures, expressions, breathing rests and gentle pointer attention. A denser, longer tornado transforms the approved key, pound and heart forms. Page topic tracking and the existing single AI conversation remain intact.

Play opens an optional local stage with a bouncing ball, several dance treatments and a fast house-building scene. Generated matching bricks, hammer, house, door and dust are independently animated. The finished house has a door users can open, revealing a warm glow. Ask Buddy remains a separate action. Play never sends a model request.

Pause, minimise, Escape, focus return, reduced motion, hidden/offscreen suspension and failure recovery are included. The play module and new prop atlas are lazy-loaded. Existing Tailwind and bone-white tokens remain; original Buddy body and corrected hands are preserved. The logged-in platform receives the corresponding implementation in its own repository.

## Evidence status

Source `98ffa9ac0761cda3408bbb0db7ac415b07ddc1f0` passed [Pages run 43493993872](https://github.com/Impact-Investment-Group/Impact-Investment-Group-site/actions/runs/43493993872) and was deployed at 19:50:43 UTC on 13 November 2026. [CodeQL run 43493993902](https://github.com/Impact-Investment-Group/Impact-Investment-Group-site/actions/runs/43493993902) is green. The live homepage HTML hash, script URLs and module preloads match the deployed CI artifact, as recorded at 19:52:18 UTC.

- All 38 engine/play cases and ten motion cases passed. Coverage includes every ordered form transition, wrist continuity, bounded scene geometry, balanced canvas state and identical finished-build/closed-house/door-start frames.
- All 32 Buddy browser checks passed. The normal and reduced-motion play journeys at phone and desktop widths made zero mocked chat requests and zero mocked readiness checks. Chat responses within the broader CI journey were mocked local responses; this is not production AI-answer verification.
- The wider site gate passed 64 page/viewport checks and 47 interactions, three cross-browser checks, five motion/pricing checks, four ecosystem views and seven authority checks retaining all 382 councils. The visual gate passed 32 screenshots and measured all 286 contrast nodes requiring pixel inspection, with no unmeasured nodes.
- Homepage initial JavaScript measured 758,115 bytes against the unchanged 780,000-byte ceiling, leaving 21,885 bytes. All tests, builds and audits were executed in CI; none were run locally for this wave.

Exact CI and deployment evidence is retained in `05-Artifacts/buddy-play-2026-11-13/ci-site-98ffa9ac0/final-verification.json` and `deployment-verification.json`.

## Live website verification

The published site was inspected at desktop, tablet, phone and compact phone heights. Buddy's character frame measured 192 pixels at 1280 and 768 viewport widths, 160 pixels at width 390, and 96 pixels at 390 by 320. Phone and tablet views had no horizontal overflow. At 390 by 320, the play panel stayed between viewport positions 12 and 308 and its 441-pixel content remained reachable by scrolling.

The live building sequence, smoke reveal and opening glowing door were observed, alongside ball play and dance replay. Pause left the captured scene pixels identical. Minimise/reopen worked. Closing Play or pressing Escape returned focus to Play; Ask opened the existing ready chat composer and closing chat returned focus to Ask Buddy. No questions were sent during this check, and play produced zero POST requests to the public Buddy endpoint.

With reduced motion enabled, Build immediately displayed the finished house, the motion state was off and repeated scene captures were pixel-identical. The Services explorer displayed all three Buddy forms and the layered tornado, including page-context following. These are the recorded manual observations; the complete ordered transition matrix is covered by the automated engine tests, not claimed here as a completed manual matrix.

Changing the Services topic during an active house build showed the tornado at the play character's position and then completed the house in the care form. On the homepage, the reading context selected support at Metro's care section, investment at the financial figure, and property again at the hero. The final page was restored to the homepage with Play and chat closed; temporary viewport, cache and reduced-motion overrides were cleared.

Selected screenshots under `05-Artifacts/buddy-play-2026-11-13/` are `website-final-launcher-1280.png`, `website-final-launcher-768.png`, `website-final-launcher-390.png`, `website-final-building-1280.png`, `website-final-house-door-1280.png`, `website-final-care-form-1280.png` and `website-tornado-frame-8.png`.

Additional context evidence: `website-final-building-form-change-1280.png`, `website-final-scroll-care-1280.png`, `website-final-scroll-investment-1280.png` and `live-website-observations.json`.

Source art, exact imagegen generation and cleanup prompts, alpha/hashes and before/after screenshots are retained in the same dated artifact folder. Runtime prop provenance is stored alongside the WebP. Generated props are fictional illustrations, not actual property evidence. Platform results and native/provider boundaries remain in the platform repository's report.

## Initial JavaScript loading

The first corrected-engine Pages candidate, `7471263`, passed the engine checks but exceeded the unchanged homepage JavaScript budget: 781,800 bytes against 780,000. Its Buddy browser stage was therefore not reached.

The follow-up keeps Play-only sizing and focus coordination behind the Play action, shares identical character image-loading and action metadata, and uses a narrow rig export surface while preserving the complete engine API. The main launcher, canvas and chat focus target remain mounted through play.

Navigation and partner route metadata previously imported the full partner profiles. Their ten existing summary blocks now have one typed, lightweight source, reused by the full profiles. Header, footer, sitemap and synchronous route head metadata read that index; the ten partner page loaders fetch the complete profiles when their route is loaded or preloaded. All authored profile copy, labels, order, URLs, page titles, descriptions and resident crisis signposting are preserved. The partner hub and ecosystem continue to use the complete profiles in their existing page chunk.

This is a loading-only correction. No timing delay, budget change or test relaxation is used. The final CI build completed static route generation and the browser gates; initial homepage JavaScript fell by 23,685 bytes from the failed candidate to 758,115 bytes, below the original ceiling.
