/**
 * Home page copy and data. Nothing in here is invented: every figure carries
 * its published source. Illustrative product data is labelled at the panel.
 */

export interface LiveCount {
  id: string;
  value: string;
  label: string;
}

/** The quiet single line under the hero buttons. */
export const heroCounts: LiveCount[] = [
  { id: "homes", value: "188,000+", label: "homes sourced & analysed" },
  { id: "rooms", value: "618,000+", label: "potential homing opportunities" },
  { id: "areas", value: "1,693", label: "towns & areas covered" },
];

export const heroCountsSource = "live from our platform";

export interface PurposeStat {
  id: string;
  /** Figure exactly as approved. Never edit or re-round these. */
  value: string;
  label: string;
  /**
   * What the figure measures, or where it comes from. Mandatory on every card:
   * these populations overlap — someone leaving hospital may also be homeless,
   * on a waiting list and receiving support — so the basis is what stops a
   * reader treating the set as cumulative.
   */
  basis?: string;
  /** lucide-react icon name, resolved in the component. */
  icon: string;
  tone?: "teal" | "orange";
  /** True where the client has not yet supplied the number. */
  pending?: boolean;
}

/**
 * The scale of the need, as approved by the client. Every card carries a basis
 * line — these populations overlap and must never read as a running total.
 *
 * Only the 176,130 card is a published statistic with a citation; it keeps its
 * gov.uk wording exactly and is deliberately not rounded to match its
 * neighbours. The other five are the client's own market-research figures,
 * approved as approximations, and their basis lines say so.
 */
export const purposeStats: PurposeStat[] = [
  {
    id: "housing-need",
    value: "~4 million",
    label: "People affected by housing need",
    basis: "Estimate across all housing need categories",
    icon: "Users",
    tone: "orange",
  },
  {
    id: "waiting-lists",
    value: "1.6 million",
    label: "Households on social housing waiting lists",
    basis: "Combined UK housing registers",
    icon: "ClipboardList",
  },
  {
    id: "temporary-accommodation",
    value: "~150,000",
    label: "Households in temporary accommodation",
    basis: "Great Britain, latest published",
    icon: "House",
  },
  {
    id: "children-ta",
    value: "176,130",
    label: "Children in temporary accommodation",
    basis: "gov.uk · England · at 31 Dec 2025",
    icon: "Baby",
    tone: "orange",
  },
  {
    id: "homes-needed",
    // Lucide has no Crane glyph; HardHat is the build icon used site-wide.
    value: "400–430,000",
    label: "Additional homes needed each year",
    basis: "UK planning range",
    icon: "HardHat",
  },
  {
    id: "asset-requirement",
    value: "£425 billion",
    label: "Indicative asset requirement",
    basis: "Illustrative market value, not a budget",
    icon: "PoundSterling",
  },
];

/** Mandatory under the grid. The figures above measure overlapping groups. */
export const purposeStatsNote =
  "These figures measure overlapping populations and are not cumulative.";

/*
 * The AI statement placeholder is no longer rendered. It ran as a dashed chip
 * on the foot rule of Our Solution and was removed at Callum's request — a
 * visible TBC on a live page reads as an unfinished site rather than as a note
 * to ourselves.
 *
 * The wording is still outstanding from the client. When it lands it belongs in
 * Our Solution, and the export below is what to fill in:
 */
export const aiStatementPlaceholder = "[AI-DRIVEN PLATFORM STATEMENT — TBC]";

/*
 * FIGURES SUPPLIED BY THE CLIENT BUT NOT PUBLISHABLE — held here deliberately.
 *
 *   [80,000+ — SOURCE REQUIRED]  80,000+ families without settled housing.
 *
 * Credible and probably correct, but this site makes investment claims and it
 * has no citation, so it does not go on a page until it has one.
 *
 * The client's "4.2 million people affected by housing need" was held here for
 * the same reason. It is now approved and published as "~4 million" with the
 * basis line "Estimate across all housing need categories" — approximate by
 * design. Never restore the false precision of 4.2M or 4,200,000.
 *
 * Four published figures came off this page when the card set was replaced:
 * 330,410 households owed a homelessness duty (gov.uk), 677,202 supported homes
 * needed by 2040 (National Housing Federation), £102m/yr NHS cost (Inside
 * Housing) and the 430% rise in council B&B spend (LGA). All four are cited in
 * CLAUDE.md and belong on /the-problem rather than being lost.
 */

