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

Local builds and test suites were not run, following the project's CI-only gate rule. GitHub Actions and live verification are pending publication.
