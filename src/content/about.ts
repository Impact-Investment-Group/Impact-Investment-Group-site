import { charityPledge } from "@/content/charity";
import { closingBeats, closingStrapline } from "@/content/site";

/** Copy for /about. Edit here — never inside JSX. */

/*
 * THE PAGE'S FOUR SECTIONS.
 *
 * Client copy, supplied whole and used verbatim — the section names are his
 * and are set as the H2s rather than being paraphrased into something
 * house-styled. Everything the page carried before is still here; it now sits
 * inside whichever of these four sections it answers:
 *
 *   Who We Are ......... the director and the team context
 *   Why We Exist ....... the vision and mission cards
 *   What We Do ......... the group structure, partner types, technology
 *                        partners and the commissioning context
 *   Why Partner ........ the values, how a partnership starts, what we ask
 *
 * The previous hero statement is retired but kept, because it is the sharpest
 * sentence written for this page and may be wanted again:
 *
 *   "Somebody is waiting in a hospital bed, a hostel or a placement that was
 *    never right for them — not because the money is missing, but because
 *    nobody joined the home, the lease and the support together. That is the
 *    work we do."
 */

export const whoWeAre = {
  eyebrow: "About us",
  title: "Who We Are",
  lead: "Connecting property, investment and housing demand to transform lives.",
  body: [
    "Impact Investment Group is building a national property and housing ecosystem that connects investors, landlords and developers with local authorities, housing associations, and organisations delivering care and support.",
    "We combine property expertise, sector relationships and technology to help create safe, suitable and sustainable homes for individuals, families and communities across the UK.",
  ],
};

export const whyWeExist = {
  eyebrow: "Purpose",
  title: "Why We Exist",
  lead: "The UK does not simply have a shortage of property. It has a disconnected housing system.",
  body: [
    "Local authorities, housing associations, care providers and support organisations need access to suitable homes, while investors, landlords and developers need clearer information about demand, partnerships and long-term property opportunities.",
    "Our mission is to bring these organisations together, increase the supply of suitable housing and ensure property investment is driven by genuine local need.",
  ],
};

export const whatWeDo = {
  eyebrow: "The ecosystem",
  title: "What We Do",
  lead: "Our ecosystem connects every stage of the housing journey.",
  body: [
    "We identify housing demand, source and match suitable properties, connect investment partners, support leases and management arrangements, and coordinate with housing, care and support organisations.",
    "Through our developing AI-powered platform, partners will be able to view housing demand, advertise properties, identify opportunities and build the relationships required to deliver more homes nationally.",
  ],
};

export const whyPartner = {
  eyebrow: "Partnership",
  title: "Why Partner With Us?",
  body: [
    "With more than 30 years of experience across property, housing, care and support, we understand both the investment opportunity and the responsibility involved in providing homes for people who need them.",
    "We are building more than an estate agency or property platform. We are creating a collaborative national network focused on delivering measurable social impact, sustainable partnerships and responsible investment.",
  ],
  /**
   * The same three-part line the homepage hero is built on — now split, because
   * on /about it IS the heading rather than a strapline under one. Rejoin with
   * a space to get the original sentence back.
   */
  /* Both re-exported from content/site.ts — the line is site-wide and every
     page closes on it. Do not paste a second copy in here. */
  strapline: closingStrapline,
  straplineBeats: closingBeats,
  cta: "Register Your Interest",
};

export const visionMission = [
  {
    id: "vision",
    label: "Our vision",
    rule: "teal" as const,
    title: "A suitable home for everyone who needs support to keep one.",
    body: "Supported housing that is chosen on evidence, held for the long term, and good enough that nobody has to move again for the wrong reasons.",
  },
  {
    id: "mission",
    label: "Our mission",
    rule: "orange" as const,
    title: "Join up supply, support and capital in one accountable chain.",
    body: "We source and convert homes to a commissioner's brief, place them with a housing association on a long lease, and wrap regulated care and support around the household — with every step recorded.",
  },
];

