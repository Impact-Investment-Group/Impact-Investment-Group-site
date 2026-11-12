# UK local authority logos

The homepage section headed “Working with all local authorities” now has a larger, four-country logo preview and an expandable directory of all 382 current UK principal local authorities. Search, country filters and progressive results keep the complete collection usable without loading hundreds of images into the initial homepage.

## Coverage, checked 12 November 2026

| Country | Authorities |
| --- | ---: |
| England | 317 |
| Scotland | 32 |
| Wales | 22 |
| Northern Ireland | 11 |
| Total | 382 |

The code set matches the ONS May 2026 districts, unitary authorities and council areas (361), plus the 21 English county councils. It includes the City of London and Isles of Scilly. Combined authorities, the GLA, parish/town/community councils and future shadow councils are different administrative layers and are outside this principal-council directory. Current Surrey councils remain in the roster until the April 2027 transition.

The roster is in `public/data/uk-local-authorities.json`, including its source metadata. Primary sources are the [GOV.UK local-links directory](https://raw.githubusercontent.com/alphagov/local-links-manager/e0044d06811681acc2ed14acbd83cfdaa4177714/data/local-authorities.csv), [ONS district names and codes](https://www.arcgis.com/home/item.html?id=43eddab36751466db7bb4006b242243c), and [ONS upper-tier names and codes](https://www.arcgis.com/home/item.html?id=79e0950fa93446b996d0f3f95537ab6d). This is a directory of councils, not a change to the separate published commissioning-brief dataset.

## Artwork and presentation

Each authority has a locally served genuine logo at `public/images/logos/councils/uk/{GSS}.webp`. Artwork comes from council websites and official secondary sources such as council employer profiles, statutory agencies, parish councils and member organisations, with a small number of documented secondary sources where the originals were inaccessible. `docs/council-logo-sources.json` records per-logo provenance and hashes. Original downloads and review sheets are retained in the dated project artifact folder.

Logos retain their original colours and proportions. Some official header logos require a dark or neutral presentation background so white elements remain visible. The directory also provides the full council name alongside every logo. Shared council-service branding is retained where that is the council's current published identity.

The homepage preview uses 18 representative logos from all four countries. Its plates are 148 × 68 CSS pixels on desktop and 136 × 64 on smaller screens, up from 118 × 54. An explicit pause control and reduced-motion behaviour keep motion optional. The full directory is loaded only when opened, displays 24 results initially, and supports search, country selection and further results. It uses the existing Tailwind framework and site colour tokens.

## Build and maintenance

`bun run build` first runs `scripts/build-authority-directory.mjs`. It checks unique codes, the four country totals, canonical paths and the presence of every logo before generating a complete static gallery at `/local-authorities/`. Postbuild links the compiled site CSS. The homepage has a native disclosure and a no-JavaScript link to this complete gallery.

To update the collection, revise the source roster and affected logo/provenance records together, then update the expected count in the directory UI and generator if administrative boundaries change. Keep the initial preview small; do not insert all 382 images into the animated lane. The existing generic marquee remains unchanged for other consumers.