/**
 * The human + AI photography. Warm, dark, restrained teal data overlay — the
 * "human plus AI" language, brand-matched already, so no filters or duotones.
 */
export const imagery = {
  thinking: {
    src: "/images/problem-thinking.webp",
    alt: "A woman resting her chin on her hand, looking up in thought, a thought bubble above her holding a single orange question mark",
  },
  statement: {
    src: "/images/solution-speaking.webp",
    alt: "A man in a navy blazer mid-sentence, one hand open in front of him in explanation",
  },
  insight: {
    src: "/images/human-insight.jpg",
    alt: "A woman in profile looking towards a glowing teal network of connected data points",
  },
  meeting: {
    src: "/images/human-meeting.jpg",
    alt: "Four colleagues of different ages around a laptop, talking, with a teal data network across the table between them",
  },
  partnership: {
    src: "/images/human-partnership.jpg",
    alt: "Two professionals shaking hands, a teal data network linking their arms",
  },
} as const;

/*
 * The full-bleed purpose band is gone, and with it `purposeBand` — the
 * blueprint-into-street photograph and the line "From plans on a page to keys
 * in a hand." The same picture now runs ghosted behind the hero at 14%, so the
 * band was showing it a second time on the same page.
 *
 * The photograph itself survives as `public/images/hero-ground-street.webp`.
 * `public/images/our-purpose-band.png` is the 2.8 MB original and is no longer
 * referenced anywhere.
 */

/*
 * The Accountable Chain moved off the homepage: a marketing landing page is not
 * where a delivery structure belongs. Nothing was lost — About Us already told
 * the same story in more detail, so this was merged rather than duplicated.
 *
 * All three companies, their roles, the cash-flow line and the Care Quality
 * Commission qualifier live in `groupStructure` and `cashFlow` in
 * content/about.ts, rendered by <GroupDiagram /> on /about. Our Solution links
 * through via `solutionCopy.delivery`.
 */

/*
 * Named `purposeCopy` for historical reasons — the section was "Our Purpose"
 * until it was renamed to "Our Mission". The identifier is left alone
 * deliberately: renaming it would touch `purposeStats`, `purposeStatsNote` and
 * `PurposeStat` too, for no benefit anyone can see on the page.
 */
export const purposeCopy = {
  eyebrow: "Our mission",
  title: "Creating a connected ecosystem for housing, care and support.",
  /** The one phrase carried in orange. Must appear verbatim inside `title`. */
  emphasis: "connected ecosystem",
  /**
   * Client-approved mission statement. Verbatim — do not paraphrase.
   *
   * Split across two fields for PRESENTATION ONLY: `statement` and `closing`
   * joined with a single space reproduce the supplied wording exactly. The
   * last sentence carries the emotional weight of the whole section, so it is
   * set larger and heavier than the two before it. Not one word differs.
   *
   * The previous wording is retired, along with the supporting line "Every
   * home creates the opportunity for stability, independence and a better
   * future." — this statement replaced it rather than joining it.
   */
  statement:
    "Investment, property, housing, care and support often sit in disconnected systems. We’re bringing them together, so the right home reaches the right organisation.",
  /**
   * Two sentences, not one with a dash. The earlier wording —
   * "…a safe place to call home — so does every adult who needs support" —
   * hung the adult clause off the child clause, which made it read as an
   * afterthought. Giving each its own sentence, set at the same size and
   * weight, is the layout asserting that the two claims are equal rather than
   * the copy having to say so.
   */
  closing: [
    "Every child deserves a safe place to call home.",
    "So does every adult who needs support.",
  ],
};

