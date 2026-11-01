# Wave 838: a Co-sourcer tile on /register, and Log in goes to the platform

Issued 1 Nov 2026 18:36 UK by the PC chair (cloud session) on Callum's ask of 18:32: the website "needs to have options for co-sourcers which currently it doesn't for them both to register as well as log in when going through the login page". Base `0185185d8` (wave 777).

## What shipped

- `src/content/audiences.ts`: `AudienceRole` gains `href?` and `pickerOnly?`; a new tile after the broker, `co-sourcer` ("Co-sourcer", "Source homes with us"), whose `href` is the platform's own sign-up `https://app.impactinvestmentgroup.co.uk/sourcer/join` (`GET /api/auth/register/sourcer` answers `{"enabled": true}` in production). `pickerOnly` keeps it off the hero's row of ten.
- `src/content/register.ts`: the invariant filter skips an `href` tile, so the registration forms stay the nine partner routes plus the resident route.
- `src/components/register/role-picker.tsx`: an `href` tile is a plain anchor drawn with the same card, spanning the row at the three-column width; the nine partner tiles keep their three rows.
- `src/components/register/role-icon.tsx`: `co-sourcer` draws `Search` with `House` as its one accent.
- `src/components/home/hero.tsx`: `heroRoles` excludes `pickerOnly` tiles; the hero is unchanged.
- `src/components/site-header.tsx`: both "Log in" links go to `https://app.impactinvestmentgroup.co.uk/login`, where the platform's own login page carries the co-sourcer join link.

No new colour, no new token, no hex. User-facing strings added: "Co-sourcer", "Source homes with us". Nothing else changed.

## Held

The general enquiries address in `src/content/legal.ts` reads `enquires@impactig.co.uk`; the comments say the mailbox was created with that spelling. Not changed this wave: the chair asked Callum whether the mailbox or the site is wrong. Default if no answer: switch the site to `enquiries@impactig.co.uk` once he adds that alias.

## Gate, measured on this tree

- `bunx eslint --fix` on the six files, then `bun run lint`: the six files clean (the base's inherited errors in non-src files unchanged).
- `bunx tsc --noEmit -p .`: rc 0.
- `node scripts/wave443-contrast.mjs`: failures [].
- `STATIC_BUILD=true BASE_PATH=/ bun run build`: ok.
- `python3 scripts/wave412-screenshots.py`, run twice:
  - run 1: 28 shots, 1 failure, `platform @ 1280`: the "03" disc's INCOMPLETE node could not be measured off the shot. The same node wave 777's report names as red on the base itself.
  - run 2 (while two other builds loaded the box): 28 shots, 18 failures, all `solutions @ 1280/390`, all "could not be measured off the shot" on the fifth `Reveal` block, a shot taken mid-rise. No contrast pair failed in either run; no page had a serious axe violation.
  - The pages this wave touches passed both runs: `register` 1280 raw 3.23% ground 1.91% axe 0, incomplete 2 measured 2; `register` 390 raw 5.51% ground 2.33% axe 0, 2 of 2; `home` 1280 raw 22.69% ground 8.69% axe 0, 20 of 20; `home` 390 raw 16.45% ground 7.80% axe 0, 18 of 18. Islands at most 1 on every page.
- The two `register` shots are committed; the other 26 are left at the base's.

## Open

- A clean 28-shot run on an idle box, to be recorded by the next site wave; the failures above are the measurement environment, not a pair that failed.
