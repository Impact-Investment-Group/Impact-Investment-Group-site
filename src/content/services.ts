/**
 * Copy for /platform — "Our Services" in the navigation.
 *
 * Transcribed from the old production page at iip-web.onrender.com/platform and
 * then cut hard. The originals ran to four and five lines each; what is here is
 * one line per idea, with the words worth seeing marked for emphasis.
 *
 * Emphasis is data, not markup — `{ t, em }` inside a segment array — so a
 * sentence and its bolding change in the same place. `ink` is bold in the
 * section's strongest text colour, `accent` is bold orange.
 */

export type Seg = string | { t: string; em: "ink" | "accent" };

export const servicesHero = {
  eyebrow: "Our services",
  title: "Find it, price it, match it.",
  lead: "One platform, from search to supported home.",
  summary: [
    "We source UK residential property, price every home against ",
    { t: "named public data", em: "ink" as const },
    ", and follow it into ",
    { t: "managed supported housing", em: "accent" as const },
    " — every figure sourced, or honestly blank.",
  ] satisfies Seg[],
  image: {
    src: "/images/platform-finder.webp",
    alt: "The Property Finder inside the platform: a plain-language search box, matching property cards with beds, rent and gross yield, and an investor pack export panel.",
    caption:
      "Real product UI — the Property Finder. Figures shown are illustrative review data, not live listings.",
  },
};

/** Four steps. One line each — the old page gave each of them a paragraph. */
export const steps = [
  {
    id: "search",
    image: "/images/steps/search.webp",
    name: "Search",
    body: "Describe the home you need in plain English. See matching properties, the map and local demand side by side.",
    accent: "teal" as const,
  },
  {
    id: "assess",
    image: "/images/steps/assess.webp",
    name: "Assess",
    body: "See the numbers behind every home. Each figure is sourced, labelled as an estimate or left blank.",
    accent: "orange" as const,
  },
  {
    id: "reserve",
    image: "/images/steps/reserve.webp",
    name: "Reserve",
    body: "Enquire about a home and keep the paperwork, updates and next steps together.",
    accent: "white" as const,
  },
  {
    id: "managed",
    image: "/images/steps/managed.webp",
    name: "Managed",
    body: "Rhema holds the lease, Elevate delivers the care — and the home reaches someone who needs it.",
    accent: "teal" as const,
  },
];

/** The tools explain property, costs and housing need. */
export const toolsEyebrow = "The platform, live";
export const toolsHeading = "Find it. Price it. Match it.";
export const toolsLead = "Connected tools for property, costs and housing need.";

export interface WorkflowStep {
  id: string;
  /** The tool headline. */
  claim: string;
  body: string;
  /** The tool or property this step happens in. Two or three words. */
  chip: string;
  accent: "teal" | "orange";
}

export const workflow: WorkflowStep[] = [
  {
    id: "property",
    claim: "Find suitable homes.",
    body: "Describe the home you need. Search the sourced market for properties that fit your brief.",
    chip: "Property Finder",
    accent: "teal",
    // was: "Scans the sourced market for homes that fit your brief."
  },
  {
    id: "investment",
    claim: "Understand the figures.",
    body: "Compare property valuations and costs against named public data.",
    chip: "Every figure traceable",
    accent: "orange",
    // was: "Runs the valuation and cost work on named public data."
  },
  {
    id: "support",
    claim: "Connect property and need.",
    body: "Explore the housing demand around a property and review its social impact in plain terms.",
    chip: "Impact score",
    accent: "teal",
    // was: "Scores the social impact of every home the platform offers."
  },
];

/**
 * The Demand Map, which is NOT one of the three analysts.
 *
 * It was a tool of its own in the old three-stop layout and it still has to be
 * named on this page — it is the thing that shows where supported housing is
 * actually needed, and the honesty of it (public figures first, estimates
 * labelled, blanks left blank) is a selling point, not a footnote. It sits
 * separately from the three tools.
 */
export const workflowFooter =
  "The Demand Map helps you explore where supported housing is needed, town by town. Public figures come first, estimates are labelled and unknowns stay blank.";

/** Not optional. The tools provide analysis, and the page has to say so. */
export const aiTeamNote =
  "Analysis, not financial advice. Every figure is sourced or a labelled estimate.";

export const differenceHeading = "Longer is not always stronger.";
export const differenceLead =
  "The sector has learnt that a long lease alone cannot make supported housing sustainable. It also takes evidence, clear accountability and the freedom to respond when circumstances change.";
export const compareUpdated = "Updated 2 June 2026";