export const values = [
  {
    id: "trustworthy",
    icon: "shield" as const,
    title: "Trustworthy",
    body: "Registrations, indemnity and redress are published. Every claim on this site carries its source or it does not appear.",
  },
  {
    id: "professional",
    icon: "badge" as const,
    title: "Professional",
    body: "Procurement-ready paperwork, named contacts and reporting that stands up to a committee, not just a pitch.",
  },
  {
    id: "impactful",
    icon: "target" as const,
    title: "Impactful",
    body: "We measure what happens to people in the homes — placements made, tenancies sustained, voids avoided.",
  },
  {
    id: "purposeful",
    icon: "heart" as const,
    title: "Purposeful",
    body: "Long-hold capital, not a flip. The return depends on the household staying housed and well supported.",
  },
];

export interface Director {
  /** Optional 4:5 crop for the tall lead card. Falls back to `portrait`. */
  portraitLead?: string;
  name: string;
  role: string;
  initials: string;
  /** Real photograph only. Left undefined until one is supplied. */
  portrait?: string;
  bio?: string;
  /** Short credential lines, as supplied by the client. */
  credentials?: string[];
  /** lucide-react icon name, resolved in the component. */
  icon?: string;
  /** Orange marks the lead only — the accent has to stay scarce. */
  accent?: "teal" | "orange";
}

/** Names, roles, experience and portraits supplied by Israel. Updated 5 November 2026. */
export const team: Director[] = [
  {
    name: "Israel Silgram",
    portrait: "/images/team/israel-silgram.webp",
    role: "Impact Director",
    initials: "IS",
    icon: "HandHeart",
    accent: "orange",
    credentials: [
      "Care professional",
      "30+ years scaling social-impact businesses",
      "Property-led care and support",
    ],
    /*
     * Condensed from the four-sentence bio on the old production site, which is
     * kept verbatim below. Nothing in it was contradicted — the sentences were
     * merged and the repetition ("dynamic and highly skilled", "significant
     * strategic and operational success") dropped.
     *
     * THE ORIGINAL:
     *   "Israel Silgram is a passionate motivated leader and is committed to
     *    seeing the quality of vulnerable people's lives improve. He is a
     *    dynamic and highly skilled social entrepreneur with proven experience
     *    in both children and adult social care. A business leader with
     *    significant strategic and operational success within children and
     *    adult services, across commercial businesses and charities."
     */
    bio: "A social entrepreneur with 30+ years building and scaling care businesses across children's and adult services — and the reason this platform is built around people, not stock.",
    /** The existing 4:5 crop remains available for the tall card. */
    portraitLead: "/images/team/israel-silgram-lead.webp",
  },
  {
    name: "Maria Avallone",
    portrait: "/images/team/maria-avallone.webp",
    role: "Asset Manager",
    initials: "MA",
    icon: "House",
    credentials: ["Children's and adult services", "20+ years managing social-impact businesses"],
  },
  {
    name: "Laurie Hale",
    portrait: "/images/team/laurie-hale.webp",
    role: "Housing Manager",
    initials: "LH",
    icon: "House",
    credentials: [
      "20+ years in residential property management",
      "Landlord & investor relations, portfolio growth, compliance and asset management",
    ],
  },
  {
    name: "Josh Howard",
    portrait: "/images/team/josh-howard.webp",
    role: "Partnership Manager",
    initials: "JH",
    icon: "Handshake",
    credentials: ["15+ years experience in strategic partnership management and contract growth"],
  },
  {
    name: "Callum Saxon",
    portrait: "/images/team/callum-saxon-v2.webp",
    role: "Chief Technology Officer",
    initials: "CS",
    icon: "BrainCircuit",
    credentials: [
      "BSc Computer Science",
      "Special Recognition Award-winning technologist",
      "5+ years professional experience",
    ],
  },
  {
    name: "Tommy Lam",
    portrait: "/images/team/tommy-lam.webp",
    role: "Software Engineer & AI Specialist",
    initials: "TL",
    icon: "Sparkles",
    credentials: ["Software engineering · AI & LLMs", "4 years professional experience"],
  },
];

