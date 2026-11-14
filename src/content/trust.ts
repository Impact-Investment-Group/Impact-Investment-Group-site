/**
 * Council and data-provider credits, plus the platform's own coverage
 * figures.
 *
 * The original council sample and five data credits came from the platform.
 * The expanded provider catalogue is traced to platform services and dataset
 * provenance in scripts/fixtures/data-service-inventory.json. New and reused artwork sources
 * are recorded separately in docs/WAVE1293_LOGO_SOURCES.json.
 *
 * The disclaimers below are the reason this can ship at all. Council crests
 * are protected marks and a wall of them reads as endorsement unless it says
 * otherwise, and OpenStreetMap's ODbL *requires* attribution wherever its
 * data is credited. None of these lines is decoration — do not trim them to
 * make a layout fit.
 */

export interface LogoCredit {
  name: string;
  logo?: string;
}

/**
 * The 18 councils whose published commissioning briefs shape what the
 * platform sources. Every entry has artwork — a council without a logo is
 * left out rather than shown as bare text.
 *
 * ARTWORK: these point at `councils/normalised/`, not at the original
 * `-128.webp` files beside them. The originals are inconsistent in a way no
 * amount of CSS could fix: ten carry a white background baked in, four are
 * properly transparent, and Liverpool and Salford are white-out-of-colour
 * lockups — a purple block and a pink block. Aspect ratios ran from 1:1
 * (Manchester) to 4:1 (Newcastle), so a row of equal-width plates still
 * looked ragged, because each file brought its own padding with it.
 *
 * They render in FULL COLOUR — the earlier low-saturation treatment is gone.
 * That is what the normalisation is carrying now: the row reads as one rhythm
 * because every mark is the same optical size, not because the colour was
 * drained out of it.
 *
 * The normalised set is generated from those originals: flattened onto white,
 * trimmed of the file's own padding, then rescaled so every mark occupies the
 * same optical AREA — sqrt(w × h) held constant — and centred in a 240 × 104
 * canvas. A square crest and a wide wordmark therefore carry equal visual
 * weight in the lane. No mark is cropped, recoloured or distorted; only the
 * empty space around it changes.
 *
 * The originals are deliberately kept in place. If a council reissues its
 * mark, replace the original and regenerate — do not hand-edit the normalised
 * file.
 *
 * This also rules out the treatment that would suit the navy best — logos
 * knocked back to white with no plates. Liverpool and Salford would come
 * through as solid rectangles, because in their artwork the colour IS the
 * background. That needs reversed-out versions from the councils themselves.
 */
export const commissioningCouncils: LogoCredit[] = [
  {
    name: "North East Lincolnshire Council",
    logo: "/images/logos/councils/normalised/north-east-lincolnshire.webp",
  },
  { name: "Newcastle City Council", logo: "/images/logos/councils/normalised/newcastle.webp" },
  { name: "Sunderland City Council", logo: "/images/logos/councils/normalised/sunderland.webp" },
  { name: "Hartlepool Borough Council", logo: "/images/logos/councils/normalised/hartlepool.webp" },
  { name: "Middlesbrough Council", logo: "/images/logos/councils/normalised/middlesbrough.webp" },
  {
    name: "Stockton-on-Tees Borough Council",
    logo: "/images/logos/councils/normalised/stockton-on-tees.webp",
  },
  { name: "County Durham Council", logo: "/images/logos/councils/normalised/county-durham.webp" },
  { name: "Manchester City Council", logo: "/images/logos/councils/normalised/manchester.webp" },
  { name: "Salford City Council", logo: "/images/logos/councils/normalised/salford.webp" },
  { name: "Liverpool City Council", logo: "/images/logos/councils/normalised/liverpool.webp" },
  { name: "Wirral Council", logo: "/images/logos/councils/normalised/wirral.webp" },
  { name: "Lancashire County Council", logo: "/images/logos/councils/normalised/lancashire.webp" },
  { name: "Cumberland Council", logo: "/images/logos/councils/normalised/cumberland.webp" },
  {
    name: "Westmorland and Furness Council",
    logo: "/images/logos/councils/normalised/westmorland-and-furness.webp",
  },
  { name: "Nottingham City Council", logo: "/images/logos/councils/normalised/nottingham.webp" },
  { name: "Derby City Council", logo: "/images/logos/councils/normalised/derby.webp" },
  {
    name: "Lincolnshire County Council",
    logo: "/images/logos/councils/normalised/lincolnshire.webp",
  },
  {
    name: "East Riding of Yorkshire Council",
    logo: "/images/logos/councils/normalised/east-riding-of-yorkshire.webp",
  },
];