export interface ChallengePoint {
  text: string;
  /** lucide-react icon name, resolved in the component. */
  icon: string;
  /** Orange for the human consequence, teal for the data or systems failure. */
  tone: "orange" | "teal";
}

/*
 * Tightened for length, not for meaning. Every fact in the longer version is
 * still here: the five actor types, the five failure modes, and the point that
 * the cause is the systems rather than unwillingness. Roughly a third fewer
 * words. Site copy, not client-approved wording — the verbatim client
 * statements live in `purposeCopy` and `solutionCopy`.
 *
 * The longer originals, in case any of this needs putting back:
 *
 *   lead   "Local Authorities understand demand. Housing Associations manage
 *           housing. Providers deliver care and support. Investors provide
 *           capital. Developers build homes. Each holds valuable information,
 *           and almost none of it is connected."
 *   points "Suitable properties remain empty while demand grows"
 *          "Housing opportunities are identified too late"
 *          "Investment isn't always directed where it creates the greatest impact"
 *          "Providers spend valuable time searching for accommodation"
 *          "Families and individuals wait longer than necessary for safe, suitable homes"
 *   close  "This isn't because organisations don't want to collaborate. It's
 *           because the systems available to them weren't designed to connect
 *           everyone together."
 */
export const challengeCopy = {
  eyebrow: "The problem",
  title: "The housing system is fragmented",
  lead: "Local authorities, housing associations, care and support providers, investors and developers each hold part of the picture — and almost none of it connects.",
  points: [
    {
      text: "Suitable homes sit empty while demand grows",
      icon: "House",
      tone: "orange",
    },
    {
      text: "Opportunities are identified too late",
      icon: "Clock",
      tone: "teal",
    },
    {
      text: "Investment misses where impact is greatest",
      icon: "Network",
      tone: "teal",
    },
    {
      text: "Providers lose time searching for homes",
      icon: "ClipboardList",
      tone: "orange",
    },
    {
      text: "Families and individuals wait too long for a safe home",
      icon: "Users",
      tone: "orange",
    },
  ] satisfies ChallengePoint[],
  close: "It isn’t unwillingness. The systems were never designed to connect everyone.",
};

/**
 * A line of copy carried by an icon rather than a tick. Teal marks data,
 * measurement and verification; orange marks people, homes, care and action,
 * and stays scarce.
 */
export interface IconPoint {
  text: string;
  /** lucide-react icon name, resolved in the component. */
  icon: string;
  tone: "teal" | "orange";
}

