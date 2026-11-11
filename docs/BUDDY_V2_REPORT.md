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
font shaping, tabular numbers and approved colours are retained. Pricing and
FAQ section navigation and more readable partner menus are included.

Conversation copy loads with the chat. Registration questionnaires now load
with their route instead of the homepage; registration copy, metadata and
account forms are preserved. The complete initial JavaScript graph, including
Buddy's engine, measures 752,868 bytes against the unchanged 780,000-byte
budget. The page-idleness check uses Buddy's actual Minimize control before
applying its unchanged frame budget; active animation has separate checks.

Metro's exact 10% pledge, registration link and existing programme descriptions
are preserved. The homepage gives the approved logo visual priority with
bounded entrance motion and a warm presentation. A CSS silhouette clip removes
the yellow square corners without altering the original badge or lettering.
No beneficiary photography,
new impact statistics or donation claims have been invented.

## Verification and remaining dependency

The local production build passes. Manual browser review covers desktop and
phone placement, minimize/reopen, conversation availability, Services form
selection and the charity story controls. Final CI and publication results
are recorded at closeout.

The repository-wide strict TypeScript check has existing errors outside the
new Buddy and charity components. It is not claimed as a passing check.

The public Buddy API still returned 404 during this session. The latest
backend CI was blocked before jobs started by GitHub payments/spending limits.
Actual provider, Redis and reply-guard readiness cannot be inferred from that
404. Backend deployment and a successful checked live answer remain necessary
before claiming that AI chat is operational. Browser AI tests use fixtures.
