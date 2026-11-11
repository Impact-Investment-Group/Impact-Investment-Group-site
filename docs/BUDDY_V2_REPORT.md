# Buddy v2 and Metro World Child refinement

## Scope

The rejected website redesign was reverted in `5aa2ced`. Its tree matched the
pre-change website at `8206acf`; GitHub Pages run `42987275133` deployed it
successfully. The live homepage was checked after deployment.

This replacement keeps the homepage content structure, introduces Buddy only
as a compact floating assistant, and places one larger Buddy example on Our
Services. Following the user's further instruction, the legacy character
illustrations on the other pages are replaced with Buddy's relevant forms,
while the homepage keeps Buddy outside its page content. Legacy artwork and
character names are removed from the rendered pages. Standalone legacy artwork
is removed from the publishable assets. Six existing platform captures use
workspace crops in both preview sizes to exclude old assistant banners and
launchers while preserving the authentic interface pixels.
It also improves the homepage Metro World Child section at the
user's request. The About charity section and footer keep their existing
presentation and exact pledge.

## Buddy

- Uses the supplied `iig-animation-library-2026-11-10/v2-refined` atlas and
  matching engine. The atlas SHA-256 is
  `63ccd2d7b230b116b2f44225c546f07bab811551a175c7792ad58894fadc45b2`.
- Floating character on phones and desktops, with accessible minimize and
  reopen controls. Chat loads on demand and opens without blocking the page.
- Bounded greetings and smooth pose changes, independent facial expressions,
  gentle idle movement, and the supplied Tornado change between forms.
  This is articulated 2D artwork, not a geometric or 3D morph.
- Pauses offscreen and when the document is hidden; respects reduced motion.
  Supplied v2 hero images provide an artwork-failure fallback.
- Retains strict real-AI response validation, readiness checks, transient
  history, cancellation, timeouts, retry and focus restoration.
- No homepage Buddy feature section, no automatic questions, and no scripted
  answers presented as model output.

## Design framework

Tailwind v4 remains the framework. New interfaces use existing semantic brand
tokens and shared type conventions. The relevant reference principles remain
in use: readable measures and leading, balanced headings, explicit selected
states, 44px controls, stable reserved geometry, progressive disclosure,
safe-area spacing, bounded motion and honest empty/error states. Existing
font shaping, tabular numbers and approved colours are retained. FAQ section
navigation and more readable partner menus are included.

At the user's further request, Pricing is restored to its exact previous
Coming soon page from `cffe94d`. Published packages, amounts and the fee
calculator are removed. Buddy's cost guidance now points to the team and
the coming-soon page rather than promising published prices.

Conversation copy loads with the chat. Registration questionnaires now load
with their route instead of the homepage; registration copy, metadata and
account forms are preserved. The initial JavaScript graph, including
Buddy's engine, retains the unchanged 780,000-byte budget.
The page-idleness check uses Buddy's actual Minimize control before
applying its unchanged frame budget; active animation has separate checks.

Metro's exact 10% pledge, registration link and existing programme descriptions
are preserved. The homepage gives the approved logo visual priority with
bounded entrance motion and a warm presentation. A CSS silhouette clip removes
the yellow square corners without altering the original badge or lettering.
No beneficiary photography,
new impact statistics or donation claims have been invented.

## Earlier release verification