export const differenceStory = [
  {
    id: "past",
    number: "01",
    eyebrow: "The past failures",
    title: "Long leases were treated as proof of security.",
    body: "Long commitments could outlast the demand, funding and working assumptions behind them. When circumstances changed, there was little room to respond.",
    points: [
      "Homes secured before local demand was properly evidenced",
      "Housing, care and asset management working separately",
      "Risk carried forward instead of reviewed as conditions changed",
    ],
    tone: "orange" as const,
  },
  {
    id: "lessons",
    number: "02",
    eyebrow: "The lessons learnt",
    title: "A lease only works when the model around it works.",
    body: "Local need, public funding, regulation and people's circumstances all change. A sustainable model needs regular reviews and shared responsibility.",
    points: [
      "Start with evidence of need, not simply an available property",
      "Keep the investor, leaseholder, provider and care team connected",
      "Review the model regularly instead of relying on old assumptions",
    ],
    tone: "white" as const,
  },
  {
    id: "solution",
    number: "03",
    eyebrow: "Our sustainable solution",
    title: "Five-year-plus leases, renewed on evidence.",
    body: "Our leases run for five years or more on full repairing and insuring or internal repairing terms, with CPI-linked rent and renewal at the end of the term: a clear point to review demand, funding and policy while residents keep the stability of their home.",
    points: [
      "Full repairing and insuring (FRI) or internal repairing terms",
      "Rent linked to CPI for the life of the lease",
      "Renewal at the end of the term, decided on the evidence of demand",
    ],
    tone: "teal" as const,
  },
];

/**
 * `strip` is the whole line the comparison strip prints for that side, verbatim.
 * Wave 567, Callum, 7 Oct 2026 (R567-2): the legacy side names no number of
 * years, and ours says five years plus and the terms it runs on.
 */
export const leaseComparison = [
  {
    id: "legacy",
    label: "Typical legacy model",
    term: "One long fixed term",
    strip: "One long fixed term · the legacy model",
    title: "One fixed commitment",
    detail:
      "The original assumptions can remain in place long after demand, policy or operating conditions have moved on.",
    tone: "orange" as const,
  },
  {
    id: "ours",
    label: "Our model",
    term: "5 years+",
    strip: "5 years+ · FRI or internal repairing · CPI-linked · renewable",
    title: "Renewed on evidence",
    detail:
      "Five years or more on FRI or internal repairing terms, CPI-linked, with renewal at the end of the term reviewed against current demand, performance and risk.",
    tone: "teal" as const,
  },
];

export const sustainabilityPrinciples = [
  {
    id: "agility",
    title: "Agility",
    detail: "We can respond when commissioning, funding or local demand changes.",
  },
  {
    id: "risk",
    title: "Risk mitigation",
    detail: "We review the evidence and performance before carrying risk forward.",
  },
  {
    id: "resilience",
    title: "Long-term resilience",
    detail: "Each renewal is a fresh, informed decision—not an assumption made decades earlier.",
  },
];

/** Published figures. Each carries its publisher and date; none may lose it. */
export const demandFigures = [
  {
    id: "registers",
    value: "1.34m",
    label: "households on local-authority housing registers",
    source: "gov.uk · at 31 March 2025",
    accent: "orange" as const,
  },
  {
    id: "ta",
    /*
     * Updated from 131,140. That figure had no date on it and had gone stale —
     * the current published number is 134,210 at 31 December 2025, from the
     * quarterly statutory homelessness release. It is quoted on /the-problem
     * too; if one moves, BOTH move, or the site contradicts itself.
     */
    value: "134,210",
    label: "households in temporary accommodation",
    source: "gov.uk · at 31 December 2025",
    accent: "teal" as const,
  },
  {
    id: "spend",
    value: "£2.7bn",
    label: "council spend on temporary accommodation",
    source: "gov.uk · 2024–25",
    accent: "white" as const,
  },
];

export const servicesClose = {
  title: "Every figure, sourced — or honestly blank.",
  /*
   * "Register here to request access" is the meaning, but it is far too long
   * for a pill — it wraps to two lines at every width below a desktop. Split
   * in two instead: the button carries the action and the line beneath it
   * carries the consequence. Both halves survive, neither is cramped.
   */
  cta: "Register for Access",
  ctaNote: "Register to join the queue for platform access.",
};

/** Capital-at-risk wording, verbatim from the old page. Never shortened. */
export const capitalAtRisk =
  "Capital at risk. The Impact Investment Platform provides property sourcing, deal packaging and managed investment services, not financial, legal, tax, or mortgage advice. Investing into property on the platform is also a direct investment into the lives of the people housed by Elevate Supported Living.";
