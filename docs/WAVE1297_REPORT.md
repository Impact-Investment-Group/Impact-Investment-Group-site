# Wave 1297: logo images only for data providers

The homepage's "Powered by authoritative UK data" carousel now displays only entries with verified logo artwork. The text-only publisher tiles are omitted. The full publisher inventory and source evidence remain available in the repository.

Postcodes.io and OpenStreetMap use files supplied by their own websites. The recreated HM Land Registry, EPC Register and Companies House marks are omitted because no verified replacement artwork was acquired in this change. Existing ONS, Zoopla, Hometrack, Mapbox, Bank of England and Care Quality Commission artwork is retained. An image loading failure removes that provider from both carousel copies and the corresponding accessible list, without showing a name tile or leaving a blank plate. Screen readers retain names and descriptions for displayed logos.

## Artwork provenance

- Postcodes.io: https://postcodes.io/ identifies `/img/house.png` as its logo; downloaded unchanged from https://postcodes.io/img/house.png.
- OpenStreetMap: https://www.openstreetmap.org/ identifies its header image as the OpenStreetMap logo; downloaded unchanged from https://www.openstreetmap.org/assets/osm_logo-cc7d94392992162133be3baa21a37eb84f19f9b91178f704005378fbeecabb4e.svg.
- Previously acquired artwork: `docs/WAVE1293_LOGO_SOURCES.json`; ONS is also linked by its official homepage at https://www.ons.gov.uk/.
- The existing data licence and OpenStreetMap contributor attribution remain visible.

## Verification

The existing CI browser checks now verify image-only tiles, the displayed subset of the provider inventory, no empty fallback plates, accessible labels, both carousel copies, image decoding, mobile and desktop layouts, reduced motion and JavaScript-disabled views. A missing-image scenario returns an actual HTTP 404 for a displayed provider and verifies its removal.

Local builds and test suites were not run, following the project's CI-only gate rule. [GitHub Actions run 43639744679](https://github.com/Impact-Investment-Group/Impact-Investment-Group-site/actions/runs/43639744679) passed both build and deployment for `15c2e1f11a82d0ea880069cbd4ee34c1234605c8`. Its authority/data carousel report records all thirteen scenarios passing, with no failures and eight displayed data providers.

The published homepage was inspected in a browser. All eight original provider tiles contained images and no visible text fallback; the matching accessible names and descriptions remained. The visual strip showed the provider artwork with the existing heading, colours and attribution.

CI screenshots and the carousel report are saved outside Git at `C:/Users/Israel/Claude/Projects/Impact Investment Group/05-Artifacts/data-source-logos-2026-11-14/`.

The Context Library's Design System, Live State and History Ledger entries were published in commit `237963b38763b9c7c95cff84d5077b0d264a5720`, based on its current remote head with an isolated temporary index. The existing local context branch and unrelated edits were preserved. The lean platform CLAUDE.md has no Current heads block and expressly locates measured heads in Live-State, which was updated instead.