The local production build passes. Manual browser review covers desktop and
phone placement, minimize/reopen, conversation availability, Services form
selection and the charity story controls. Release source
`34a8ed8a9fa07b4949852cc279699bdf8e6c1b1a` passed the build, functional,
accessibility, motion, performance and visual gates in
[run 43001198823](https://github.com/Impact-Investment-Group/Impact-Investment-Group-site/actions/runs/43001198823).
The Pages deployment succeeded. Live browser verification on 11 November 2026
confirmed the original Coming soon pricing page, no package cards or fee
calculator, and the supplied v2 floating artwork. The live homepage has no
inline Buddy section or legacy mascot images, and uses the shaped Metro badge.
The retired Peter artwork URL returns HTTP 404. All six platform screenshot
crops were visually reviewed without a visible legacy mascot.

The repository-wide strict TypeScript check has existing errors outside the
new Buddy and charity components. It is not claimed as a passing check.

At this earlier verification, the public Buddy readiness endpoint returned
HTTP 200 with `{"configured":false}`, superseding the initial missing-route
result. That observation and the strict-guard dependency below are historical;
the later public-lane approval is recorded in the activation follow-up.
A readiness boolean alone is not proof of an operational live conversation.
Browser AI tests use fixtures.

## Follow-up: one conversation, automatic forms

The website no longer asks visitors to select a chat topic. It retains one
conversation and uses the validated model response's topic to change Buddy
between the key, pound sign and heart. The existing v2 canvas stays mounted
during transformations, and the talking gesture continues after the form
change. Invalid or missing response topics keep the last valid form.
Internal chat links use client-side navigation; Services showcase actions
cannot cancel or retarget an existing conversation or its pending reply.

The backend uses the platform's configured assistant provider and credentials.
One structured Gemma response supplies both the answer and topic, with no
second classification call. In this strict-guard release, the public response
required the existing reply guard. On 11 November the user confirmed Jev had
not been set up; a read-only Render key inventory also showed its configuration
was absent. No guard requirement or global provider setting was changed in
that release, and the public endpoint remained unavailable. This is historical
evidence, superseded by the user's explicit public-lane approval below.

The production static build passes. The strict TypeScript check still reports
pre-existing repository errors, with no diagnostics in changed Buddy files.
The follow-up browser suite uses explicit model fixtures to verify all three
forms, retained history, post-transformation talking, retries, cancellation,
navigation, invalid topics, keyboard access and reduced motion. All 26 Buddy
checks and all other release gates passed for `00c9400` in
[run 43023428372](https://github.com/Impact-Investment-Group/Impact-Investment-Group-site/actions/runs/43023428372).
GitHub Pages deployment succeeded. Live browser verification confirmed the
single chat, removal of its manual topic controls, the updated Services
explanation and the honest unavailable connection state. Model fixtures are
not live AI proof.

## Activation follow-up: approved public operation without Jev

On 11 November 2026 the user explicitly instructed **"Run now without Jev"**.
This authorises public website Buddy to use the platform's configured
Cloudflare/Gemma provider while the reply guard is disabled. It does not
change the global guard setting or the authenticated platform lanes.

Backend commit `24618ddabf096d5c16ff0abeb1233ae7e4c4a695` implements that
public-lane exception. Readiness still requires the configured assistant host
and shared Redis budget. If the guard is enabled, its configuration and a
checked, unheld result remain required. A guard enabled at request entry or
after inference cannot be bypassed by a setting change during the request.
Real model output, structured reply/topic validation, public-only facts,
bounded history, privacy scrubbing, rate and cost limits, cancellation and
deadlines remain in place. No scripted fallback answer is introduced.

The focused backend suite passed 78 tests; two additional guard-off checks
also passed, confirming that host and shared-budget configuration remain
required. The unchanged full-app registration case was left to CI. Before
deployment, one synthetic public question through the real shared Gemma
client, Buddy prompt and budget reservation returned a validated property
reply in 19.23 seconds. This is provider-contract evidence, not verification
of the deployed public endpoint or website conversation.

The initial activation reached backend revision
`47d4882e107e199e489c25698a0938853413341f`. Subsequent CI-only environment
repairs supply bundled browser dependencies, trust the exact mounted checkout,
and register setup-python's library in the ephemeral runner so isolated
children still start without inherited library environment variables.
Production subprocess isolation is unchanged. That
[CI run 43050978731](https://github.com/Impact-Investment-Group/Impact-Investment-Platform/actions/runs/43050978731)
passed all 33 build/test jobs and its aggregate verdict at 16:07:57 UTC.
Existing retries recorded a timestamp-sentinel flake and three Vitest retries;
no assertion or deployment gate was bypassed. Render automatically deployed
the green revision. At 16:13:26 UTC, public health reported build
`47d4882e107e`, status `ok` and current schema; Buddy readiness returned
HTTP 200 with `configured: true` using the website's Origin.

Actual production website checks then completed one continuous conversation
through property/key, investment/pound and support/heart, with six retained
user/assistant turns and no manual topic selectors. These were real model
answers. The investment answer accurately kept unpublished fees unpublished.
Evidence is `buddy-live-chat-47d4882e.json` and the three matching
`buddy-live-property`, `buddy-live-investment` and `buddy-live-support` JPGs in
the 11 November refinement artifact folder.

This initial live check also exposed a reliability limitation: two of five
requests returned HTTP 503 after approximately 40 seconds. Both explicit
retries succeeded while retaining the conversation. A same-body support
canary then returned a validated Gemma answer in 2.12 seconds when the only
request change was `chat_template_kwargs.enable_thinking=false`. Its evidence
is `website-buddy-2026-11-10/buddy-gemma-thinking-off-canary-result.json`.
This is a provider-level observation, not a deployed reliability result.
Commit `2891a6a9fb1a06a5564f05929d29c2e623f66b65` applies that parameter
only to public Buddy calls using the exact Gemma 4 model. Other callers,
models, validation, budgets and guard behaviour are unchanged. The 87 locally
runnable focused Buddy cases passed; the unchanged full-app registration
case remains covered by CI because of the local Starlette mismatch. The full
[release gate 43058376429](https://github.com/Impact-Investment-Group/Impact-Investment-Platform/actions/runs/43058376429)
held deployment on an unrelated deterministic test-fixture ordering issue:
a subject older than 200 preceding licensed fixtures fell outside an unchanged
newest-100 result limit. An isolated same-image probe reproduced the failure
and passed all 43 predecessor/fixed-suite cases after the fixture correction.
Production routes, result limits and existing assertions remain unchanged;
a crowded-corpus regression is added. Final backend revision
`0913eb6e5689ce3039cc208cd492bf2c99e65a8e` passed all 34 jobs in
[gate 43063991933](https://github.com/Impact-Investment-Group/Impact-Investment-Platform/actions/runs/43063991933).
Every backend shard passed on its first attempt; the aggregate records one
existing Vitest retry. Render deployed the green revision. At 17:23:38 UTC,
public health confirmed build `0913eb6e5689`, healthy status/current schema,
and Buddy readiness `configured: true`. Evidence is
`website-buddy-2026-11-10/backend-gemma-live-0913eb6e.json`.

Final production website verification on `0913eb6` completed three fresh
questions and three real replies on their first attempts, with no HTTP 503
or API retry. Buddy changed from property/key to investment/pound to
support/heart while retaining all six user/assistant turns; no manual topic
controls appeared. The investment reply was observed in 2.77 seconds. Other
observation timings include gaps between checks and are not precise request
latencies, so this evidence does not claim every reply takes two seconds.

Final evidence is `buddy-live-chat-0913eb6.json`,
`buddy-live-investment-0913eb6.jpg` and `buddy-live-support-0913eb6.jpg` in the
11 November refinement artifact folder. `buddy-live-homepage-0913eb6.jpg`
also confirms the deployed RGB(249, 248, 243) body and 128px launcher. These
successful live checks verify this three-question sample on the final release;
the earlier timeout observations remain recorded above.

## Follow-up: reference bone white and a livelier invitation

The user supplied a bone-white colour reference and requested a larger, more
playful floating Buddy. Runtime commit `981dc0b` uses the reference image's
dominant sampled RGB value, **249, 248, 243 (`#F9F8F3`)**, for the shared page,
band, card and popover surface tokens. Tailwind utilities consume the same
value. The supplied image is preserved unchanged as
`bone-white-reference-2026-11-11.png` in the refinement artifacts. Orange
washes on the hero, page introductions and charity background are removed;
neutral depth replaces pink tinted beds. Brand orange controls,
teal accents, photographs and the supplied logos remain unchanged.

Floating Buddy now reserves a 128px canvas on desktop and 112px on phones,
with a 96px short-landscape treatment. The supplied celebration, nod, wave
and thank-you poses alternate with breathing pauses. These gestures are
opted into only by the launcher; conversational listening, thinking and
answering retain their own states. Minimize, reduced motion and hidden-page
pausing remain available.

The combined production static build and Pages postbuild passed. Local
manual browser review at desktop and 390 x 844 confirmed the bone-white
ground, distinct animated poses, clear placement, minimize/reopen and focus,
and no horizontal page overflow.

Two attempts of run `43037436170` were stopped before browser tests because
Ubuntu package mirrors failed DNS resolution. Workflow-only commit `6c35c68`
uses the official Playwright Python `1.65.0-noble` image, pinned to registry
digest `sha256:f9294526294a7bdfb8ca8aa7d815c049125a10e73b65d47fb9a80f5d74f284a6`,
and the matching Python package. The six browser gate scripts, thresholds,
three browser engines and artifact paths are unchanged. This supplies browser
system dependencies without the failing apt downloads; it bypasses no checks.

The first full verification run (`43039130053`) passed the cross-browser,
motion, all-page, partner ecosystem and 26 Buddy checks. Its contrast gate
correctly held deployment for one director role label at 4.49:1 against the
unchanged 4.5:1 floor. Commit `0fff91b` changes that label to the existing
stronger muted-ink token, preserving the portraits and layout.

The complete gate set passed on `0fff91b` in
[run 43041196780](https://github.com/Impact-Investment-Group/Impact-Investment-Group-site/actions/runs/43041196780),
and GitHub Pages deployment succeeded. Evidence covers 64 page/viewports,
47 interactions, all 26 Buddy checks, and 286/286 measured contrast nodes
across 32 screenshots with no unmeasured nodes. The corrected mobile role
label measures 6.09:1. Homepage JavaScript is 752,875 bytes against the
unchanged 780,000-byte budget.

Live homepage browser verification confirmed `--bg-bone: #F9F8F3`, body
RGB(249, 248, 243), the 128px floating launcher and the supplied v2 refined
property artwork, including distinct wave and other gesture frames. The Metro
section also measures RGB(249, 248, 243) and retains its centred shaped badge.
Live captures are `bone-white-live-0fff91b.jpg` and
`metro-bone-white-live-0fff91b.jpg` in the 11 November refinement artifact
folder. Pricing still shows Coming soon, with no published package cards.
The earlier local 390px review covers mobile placement, movement and
minimize/reopen. These observations verify the deployed appearance.
The final real three-topic conversation and its measurement limits are
recorded in the activation follow-up above.
