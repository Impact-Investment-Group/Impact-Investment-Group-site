/**
 * Content for /platform.
 *
 * Nothing here is a verified public statistic. Every figure below sits inside a
 * LiveWindow and is labelled at the panel as illustrative interface data.
 */

export interface CapabilityLink {
  id: string;
  label: string;
}

export const capabilityLinks: CapabilityLink[] = [
  { id: "what-we-do", label: "What we do for you" },
  { id: "ai-team", label: "Your AI investment team" },
  { id: "data-layers", label: "The data layers" },
  { id: "demand-heat-maps", label: "Demand heat maps" },
  { id: "property-intelligence", label: "Property intelligence" },
  { id: "portals", label: "Portals" },
];

/* 1 · Hero summary state -------------------------------------------------- */

export const heroSummary = {
  eyebrow: "The Platform",
  title: "Every home matched on evidence, not guesswork.",
  lead: "One record holds the brief, the property, the compliance evidence and the placement decision — so the match can be explained to a committee, line by line.",
  caption:
    "A preview of the platform. Pre-release, invitation only — join the wait list for access.",
  tabs: [
    { id: "summary", label: "Summary" },
    { id: "matches", label: "Matches" },
    { id: "evidence", label: "Evidence" },
  ],
  metrics: [
    { id: "homes", value: "1,240", label: "Homes in view" },
    { id: "match", value: "92%", label: "Top match score" },
  ],
  rows: [
    { id: "r1", property: "3-bed terrace · M14", rooms: "4 rooms", score: 92 },
    { id: "r2", property: "2-bed semi · M20", rooms: "3 rooms", score: 78 },
    { id: "r3", property: "4-bed HMO · OL8", rooms: "5 rooms", score: 71 },
  ],
};

/* 3a · What we do for you -------------------------------------------------- */

export interface DeliveryStep {
  id: string;
  spine: string;
  title: string;
  meta: string;
  detail: string;
  tone: "teal" | "orange";
}

export const whatWeDo = {
  eyebrow: "What we do for you",
  title: "Sourced data, managed people, a leased home, real support",
  lead: "Four steps, in order. Hover or tap a step.",
  steps: [
    {
      id: "data",
      spine: "Data",
      title: "We source the data",
      meta: "Land Registry \u00b7 ONS \u00b7 Environment Agency \u00b7 Police.uk",
      detail:
        "A live feed of sourced listings, scored against your strategy, from a market scanned whole \u2014 every analytical figure travelling with its source, date and licence.",
      tone: "teal",
    },
    {
      id: "people",
      spine: "People",
      title: "We bring the people in",
      meta: "A managed service, not a directory you browse",
      detail:
        "We appoint the vetted contractors, valuers and partners that turn a house into a leased supported home, and we manage them \u2014 you never have to find them.",
      tone: "teal",
    },
    {
      id: "lease",
      spine: "Lease",
      title: "The home is leased",
      meta: "5 year+ institutional lease",
      detail:
        "5 year+ FRI, CPI or internal repairing lease, paid monthly in advance. Income is lease-backed: the lease is a commitment, not a promise of any particular return \u2014 capital remains at risk.",
      tone: "teal",
    },
    {
      id: "support",
      spine: "Support",
      title: "The people living there are supported",
      meta: "Elevate Supported Living",
      detail:
        "Elevate delivers the care and support, with safeguarding at the centre of every placement. A human housing officer confirms every match. Care Quality Commission registration is currently in progress.",
      tone: "orange",
    },
  ] satisfies DeliveryStep[],
};

/* 3b · Your AI investment team --------------------------------------------- */

export interface Specialist {
  id: string;
  name: string;
  role: string;
  icon: "search" | "calculator" | "heart-handshake";
  body: string;
}

