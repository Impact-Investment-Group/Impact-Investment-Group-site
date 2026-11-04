# Wave 967: role icons, Our mission and About Us

Israel asked to fix the homepage role icon colours, restore Our mission, and put About Us back to its earlier layout.

The homepage had overrides shrinking the shared 48px role icon plate to 28px and making its background transparent. Removing those overrides restores the original orange tint, navy base glyphs and orange detail accents, with space for the composite symbols. The shared role icon map and other uses are unchanged. Hover and keyboard focus retain the existing stronger orange tint.

Our mission, About Us and its director cards are restored exactly from 5485b88, the pre-wave-964 baseline used for the requested hero restoration. Their source diff against that baseline is empty. Existing copy, facts, image files, links, mission keyboard tabs and About section navigation remain. Unused mission-only CSS is removed; the other homepage demand styling stays.

The restored three-photo hero, removed connection section and centred larger UK data logos from wave 965 remain. No new user-facing strings, no changed image files or signed-in application changes.

Existing browser coverage now checks ten full-size role plates with visible tint, navy/orange glyph colours, and absence of the superseded mission/About wrappers. Its existing mission keyboard and About navigation checks remain. No local tests, builds, audits or screenshots were run under the GitHub Actions-only notice. Final CI, actual screenshot review and live proof are recorded in Context Library Live-State and local 05-Artifacts/website-icon-mission-about-2026-11-04/.