export const councilsEyebrow = "Built around what local authorities are commissioning";

/**
 * The one line that sits above the carousel.
 *
 * `councilsCount` is separate so the number can be set in teal without the
 * sentence being split in the JSX.
 */
/*
 * ⚠️ THE COUNT IS NO LONGER RENDERED. The strip used to read "18 local
 * authorities that we build around". Callum replaced it with the wording
 * below, which does not quote a number.
 *
 * ⚠️ AND A FLAG THAT NEEDS A DECISION, NOT A CODE CHANGE: the live wording says
 * "all local authorities". Eighteen crests are shown, and the business builds
 * around eighteen published commissioning briefs — not all 317 English
 * councils. If any reader takes "all" to mean "we work with every council in
 * the country", that is a claim the business cannot evidence. Dropping the one
 * word — "Working with local authorities" — removes the exposure entirely and
 * loses nothing. Raised with Callum; his call.
 */
export const councilsCount = "";
export const councilsStatement = "Working with all local authorities";

/*
 * THE SMALL PRINT UNDER THE LOGOS — the shortest form this can safely take.
 *
 * The original ran to three lines and is kept verbatim below. It was cut to one
 * line at Callum's request, and this is the floor: a wall of protected council
 * crests reads as endorsement unless something says otherwise, and none of
 * these councils has given one. The two claims that had to survive are the
 * sample size (so 18 crests cannot imply national coverage) and the denial.
 *
 * ⚠️ NOT CURRENTLY RENDERED. Removed from the strip at Callum's request. This
 * export is kept so restoring it is one line in CouncilPanel rather than a
 * rewrite, and so the wording does not have to be reconstructed from memory if
 * a council ever objects to its crest being shown.
 *
 * THE ORIGINAL, verbatim from the production site's CommissioningStrip:
 *
 *   "These are 18 of the ~296 local authorities in England, in the areas we
 *    source most. Their logos indicate the commissioning briefs we build
 *    around — not a partnership, endorsement or approval by any council."
 */
export const councilsDisclaimer =
  "18 of ~296 English local authorities · not a partnership, endorsement or approval by any council.";

export interface DataSource extends LogoCredit {
  id: string;
  /** What the platform reads, including clearly described upstream datasets. */
  blurb: string;
  artwork?: { w: number; h: number };
}

/** Verified direct services and upstream publishers, documented in
 * scripts/fixtures/data-service-inventory.json. Optional, unverified APIs are not credited.
 * Companies House contributes published bulk data independently of its keyed API.
 * A plain-name tile is used where no approved standalone brand artwork is available.
 */
