# Wave 1363 plan: Register your interest registers an account, on one page (17 Nov 2026, 17:49 UK)

Q1. Where `Register your interest` leads today: the footer's Contact routes link and `/contact` with no query (its default route) both open the enquiry form's `waitlist` route, which posts `POST /public/enquiry`: one enquiry row, no account. The pre-release badge and the footer funnel's sr-only heading are text, not links. The header, page shell and footer funnel buttons (`Register to join the waitlist`) already open `/register`. The `Register Your Interest` CTA strings in about.ts, problem.ts and solutions.ts are not rendered anywhere.
Q2. After the enquiry the person reads "Enquiry received" and a reply time, under a form headed "Register your interest" whose button also said "Register your interest": easy to read as registered for the platform. No account exists. After `/register/<role>` they read "Registration saved", then "You're registered" and "Your registration is saved. Account access opens after activation.": true, an inactive account waits for activation.
Q3. `/register` is a picker only (ten tiles that navigate away); `/register/<role>` is the account form for one role. Missing: the choice and the form on one page, and every `Register your interest` pointing there.

Build, in order:
1. Bug: Talk to the team (the new contact default) cannot submit without a slot (an unchosen radio is null, zod `optional` refuses it, nothing is sent). Accept null, send none. Test it.
2. One page: a shared `RegisterPage` for `/register` and `/register/<role>`: intro, the role tiles (anchors to `/register/<role>` that choose in place once hydrated), then the resident's crisis card when Resident is chosen, then the existing `RegistrationFlow` (its headings drop to h2; the page keeps one h1). Tiles hide once the account is created.
3. Contact: drop the `waitlist` route from the form; default to `demo`; `/contact?enquiry=waitlist` forwards to `/register`; the footer's `Register your interest` opens `/register`.
4. Tests in the CI browser script (`scripts/wave909-experience.py`) and a bun test for the enquiry schema; each shown failing on the base. No new strings.