/** The lead, kept as its own export so callers do not index into the array. */
export const director: Director = team[0]!;

export const teamEyebrow = "Who we are";
export const teamTitle = "The team";

/**
 * Collective proof shown beside the equal-height leadership rows on /about.
 * Kept here with the rest of the About copy so wording can change without
 * touching the layout.
 */
export const leadershipCapability = {
  eyebrow: "Collective capability",
  title: "Key Skills & Experience",
  experience: "20+",
  experienceLabel: "years of combined housing industry experience",
  lead: "Housing, care, investment, operations and technology in one team.",
  impacts: [
    {
      title: "Housing & care delivery",
      body: "Supported housing, asset management and children's and adult services.",
    },
    {
      title: "Partnerships & growth",
      body: "15+ years experience in strategic partnership management and contract growth.",
    },
    {
      title: "Operational leadership",
      body: "30+ years building and scaling social-impact organisations.",
    },
    {
      title: "Technology & AI",
      body: "In-house platform, software, AI and LLM delivery.",
    },
  ],
};

export const teamContext =
  "The team works across property, investment and care: Impact Investment Group sources and packages the homes, Rhema Social Impact Group holds the lease and manages compliance and repairs, and Elevate Supported Living delivers the care with a human allocation gate at the centre of every placement.";

export const teamNote = "Further team details to follow.";

export const groupStructure: {
  id: string;
  name: string;
  role: string;
  body: string;
  qualifier?: string;
}[] = [
  {
    id: "iig",
    name: "Impact Investment Group",
    role: "Sources & packages · runs the investor community",
    body: "Finds and structures the homes against published commissioning briefs, and brings the capital that funds them.",
  },
  {
    id: "rhema",
    name: "Rhema Social Impact Group",
    role: "Holds the head lease · manages the home",
    body: "Holds the head lease — a 5 year+ FRI, CPI or internal repairing lease — and under-leases each home to a UK Registered Provider. Responsible for condition, compliance and repairs.",
  },
  {
    id: "elevate",
    name: "Elevate Supported Living",
    role: "Delivers the care & support",
    body: "Delivers the care and support, and runs a human allocation gate at the centre of every placement.",
    qualifier: "Care Quality Commission registration is currently in progress.",
  },
];

export const cashFlow = {
  label: "Cash flow",
  steps: ["Housing association", "Rhema", "Investor"],
};

export const partnerTypes = [
  { id: "nhs", partner: "NHS", detail: "Discharge to a suitable home, not a hospital bed" },
  {
    id: "ha",
    partner: "Housing Associations",
    detail: "Take the lease, hold the tenancy",
  },
  { id: "councils", partner: "Councils", detail: "Commission placements, set the brief" },
  {
    id: "care",
    partner: "Care Providers",
    detail: "Deliver support around the household",
  },
  { id: "investors", partner: "Investors", detail: "Fund the homes, hold them long term" },
  { id: "developers", partner: "Developers", detail: "Build and convert to the brief" },
];

export const technologyPartners = {
  partner: "Technology partners",
  detail:
    "Data providers and case-management systems the platform connects to — HM Land Registry · ONS · EPC Register · postcodes.io · OpenStreetMap · Environment Agency · Police.uk",
  note: "Public data used under licence. These publishers do not endorse this platform.",
};

export const commissioningContext = {
  eyebrow: "Commissioning context — not partnerships",
  title: "Briefs we read",
  count: "18",
  of: "of ~296 authorities",
  body: "Their published briefs shape what we source.",
  disclaimer: "This is not a partnership, endorsement or approval by any council.",
};

export const partnershipSteps = [
  { id: "1", title: "Tell us what you need or what you hold" },
  { id: "2", title: "Due diligence, both ways" },
  { id: "3", title: "A pilot on one home or one brief" },
  { id: "4", title: "Reporting from the first placement" },
];

export const partnerAsk = {
  title: "What we ask of partners",
  items: [
    "Registered entity",
    "Relevant regulation and insurance",
    "Named contact",
    "Willingness to be reported on",
  ],
};

