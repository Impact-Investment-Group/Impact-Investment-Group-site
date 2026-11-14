# Wave 1294: clearer Buddy artwork, authored movement and one website character

Status: complete, 14 November 2026. Website source `d4c6b40547adb32d020a1057b6d6d259f363e305` passed its complete gates and was published; exact served-file comparison and focused live behavior are verified. The platform shares the verified renderer and is live on train `00427c721168`, with its wider release owned by the other chair.

## Request and implementation boundary

The owner asked for substantially better image and animation quality on both the website and platform, a review of existing animation tools, removal of Peter, Petra and Pippa from the website, and one website Buddy who moves from the floating corner into a relevant page illustration and back while scrolling. Earlier requirements still apply: the supplied v2-refined design, key/pound/heart forms, automatic idle activity, one conversation, no ball scene and no animation playback menu.

The rebuild changes frontend artwork, choreography and website placement. It preserves the existing AI connection and permissions. It adds no backend route, provider, model, key, infrastructure, native release, pricing content or new Academy curriculum. The platform's existing Buddy mounts, including Academy, adopt the shared renderer; the persistent character travelling between page destinations is the website implementation.

The data-provider carousel is the separately scoped wave 1293 and has its own source inventory, provenance record and report.

## Existing tools considered

Official documentation was reviewed on 14 November 2026:

