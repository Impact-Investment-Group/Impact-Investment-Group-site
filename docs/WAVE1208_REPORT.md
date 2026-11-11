# Wave 1208: Buddy and public website design

## Result and scope

The public website has one Buddy identity: a key for property, a pound sign for
investment information and a heart for care and support. The homepage explorer
lets visitors choose an area, see Buddy transform, read a short process and
follow a relevant destination. Existing public character placements now use
Buddy. Navigation labels and mobile targets are more readable, and Pricing and
FAQs have section navigation.

The existing light brand, photo homepage hero, published prices, factual
figures, forms and signed-in platform design are preserved. Tailwind v4 was
already installed; the new components use its existing semantic theme and
shared control conventions. The broader route-family review and remaining
opportunities are in `WAVE1208_DESIGN_REVIEW.md`.

## Character and interaction

The user-supplied animation atlas is 144,748 bytes. One renderer shares its
decoded image and dynamically loads the articulated engine when visible.
It reserves a square stage, settles after bounded gestures, stops off-screen
and honours reduced motion. A topic icon remains if artwork cannot load.
The form transition changes artwork within the supplied animation, rather
than claiming a mathematical vector morph.

The homepage has keyboard-operated tabs and fixed panel geometry. The public
assistant loads only when requested. It offers topic suggestions, transient
conversation history, immediate display of submitted questions, a pending
state, cancellation, retry and a fresh-conversation control. It restores focus
on close and makes processing/privacy information available beside the input.
Conversation data is not saved in browser storage.

On phones, Buddy is available in the site menu and in normal page flow above
the footer, so a floating button cannot obscure text. The floating launcher is
reserved for desktop. Short-screen dialogs compact the header and let the
conversation area shrink while preserving the composer.

## AI integration

The website posts to its existing direct marketing backend at
`/public/buddy`. The companion platform wave implements this separate public
route using the existing Cloudflare/Gemma assistant configuration and shared
allowance. It has no authenticated account/deal context or action tools.

The website accepts an assistant reply only when the service returns
`used_ai: true` and nonempty bounded text. Topic links are related destinations,
not per-answer retrieval citations. Generated content is rendered as plain
text. Non-success produces an explicit unavailable/busy message and useful
links; it never produces a scripted answer labelled as AI.

Model and guard credentials stay server-side. The required reply guard and
shared budget must be operational before live answers can be claimed. The
backend wave report records settings, rate limits, telemetry scrubbing,
deadline behaviour and the concurrent wave 1207 dependency.

Before enabling questions, the panel checks `/public/buddy/status` with a
six-second timeout and requires `configured: true`. A missing or unavailable
service shows related pages and a connection retry, with no question sent.
History can be cleared while offline. Readiness is checked again on opening;
cancelled or stale responses cannot enable the composer. This addition follows
the live API returning 404 while its final CI is blocked by GitHub billing.

## Verification status

All builds, tests and executable audits run in GitHub CI, per the project rule.
No local build or test was run. Browser chat responses in `site-buddy.py` are
explicit deterministic fixtures; they cannot establish live Gemma operation.

Initial CI found the upfront chat import exceeded the homepage JavaScript
budget. Loading chat on request restored compliance with the unchanged
780,000-byte limit. CI run `42930605564` passed on `97b9f1a`: 64 page/viewport
checks, 47 interactions, 13 Buddy cases, four partner-ecosystem widths,
Firefox/WebKit scrolling, pricing and motion, and rendered contrast checks.
Homepage JavaScript measured 771,477 bytes. All 276 contrast nodes needing
pixel verification were measured, with none unproven, across 32 visual shots.

The exact CI-generated Pages artifact was served unchanged for manual browser
review. Desktop key/pound forms, 390px menu-to-chat handoff, reopening and focus
return to the menu trigger were verified. Temporary viewport overrides were
reset. Public deployment and live AI availability remain separate checks.
The subsequent readiness cases require a fresh CI result before publication.