export const teasers = [
  {
    id: "impact",
    eyebrow: "Social impact",
    title: "The scale of the problem, with every figure sourced.",
    action: "See the numbers",
    to: "/the-problem" as const,
  },
  {
    id: "technology",
    eyebrow: "Technology",
    title: "How matching, demand mapping and reporting actually work.",
    action: "Explore the platform",
    to: "/platform" as const,
  },
];

/*
 * Blocks lifted from the old production About page (iip-web) so the page keeps
 * the material that only lived there. Copy is that site's, verbatim.
 */

/** The three companies, worded as the old site words them — shorter. */
/**
 * The three companies, said as STATEMENTS rather than descriptions.
 *
 * The headline of each card is now the claim — "We find the home." — and the
 * company name is the credit under it. That inversion is the point: a reader
 * scanning three cards reads three verbs and understands the chain, instead of
 * reading three company names they have never heard of and having to work it
 * out from the body copy.
 *
 * `claim` is the only line most people will read. Keep it under six words, keep
 * the full stop, and keep the subject as "we" — the moment one of them says
 * "Rhema holds…" the row stops being one voice.
 *
 * ⚠️ `detail` IS NOT DECORATION. Between them the three detail lines carry the
 * lease term, the fact that the under-lease goes to a UK Registered Provider,
 * and the human allocation gate. Those are the three things that make the
 * structure defensible. Shorten them if you must; do not remove them.
 *
 * The original, longer body copy is kept below each entry, because it is the
 * wording that was signed off and this is a condensation of it.
 */
export interface ChainStep {
  id: string;
  /** The headline. Six words or fewer, with a full stop. */
  claim: string;
  name: string;
  detail: string;
  /** File in public/images/chain/. Transparent, already brand-coloured. */
  icon: string;
}

export const accountableChain: ChainStep[] = [
  {
    id: "iig",
    claim: "We find the home.",
    name: "Impact Investment Group",
    detail: "Sourced and packaged against a published commissioning brief.",
    icon: "/images/chain/source.webp",
    // was: "Sources and packages every deal, and operates the platform."
  },
  {
    id: "rhema",
    claim: "We hold the lease.",
    name: "Rhema Social Impact Group",
    detail: "A 5 year+ head lease, under-leased to a UK Registered Provider.",
    icon: "/images/chain/lease.webp",
    // was: "Holds the head lease — a 5 year+ FRI, CPI or internal repairing
    //       lease — and under-leases each home to a UK Registered Provider."
  },
  {
    id: "elevate",
    claim: "We look after the people.",
    name: "Elevate Supported Living",
    detail: "Care and support delivered, with a human deciding every placement.",
    icon: "/images/chain/care.webp",
    // was: "Delivers the care and support, and runs the human allocation gate
    //       at the centre of every placement."
    //      qualifier: "Care Quality Commission registration is currently in
    //       progress." — still stated in the Contact FAQ, which is where the
    //       regulatory position is set out in full.
  },
];

/** Both paragraphs are compliance text. Verbatim from the old site. */
/**
 * The compliance notice under the chain. ONE paragraph, 48 words.
 *
 * It replaced two paragraphs totalling 85 words. Five claims had to survive the
 * cut and all five are still here, in this order:
 *
 *   1. what the service IS      sourcing, deal packaging, managed investment
 *   2. what it is NOT           not financial, legal, tax or mortgage advice
 *   3. FCA position             not authorised or regulated
 *   4. scheme status            not a Collective Investment Scheme
 *   5. the instruction          take independent professional advice
 *
 * The entity names are load-bearing and are NOT interchangeable: the PLATFORM
 * provides the services, the GROUP is the one that is not FCA regulated. Do not
 * merge them into one subject to save a few words.
 *
 * ⚠️ CAPITAL AT RISK IS NOT STATED HERE, and never was. It lives in the site
 * footer and in the Contact FAQ. That is only safe while the footer is on every
 * page — if this section is ever lifted onto a page without it, the risk
 * warning has to come with it.
 *
 * `emphasis` is the list of substrings set in bold navy. All four are negatives:
 * a disclosure nobody's eye stops on is not much of a disclosure.
 *
 * THE ORIGINAL, verbatim, in case any of this is ever queried:
 *
 *   "The Impact Investment Platform provides property sourcing, deal packaging
 *    and managed investment services, not financial, legal, tax, or mortgage
 *    advice. Investing into property on the platform is also a direct
 *    investment into the lives of the people housed by Elevate Supported
 *    Living."
 *
 *   "Impact Investment Group is not authorised or regulated by the Financial
 *    Conduct Authority (FCA), and the platform is not a Collective Investment
 *    Scheme. Take independent professional advice before you invest."
 *
 * The only sentence dropped is the second of the first paragraph — "a direct
 * investment into the lives of the people housed by Elevate Supported Living".
 * It is a marketing line, not a disclosure, and it was the reason the block read
 * as prose rather than as a notice.
 */
