# UK local authority logos

The homepage section headed “Working with all local authorities” contains one simple carousel with the logos of all 382 current UK principal local authorities. The established 18-logo sequence opens the carousel, followed by the remaining authorities in alphabetical order.

## Coverage, checked 12 November 2026

| Country          | Authorities |
| ---------------- | ----------: |
| England          |         317 |
| Scotland         |          32 |
| Wales            |          22 |
| Northern Ireland |          11 |
| Total            |         382 |

The code set matches the ONS May 2026 districts, unitary authorities and council areas (361), plus the 21 English county councils. It includes the City of London and Isles of Scilly. Combined authorities, the GLA, parish/town/community councils and future shadow councils are different administrative layers and are outside this principal-council roster. Current Surrey councils remain in the roster until the April 2027 transition.

The canonical roster is in `public/data/uk-local-authorities.json`, including its source metadata. Primary sources are the [GOV.UK local-links directory](https://raw.githubusercontent.com/alphagov/local-links-manager/e0044d06811681acc2ed14acbd83cfdaa4177714/data/local-authorities.csv), [ONS district names and codes](https://www.arcgis.com/home/item.html?id=43eddab36751466db7bb4006b242243c), and [ONS upper-tier names and codes](https://www.arcgis.com/home/item.html?id=79e0950fa93446b996d0f3f95537ab6d). The separate published commissioning-brief dataset keeps its existing scope.

## Artwork and presentation

Each authority has a locally served genuine logo at `public/images/logos/councils/uk/{GSS}.webp`. Artwork comes from council websites and official secondary sources such as council employer profiles, statutory agencies, parish councils and member organisations, with a small number of documented secondary sources where the originals were inaccessible. `docs/council-logo-sources.json` records per-logo provenance and hashes. Original downloads and review sheets are retained in the dated project artifact folder.

Logos retain their original colours and proportions. Some official header logos require a dark or neutral presentation background so white elements remain visible. Every carousel entry carries the full council name for accessible identification. Shared council-service branding is retained where that is the council's current published identity.

The carousel's logo plates are 148 × 68 CSS pixels on desktop and 136 × 64 on smaller screens, up from 118 × 54. An explicit pause control and reduced-motion behaviour keep motion optional. It uses the existing Tailwind framework and site colour tokens. All 382 unique authorities are part of the same carousel sequence.

## Build and maintenance

`bun run build` and `bun run build:dev` first run `scripts/prepare-authority-carousel.mjs`. The generator checks unique codes, the four country totals, canonical paths and the presence of every logo. It then writes `src/content/authority-carousel.ts`: compact `[gss_code, name]` pairs mapped to `LogoCredit` objects with the common local logo path. Only those identifiers and names enter the browser bundle; the full catalogue metadata remains in its public JSON source.

Run `bun run prepare:authority-carousel` to refresh the generated module independently. Keep that module in source control so development has the same complete sequence. To update the collection, revise the canonical roster and affected logo/provenance records together, then regenerate it. Update the expected totals and opening sequence in the generator when administrative boundaries require a change.