| Option | What it supplies | Decision for this implementation |
| --- | --- | --- |
| [Rive Web runtime](https://rive.app/docs/runtimes/web/web-js) | A JavaScript/WASM runtime that renders authored Rive content and supports interactive control. | A good dedicated authoring route, but the supplied library does not include an authored Buddy `.riv` project. Installing its player would not itself create the required character artwork. No Rive runtime or Rive asset is claimed here. |
| [Motion animate](https://motion.dev/docs/animate) | Easing and spring animation for elements and values, including browser-accelerated animation where supported. | Useful for interpolation, but it does not supply Buddy's artwork. The existing browser controller and small native placement follower cover the required travel without another runtime dependency. |
| [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html) | Loading of an authored glTF scene, including geometry and supported material/animation data. | Genuine modelled geometry remains a future authoring option. This wave does not have an authored Buddy glTF rig; adding a loader alone would not produce one, and its runtime would need separate budget evidence. |

The selected implementation is a native Canvas2D character rig with vector paths and projected shell depth, plus browser animation-frame travel. The supplied `iig-animation-library-2026-11-10/v2-refined` library remains the design reference and failure-fallback source. This is a deliberately bounded implementation decision, not a claim that native canvas is universally superior to a dedicated authoring tool.

## Artwork and movement

`buddy-art.js` draws coherent key, pound-sign and heart bodies from vector paths. All forms use the same navy, orange and teal materials, cuff treatment, palm and fingers. The new normal rendering path no longer loads the old body atlas or detached hand sheet. The wrist, cuff, palm and fingers are drawn as connected geometry rather than independently positioned hand PNGs.

The shell has front, side and back surfaces. Projected depth keeps the profile substantial during turns; the face is drawn only on the front. The curved surface orientation was corrected after the first CI artwork contact sheets exposed inconsistent side surfaces. The controller keeps the same body and pose state across changes rather than swapping screenshots.

Pose blending, pointer attention, facial expression, varied idle choices, natural rests and continuous animation timing remain part of the rig. Idle selection avoids immediately repeating recent gestures and varies their treatment. Existing automatic scenes include construction, dance, peek, stretch and house polishing. The viewer does not need to select or play an animation.

House construction remains an authored scene: Buddy approaches the work, uses a held hammer, progresses through masonry and fixtures, adds the roof and windows, reveals the completed house with dust and opens the glowing door. Hammer orientation follows the projected wrist during turns. These props are an existing illustrated scene asset and procedural assembly; the wave does not claim a fully vector or physically simulated environment.

The tornado starts with Buddy's own rotation, accelerates through real front/profile/back views, conceals the change of form and decelerates into the destination form. The continuous rotation envelope avoids resetting the angular phase midway through the effect. Interrupted topic changes reuse the visible pose and position. Final timing and visual acceptance belong to the frozen source and CI captures, not to an arbitrary claimed number of generated image frames.

The renderer sizes its backing canvas from the untransformed layout dimensions. Moving the same actor into the small chat avatar therefore does not permanently reduce its drawing resolution when it returns to the page or floating corner.

## One persistent website actor

The root layout mounts `BuddyLauncher`, which mounts one `BuddyActor` before the lazy conversation branch. Only this actor renders `BuddyCharacter`. Page illustrations, the floating corner and the chat avatar are destinations declared by `BuddySlot`; they do not create another character or another canvas.

The coordinator measures destination geometry in viewport coordinates and follows the selected destination from Buddy's current displayed position. Chat takes priority. Otherwise a sufficiently visible illustration near the reading area takes priority over the floating corner. Hysteresis prevents small scroll movements from making Buddy oscillate between neighbouring destinations. Scrolling past an illustration returns the same actor to the corner. Client-side navigation preserves the mounted canvas and its animation state.

Page slots show a neutral Home, PoundSterling or Heart service icon while unoccupied. The active slot's icon is hidden when Buddy occupies it. Repeated small cards, such as the About process row, use ordinary service icons, avoiding repeated mascot illustrations or multiple blank character spaces.

The chat header receives the same actor in its small avatar destination. The page/corner overlay button is removed while Buddy occupies the chat header, so it cannot cover the composer. Closing chat restores the previous page or corner destination without losing the draft or conversation. Existing readiness, cancel, retry, clear, notice disclosure, keyboard access and focus restoration remain owned by the chat component.

Minimising Buddy hides the actor globally, including when a page illustration is visible; the small Show Buddy control restores it. Other modal dialogs suspend the same mounted actor and animation clock. This includes both Radix dialogs that hide the background and the custom Site menu, which declares `aria-modal` without setting page `inert`. Closing the modal restores the actor without creating another canvas. Visual viewport resize/scroll and hidden-tab changes trigger placement updates or suspend work appropriately.

Reduced-motion visitors receive a still character and direct placement changes. The static source image is rendered only if the dynamic renderer fails, while the canvas is hidden, so the fallback is not a simultaneous second Buddy.

The floating character keeps its larger preferred size where there is room, with a compact short-screen variant. The website now measures visible text ranges and interactive controls around the right corner, choosing the largest locally clear size and position. Wider ambient scenes run only when their complete canvas footprint is clear. If a crowded viewport has no clear candidate, the smallest local position with least overlap is used. This is adaptive placement, not a promise that arbitrary future page content can never overlap. The explicit Resident-label and registered-office Copy regressions remain part of the final rendered gate.

## Website route and retired-character coverage

All public UI routes share the root actor. This source review covered the route definitions and character placements below; it is not a substitute for the final responsive rendered journeys.

| Routes | Character treatment |
| --- | --- |
| `/` | Floating Buddy and shared chat only. The home hero does not gain a separate mascot. |
| `/about` | The care/support illustration is a destination for the root actor; small repeated process illustrations use service icons. |
| `/contact` | Contact illustration is a destination for the root actor. |
| `/platform` | The existing Buddy services showcase provides one topic-aware page destination; its selected form and the root actor agree. |
| `/solutions` | Both former trio illustrations are replaced with destinations: property/key in the hero and investment/pound in the product section. The original surrounding layout and copy remain. |
| `/the-problem` | The contextual section illustrations are destinations for the same actor. |
| `/partners` | The partner-hub illustration uses the same actor. Partner-selection dialogs suspend it while modal. |
| `/partner-with-broker`, `/partner-with-care-provider`, `/partner-with-developer`, `/partner-with-housing-association`, `/partner-with-investor`, `/partner-with-landlord`, `/partner-with-local-authority`, `/partner-with-resident`, `/partner-with-social-worker`, `/partner-with-support-provider` | Shared partner-page illustrations use contextual Buddy slots, including both existing illustration positions. |
| `/register` | The introduction illustration receives the root actor. |
| `/register/broker`, `/register/care-provider`, `/register/developer`, `/register/housing-association`, `/register/investor`, `/register/landlord`, `/register/local-authority`, `/register/resident`, `/register/social-worker`, `/register/support-provider` | Existing registration forms retain the shared floating actor and chat; no extra mascot illustration is introduced. |
| `/faqs`, `/legal`, `/pricing` and the root not-found view | Shared floating actor and chat, with no new page mascot. Pricing retains the coming-soon treatment. |

The source search excludes legitimate place names such as Peterborough from retired-persona findings. The previously missed `public/images/solution/trio.webp` artwork was visually inspected and identified as the retired trio. Both rendered uses, its responsive-image metadata and the three now-unused original/responsive files were removed in `041c43e`. The follow-up adds a CI journey for both Solutions destinations and checks that no trio image is rendered.

Historical screenshot boundary: six original platform-guide captures retain earlier assistant UI outside the displayed workspace crop. The investor, resident and care-provider crops exclude the old corner assistant; housing-association, local-authority and housing-provider crops exclude both the old hero and corner assistant. The same clipped workspace is used in the preview and enlarged screenshot dialog. The other inspected guide captures do not show the retired mascots. Thus the claim is removal from current displayed website character placements, not erasure of every old persona pixel from every original public screenshot file.

## Source and verification record

Source milestones before final combined freeze:

- `ac6347fcd`: initial combined carousel and Buddy implementation.
- `8fa5116ac`: carousel scroll correction, actor modal lifecycle and placement-test correction.
- `041c43e`: remaining Solutions trio replaced, three unused assets removed and placement coverage extended.
- `1167cb2`: custom Site menu modal suspension and return coverage.

The first website placement journey failed because clicking a showcase control on the phone scrolled its illustration out of view. Returning Buddy to the corner was correct behavior. The CI journey now deliberately re-centres the illustration before asserting the later chat-to-page return, and records geometry and a screenshot if settlement fails. The modal interception finding was a real implementation issue and was corrected in product code.

The replacement website run on `8fa5116ac` passed its Buddy, placement and artwork-proof steps, but failed the later rendered-contrast gate and skipped deployment. Same-head UI images show corner Buddy obstructing the homepage Resident label and Legal Copy control. These observations are not treated as a successful final release. The adaptive-corner correction and the final successful source are recorded below.

Focused CI coverage includes geometry selection and interrupted travel; actor identity across scrolling, client navigation and chat; draft retention; minimise/show behavior; reduced motion; modal suspension and focus restoration; both Solutions slots; and actual-renderer turn, pose, tornado and construction contact sheets. Existing cross-browser, page-interaction, performance, accessibility and chat checks remain in force. No local tests, builds, audits or screenshot runner were executed under the project's CI-only rule.

The adaptive-corner follow-up preserves the preferred responsive slot dimensions and touch-target assertions, while checking the actor against its actual selected size and position. Ambient journeys find a clear location by scrolling the unmodified homepage, then exercise the real idle controller; they do not hide page content or force a blank fixture. The workflow now preserves the contrast-stage screenshots as well as the ordinary experience images.

On website `775fcdfa`, the contrast correction passed all 32 rendered shots: the Resident label measured 10.58:1 and the registered-office Copy control 4.66:1. All 290 incomplete contrast nodes were measured, with none unmeasured. The ordinary Buddy, artwork and carousel steps also passed. The separate placement journey found that the reading position had changed after a mobile Site menu cycle. Buddy correctly resumed at the corner because its previous illustration was offscreen; that trace did not establish when or why the page moved.

Commit `58082308` retained scroll position when restoring focus on all three dismissal paths and added explicit pre/open/close scroll assertions. Those stronger checks failed immediately after opening. Commit `bc2e3ecc` also retained scroll position for opening focus and preserved exception-time geometry, focus and overflow evidence. The same opening assertion failed. These safeguards were sensible product changes but did not resolve the automation behavior.

The retained screenshots showed the sticky menu trigger already fully onscreen. The failure geometry exposed a 462-pixel displacement, matching Chromium's pre-click centring of that trigger within the root's padded scroll area. Playwright locator clicks invoke a scroll-into-view operation before sending pointer input. Commit `d4c6b405` instead checks the visible button's bounds, verifies the point with `elementFromPoint`, then sends a real viewport mouse click. The same procedure covers the Close button and exposed scrim after the drawer reaches its onscreen position. Every opening/closing scroll, actor identity and page-slot assertion remains. The journey does not recenter the page or dispatch a synthetic DOM click to hide a failure. The placement step now runs early in CI so a failed placement blocks later long checks and publication sooner.

Platform gate follow-up: the earlier push run on 801dae8b8 passed all jobs, while a later scheduled run on the identical revision failed a nightly-only Git ownership prerequisite and an unordered pager test. The web container now trusts only its own checkout path, matching the backend pattern. The pager test uses the same explicitly descending query for its expected rows and actual walk, preserving every assertion. These are CI/test fixes only; no backend product behavior was changed. The full push run on `ff60032eb7e6b2d8f6af17cc1020fc53a0f8e668`, [43588493359](https://github.com/Impact-Investment-Group/Impact-Investment-Platform/actions/runs/43588493359), passed all 35 jobs. This includes all web shards, the web build/static checks, backend shards and final gate. The nightly-only pixel harness was not run by that push and is not claimed as passed.

Verified platform publication and source parity:

- The live web version endpoint returned `2026-11-14T00:38:28.215Z.df866117ccdb` on 14 November. Native Chrome inspection showed the new vector pound form, house scene and compact animated chat header on investor home. No AI question was submitted during this observation.
- The entire `iip-frontend/iip-web` tree is byte-identical between deployed reference `df866117ccdb9c6af5d928739c01252acf587256` and green source `ff60032eb7e6b2d8f6af17cc1020fc53a0f8e668`. This includes the Buddy, chat and Academy modules. The 4,078-file tree has the same Git object ID; no newer frontend feature deployment is being inferred from a backend release.
- A later read-only check at 12:18 UTC found live web build `2026-11-14T11:38:07.273Z.00427c721168`. This is another chair's train 124 release. Its exact-head CI [43590927860](https://github.com/Impact-Investment-Group/Impact-Investment-Platform/actions/runs/43590927860) passed all 35 jobs. Buddy, chat and Academy source scopes are unchanged from `ff60032eb`; other Management/Finder files did change. The earlier whole-web-tree equality remains a dated observation, not a claim that the entire later release is unchanged. A fresh native Chrome tab subsequently confirmed the large vector pound character and the compact Buddy chat panel on this current investor home. No question was submitted or business record changed.
- All five intended shared Buddy modules are byte-identical between website `d4c6b40547adb32d020a1057b6d6d259f363e305` and platform `ff60032eb7e6b2d8f6af17cc1020fc53a0f8e668`. Raw-byte SHA-256 evidence is in `05-Artifacts/buddy-quality-2026-11-14/source-parity.json`; the live platform observation is in `live-platform-verification.json` beside it.

## Final website gate, visual review and publication

Frozen website source: `d4c6b40547adb32d020a1057b6d6d259f363e305`. [Pages run 43594000546](https://github.com/Impact-Investment-Group/Impact-Investment-Group-site/actions/runs/43594000546) passed both build and deployment. [CodeQL run 43594000566](https://github.com/Impact-Investment-Group/Impact-Investment-Group-site/actions/runs/43594000566) passed all three analysis jobs. The menu's hit-tested viewport input resolved the prior automation failure without changing any reading-position, actor identity or destination assertion.

The final Pages artifacts record:

| Coverage | Exact-source result |
| --- | --- |
| Public pages and interactive journeys | 64 page checks and 47 interactions passed |
| Floating Buddy and conversation states | 34 recorded checks passed |
| Single persistent actor | Six viewport/motion journeys plus two real-page corner-clearance regressions passed |
| Renderer artwork | Four proof sets passed: turns, poses, tornado and construction |
| Councils and data credits | 12 recorded checks passed |
| Cross-browser scrolling and motion/pricing | Three scrolling and five motion/pricing checks passed |
| Rendered contrast and light surfaces | All 32 shots passed; 289 incomplete nodes were measured, with none unmeasured |

The partner ecosystem, static build and existing other gate steps also passed. No acceptance assertion, contrast floor or performance ceiling was weakened. The placement step now runs early, with the same failure evidence and publication blocking behavior. No local tests, builds, audits or screenshot runners were executed.

Final experience artifact `14114023024` is retained at `05-Artifacts/buddy-quality-2026-11-14/website-experience-d4c6b4054/`. Reviewed images include the desktop/phone carousels, the far-end static data row, the home/legal clear-corner regressions, care on the phone Services page, the investment Solutions illustration, and all four actual-renderer artwork sheets. The rendered page destinations contain one character, with no corner duplicate. The Resident and Copy labels are clear. The three forms have connected wrists and coherent front/side/back surfaces; tornado samples show the spinning character and construction samples show progressive assembly. These sheets exercise the real renderer source as diagnostic captures, while the ordinary page journeys independently exercise the built runtime.

At 12:33:34 UTC, the read-only hosted verifier passed all 25 selected files byte for byte against exact Pages artifact `14113958466`: root HTML, six critical JavaScript chunks, two CSS files, all 11 data-logo files, four Buddy scene/fallback assets and the authority catalogue. It first required successful exact-head Pages and deployment jobs, checked the downloaded archive digest and used cache-busted public requests. Report: `05-Artifacts/buddy-quality-2026-11-14/served-website-d4c6b4054-43594000546/report.json`.

Focused live Chrome observation then confirmed the larger corner character on Services, travel into its page illustration, the care/heart form, travel into the compact chat header, return to the page on closing chat, and return to the corner after further wheel scrolling. The vacated illustration uses a neutral service icon; there was no second character at the corner. The homepage showed the larger data carousel and the original simple council strip without pause buttons. No AI question or business form was submitted. This live check is desktop and focused; responsive, reduced-motion, canvas identity and all-route proof remains in CI. Observation: `05-Artifacts/buddy-quality-2026-11-14/live-website-verification.json`.

The final Context closeout records these dated source, gate and publication facts in Live-State A/C, with the complete attempt history in CI-Runs and the implementation boundaries in Design-System. Later report-only commits do not represent a new frontend feature release.

## Limits and release wording

This is procedural vector artwork with layered projected depth. It is not an authored Rive project, a fully modelled three-dimensional character, physical lighting, cloth simulation, skeletal glTF animation, audio lip-sync or an AI model that autonomously invents new movements. Conversation and visible topic choose among authored forms and motions; they do not grant new data access.

The body and hands are resolution-independent; the browser ultimately rasterises the canvas, and existing scene props and emergency fallback images remain raster assets. Device performance, preference settings and viewport determine the visible animation cadence. No fixed movie-frame count or cinema-production quality is claimed.

Existing Tailwind styling, bone-white surfaces, page copy and model configuration remain. Native is not a new release. The evidence above distinguishes implemented source, CI, reviewed images and verified live publication. The website travel coordinator is not a claim that the platform uses that same placement lifecycle; the platform shares the artwork and animation rig through its existing mounts.
