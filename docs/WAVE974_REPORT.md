# Wave 974: compact Zoopla attribution

Israel found the enlarged Powered by Zoopla badge too large. The original artwork now displays at 112px on desktop and 100px on phones, down from 180px and 150px. Tighter spacing, padding and corner radius reduce the surrounding badge while retaining a 44px touch target. The label stays readable at 13px.

The existing reveal, copy, animation, keyboard controls and reduced-motion behaviour are unchanged. No other homepage elements, image assets or signed-in application files changed.

The existing browser size assertion now checks compact dimensions and a usable touch target. Its hover, keyboard, tap, motion and viewport checks remain. All builds, checks and screenshots run in GitHub Actions only; final results, screenshot review and public publication evidence are in Context Library Live-State and local 05-Artifacts/website-compact-zoopla-2026-11-04/.

The claim was renumbered from 968 to 974 before implementation because concurrent platform claims 968 to 973 arrived during the context merge. Their work is untouched.