export const chainNotice =
  "The Impact Investment Platform provides property sourcing, deal packaging and managed investment services — not financial, legal, tax or mortgage advice. Impact Investment Group is not authorised or regulated by the Financial Conduct Authority (FCA), and the platform is not a Collective Investment Scheme. Take independent professional advice before you invest.";

/** Substrings of `chainNotice` set in bold navy. Must match it exactly. */
export const chainNoticeEmphasis = [
  "not financial, legal, tax or mortgage advice",
  "not authorised or regulated by the Financial Conduct Authority (FCA)",
  "not a Collective Investment Scheme",
];

/*
 * ⚠️ NOT RENDERED ON /about ANY MORE.
 *
 * These two lines used to run in small grey type directly under the orange
 * strapline, and most of them said the same thing it did — "Building Homes" is
 * "Providing Homes", "Changing Lives" is "Transforming Lives". Stacked, the two
 * blocks read as one long block of near-repetition, which is what made the
 * closing section feel wordy.
 *
 * They are kept because they are approved brand lines and are used elsewhere.
 * If they ever come back to this page they need to sit somewhere the strapline
 * is not — not directly beneath it.
 */
export const straplines = [
  "Building Homes · Changing Lives · Generating Impact.",
  "More Than Property · An Investment in Lives",
];

/**
 * The four published figures, with their sources. Every one carries a live
 * link to the publication it came from — that is the whole point of the block
 * and no figure may appear here without one.
 */
export const problemFigures = [
  {
    id: "children-ta",
    kind: "Sourced figure",
    value: "176,130",
    label: "children in temporary accommodation in England",
    source: "gov.uk · Statutory homelessness in England: Oct–Dec 2025 · at 31 December 2025",
    href: "https://www.gov.uk/government/statistics/statutory-homelessness-in-england-october-to-december-2025/statutory-homelessness-in-england-october-to-december-2025",
  },
  {
    id: "duty",
    kind: "Sourced figure",
    value: "330,410",
    label: "households owed a homelessness duty in England, 2024–25",
    source: "gov.uk · Statutory homelessness in England: financial year 2024-25",
    href: "https://www.gov.uk/government/statistics/statutory-homelessness-in-england-financial-year-2024-25/statutory-homelessness-in-england-financial-year-2024-25",
  },
  {
    id: "nhs-cost",
    kind: "A cost, not a headcount",
    value: "£102m / yr",
    label:
      "the annual NHS cost of people waiting in hospital for supported housing to be available",
    source: "Inside Housing · Lack of supported housing places costs NHS £102m per year",
    href: "https://www.insidehousing.co.uk/news/call-for-government-action-on-supported-housing-as-lack-of-spaces-costs-nhs-102m-per-year-96834",
  },
  {
    id: "2040",
    kind: "Sourced projection",
    value: "677,202",
    label: "supported homes England is projected to need by 2040",
    source: "National Housing Federation · How much supported housing will we need by 2040?",
    href: "https://www.housing.org.uk/resources/how-much-supported-housing-will-we-need-by-2040/",
  },
];