export const dataSources: DataSource[] = [
  {
    "id": "land-registry",
    "name": "HM Land Registry",
    "blurb": "Sold prices and price-paid comparables",
    "logo": "/images/logos/data/hm-land-registry.svg",
    "artwork": {
      "w": 440,
      "h": 200
    }
  },
  {
    "id": "ons",
    "name": "Office for National Statistics",
    "blurb": "Population estimates and private-rent trends",
    "logo": "/images/logos/data/ons.svg",
    "artwork": {
      "w": 595.3,
      "h": 116.3
    }
  },
  {
    "id": "postcodes-io",
    "name": "postcodes.io",
    "blurb": "Postcode validation and geocoding",
    "logo": "/images/logos/data/postcodes-io.svg",
    "artwork": {
      "w": 440,
      "h": 200
    }
  },
  {
    "id": "openstreetmap",
    "name": "OpenStreetMap",
    "blurb": "Walkable amenities around a home",
    "logo": "/images/logos/data/openstreetmap.svg",
    "artwork": {
      "w": 440,
      "h": 200
    }
  },
  {
    "id": "epc-register",
    "name": "Energy Performance Register",
    "blurb": "Energy ratings and floor area",
    "logo": "/images/logos/data/epc-register.svg",
    "artwork": {
      "w": 440,
      "h": 200
    }
  },
  {
    "id": "zoopla",
    "name": "Zoopla",
    "blurb": "Property listing information",
    "logo": "/images/brand/zoopla-ink.webp",
    "artwork": {
      "w": 548,
      "h": 120
    }
  },
  {
    "id": "hometrack",
    "name": "Hometrack",
    "blurb": "Licensed property data",
    "logo": "/images/logos/data/hometrack.svg",
    "artwork": {
      "w": 147,
      "h": 16
    }
  },
  {
    "id": "mapbox",
    "name": "Mapbox",
    "blurb": "Maps, directions and travel distances",
    "logo": "/images/logos/data/mapbox.svg",
    "artwork": {
      "w": 126,
      "h": 28
    }
  },
  {
    "id": "planning-data",
    "name": "Planning Data",
    "blurb": "Planning constraints and designations"
  },
  {
    "id": "environment-agency",
    "name": "Environment Agency",
    "blurb": "Flood warnings and flood zones"
  },
  {
    "id": "sepa",
    "name": "Scottish Environment Protection Agency",
    "blurb": "Scottish flood maps"
  },
  {
    "id": "mining-remediation-authority",
    "name": "Mining Remediation Authority",
    "blurb": "Coal mining risk information"
  },
  {
    "id": "police-uk",
    "name": "police.uk",
    "blurb": "Local crime information"
  },
  {
    "id": "department-for-transport",
    "name": "Department for Transport",
    "blurb": "Public transport access points (NaPTAN)"
  },
  {
    "id": "nhs-england",
    "name": "NHS England",
    "blurb": "Health services and hospital discharge statistics"
  },
  {
    "id": "department-for-education",
    "name": "Department for Education",
    "blurb": "Schools and children statistics"
  },
  {
    "id": "bank-of-england",
    "name": "Bank of England",
    "blurb": "Bank Rate information",
    "logo": "/images/logos/data/bank-of-england.svg",
    "artwork": {
      "w": 403.82,
      "h": 52.71
    }
  },
  {
    "id": "historic-england",
    "name": "Historic England",
    "blurb": "Heritage and listed-building information"
  },
  {
    "id": "mhclg",
    "name": "Ministry of Housing, Communities and Local Government",
    "blurb": "Housing need and homelessness statistics"
  },
  {
    "id": "valuation-office-agency",
    "name": "Valuation Office Agency",
    "blurb": "Local Housing Allowance and rental areas"
  },
  {
    "id": "dwp",
    "name": "Department for Work and Pensions",
    "blurb": "Benefit and income statistics"
  },
  {
    "id": "hmrc",
    "name": "HM Revenue & Customs",
    "blurb": "Property tax and household income datasets"
  },
  {
    "id": "revenue-scotland",
    "name": "Revenue Scotland",
    "blurb": "Scottish property tax information"
  },
  {
    "id": "welsh-revenue-authority",
    "name": "Welsh Revenue Authority",
    "blurb": "Welsh property tax information"
  },
  {
    "id": "nomis",
    "name": "Nomis",
    "blurb": "Population and labour-market statistics"
  },
  {
    "id": "cqc",
    "name": "Care Quality Commission",
    "blurb": "Care-service registrations",
    "logo": "/images/logos/data/cqc.svg",
    "artwork": {
      "w": 170.083,
      "h": 53.739
    }
  },
  {
    "id": "care-inspectorate",
    "name": "Care Inspectorate",
    "blurb": "Scottish care-service registrations"
  },
  {
    "id": "care-inspectorate-wales",
    "name": "Care Inspectorate Wales",
    "blurb": "Welsh care-service registrations"
  },
  {
    "id": "ofsted",
    "name": "Ofsted",
    "blurb": "Children's homes and supported accommodation statistics"
  },
  {
    "id": "dhsc",
    "name": "Department of Health and Social Care",
    "blurb": "Adult support and care fee statistics"
  },
  {
    "id": "regulator-social-housing",
    "name": "Regulator of Social Housing",
    "blurb": "Supported-housing stock statistics"
  },
  {
    "id": "companies-house",
    "name": "Companies House",
    "blurb": "Published company information",
    "logo": "/images/logos/data/companies-house.svg",
    "artwork": {
      "w": 440,
      "h": 200
    }
  },
  {
    "id": "welsh-government",
    "name": "Welsh Government / StatsWales",
    "blurb": "Welsh housing and deprivation statistics"
  },
  {
    "id": "scottish-government",
    "name": "Scottish Government",
    "blurb": "Scottish housing and deprivation statistics"
  },
  {
    "id": "communities-ni",
    "name": "Department for Communities Northern Ireland",
    "blurb": "Northern Ireland housing statistics"
  },
  {
    "id": "nihe",
    "name": "Northern Ireland Housing Executive",
    "blurb": "Housing waiting-list statistics"
  },
  {
    "id": "registers-of-scotland",
    "name": "Registers of Scotland",
    "blurb": "Scottish house-price data"
  },
  {
    "id": "land-property-services",
    "name": "Land & Property Services Northern Ireland",
    "blurb": "Northern Ireland house-price data"
  },
  {
    "id": "nisra",
    "name": "Northern Ireland Statistics and Research Agency",
    "blurb": "Northern Ireland statistical contributions"
  },
  {
    "id": "ordnance-survey",
    "name": "Ordnance Survey",
    "blurb": "Open address, place and boundary data"
  },
  {
    "id": "royal-mail",
    "name": "Royal Mail",
    "blurb": "Upstream postcode reference data"
  },
  {
    "id": "ubdc",
    "name": "Urban Big Data Centre, University of Glasgow",
    "blurb": "Postcode-to-rental-area lookup"
  }
];

