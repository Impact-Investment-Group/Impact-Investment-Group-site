# Wave 1432 report (site): the account form shows the organisation an email domain belongs to

20 Nov 2026. Base `462128c`, a detached copy, nothing pushed. This is part 3 of the platform's wave 1432; the platform's `docs/WAVE1432_REPORT.md` is the full record. It boards only once the platform's part 2 (the route) is live and Callum's word on the two strings is in.

## What shipped
- **The offer.** On `/register/care-provider` and `/register/support-provider`, once the typed address is one the form would accept, the form sends the address's DOMAIN (never the address) to the platform's `POST /public/registration/organisations` and, when the platform names an organisation, draws a select under the email field with that one option, chosen. Any other answer (no organisation, a failure, a 404 while the platform does not carry the route yet, a 429) draws nothing and the form is the form it was. No other audience asks.
- **Nothing sent.** The select has no `name` and the registration request is unchanged: the same nine keys, pinned by a test.
- **The trap field.** `trapSprung` no longer treats a value the browser's own autofill put in the hidden field as a script: it reads the browser's autofill mark (`:autofill`, and the older engines' spellings). A value a script set still refuses, as before. No string added or changed for it; the hidden label is as it was.
- **Where the logic lives.** `src/lib/registration.ts`: `registrationEmailDomain`, `lookUpRegistrationOrganisation` (never throws), `watchOrganisationOffer` (asks once the domain has rested 400ms, holds each answer, drops a late one), `trapSprung`. `registration-flow.tsx` only wires the watch and draws.

## Strings, the whole list (Assumed 20 Nov 2026, for the owner's word)
- The select's label: `Your organisation`
- Its line: `This email address belongs to an organisation already on the platform. Your account joins it once your email is confirmed and your account is activated.`

Both in `src/content/registration-journey.ts` (`organisationOffer`). No other user-facing string added or changed.

## Design rules followed
Tokens by name only (the form's own `fieldClass`, `text-ink`, `text-ink-muted`), no hex, no emoji, no new component: the select is the contact form's treatment (`fieldClass` plus `cursor-pointer`), the label and the line are the email field's and the password help's classes. No entrance animation. The site's `CLAUDE.md` scopes work to the landing page; row 1432 names this form and governs.

## Measured on this box
- `bun test scripts/wave1432-organisation-offer.test.ts scripts/wave358-registration.test.ts`: **47 pass, 0 fail** (38 and 9).
- Sixteen mutations of `src/lib/registration.ts` and the copy, each restored after, every one red (the lookup refusing an address; any status read as an answer; the trap ignoring autofill; the shape check out; one word of the line; a throwing lookup; two organisations read as one; no field springing nothing; no rest; no answer held; a late answer shown; a failure held; the offer not cleared; the key without the audience; a stop that gives nothing up; the same domain asked again). The last was green at first: no test saw it, so one was added (the same domain set again while its answer is on its way), and it is red now.
- `prettier --check` (3.8.1, the repo's `.prettierrc`) on the four changed TypeScript files: clean.
- The global `tsc` (7.0.2) under the repo's own strict options on `src/lib/registration.ts` and `src/content/registration-journey.ts`: clean, and red on a deliberate misuse.
- `src/lib/registration.ts` bundled alone and run in Chromium 157 (Playwright): the lookup's hit, miss, 404, 429 and aborted request, the watch with a real fetch, and the trap on a real element, all as expected; every request body was a role and a domain.

## NOT RUN, and why
- **The site's install, build, type check, lint and browser gate.** `bun install --frozen-lockfile` (the deploy workflow's own command; there is no `package-lock.json` for `npm ci`) was tried once and refused: thirty of the lockfile's packages resolve from `europe-west4-npm.pkg.dev`, which this box's egress denies (403). `pnpm-lock.yaml` is behind `package.json` (it has no `ogl`). So `bun run build`, `tsc`, `eslint`, `scripts/wave909-experience.py`, `scripts/wave412-screenshots.py` and `scripts/wave1363-register.test.ts` (it needs `zod`) did not run here.
- **The form itself in a browser.** The new journey in `scripts/wave909-experience.py` (`organisation_offer`: the one request, the select, its two strings, its place under the email field, axe on the drawn state, the 404, the aborted request, the investor's silence) is written and has not been run. The form's file was type checked only against stand-in typings for React and the outside packages: no error in this wave's lines.
- **A real autofill.** Nothing here can drive a browser's own autofill, so the trap's cure is proved by unit test and by the selector being known to Chromium, not by a filled form.

## For the second reader
1. Run the deploy workflow's steps on a box that can install, and read `organisation_offer` at 390 and 1280.
2. The email cell grows taller than the phone cell at 1280 while the offer is drawn (two columns). Say if the offer should span both columns instead.
3. The platform offers an organisation only when it has an active owner; one made by the Users door alone has none, so nothing is drawn for it.