export const problemHeading = "A safe home is out of reach for hundreds of thousands.";
export const aboutHeroImage = {
  caption: "Illustrative image",
};

/**
 * Short-form versions of the four sections.
 *
 * The client's full paragraphs are still above and unchanged — these are what
 * the page renders. Each is an array of segments so individual words can be
 * emphasised: a bare string is body copy, `{ t, em: "ink" }` is bold in the
 * section's strongest text colour, `{ t, em: "accent" }` is bold orange.
 *
 * Written as data rather than as markup so the emphasis lives with the copy.
 * If a sentence changes, the bolding changes with it in the same place.
 */
export type Seg = string | { t: string; em: "ink" | "accent" };

/**
 * The condensed copy for each band — and the ONLY copy those bands render.
 *
 * ⚠️ THIS REPLACED THE `lead` + `body` PAIRS ABOVE. Every section used to run a
 * short lead sentence and then a two-paragraph body, and the lead almost always
 * restated the first line of the body. Callum asked for them joined and made
 * readable, so each section is now one or two SHORT lines and nothing else. The
 * originals are still exported above, unedited, because they are the approved
 * wording — if a claim here is ever questioned, that is what it was condensed
 * from.
 *
 * Each entry is a LIST OF LINES, not one blob. The first line renders large and
 * semibold, the rest smaller and regular — that is what stops a paragraph
 * reading as a wall. Keep the first line under ~25 words; if it needs more,
 * split it into a second line rather than letting it run.
 */
export const summaries: Record<string, Seg[][]> = {
  /*
   * ⚠️ THE ORANGE HAS TO LIVE ON THE FIRST LINE.
   *
   * `Rich` renders an accent in a small line as navy ink, so on a cream band
   * the accent goes in line one or it does not go in at all. That is why this
   * entry leads with the outcome and follows with the mechanism, rather than
   * the other way round.
   *
   * It began as a contrast rule: orange-700 was 4.1:1 on the cream and only
   * cleared AA as large text, which the first line is and the smaller ones
   * are not. Wave 295 took it to 5.78:1 and the rule survives as a
   * typographic one. The copy order below is still the right order.
   *
   * Wave 576 (10 Oct 2026): the third line is the charity pledge, from its one constant.
   */
  whoWeAre: [
    [
      "We turn property investment into ",
      { t: "safe, suitable homes", em: "accent" },
      " across the UK.",
    ],
    [
      "Connecting ",
      { t: "investors, landlords and developers", em: "ink" },
      " with ",
      { t: "councils, housing associations and care providers", em: "ink" },
      ".",
    ],
    [charityPledge],
  ],
  whyWeExist: [
    [
      "The UK doesn't just have a ",
      { t: "shortage of homes", em: "ink" },
      ". It has a ",
      { t: "disconnected housing system", em: "accent" },
      ".",
    ],
    [
      "Every organisation holds part of the picture, but very little of it connects. We bring them together so investment follows ",
      { t: "genuine local need", em: "ink" },
      ".",
    ],
  ],
  whatWeDo: [
    [
      "We start with the demand, find the right property and bring housing, investment, care and support together.",
    ],
    [
      "Our ",
      { t: "AI platform", em: "accent" },
      " will help partners see demand, list property and form the partnerships needed to deliver ",
      { t: "more homes, faster", em: "ink" },
      ".",
    ],
  ],
  /*
   * ONE line, not two. The pair this replaced ran to 28 words across two
   * paragraphs under a heading that already said "Why Partner With Us?" — and
   * on this band the three beats above it are doing the shouting, so the job of
   * this line is only to say what we are and what we are not, once.
   */
  whyPartner: [
    [
      { t: "30+ years", em: "accent" },
      " across property, housing, care and support — not an estate agency, a ",
      { t: "national network", em: "ink" },
      ".",
    ],
  ],
};

/** One accent per figure card, so the row is not four identical blue boxes. */
export const figureAccents = ["orange", "teal", "white", "teal"] as const;

/** And one per company in the chain. */
export const chainAccents = ["teal", "orange", "teal"] as const;
