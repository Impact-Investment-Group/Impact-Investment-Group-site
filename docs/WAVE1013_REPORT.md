# Wave 1013: supplied website logo

The header, mobile menu and footer now use the supplied Impact Investment Group artwork with teal Impact, orange Investment and navy Group. Only excess near-transparent outer padding was trimmed. The master lossless WebP exactly preserves all four channels of the retained source pixels. All responsive variants are generated from this same asset with transparency retained, so a phone cannot select the previous logo.

The intrinsic image size is updated together with the image registry. Existing display heights, navigation, accessible home label and other branding styles are preserved. The current logo has a slightly narrower display width at each height than the previous asset. Source files and hashes are kept in local 05-Artifacts/website-logo-2026-11-05/.

The browser favicon uses the emblem cropped from the same supplied artwork. Its URL has a cache version. The existing homepage share-card generator now reads the new logo, retaining the white 1200 by 630 canvas and adding no text. Open Graph and Twitter metadata point to the new versioned preview. The supplied PNG remains unchanged in the local artifacts.

The existing Actions workflow runs the normal website release checks. Focused header captures at phone, tablet and desktop widths plus mobile-menu and footer-logo captures supplement its existing screenshots; no extra test suite or local build/test/browser capture was run. Publication and final browser/public asset proof are recorded in Live-State after deployment. Public website only; current team greyscale and all other site changes remain.