export const aiTeam = {
  eyebrow: "Your AI investment team",
  title: "Not a chatbot \u2014 a team that does the work.",
  lead: "Three specialists run the analysis behind every deal \u2014 Petra finds the right homes, Peter prices them, and Pippa scores their impact, with every figure traceable to a named public dataset. And you can talk to them directly inside the platform.",
  specialists: [
    {
      id: "petra",
      name: "Petra",
      role: "Finds the deals",
      icon: "search",
      body: "Scans the whole market for the best-fit opportunities \u2014 strong equity, the right type, high verified tenant demand \u2014 and flags red flags and oversupply before you commit.",
    },
    {
      id: "peter",
      name: "Peter",
      role: "Runs the numbers",
      icon: "calculator",
      body: "Valuation and comparables, net yield, a single sourced all-in cost estimate, financing, stress tests and 10-year projections \u2014 with the downside shown via a financing stress test.",
    },
    {
      id: "pippa",
      name: "Pippa",
      role: "Scores the impact",
      icon: "heart-handshake",
      body: "Puts a number on the good: lives housed, social impact and impact-per-pound \u2014 so you can choose the home that changes the most lives, not just the balance sheet.",
    },
  ] satisfies Specialist[],
  flow: [
    { id: "finds", label: "Petra finds it", tone: "teal" as const },
    { id: "prices", label: "Peter prices it", tone: "teal" as const },
    { id: "proves", label: "Pippa proves it", tone: "orange" as const },
  ],
  workedExampleLabel: "Peter\u2019s analysis",
  disclaimer:
    "The team surfaces analysis to help you decide \u2014 it isn\u2019t financial, legal or tax advice, and a real human team is always on hand. Every figure is drawn from a named dataset or shown as a clearly-labelled estimate.",
};

/* 3c · Five data layers ---------------------------------------------------- */

export interface DataLayer {
  id: string;
  layer: string;
  /** Named providers only — no unsourced claims. */
  sources: string[];
  gives: string;
}

export const dataLayers = {
  eyebrow: "The data layers",
  title: "Five data layers, one question",
  lead: "Most property platforms hold one layer: listings. We hold five, joined together — which is what makes the question below answerable at all.",
  layers: [
    {
      id: "listings",
      layer: "Property listings",
      sources: ["Estate agent feeds and listing providers"],
      gives: "Address, price, bedrooms, description, images, status",
    },
    {
      id: "planning",
      layer: "Planning intelligence",
      sources: ["Planning Portal", "Council planning APIs"],
      gives: "C2, C3 and HMO use classes, applications, refusals, conversions",
    },
    {
      id: "land-registry",
      layer: "Land Registry",
      sources: ["HM Land Registry"],
      gives: "Owner, purchase price, date purchased, title number, tenure",
    },
    {
      id: "care-quality",
      layer: "Care quality",
      sources: ["CQC", "Ofsted"],
      gives: "Registered services, ratings, provider, capacity, operator",
    },
    {
      id: "company",
      layer: "Company data",
      sources: ["Companies House"],
      gives: "Entity, directors, filings, group structure",
    },
  ] satisfies DataLayer[],
  query: "Show me houses within three miles of an Outstanding CQC care home.",
  answer:
    "No property portal can answer that. Ours can, because the layers are joined.",
};

export interface MatchFactor {
  id: string;
  label: string;
  /** Filled dots out of five. */
  filled: number;
}

export const matchFactors: MatchFactor[] = [
  { id: "location", label: "Location fit", filled: 5 },
  { id: "rooms", label: "Room count", filled: 4 },
  { id: "amenities", label: "Amenities · transport", filled: 4 },
  { id: "support", label: "Support model fit", filled: 5 },
];

export const matchOverall = "92%";

/* 4 · Demand heat maps & property intelligence ---------------------------- */

export const supportFilters = [
  { id: "all", label: "All support types" },
  { id: "learning-disability", label: "Learning disability" },
  { id: "mental-health", label: "Mental health" },
  { id: "young-people", label: "Young people" },
  { id: "homelessness", label: "Homelessness" },
];

/** Illustrative segmentation, used only to demonstrate the filter behaviour. */
/** Ids reference commissioningAuthorities in src/content/demand.ts. */
export const filterNodeIds: Record<string, string[]> = {
  "learning-disability": [
    "manchester",
    "salford",
    "county-durham",
    "lancashire",
    "newcastle-upon-tyne",
    "derby",
  ],
  "mental-health": [
    "liverpool",
    "wirral",
    "nottingham",
    "middlesbrough",
    "sunderland",
    "lincolnshire",
  ],
  "young-people": [
    "manchester",
    "hartlepool",
    "stockton-on-tees",
    "north-east-lincolnshire",
    "cumberland",
  ],
  homelessness: [
    "manchester",
    "liverpool",
    "salford",
    "east-riding-of-yorkshire",
    "westmorland-and-furness",
    "lancashire",
  ],
};


