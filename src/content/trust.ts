/**
 * Council and data-provider credits, plus the platform's own coverage
 * figures.
 *
 * Everything here was copied from the production site at
 * `Impact-Investment-Platform/iip-frontend/iip-web` rather than rebuilt:
 * the council list from `src/components/marketing/CommissioningStrip.jsx`,
 * the data sources from `src/lib/dataSources.js`, and the artwork from
 * `public/logos/` with filenames unchanged.
 *
 * The disclaimers below are the reason this can ship at all. Council crests
 * are protected marks and a wall of them reads as endorsement unless it says
 * otherwise, and OpenStreetMap's ODbL *requires* attribution wherever its
 * data is credited. None of these lines is decoration — do not trim them to
 * make a layout fit.
 */

export interface LogoCredit {
  name: string;
  logo: string;
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
  /** Rides the image alt — what the platform actually reads from it. */
  blurb: string;
  /** Intrinsic artwork size, so a lazy tile reserves its true width. */
  artwork: { w: number; h: number };
}

/**
 * A logo here is a claim that the running platform queries that source.
 * Companies House is deliberately absent: the old repo records that its
 * integration is key-gated on a variable never provisioned in production,
 * so crediting it would claim something the platform does not do.
 */
export const dataSources: DataSource[] = [
  {
    id: "land-registry",
    name: "HM Land Registry",
    logo: "/images/logos/data/hm-land-registry.svg",
    artwork: { w: 440, h: 200 },
    blurb: "Sold prices · price-paid comparables",
  },
  {
    id: "ons",
    name: "Office for National Statistics",
    logo: "/images/logos/data/ons.svg",
    artwork: { w: 595.3, h: 116.3 },
    blurb: "Population estimates & private-rent trends",
  },
  {
    id: "postcodes-io",
    name: "postcodes.io",
    logo: "/images/logos/data/postcodes-io.svg",
    artwork: { w: 440, h: 200 },
    blurb: "Postcode validation & geocoding",
  },
  {
    id: "openstreetmap",
    name: "OpenStreetMap",
    logo: "/images/logos/data/openstreetmap.svg",
    artwork: { w: 440, h: 200 },
    blurb: "Walkable amenities around a home",
  },
  {
    id: "epc-register",
    name: "Energy Performance Register",
    logo: "/images/logos/data/epc-register.svg",
    artwork: { w: 440, h: 200 },
    blurb: "Energy ratings · floor area",
  },
];

export const dataSourcesEyebrow = "Powered by authoritative UK data";

/** Both lines are legal, not decorative. */
export const dataSourcesDisclaimer =
  "Public data used under licence. These publishers do not endorse this platform.";
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