export const dataSourcesEyebrow = "Powered by authoritative UK data";

/** Both lines are legal, not decorative. */
export const dataSourcesDisclaimer =
  "Data used under licence. These publishers do not endorse this platform.";
/** ODbL requires the contributor credit *and* an indication of the licence. */
export const openStreetMapAttribution = "© OpenStreetMap contributors · ODbL";

export interface PlatformStat {
  value: string;
  label: string;
  detail: string;
  /** The middle card is filled — teal, never orange. Orange is for actions. */
  emphasis?: boolean;
}

/*
 * ⚠️ THESE FIGURES ARE A STATIC SNAPSHOT, NOT LIVE.
 *
 * On the production site these three tiles read `GET /api/public/platform-stats`
 * and follow an honest ladder: skeleton while in flight, the banded figure on
 * success, and the literal word "Growing" on failure — never a fabricated
 * number. This repo has no backend and no such endpoint, so the values below
 * are transcribed from what that site was displaying.
 *
 *   Source:    Impact-Investment-Platform production site, HomeStatsBand
 *   Recorded:  3 August 2026
 *
 * They will drift. Either point the caption at a real endpoint or change the
 * "live from our platform" line, because as it stands the caption claims
 * something the page cannot currently do.
 */
export const platformStats: PlatformStat[] = [
  {
    value: "193,000+",
    label: "homes sourced & analysed",
    detail: "Sourced across the UK, each run through our analysis.",
  },
  {
    value: "634,000+",
    label: "potential homing opportunities",
    detail: "Counted as the bedrooms across those homes — each a potential supported room.",
    emphasis: true,
  },
  {
    value: "1,693",
    label: "towns & areas covered",
    detail: "Towns and areas with at least one home sourced.",
  },
];

export const platformStatsSource = "Platform snapshot recorded 3 August 2026";