export interface ReportRow {
  id: string;
  row: string;
  source: string;
}

export const propertyReportRows: ReportRow[] = [
  { id: "comparables", row: "Sold comparables", source: "Land Registry" },
  { id: "rent", row: "Rent trend", source: "ONS" },
  { id: "epc", row: "EPC · floor area", source: "EPC Register" },
  { id: "amenities", row: "Walkable amenities", source: "OpenStreetMap" },
  { id: "flood", row: "Flood risk", source: "Environment Agency" },
  { id: "crime", row: "Neighbourhood crime", source: "Police.uk" },
];

export const propertyReportNote =
  "Public data used under licence · these publishers do not endorse this platform.";

/* 5 · Portals ------------------------------------------------------------- */

export interface Portal {
  id: string;
  label: string;
  see: string;
  do: string;
  get: string;
  /** Column headings shown in the LiveWindow preview. */
  columns: string[];
  rows: { id: string; cells: string[] }[];
}

export const portals: Portal[] = [
  {
    id: "investor",
    label: "Investor",
    see: "Portfolio, income and impact against every home you hold, with documents attached.",
    do: "Drill into a property, download the lease pack, export a quarterly statement.",
    get: "A five-year-plus lease position you can report on without chasing a managing agent.",
    columns: ["Portfolio", "Income", "Impact", "Documents"],
    rows: [
      { id: "p1", cells: ["12 homes · North West", "£— pcm", "38 rooms supported", "Lease pack"] },
      { id: "p2", cells: ["7 homes · West Midlands", "£— pcm", "21 rooms supported", "Lease pack"] },
    ],
  },
  {
    id: "housing-association",
    label: "Housing Association",
    see: "Stock, lease terms and tenancy status in one list, filtered to your patch.",
    do: "Accept a lease, log a tenancy, raise a repair against the right property record.",
    get: "Stock you can hold with confidence, and a tenancy record your auditors can follow.",
    columns: ["Property", "Lease term", "Tenancy", "Status"],
    rows: [
      { id: "h1", cells: ["3-bed terrace · M14", "5 years", "Occupied", "Live"] },
      { id: "h2", cells: ["2-bed semi · M20", "7 years", "Void", "Ready"] },
    ],
  },
  {
    id: "local-authority",
    label: "Local Authority",
    see: "Every brief you have sent, the homes matched to it and the evidence behind each match.",
    do: "Send a brief, compare ranked matches, confirm or reject a placement with a reason.",
    get: "Reporting your committee will accept, because each decision carries its audit trail.",
    columns: ["Brief", "Matched", "Top score", "Decision"],
    rows: [
      { id: "l1", cells: ["LD · 4 rooms", "6 homes", "92%", "Awaiting"] },
      { id: "l2", cells: ["MH · 3 rooms", "4 homes", "78%", "Confirmed"] },
    ],
  },
  {
    id: "care-support",
    label: "Care & Support",
    see: "Placements and rotas alongside the home they belong to, not in a separate system.",
    do: "Accept a referral, staff the rota, record a support note against the placement.",
    get: "One record per person, so support and housing stop drifting apart.",
    columns: ["Placement", "Home", "Rota", "Status"],
    rows: [
      { id: "c1", cells: ["Referral 0418", "3-bed terrace · M14", "2 waking", "Staffed"] },
      { id: "c2", cells: ["Referral 0421", "4-bed HMO · OL8", "1 waking · 1 sleep", "Open shift"] },
    ],
  },
];

/* 6 · Governance ---------------------------------------------------------- */

export const governance = {
  eyebrow: "Governance & audit trail",
  title: "Every match, confirmation and placement is logged and exportable.",
  lines: [
    "Each match records the factors that produced it, the version of the model that ranked it and the officer who confirmed it.",
    "Nothing is deleted. A rejected match keeps its reason, so a pattern of rejections can be examined rather than lost.",
    "Exports are produced in a fixed schema for case-management systems and for committee papers.",
    "Board-ready exports · social value reporting (HACT model, once live).",
  ],
};
