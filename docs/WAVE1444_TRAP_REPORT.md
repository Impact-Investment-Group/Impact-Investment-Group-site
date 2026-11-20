# Wave 1444 report (site): the hidden trap field no longer refuses a person whose browser autofilled it

20 Nov 2026. Base `462128c`, a detached copy, no branch, nothing pushed. Three commits: two of code (`f6b0cb7`, then `17fd56a`, called the tip below) and this report. Model and effort: Fable 5.2, extra high.

## What shipped: two commits, each stands without the other

1. **`f6b0cb7` the trap's cure.** The account form's hidden field refused on any value, before a request was sent, with the general "could not save" line. The refusal is now `trapSprung`'s answer (`src/lib/registration.ts:114`, asked at `src/components/register/registration-flow.tsx:389`): a value the browser marks as autofilled (`:autofill`, `:-webkit-autofill`, `:-moz-autofill`) passes, a value typed or scripted there still refuses before any request, an empty trap passes. Lifted byte for byte from wave 1432's detached copy (`fa7bd9a9b`) and alone: no lookup, no dropdown, nothing under `src/content`. Tests: `scripts/wave1444-trap.test.ts` (seven of `trapSprung`, three source pins that the form asks it, of the trap's own element, before the one request).
2. **`17fd56a` the dead address.** `Already registered? Sign in` now opens the header's own `platformLoginUrl`. Pin: `scripts/wave1444-sign-in-address.test.ts` (three).

Files changed over the base: `src/lib/registration.ts` (+24), `src/components/register/registration-flow.tsx` (+6, -2), `src/components/site-header.tsx` (the word `export`), the two test files, this report.

## The dead address: the two facts, read from the code

- **The site.** The header's `Log in` takes `platformLoginUrl`, `https://app.impactinvestmentgroup.co.uk/login`, declared at `src/components/site-header.tsx:24` and used at `:457` and `:667`. The form's link held its own literal, `.../auth/login`, at `src/components/register/registration-flow.tsx:757` (base numbering; `:761` now). `grep -rn "auth/login" .` at the base found that one line and no pin, script or test naming it, so no assertion moved.
- **The platform's web app** (checkout at `467e5312a`, read only). `iip-frontend/iip-web/src/App.jsx:557` is `<Route path="/login" ...>`, the sign in page. `App.jsx:1215` is `<Route path="*" element={<NotFound />} />`. No `Route` in `src` has a path naming `auth`. `/auth/login` there is a data endpoint the app posts to (`src/lib/auth.jsx:670`). `render.yaml` has no route naming `auth`, only the fallback of every path to `index.html`. Neither address was opened live.
- **Is it one line?** One line changes what a person gets: the link's `href`. Reusing the header's constant, as asked, costs the word `export` on its line and one import line. Three lines in two files, no string changed.

## Runs on this box, with counts

- `bun test` (bun 1.4.4) at the tip: `wave1444-trap` **10 pass, 0 fail**; `wave1444-sign-in-address` **3 pass, 0 fail**; with `wave358-registration` (9) **22 pass, 0 fail**, 52 expectations. The trap commit alone: 19 pass, 0 fail. The address commit alone on the base (a trial cherry-pick, clean): 12 pass, 0 fail.
- `prettier --check` (3.8.1, the repo's `.prettierrc`) on the five changed files: clean.
- The global `tsc` (7.0.2) under the repo's own options on `src/lib/registration.ts`, with a stand-in for Vite's typing of `import.meta.env`: clean. The form's own call typed alone against the DOM library: clean. A deliberate misuse: red, two errors.
- **The form in Chromium 157.0.8103.78 (Playwright 1.63), ad hoc and not committed.** The site's real `RegistrationFlow`, real content and real `src/lib/registration.ts`, bundled with stand-ins only for packages not on this box (the router's `Link`, the icons, the Radix slot and dropdown, the API base). Every request was answered on the box. Three builds, six rows each, **18 of 18 as expected**:

| Case                                  | Base `462128c`                           | Trap commit `f6b0cb7`    | Tip `17fd56a`            |
| ------------------------------------- | ---------------------------------------- | ------------------------ | ------------------------ |
| Empty trap                            | 1 request, moves on                      | 1 request, moves on      | 1 request, moves on      |
| Value set by a script                 | 0 requests, general line                 | 0 requests, general line | 0 requests, general line |
| Value typed with real keys            | 0 requests, general line                 | 0 requests, general line | 0 requests, general line |
| Value the browser marks as autofilled | **0 requests, general line (the fault)** | 1 request, moves on      | 1 request, moves on      |
| The same value, mark taken away       | 0 requests, general line                 | 0 requests, general line | 0 requests, general line |
| The sign in link's address            | `/auth/login`                            | `/auth/login`            | `/login`                 |

The one request carried the same nine keys in every build and never the trap's value. The mark was set through the engine's own protocol (`CSS.forcePseudoState`, `autofill`), which `Element.matches(":autofill")` then reads; it is not a real autofill. `:-moz-autofill` throws in Chromium, which is why the function catches. The harness, its log and the mutation lists are kept on the box beside the bundle (`/home/claude/probes/w1444/harness`), not in the repo.

## Mutations: each applied, run, restored, checksum checked. All red.

- **The trap, 17.** The mark no longer excuses a value; an empty trap not let through; no field springs nothing; an unknown spelling not caught; a value with no mark no longer springs; the WebKit, the Mozilla and the standard spelling each dropped; a second excuse (`:focus`) added; the form's old line back; the form asking the wrong element; the trap's own id moved away; the refusal no longer stopping the form; no refusal at all; the refusal moved to after the request; the cure out of the library (the test file then cannot load: 0 pass, 1 fail, 1 error); the cure out of the form. Every one of the ten tests went red under at least one.
- **The address, 8.** The old line back; the right address by a second literal and not the constant; the header's constant made the dead address; the constant moved elsewhere; the dead address back elsewhere under `src`; the import out; the change out of the form; the change out of the header.

## NOT RUN, and why

- **The site's install, build, lint, full type check and browser gate** (`bun run build`, `eslint`, `scripts/wave909-experience.py`, `scripts/wave412-screenshots.py`). The install was not attempted: the earlier builder's was refused (the lockfile resolves from a mirror this box's egress answers 403). Lint is reasoned only: the header's new export is a constant and the rule has `allowConstantExport: true`.
- **`scripts/wave1363-register.test.ts`**: tried once, cannot load (`zod` is not installed).
- **A real autofill by a real browser profile**, and any engine but Chromium.
- **The platform's two addresses in a browser.** Both facts are from its code.
- **The deploy workflow.** It runs no `bun test`, so these unit tests are not in the site's gate. Its node tests were not run: this diff does not touch what they read.

## The strings check

- `git diff 462128c..HEAD -- src/content`: empty (0 bytes).
- Every string literal on a code line the diff adds under `src/`: `"@/components/site-header"` (a module path), `"registration-website"` (the trap's existing id), `"matches"` (a type key), `":autofill"`, `":-webkit-autofill"`, `":-moz-autofill"` (selectors), and the header's address, restated only because its line gained `export`. **None is a string a person reads.** One literal removed: the dead address. The hidden field's label is as it was.

## Trial merge of the larger work on top (read only)

- `git merge-tree --write-tree HEAD fa7bd9a9b`: **exit 1**. Conflicts in `src/components/register/registration-flow.tsx` (one, in the import list) and `src/lib/registration.ts` (one, at the end of the file). In both, this side is empty and the larger work's side holds only its own additions (1 line and 146 lines): the larger work adds more at the very two places this cure adds, and git calls that a conflict even when one addition is the other's tail. Taking the larger work's side resolves both.
- With `-X theirs`: **exit 0**. The merged tree differs from `fa7bd9a9b` only by this wave's two test files, the address change and the header's `export`; `src/lib/registration.ts` is that work's file byte for byte. On that tree the four unit files run **60 pass, 0 fail**. The same holds on the trap commit alone.

## Assumed (20 Nov 2026)

- The lifted comments keep the words `WAVE 1432`, so the two sides stay identical and the conflict stays the empty kind.
- "One line" is read as the one line that changes what a person gets; the `export` and the import are what reusing the header's constant costs. If that reading is wrong, drop `17fd56a`.
- The larger work's browser journey in `scripts/wave909-experience.py` is left with it: it could not be run here and would conflict.

## For the second reader

1. Drive a real autofill (a browser profile with a saved company website) against a deployed preview, in Chromium, Safari and Firefox.
2. A filler that writes the hidden field by script (some password managers and extensions) carries no browser mark and is still refused. This cure covers the browser's own autofill only.
3. Run the deploy workflow's steps on a box that can install, and say whether these unit tests should join it.
4. Open the platform's `/login` and `/auth/login` once, live.