export const solutionCopy = {
  eyebrow: "Our solution",
  title: "One Platform. One Network. One Shared Purpose.",
  /** Client-approved platform description. Replaced the previous intro. */
  lead: "Impact Investment Group is building the UK's AI-powered social impact property platform, connecting investors, property owners, developers, housing associations, local authorities and organisations delivering care, support and supported living through one intelligent, integrated ecosystem.",
  /** Client-approved. The assertion the section is built around. */
  assertion:
    "Our platform works 24/7 to create seamless, intelligent matching, ensuring all partners have the resources, solutions and opportunities to deliver individual and national impact.",
  /** Client-approved mechanism statement. Verbatim — do not paraphrase. */
  mechanism:
    "Our demand-led, data-driven AI platform connects private investment with verified housing demand — intelligently aligning the right property, the right funding, the right housing association, the right local authority and the right care and support provider.",
  /**
   * The six partner types named in `lead`, pulled out as chips.
   *
   * PRESENTATION ONLY — not a rewrite. The lead sentence and the mechanism
   * sentence both name the same roster, fifteen centimetres apart, and reading
   * it twice was the section's real length problem. Setting it once as chips
   * says it plainly and gives the mechanism sentence room to be read.
   *
   * The lead itself is retained above and is still the source of truth. If the
   * chips are ever dropped, put `lead` back as a paragraph — do not leave the
   * roster unstated.
   */
  roster: [
    "Investors",
    "Property owners",
    "Developers",
    "Housing associations",
    "Local authorities",
    "Care & support providers",
  ],
  /**
   * The eight capabilities, grouped into the three stages they always were.
   *
   * Not one word of any capability changed and none was dropped — the order is
   * the order they were already in. Eight identical rows exceeded what anyone
   * holds in working memory, and the first and last were the only two being
   * read. Three named stages are three things to remember, and the sequence
   * they describe is the platform's actual order of operations.
   */
  stages: [
    {
      id: "need",
      number: "01",
      name: "See the need",
      icon: "Search",
      points: [
        { text: "Share verified housing demand", icon: "Share2", tone: "teal" },
        { text: "Identify suitable properties", icon: "Search", tone: "teal" },
      ] satisfies IconPoint[],
    },
    {
      id: "match",
      number: "02",
      name: "Make the match",
      icon: "ArrowLeftRight",
      points: [
        { text: "Connect with Housing Associations", icon: "Building2", tone: "teal" },
        {
          text: "Match Care and Support Providers with available accommodation",
          icon: "HandHeart",
          tone: "orange",
        },
        {
          text: "Introduce investors to demand-led opportunities",
          icon: "HandCoins",
          tone: "teal",
        },
      ] satisfies IconPoint[],
    },
    {
      id: "impact",
      number: "03",
      name: "Prove the impact",
      icon: "ShieldCheck",
      points: [
        { text: "Track placements", icon: "MapPin", tone: "teal" },
        { text: "Measure outcomes", icon: "TrendingUp", tone: "teal" },
        { text: "Demonstrate social impact", icon: "Heart", tone: "orange" },
      ] satisfies IconPoint[],
    },
  ],
  /**
   * The accountable chain itself now lives on About Us — `groupStructure` in
   * content/about.ts carries all three companies, the cash-flow line and the
   * CQC qualifier in more detail than the homepage ever did. This is the link
   * through to it.
   */
  delivery: "Delivered through three accountable partners —",
  deliveryLink: "read how it works",
};

/**
 * The closing band of Our Solution — brought back from the earlier IIP site.
 *
 * It answers the question the capability list leaves open: so what happens
 * when one home goes through all that. The section used to end on a grey
 * footnote; ending on this is the difference between a feature list and an
 * argument.
 *
 * THE HONESTY RULES THIS BAND IS BUILT ON — do not relax any of them:
 *
 *  1. The multiplier is OURS and is illustrative. It is a conversion model,
 *     not an outcome we have achieved, and it says so on the card.
 *  2. The 430% is the LGA's, published, and cited. It is a NATIONAL figure and
 *     is never multiplied by the number of homes — the earlier site carried a
 *     slider and this warning was printed beside it. There is no slider here,
 *     and the warning stays anyway.
 *  3. We do not publish a per-home saving. We have not evidenced one. Saying so
 *     out loud is what stops a reader inferring one from the 430%.
 */
export const impactProof = {
  eyebrow: "What one home does",
  multiplier: {
    from: { figure: "1", label: "home sourced" },
    to: { figure: "~4", label: "supported places" },
    /** Our own conversion model, described plainly so it cannot be misread. */
    basis:
      "A typical 3-bed terrace of the kind we source, a reception room converted where the home has two — four supported bedrooms.",
    disclaimer:
      "Illustrative — based on our standard conversion model, not a result we've achieved yet.",
  },
  /** Verified and cited in CLAUDE.md. Never restate it as a per-home figure. */
  cost: {
    figure: "430%",
    body: "Rise in council spend on B&B emergency accommodation for homeless households, 2010/11–2019/20.",
    source: "Local Government Association, Jul 2021",
    /** The guard rail. Keep both halves — the first stops the figure being
        scaled, the second stops a saving being inferred from it. */
    caveat:
      "A national figure, never multiplied. We don't publish a per-home saving yet — when we can evidence one, it will be sourced here.",
  },
  outcomes: {
    heading: "What it changes",
    points: [
      {
        text: "Children out of temporary accommodation and into homes of their own.",
        icon: "Baby",
      },
      {
        text: "Fewer people stuck in NHS beds waiting for somewhere suitable to live.",
        icon: "Stethoscope",
      },
      { text: "Care delivered where it belongs — in a home, by name.", icon: "House" },
    ],
  },
};

