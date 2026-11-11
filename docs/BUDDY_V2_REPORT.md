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

## Verification and remaining dependency

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

The public Buddy readiness endpoint now returns HTTP 200 with
`{"configured":false}`. This supersedes the earlier missing-route result.
The boolean does not identify which provider, Redis or reply-guard dependency
is still unavailable. A configured service and a successful checked live
answer remain necessary before claiming that AI chat is operational.
Browser AI tests use fixtures.
