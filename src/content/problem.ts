/**
 * /the-problem — the four sections, and every figure on them.
 *
 * ── WHAT MAY GO ON THIS PAGE ──────────────────────────────────────────────
 *
 * Published statistics only. Every entry below carries `source` and, where the
 * publisher gives one, a date. A figure without both does not ship.
 *
 * ⚠️ NO MARKET SIZING. An earlier draft of this page carried indicative asset
 * values (£425bn for the whole backlog, £4.25bn for a 1% share) and a market-
 * penetration table. All of it was cut at Callum's decision and none of it may
 * come back. Two reasons, and the second is the important one:
 *
 *   1. Those numbers are arithmetic, not statistics — a count multiplied by an
 *      average house price. They have no publisher.
 *   2. They are forward-looking financial projections on a public page, from a
 *      company that is NOT authorised or regulated by the FCA. That is the
 *      single riskiest thing that could sit here.
 *
 * They belong in the investor deck. They do not belong on the open web.
 *
 * Three further figures were offered and rejected for this page:
 *   · "19 million retail investors"     — no source given
 *   · "2.3–2.8 million landlords"       — a range of estimates, no single publisher
 *   · "400,000–430,000 homes per year"  — contested; the government target is
 *                                         300,000 and other bodies say 340,000,
 *                                         so it cannot be stated as a fact
 *
 * ── THE ONE FIGURE HERE THAT IS NOT A GOVERNMENT RELEASE ─────────────────
 *
 * The £102m NHS cost is sourced to Inside Housing — trade press reporting on a
 * figure, rather than the figure's publisher. Everything around it is gov.uk.
 * It is flagged rather than removed because the claim is real and useful, but
 * if a primary source cannot be found it should come off rather than sit in a
 * row of government statistics borrowing their authority.
 */

export interface ProblemFigure {
  value: string;
  label: string;
  source: string;
}

/** Buddy's form beside a section, if any. See the note on section 2. */
export type ProblemBuddyForm = "property" | "investment" | "support";

export interface ProblemSection {
  id: string;
  eyebrow: string;
  /** The one enormous number. */
  headline: string;
  /** Prose under the headline. Two sentences at the very most. */
  lead: string;
  /** Rows down the right-hand column. */
  rows: { label: string; value: string }[];
  source?: string;
  /**
   * ⚠️ A CHARACTER MAY POINT AT DATA. A CHARACTER MAY NOT POINT AT SUFFERING.
   *
   * Section 2 is deliberately `undefined` and must stay that way. It carries
   * "176,130 children living in temporary accommodation", and a cartoon
   * gesturing cheerfully at that number is indefensible — it is the kind of
   * thing that gets screenshotted and quoted back at you. Buddy can
   * explain the system and the funding, without presenting other people's
   * hardship.
   */
  buddyForm?: ProblemBuddyForm;
  /** Cream band rather than navy. The page alternates. */
  light?: boolean;
}

export const problemHero = {
  title: "The Problem",
  description:
    "1.34 million households are on English housing registers. 134,210 are in temporary accommodation. Here is what that costs, why it persists, and what is already committed to fixing it.",
};

export const problemSections: ProblemSection[] = [
  {
    id: "scale",
    eyebrow: "The scale",
    headline: "1.34m",
    lead: "That is the number on English local-authority housing registers — the highest since 2014.",
    rows: [
      { label: "England — households on housing registers, 31 Mar 2025", value: "1.34m" },
      { label: "Scotland — housing applications, 31 Mar 2025", value: "180,074" },
      { label: "Wales — people waiting for a home", value: "~140,000" },
      { label: "Northern Ireland — households on the waiting list", value: "49,755" },
    ],
    /*
     * ⚠️ THE "NOT SIMPLY ADDITIVE" CLAUSE IS LOAD-BEARING. The four nations
     * count different things — England and NI count households, Scotland counts
     * applications, Wales counts people. Presenting a summed total without
     * saying so would be a fabricated statistic. That is why the combined
     * figure is given as "~1.6 million households and applications" and why
     * this line travels with it.
     */
    source:
      "gov.uk · Scottish Government · Welsh Government · NIHE. Recorded on different bases and not simply additive.",
    buddyForm: "property",
    light: true,
  },
  {
    id: "cost",
    eyebrow: "The cost of waiting",
    headline: "£2.7bn",
    lead: "Temporary accommodation is the most expensive way to house someone badly.",
    rows: [
      { label: "households in temporary accommodation · gov.uk · 31 Dec 2025", value: "134,210" },
      { label: "children living in temporary accommodation · gov.uk · 31 Dec 2025", value: "176,130" },
      { label: "council spend on temporary accommodation · gov.uk · 2024–25", value: "£2.7bn" },
      {
        label:
          "a year — NHS cost of people stuck in hospital waiting for supported housing · Inside Housing",
        value: "£102m",
      },
    ],
  },
  {
    id: "opportunity",
    eyebrow: "The opportunity",
    headline: "£39bn",
    lead: "The Social and Affordable Homes Programme runs 2026 to 2036. A further £3.6bn is committed to homelessness and rough sleeping from 2026/27.",
    rows: [
      { label: "over ten years", value: "£39bn" },
      { label: "homes to be delivered", value: "~300,000" },
      { label: "at social rent", value: "60%+" },
    ],
    source: "gov.uk — Social and Affordable Homes Programme 2026–2036",
    buddyForm: "investment",
    light: true,
  },
];

/**
 * Section five.
 *
 * ⚠️ THERE IS NO HEADLINE HERE ON PURPOSE. The close is the site-wide strapline
 * — "Providing Homes. Delivering Support. Transforming Lives." — which lives in
 * content/site.ts as `closingBeats`, exactly as it does on /about and
 * /platform. A bespoke headline was written here once and it made this page the
 * odd one out. Only the button label belongs to this page.
 */
export const problemClose = {
  cta: "Register Your Interest",
};