/*
 * REMOVED FROM THE DEMAND SECTION — the ten category chips and both dropdowns.
 *
 * None of them did anything. The chips were plain <li> elements with no click
 * handler and were never passed to <DemandMap visibleIds>, and the two <select>
 * elements carried options but no onChange — the region/authority datasets were
 * never wired. So this is dead UI being removed, not a feature: hover, click,
 * selection and the readout all live inside DemandMap and are untouched.
 *
 * Kept verbatim in case they are ever built for real:
 *
 *   filtersLabel: "Demand categories"
 *   filters: Temporary accommodation · Supported housing · Care leavers ·
 *            Hospital discharge · Mental health · Learning disabilities ·
 *            Older people · Families · Domestic abuse · Homelessness
 *   selectors:
 *     Region          — England · all regions, North West, North East,
 *                       Yorkshire and the Humber, West Midlands, East Midlands,
 *                       East of England, London, South East, South West
 *     Local authority — All commissioning authorities
 *
 * DemandMap already accepts a `visibleIds` prop for exactly this, so wiring the
 * chips back up is a matter of holding the filter state here and passing it
 * down — the map end is already built.
 */
export const demandMapCopy = {
  eyebrow: "Explore housing demand",
  title: "Explore the homes behind the possibilities",
  lead: "Explore current property listings by region, then see how the platform helps connect homes with housing needs.",
  /** Client-approved, final copy. Verbatim — do not paraphrase. */
  statements: [
    {
      icon: "Network",
      tone: "teal",
      heading: "Demand-Led Intelligence",
      body: "View areas where local authorities, housing associations and care and support organisations require housing.",
    },
    {
      icon: "BrainCircuit",
      tone: "teal",
      heading: "AI-Powered Analysis",
      body: "The platform analyses demand by location, property type, household need and support requirements.",
    },
    {
      icon: "HandCoins",
      tone: "orange",
      heading: "Connect to Opportunity",
      body: "Investors, landlords and developers can identify where suitable homes are required.",
    },
    {
      icon: "TrendingUp",
      tone: "teal",
      heading: "Deliver Measurable Impact",
      body: "Each property opportunity can be connected to a real housing requirement and potential social outcome.",
    },
  ] satisfies { icon: string; tone: "teal" | "orange"; heading: string; body: string }[],
  /**
   * The illustrative-purposes note, shortened.
   *
   * It used to sit beneath the Region and Local Authority dropdowns and run to
   * three lines. The dropdowns are gone — see the block below — but this note
   * is NOT tied to them: the map itself still shows illustrative demand data,
   * so the claim has to stay on the page. It now runs as a single line behind
   * an info icon beside the map.
   *
   * THE CLIENT-APPROVED ORIGINAL, verbatim, so it can be restored rather than
   * reconstructed:
   *
   *   "The information shown in this demonstration is provided for illustrative
   *    purposes. The completed platform will deliver detailed regional and local
   *    authority analysis, live housing-demand intelligence, intelligent partner
   *    connections and property-matching capabilities."
   *
   * Nothing material was dropped — "will deliver" became "delivers", the four
   * promised capabilities are all still named, and "provided for illustrative
   * purposes" became "illustrative demonstration". If Israel would rather not
   * have his wording touched, paste the original back over the string below;
   * nothing else has to change.
   */
  illustrativeNote:
    "The map shows property listings recorded on the platform. Choose a region for its count and the latest update time; housing demand is a separate measure.",
};

/*
 * The Who We Connect band has been removed from the homepage, and `connectCopy`
 * with it: the eyebrow "Who we connect", the headline "Every Organisation. One
 * Platform." and the line naming the wider partner types —
 *
 *   "We also connect Mortgage Brokers, Solicitors, Surveyors, Contractors,
 *    Technology Partners and the communities these homes sit in."
 *
 * That last line was the ONLY place on the homepage naming brokers, solicitors,
 * surveyors, contractors and technology partners. The ten role tiles in the
 * hero cover investors, landlords, developers, housing associations, local
 * authorities, care and support providers, social workers, brokers and
 * residents — but not the rest. If those partner types need to stay visible to
 * a visitor who never leaves the homepage, the line needs a home somewhere
 * else; kept here verbatim so it can be moved rather than rewritten.
 *
 * `imagery.meeting` (/images/human-meeting.jpg) was this section's photograph
 * and is now unplaced. It is still in the imagery map, ready to be used.
 */

export const aiPlatformCopy = {
  eyebrow: "AI platform",
  title: "Intelligence That Supports Better Decisions",
  lead: "Artificial Intelligence sits at the centre of the platform. Rather than replacing professional judgement, AI enhances decision-making.",
  points: [
    "Match people with suitable homes",
    "Identify the right investment opportunities",
    "Forecast housing demand",
    "Recommend suitable delivery partners",
    "Reduce property voids",
    "Increase placement speed",
    "Improve occupancy",
    "Monitor social impact",
  ],
};

export const closingCopy = {
  title: "Join the UK's Housing, Care and Support Ecosystem",
  /**
   * Client-approved vision statement, in place of the previous lead paragraph.
   * Verbatim — do not paraphrase.
   */
  lead: "To become the UK's national infrastructure for social impact investment — unlocking private capital to transform housing, care and support at scale.",
  /*
   * Cut from seven to four. "Improve outcomes" and "Create lasting social
   * impact" restated "Measure outcomes" and "Demonstrate social impact" from
   * Our Solution, and "Strengthen communities" overlapped both. The four left
   * are the ones this section says that no other section does.
   */
  points: [
    // Lucide has no Crane glyph. Construction renders as a road barrier, which
    // reads as an obstruction rather than building, so HardHat carries this one.
    { text: "Build more homes", icon: "HardHat", tone: "orange" },
    { text: "Deliver better support", icon: "HandHeart", tone: "orange" },
    { text: "Connect investment with verified need", icon: "Network", tone: "teal" },
    { text: "Transform lives", icon: "Sparkles", tone: "teal" },
  ] satisfies IconPoint[],
};

/**
 * The commissioning-briefs attribution for the demand map.
 *
 * NOT used on the homepage any more: CouncilPanel states the same thing in full
 * beside the crests it applies to, a few hundred pixels above the map, and
 * saying it twice on one page added length without adding protection.
 *
 * It is still REQUIRED on /the-problem, which renders <DemandMap /> with no
 * council panel anywhere on it. That page is the reason this export exists.
 *
 * ⚠️ Do not delete this again without checking BOTH pages. It was removed once
 * on the strength of a search that only covered part of the tree, and the
 * missing export broke the production build.
 */
export const demandMapNote =
  "Built from published commissioning briefs · 18 of ~296 English local authorities · their briefs shape what we source, which is not a partnership, endorsement or approval by any council.";

export interface PlatformCapability {
  id: string;
  title: string;
  detail: string;
  icon: string;
}

export const platformCapabilities: PlatformCapability[] = [
  {
    id: "matching",
    title: "Matching",
    detail: "Referral to room, with the evidence attached.",
    icon: "GitCompareArrows",
  },
  {
    id: "intelligence",
    title: "Property intelligence",
    detail: "Condition, compliance and yield in one record.",
    icon: "Building2",
  },
  {
    id: "analytics",
    title: "Analytics",
    detail: "Demand, placements and outcomes over time.",
    icon: "ChartNoAxesColumn",
  },
];

export interface MatchRow {
  id: string;
  property: string;
  rooms: string;
  score: number;
}

/** Illustrative interface data — labelled at the LiveWindow. */
export const matchRows: MatchRow[] = [
  { id: "m1", property: "3-bed terrace", rooms: "4 rooms", score: 92 },
  { id: "m2", property: "2-bed semi", rooms: "3 rooms", score: 78 },
];
