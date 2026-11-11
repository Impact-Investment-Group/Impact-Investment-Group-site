/**
 * THE WAIT LIST: every string and every question, typed.
 *
 * Wave 295. The site used to send all ten role tiles and the header button to
 * /contact with `enquiry=waitlist` preselected, which asked a landlord and a
 * local authority the same four questions and learned nothing from either. The
 * wait list now has its own two routes:
 *
 *   /register          the picker: the same ten roles, the same icons
 *   /register/<id>     one page per role, asking that role its own questions
 *
 * ⚠️ NOTHING IN HERE IS DECORATION. Every answer is a row the platform will be
 * built against: which regions to open first, which frictions to solve first,
 * what a licence can be priced at. A question nobody will act on costs a real
 * sign-up, because every question is another chance to close the tab. Three to
 * six per role, and each one has to earn its place.
 *
 * ⚠️ THE QUESTION IDS ARE A WIRE CONTRACT. They are the keys of the `answers`
 * object posted to the platform backend and stored there. They are snake_case,
 * they are stable, and renaming one orphans every answer already recorded
 * against the old name. Add freely; rename never.
 *
 * ⚠️ NO FIGURE ON THESE PAGES. The site's rule is that a number is either
 * sourced or absent, and a conversion page is exactly where an unsourced one
 * would be most tempting and most damaging: these readers buy from councils.
 * There is no statistic, no testimonial and no promise of a return anywhere in
 * this file, and none may be added without a source and Callum's sign-off.
 *
 * The copy here was written for Callum to read before it goes live and is
 * reproduced verbatim in docs/WAVE295_REPORT.md.
 */

import { registerRoles, type AudienceRole } from "@/content/audiences";
import { generalEnquiriesAddress } from "@/content/legal";

/* ─────────────────────────────────────────────────────────────────────────
 * Question shapes
 * ───────────────────────────────────────────────────────────────────────── */

export type QuestionKind = "single" | "multi" | "text" | "textarea";

export interface RegisterQuestion {
  /** snake_case, stable, and the key this answer is posted under. */
  id: string;
  /** The question itself. Asked as a question, not named as a field. */
  label: string;
  /** One line under the label, where the question needs framing. */
  help?: string;
  kind: QuestionKind;
  /** Required for `single` and `multi`. */
  options?: readonly string[];
  placeholder?: string;
  maxLength?: number;
  /**
   * Renders INSIDE the previous question rather than as one of its own.
   *
   * R295-4 describes the frictions question as "a short multi-choice list of
   * the real frictions for that role PLUS a free-text line": one question,
   * two answers. Drawn as a separate block it reads as a seventh question on a
   * page that is meant to ask six, and a visitor counts blocks, not ids. It
   * keeps its own id on the wire because it is its own answer.
   */
  tail?: boolean;
}

export interface RegisterRoleContent {
  /** Matches an id in `registerRoles`, the URL segment, and the payload's role. */
  id: string;
  /** For the tab title and the link back to the picker. */
  label: string;
  eyebrow: string;
  h1: string;
  lede: string;
  /** What this role gets for registering now. Three, with a Lucide icon each. */
  offer: readonly { icon: string; text: string }[];
  /** A resident has no organisation, and asking is a small insult. */
  askOrganisation: boolean;
  organisationLabel: string;
  questions: readonly RegisterQuestion[];
  submitLabel: string;
  success: {
    heading: string;
    body: string;
    /** What happens next, in order. Never a date we cannot keep. */
    next: readonly string[];
  };
  metaDescription: string;
}

/* ─────────────────────────────────────────────────────────────────────────
 * The picker, /register
 * ───────────────────────────────────────────────────────────────────────── */

/** The divider in the hero, above the same ten tiles. */
export { registerAsDivider, pickerContent } from "@/content/audiences";

/**
 * WHICH WORDS THE PERSON AGREED TO, sent with every registration as
 * `consent_version`.
 *
 * ⚠️ BUMP THIS THE SAME DAY ANY CONSENT LABEL CHANGES, and treat that as the
 * point of the field. A stored `consent_email: true` is worth nothing on its
 * own: under UK GDPR what has to be demonstrable is what the person was
 * actually shown, and the only way to reconstruct that from a row is the
 * version stamp beside it. The labels this stamp covers are `consentBlock`
 * below, `residentHealthConsent`, and `registerPrivacy.body`.
 *
 * Date stamped rather than numbered so the row itself says when, and so two
 * people editing copy in the same week cannot both claim "v2".
 */
export const CONSENT_VERSION = "2026-09-10";

/* ─────────────────────────────────────────────────────────────────────────
 * Shared blocks
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * The alerts invitation. Two boxes, both UNTICKED, both optional, and the form
 * submits perfectly well with neither ticked and records neither. That is
 * deliberate: the answers are the value of this page, and gating them behind a
 * marketing consent would trade the thing we need for the thing we would like.
 * The two labels are Callum's, verbatim.
 */
export const consentBlock = {
  heading: "Want us to tell you when it opens?",
  help: "Both optional. Leave them alone and we still keep your answers, we just will not contact you.",
  email: {
    id: "consentEmail",
    label: "Email me when the platform opens and when a match is worth my time",
  },
  sms: {
    id: "consentSms",
    label: "Text me the same (SMS now, WhatsApp when we switch it on)",
  },
} as const;

/**
 * The privacy line. Wording proposed by wave 298 and authorised by Callum on
 * 9 Sep 2026, and it is not ours to reword without him.
 *
 * ⚠️ THE OLD LINE SAID WE DO NOT PASS ANSWERS TO ANYONE OUTSIDE THE GROUP,
 * WHICH WAS NOT TRUE. The registration is emailed and texted by third-party
 * suppliers and hosted on someone else's machines, so it names them as a class
 * instead of pretending they do not exist. It also names the controller,
 * because a data subject who wants to exercise a right has to know who to
 * write to, and gives the mailbox that answers those.
 *
 * The link now points at the platform's published Privacy Policy. The site
 * itself still has no /privacy route of its own; that is why the href is
 * absolute and off-site.
 */
export const registerPrivacy = {
  body: "Impact Investment Group UK Limited is the data controller. We store your answers to shape what the platform does and to match you when it opens. We do not sell them, and we share them only with the suppliers that run our email, text messages and hosting. Registered with the ICO under ZB957755. Questions about your data: admin@impactig.co.uk",
  linkLabel: "Read the Privacy Policy",
  href: "https://app.impactinvestmentgroup.co.uk/privacy",
} as const;

/**
 * THE RESIDENT PAGE'S SPECIAL-CATEGORY CONSENT.
 *
 * ⚠️ REQUIRED, UNTICKED, AND ONLY WHERE IT APPLIES. Three of that page's
 * answers are health or disability data about the person filling it in, and
 * two more are about somebody else entirely: "Someone I care for" and "A young
 * person I support". That is Article 9 special-category data, and the lawful
 * basis the rest of this form runs on does not reach it. So the page asks, in
 * words, and refuses to send those particular answers without a yes.
 *
 * It is deliberately NOT one of the two alert boxes. Those are optional and
 * the form submits happily without them. This one gates the answers it names
 * and nothing else: leave every one of those options alone and this box never
 * has to be ticked.
 */
export const residentHealthConsent = {
  id: "consentHealth",
  label:
    "I agree that you may use what I have told you about health, disability or support needs to look for suitable housing for me or the person I am helping",
  /** Shown only when one of the options below has been chosen. */
  requiredMessage:
    "Please tick the box above so we may use what you told us about health, disability or support needs. Or clear those answers and send the rest.",
} as const;

/**
 * The resident answers that turn `residentHealthConsent` from optional into
 * required. Values, not ids: these are the option strings themselves, so the
 * gate cannot drift from the words on the page.
 */
export const RESIDENT_SPECIAL_CATEGORY_OPTIONS = {
  who_for: ["Someone I care for", "A young person I support"],
  home_needs: ["Adapted for a disability", "Somewhere with support attached"],
} as const;

/**
 * WHAT THE FORM SAYS WHEN IT DOES NOT SEND, and it says three different things
 * because there are three different situations and only one of them is worth
 * retrying.
 *
 * ⚠️ "Please try again" ON A RATE LIMIT OR A REFUSAL IS A LIE, and a costly
 * one: it sends somebody back round a form they just filled in to hit the same
 * wall. `network` is the only branch where trying again is the right advice.
 *
 * ⚠️ THE ADDRESS IS INTERPOLATED, NEVER TYPED OUT AGAIN. These three lines
 * carried a hard-coded copy of the retired general mailbox until the release
 * check of 11 Sep 2026 caught it: that address does not exist and never did
 * (Callum, 10 Sep 2026). See the note on `generalEnquiriesAddress` in
 * content/legal.ts for which address is real and why the old one is not to be
 * reinstated. `generalEnquiriesAddress` is the single source; this is the
 * same fix wave 298 made in enquiry-form.tsx's failure line.
 */
export const registerFailureLines = {
  /** Offline, DNS, CORS, a timeout, or the backend answering 5xx. */
  network: `That did not send. Please try again, or email ${generalEnquiriesAddress} directly.`,
  /** 429. The backend rate limits this endpoint. */
  rateLimited: `That was sent a moment ago. Please wait a minute and try once more, or email ${generalEnquiriesAddress}.`,
  /** Any other 4xx: the payload was refused, so retrying it changes nothing. */
  rejected: `We could not accept that. Nothing has been lost: email ${generalEnquiriesAddress} and a person will add you by hand.`,
} as const;

/** How long the form waits for the backend before it gives up and says so. */
export const SUBMIT_TIMEOUT_MS = 15000;

/**
 * The floor on how fast a registration can be filled in and still be believed.
 *
 * Not a captcha, and never will be: this page is for people in housing
 * difficulty as well as for fund managers, and a puzzle gate excludes the
 * wrong ones. Three seconds is under any human's time on a page with five
 * questions and four fields, and above any script's.
 */
export const MIN_TIME_ON_FORM_MS = 3000;

export const contactFieldLabels = {
  name: "Your name",
  email: "Email",
  emailHelp: "Where the one message that says it is open will go.",
  organisation: "Organisation",
  phone: "Phone",
  phoneHelp: "Optional, UK numbers only. Only needed if you ticked the text box above.",
  /** The honeypot's label. Never seen by a person; read by a scraper. */
  honeypot: "Company website",
} as const;

/**
 * ⚠️ THE SITE NORMALISES THE PHONE NUMBER, NOT THE BACKEND. `07700 900123`,
 * `+44 7700 900123` and `00447700900123` are the same number and a person will
 * type any of them, so the browser puts it in E.164 before it posts and the
 * platform stores one shape. Wave 294 should refuse anything that is not
 * already `+44` followed by ten digits rather than try to repair it: two
 * normalisers that disagree is how a wait list ends up texting nobody.
 */
export const phoneMessage = "Please use a UK number, starting 07 or +44.";

/**
 * PRICE BANDS, CONFIRMED BY CALLUM ON 9 SEP 2026, exactly as proposed.
 *
 * Two ladders, because the question means a different thing to a housing
 * association with a software line in its budget than to a landlord with four
 * houses. Both carry an honest bottom rung: somebody who would only use it
 * free is a real answer and a useful one, and leaving that rung off would push
 * them into a band they do not mean, which is worse than not asking.
 *
 * These are now a PRICING INSTRUMENT and not a draft. Moving a band edge makes
 * every answer already collected against the old edges incomparable with the
 * new ones, so a change here is a change to the data, not to some copy.
 */
export const orgBudgetOptions = [
  "It would have to be free to us",
  "Under £50 a month",
  "£50 to £149 a month",
  "£150 to £399 a month",
  "£400 to £999 a month",
  "£1,000 a month or more",
  "It would need a business case before I could say",
] as const;

export const personalBudgetOptions = [
  "It would have to be free to me",
  "Under £20 a month",
  "£20 to £49 a month",
  "£50 to £99 a month",
  "£100 a month or more",
  "Not sure yet",
] as const;

const budgetHelp =
  "There is no wrong answer and nothing is being sold. It tells us what we can afford to build.";

const orgBudget = (label: string): RegisterQuestion => ({
  id: "tool_budget",
  label,
  help: budgetHelp,
  kind: "single",
  options: orgBudgetOptions,
});

const personalBudget = (label: string, extra: readonly string[] = []): RegisterQuestion => ({
  id: "tool_budget",
  label,
  help: budgetHelp,
  kind: "single",
  options: [...personalBudgetOptions, ...extra],
});

/** The free-text tail of every frictions question. One id, one shape, nine roles. */
const frictionsDetail = (placeholder: string): RegisterQuestion => ({
  id: "frictions_detail",
  label: "Anything else that has cost you time or money?",
  kind: "textarea",
  placeholder,
  maxLength: 2000,
  tail: true,
});

/* ─────────────────────────────────────────────────────────────────────────
 * The ten roles
 * ───────────────────────────────────────────────────────────────────────── */

export const registerRoleContent: readonly RegisterRoleContent[] = [
  {
    id: "investor",
    label: "Investor",
    eyebrow: "Register to join the waitlist",
    h1: "Tell us the deal you want to see, and see it first",
    lede: "We are building the platform that matches funded capital to the housing demand councils and providers publish. Answer five questions now and your criteria are in the matching engine on the day it opens, before anything is advertised anywhere.",
    offer: [
      { icon: "Clock", text: "First look at matched opportunities, ahead of the general list" },
      {
        icon: "MessageSquareQuote",
        text: "A say in what we build, while the roadmap is still open",
      },
      {
        icon: "ShieldCheck",
        text: "Every opportunity to be underwritten on named public data, with its source shown",
      },
    ],
    askOrganisation: true,
    organisationLabel: "Organisation or fund",
    questions: [
      {
        id: "preferred_regions",
        label: "Which regions would you like to invest in?",
        help: "Choose as many as you like. You can add specific towns or areas next.",
        kind: "multi",
        options: [
          "North East",
          "North West",
          "Yorkshire and the Humber",
          "East Midlands",
          "West Midlands",
          "East of England",
          "London",
          "South East",
          "South West",
          "Scotland",
          "Wales",
          "Anywhere in England, Scotland or Wales",
        ],
      },
      {
        id: "investment_focus",
        label: "What are you looking to fund?",
        help: "Pick as many as apply.",
        kind: "multi",
        options: [
          "Single lets to supported housing providers",
          "HMOs and shared supported living",
          "Children's homes and specialist settings",
          "Portfolios and blocks",
          "New build and development finance",
          "Bridging and short term facilities",
          "Not decided yet, show me what is there",
        ],
      },
      {
        id: "ticket_size",
        label: "What size of commitment are you working with?",
        kind: "single",
        options: [
          "Under £100,000",
          "£100,000 to £249,000",
          "£250,000 to £499,000",
          "£500,000 to £999,000",
          "£1m to £4.9m",
          "£5m and above",
          "Prefer not to say",
        ],
      },
      {
        id: "regions",
        label: "Which parts of the UK interest you most?",
        kind: "text",
        placeholder:
          "For example: the North West, the East Midlands, or anywhere with the right lease",
        maxLength: 200,
      },
      {
        id: "frictions",
        label: "What has slowed you down before?",
        help: "The ones we hear most. Tick every one you have hit.",
        kind: "multi",
        options: [
          "Deals reach me too late to act on",
          "No way to verify the demand behind a deal",
          "The provider or the lease covenant is hard to check",
          "Due diligence packs arrive incomplete",
          "Too much of it happens over email",
          "Nothing reaches me off market",
          "Hard to compare one opportunity against another",
        ],
      },
      frictionsDetail("For example: a deal that fell over at the last stage, and why"),
      orgBudget(
        "If a tool like this saved you real time, what could you justify paying for it each month?",
      ),
    ],
    submitLabel: "Join the waitlist",
    success: {
      heading: "You are on the list",
      body: "Your criteria are recorded against your email address. Nobody will call you, and there is nothing else you need to do.",
      next: [
        "Your answers go into what we are still deciding to build, not into a pile for launch day",
        "One email when the platform opens, and none between now and then unless you asked for them",
        "Matching against your criteria starts on day one, not after you set it all up again",
      ],
    },
    metaDescription:
      "Join the Impact Investment Platform waiting list as an investor. Tell us the deal you want to see and your criteria are in the matching engine the day it opens.",
  },

  {
    id: "landlord",
    label: "Landlord",
    eyebrow: "Register to join the waitlist",
    h1: "Tell us what you own, and we will bring the demand to you",
    lede: "Councils and providers publish where they need homes. Answer six questions about your property and what you want from a lease, and when the platform opens your stock is put in front of that demand instead of sitting on a portal.",
    offer: [
      { icon: "MapPin", text: "Your property matched against published demand, not guessed at" },
      {
        icon: "MessageSquareQuote",
        text: "A say in what we build, while the roadmap is still open",
      },
      {
        icon: "ShieldCheck",
        text: "Named providers and councils on the platform, not anonymous enquiries",
      },
    ],
    askOrganisation: true,
    organisationLabel: "Company name, or your own name if you let personally",
    questions: [
      {
        id: "property_types",
        label: "What do you own, or plan to own?",
        help: "Pick as many as apply.",
        kind: "multi",
        options: [
          "Houses",
          "Flats",
          "HMOs",
          "Ground floor or step free units",
          "Whole blocks",
          "Land or empty buildings",
          "Nothing yet, I am looking to buy",
        ],
      },
      {
        id: "regions",
        label: "Where are your properties, or where would you buy?",
        kind: "text",
        placeholder: "For example: Grimsby, Nottingham, anywhere in the East Midlands",
        maxLength: 200,
      },
      {
        id: "lease_preference",
        label: "What would you want from a lease?",
        kind: "single",
        options: [
          "Guaranteed rent on a long lease, five years or more",
          "Guaranteed rent on a shorter lease",
          "Full management with rent collection",
          "A straight tenant find",
          "Open to whichever works best on the property",
          "Not sure yet, show me the options",
        ],
      },
      {
        id: "frictions",
        label: "What has been hard about letting into the supported sector?",
        help: "The ones we hear most. Tick every one you have hit.",
        kind: "multi",
        options: [
          "Voids between tenancies",
          "Finding a provider I can actually trust",
          "Arrears and chasing rent",
          "Damage and putting the property back",
          "Licensing and compliance paperwork",
          "Agents who do not understand supported housing",
          "No idea who genuinely needs my kind of property",
        ],
      },
      frictionsDetail("For example: a let that went wrong, and what would have stopped it"),
      {
        id: "discovery",
        label: "How do you fill a property today?",
        kind: "single",
        options: [
          "A letting agent",
          "Portals like Rightmove or Zoopla",
          "Providers who approach me directly",
          "The council contacts me",
          "Word of mouth and my own network",
          "Social media groups",
          "I have not let one yet",
        ],
      },
      personalBudget(
        "If a tool like this saved you real time, what could you justify paying for it each month?",
      ),
    ],
    submitLabel: "Join the waitlist",
    success: {
      heading: "You are on the list",
      body: "What you own and what you want from a lease are recorded against your email address. Nobody will call you, and there is nothing else you need to do.",
      next: [
        "Your answers go into what we are still deciding to build, not into a pile for launch day",
        "One email when the platform opens, and none between now and then unless you asked for them",
        "Your property is matched against published demand from the day it opens",
      ],
    },
    metaDescription:
      "Join the Impact Investment Platform waiting list as a landlord. Tell us what you own and what you want from a lease, and we will match it against published demand.",
  },

  {
    id: "developer",
    label: "Developer",
    eyebrow: "Register to join the waitlist",
    h1: "Know where the demand is before you commit to the site",
    lede: "The hardest part of a supported housing scheme is not building it, it is knowing there is an end user waiting at the other end. Answer six questions and when the platform opens you can read published demand by area before you buy the land.",
    offer: [
      {
        icon: "Map",
        text: "Published demand by area, so a scheme can have an end user before it starts",
      },
      {
        icon: "MessageSquareQuote",
        text: "A say in what we build, while the roadmap is still open",
      },
      { icon: "Network", text: "Providers and councils on the same platform as your pipeline" },
    ],
    askOrganisation: true,
    organisationLabel: "Company name",
    questions: [
      {
        id: "build_types",
        label: "What do you build?",
        help: "Pick as many as apply.",
        kind: "multi",
        options: [
          "New build houses",
          "New build flats and blocks",
          "Conversions and change of use",
          "Modular and offsite",
          "Refurbishment of existing stock",
          "Children's homes and specialist settings",
        ],
      },
      {
        id: "pipeline_scale",
        label: "How many units are in your pipeline for the next two years?",
        kind: "single",
        options: [
          "Under 10",
          "10 to 49",
          "50 to 149",
          "150 to 499",
          "500 or more",
          "Nothing committed yet",
        ],
      },
      {
        id: "regions",
        label: "Where do you build, or where would you go for the right demand?",
        kind: "text",
        placeholder: "For example: the North West, or anywhere the numbers work",
        maxLength: 200,
      },
      {
        id: "frictions",
        label: "What holds a scheme up?",
        help: "The ones we hear most. Tick every one you have hit.",
        kind: "multi",
        options: [
          "Not knowing where the demand actually is",
          "No end user lined up before we commit",
          "Planning and section 106 timescales",
          "Funding gaps between stages",
          "Finding a provider to take the completed units",
          "Specification changes late in the day",
          "Land that never reaches the open market",
        ],
      },
      frictionsDetail("For example: a scheme that stalled, and what would have unstalled it"),
      {
        id: "discovery",
        label: "How do you find out where the demand is today?",
        kind: "single",
        options: [
          "Relationships with individual councils",
          "Relationships with providers and housing associations",
          "Published local authority strategies and needs assessments",
          "Agents and land finders",
          "Our own research",
          "Honestly, we mostly go on experience",
        ],
      },
      orgBudget(
        "If a tool like this saved you real time, what could your business justify paying for it each month?",
      ),
    ],
    submitLabel: "Join the waitlist",
    success: {
      heading: "You are on the list",
      body: "What you build and where you build it are recorded against your email address. Nobody will call you, and there is nothing else you need to do.",
      next: [
        "Your answers go into what we are still deciding to build, not into a pile for launch day",
        "One email when the platform opens, and none between now and then unless you asked for them",
        "Demand by area is there to read from the day it opens, not after a sales process",
      ],
    },
    metaDescription:
      "Join the Impact Investment Platform waiting list as a developer. Read published demand by area before you commit to a site.",
  },

  {
    id: "housing-association",
    label: "Housing Association",
    eyebrow: "Register to join the waitlist",
    h1: "Stock, partners and demand, in one view",
    lede: "Acquisition, disposal, leasing and finding the right support partner are four separate searches today, in four separate places. Answer six questions and help us make them one. Your answers shape the build while it is still being decided.",
    offer: [
      { icon: "Network", text: "Stock, support partners and published demand in one view" },
      {
        icon: "MessageSquareQuote",
        text: "A say in what we build, while the roadmap is still open",
      },
      {
        icon: "ShieldCheck",
        text: "Every figure to be underwritten on named public data, with its source shown",
      },
    ],
    askOrganisation: true,
    organisationLabel: "Association name",
    questions: [
      {
        id: "activity",
        label: "What would you use the platform for?",
        help: "Pick as many as apply.",
        kind: "multi",
        options: [
          "Acquiring stock",
          "Disposing of stock",
          "Leasing units in",
          "Leasing units out",
          "Finding care and support partners",
          "Placing people who need a home",
          "Seeing what is available before we commit",
        ],
      },
      {
        id: "stock_scale",
        label: "Roughly how many homes do you manage?",
        kind: "single",
        options: ["Under 250", "250 to 999", "1,000 to 4,999", "5,000 to 19,999", "20,000 or more"],
      },
      {
        id: "regions",
        label: "Which local authority areas do you operate in?",
        kind: "text",
        placeholder: "For example: Greater Manchester and Lancashire",
        maxLength: 200,
      },
      {
        id: "frictions",
        label: "What is hardest today?",
        help: "The ones we hear most. Tick every one you have hit.",
        kind: "multi",
        options: [
          "Finding suitable property in the right area",
          "Matching a property to the right support provider",
          "Slow legals and due diligence",
          "No single view of what is available",
          "Voids we cannot fill",
          "Data that does not match between partners",
          "Procurement rules that slow everything down",
        ],
      },
      frictionsDetail(
        "For example: a scheme that took far longer than it should have, and where the time went",
      ),
      {
        id: "discovery",
        label: "How does available property reach you today?",
        kind: "single",
        options: [
          "Agents we already work with",
          "Developers approaching us directly",
          "Portals and open market listings",
          "Other associations and councils",
          "Our own acquisitions team",
          "It mostly does not, we go and look for it",
        ],
      },
      orgBudget(
        "If a tool like this saved your team real time, what could you justify paying for it each month?",
      ),
    ],
    submitLabel: "Join the waitlist",
    success: {
      heading: "You are on the list",
      body: "What you need and where you operate are recorded against your email address. Nobody will call you, and there is nothing else you need to do.",
      next: [
        "Your answers go into what we are still deciding to build, not into a pile for launch day",
        "One email when the platform opens, and none between now and then unless you asked for them",
        "Stock, partners and demand are matched against your areas from day one",
      ],
    },
    metaDescription:
      "Join the Impact Investment Platform waiting list as a housing association. Stock, support partners and published demand in one view.",
  },

  {
    id: "local-authority",
    label: "Local Authority",
    eyebrow: "Register to join the waitlist",
    h1: "Tell us where the pressure is, and we will go and find the homes",
    lede: "The platform exists to turn a council's stated need into property that actually appears. Answer six questions about where your pressure is hardest, and that need is in the system while we are still choosing which areas to open first.",
    offer: [
      { icon: "Map", text: "Your stated need matched against real supply, by area" },
      { icon: "MessageSquareQuote", text: "A say in which areas and which needs we open first" },
      {
        icon: "ShieldCheck",
        text: "Every figure to be underwritten on named public data, with its source shown",
      },
    ],
    askOrganisation: true,
    organisationLabel: "Council or authority name",
    questions: [
      {
        id: "pressures",
        label: "Where is the pressure hardest right now?",
        help: "Pick as many as apply.",
        kind: "multi",
        options: [
          "Families in temporary accommodation",
          "Single homeless adults",
          "Hospital discharge",
          "Care leavers",
          "Children needing a residential placement",
          "Adults with a learning disability or autism",
          "Domestic abuse and emergency placements",
        ],
      },
      {
        id: "placement_volume",
        label: "Roughly how many placements do you need to make in a year?",
        kind: "single",
        options: [
          "Under 50",
          "50 to 199",
          "200 to 499",
          "500 to 999",
          "1,000 or more",
          "Not something I would have to hand",
        ],
      },
      {
        id: "regions",
        label: "Which areas do you place into?",
        help: "Including anywhere out of area you currently have to use.",
        kind: "text",
        placeholder: "For example: in borough where possible, Kent and Essex when it is not",
        maxLength: 200,
      },
      {
        id: "frictions",
        label: "What makes a placement hard?",
        help: "The ones we hear most. Tick every one you have hit.",
        kind: "multi",
        options: [
          "Nothing suitable is available when we need it",
          "The cost of emergency and bed and breakfast placements",
          "Providers who cannot take our referrals",
          "Out of area placements we would rather not make",
          "No way to see supply before we commit",
          "Landlords who will not work with us",
          "Contract and framework paperwork",
        ],
      },
      frictionsDetail(
        "For example: a placement that took weeks, and what the blockage actually was",
      ),
      {
        id: "discovery",
        label: "How do you find available property today?",
        kind: "single",
        options: [
          "Framework and contracted providers",
          "Approaches from landlords and agents",
          "Our own housing options team",
          "Other councils",
          "Spot purchasing when we have to",
          "It is mostly phone calls and relationships",
        ],
      },
      orgBudget(
        "If a tool like this saved your team real time, what could the authority justify paying for it each month?",
      ),
    ],
    submitLabel: "Join the waitlist",
    success: {
      heading: "You are on the list",
      body: "Where your pressure is and where you place are recorded against your email address. Nobody will call you, and there is nothing else you need to do.",
      next: [
        "Your answers go into what we are still deciding to build, not into a pile for launch day",
        "One email when the platform opens, and none between now and then unless you asked for them",
        "Your areas and your pressures are weighted in which regions we open first",
      ],
    },
    metaDescription:
      "Join the Impact Investment Platform waiting list as a local authority. Tell us where the pressure is hardest and we will match it against real supply.",
  },

  {
    id: "care-provider",
    label: "Care Provider",
    eyebrow: "Register to join the waitlist",
    h1: "Stop losing referrals because the building is not there",
    lede: "You can win the commission and still have nowhere to put anyone. Answer five questions about the property you need and where you need it, and when the platform opens landlords and developers are matched to that, not to a general advert.",
    offer: [
      { icon: "HandHeart", text: "Property matched to the service you actually deliver" },
      {
        icon: "MessageSquareQuote",
        text: "A say in what we build, while the roadmap is still open",
      },
      { icon: "Network", text: "Landlords and developers on the same platform as your need" },
    ],
    askOrganisation: true,
    organisationLabel: "Organisation name",
    questions: [
      {
        id: "service_types",
        label: "What do you deliver?",
        help: "Pick as many as apply.",
        kind: "multi",
        options: [
          "Supported living",
          "Residential care",
          "Domiciliary care",
          "Complex needs and behaviour that challenges",
          "Mental health support",
          "Learning disability and autism support",
          "Older people's services",
        ],
      },
      {
        id: "property_needs",
        label: "What do you need most?",
        kind: "single",
        options: [
          "Property in areas we already work",
          "Property in new areas we want to enter",
          "Larger properties for shared settings",
          "Self contained units",
          "Adaptations to property we already hold",
          "Not property, better referrals",
        ],
      },
      {
        id: "regions",
        label: "Where do you need property?",
        kind: "text",
        placeholder: "For example: within twenty minutes of our Nottingham base",
        maxLength: 200,
      },
      {
        id: "frictions",
        label: "What gets in the way?",
        help: "The ones we hear most. Tick every one you have hit.",
        kind: "multi",
        options: [
          "Landlords who will not lease to us",
          "Property that needs work before we can use it",
          "Void costs while we wait for referrals",
          "The commission and the property never line up",
          "No way to show a landlord we are a safe tenant",
          "Nothing in the right catchment",
          "Building requirements for regulation and inspection",
        ],
      },
      frictionsDetail("For example: a referral you had to turn down, and what you were missing"),
      orgBudget(
        "If a tool like this saved your team real time, what could you justify paying for it each month?",
      ),
    ],
    submitLabel: "Join the waitlist",
    success: {
      heading: "You are on the list",
      body: "What you deliver and where you need property are recorded against your email address. Nobody will call you, and there is nothing else you need to do.",
      next: [
        "Your answers go into what we are still deciding to build, not into a pile for launch day",
        "One email when the platform opens, and none between now and then unless you asked for them",
        "Landlords and developers are matched against your catchment from day one",
      ],
    },
    metaDescription:
      "Join the Impact Investment Platform waiting list as a care provider. Property matched to the service you deliver and the areas you work in.",
  },

  {
    id: "support-provider",
    label: "Support Provider",
    eyebrow: "Register to join the waitlist",
    h1: "The commission comes first and the building never does",
    lede: "Support gets funded and then has nowhere to happen. Answer five questions about who you support and where, and when the platform opens the property side is matched to that instead of you starting the search from nothing.",
    offer: [
      { icon: "UsersRound", text: "Property matched to who you support and where" },
      {
        icon: "MessageSquareQuote",
        text: "A say in what we build, while the roadmap is still open",
      },
      { icon: "Network", text: "Landlords, councils and developers on one platform" },
    ],
    askOrganisation: true,
    organisationLabel: "Organisation name",
    questions: [
      {
        id: "support_types",
        label: "Who do you support?",
        help: "Pick as many as apply.",
        kind: "multi",
        options: [
          "Housing related support",
          "Floating support",
          "Young people and care leavers",
          "People who are homeless or rough sleeping",
          "People fleeing domestic abuse",
          "People leaving prison or on probation",
          "Refugees and people seeking asylum",
        ],
      },
      {
        id: "property_needs",
        label: "What do you need most?",
        kind: "single",
        options: [
          "Property in areas we already work",
          "Property in new areas we want to enter",
          "Shared properties and HMOs",
          "Self contained units",
          "Move on accommodation",
          "Not property, better referrals",
        ],
      },
      {
        id: "regions",
        label: "Where do you need property?",
        kind: "text",
        placeholder: "For example: Lincolnshire, and anywhere we hold a contract",
        maxLength: 200,
      },
      {
        id: "frictions",
        label: "What gets in the way?",
        help: "The ones we hear most. Tick every one you have hit.",
        kind: "multi",
        options: [
          "Councils commission before the property exists",
          "Landlords who will not lease to us",
          "Voids we carry between referrals",
          "Property in the wrong place for the referral",
          "Leases too short to make a service viable",
          "No way to prove our track record to a landlord",
          "Funding that arrives after the property has gone",
        ],
      },
      frictionsDetail("For example: a contract you could not house, and why"),
      orgBudget(
        "If a tool like this saved your team real time, what could you justify paying for it each month?",
      ),
    ],
    submitLabel: "Join the waitlist",
    success: {
      heading: "You are on the list",
      body: "Who you support and where you need property are recorded against your email address. Nobody will call you, and there is nothing else you need to do.",
      next: [
        "Your answers go into what we are still deciding to build, not into a pile for launch day",
        "One email when the platform opens, and none between now and then unless you asked for them",
        "Landlords and councils are matched against your areas from day one",
      ],
    },
    metaDescription:
      "Join the Impact Investment Platform waiting list as a support provider. Property matched to who you support and the areas you hold contracts in.",
  },

  {
    id: "social-worker",
    label: "Social Worker",
    eyebrow: "Register to join the waitlist",
    h1: "One place to look, instead of ringing round",
    lede: "You already know what the person in front of you needs. What you do not have is anywhere to look. Answer five questions about the placements you are trying to make, and they shape the search we are building.",
    offer: [
      { icon: "ClipboardList", text: "One place to look, instead of a list of numbers to ring" },
      {
        icon: "MessageSquareQuote",
        text: "A say in what we build, while the roadmap is still open",
      },
      { icon: "MapPin", text: "Placements near family and school, not wherever had a bed" },
    ],
    askOrganisation: true,
    organisationLabel: "Employer or authority",
    questions: [
      {
        id: "caseload_needs",
        label: "Who are you trying to house?",
        help: "Pick as many as apply.",
        kind: "multi",
        options: [
          "Families in temporary accommodation",
          "Young people leaving care",
          "Adults with a learning disability or autism",
          "People with mental health needs",
          "People leaving hospital",
          "People leaving prison",
          "People fleeing domestic abuse",
        ],
      },
      {
        id: "urgency",
        label: "How quickly do you usually need a placement?",
        kind: "single",
        options: [
          "Same day",
          "Within a week",
          "Within a month",
          "Within three months",
          "It varies too much to say",
        ],
      },
      {
        id: "regions",
        label: "Which areas do you place into?",
        kind: "text",
        placeholder: "For example: in borough where we can, out of area when we cannot",
        maxLength: 200,
      },
      {
        id: "frictions",
        label: "What makes a placement hard?",
        help: "The ones we hear most. Tick every one you have hit.",
        kind: "multi",
        options: [
          "Nothing available when I need it",
          "I cannot see what is available anywhere",
          "Placements too far from family and school",
          "Providers who will not take the referral",
          "Chasing people for an answer",
          "Paperwork that asks the same thing three times",
          "Out of hours there is nowhere to look at all",
        ],
      },
      frictionsDetail("For example: a placement that took far too long, and what you were missing"),
      personalBudget("If a tool like this saved you real time, what would it be worth a month?", [
        "My employer would decide, not me",
      ]),
    ],
    submitLabel: "Join the waitlist",
    success: {
      heading: "You are on the list",
      body: "The placements you are trying to make are recorded against your email address. Nobody will call you, and there is nothing else you need to do.",
      next: [
        "Your answers go into what we are still deciding to build, not into a pile for launch day",
        "One email when the platform opens, and none between now and then unless you asked for them",
        "The search is built around the placements you told us about",
      ],
    },
    metaDescription:
      "Join the Impact Investment Platform waiting list as a social worker. One place to look for a placement, instead of ringing round.",
  },

  {
    id: "broker",
    label: "Broker",
    eyebrow: "Register to join the waitlist",
    h1: "Both sides of your deal, on one platform",
    lede: "You spend half your time finding stock for buyers and the other half finding buyers for stock. Answer five questions about what you broker and where, and when the platform opens both sides are already on it.",
    offer: [
      { icon: "Handshake", text: "Funded buyers and real stock on the same platform" },
      {
        icon: "MessageSquareQuote",
        text: "A say in what we build, while the roadmap is still open",
      },
      { icon: "ShieldCheck", text: "Counterparties on a platform, not an introduction chain" },
    ],
    askOrganisation: true,
    organisationLabel: "Company name",
    questions: [
      {
        id: "services",
        label: "What do you broker or provide?",
        help: "Pick as many as apply.",
        kind: "multi",
        options: [
          "Property sourcing",
          "Finance and lending",
          "Insurance",
          "Legal and conveyancing",
          "Lettings and management",
          "Refurbishment and works",
          "Compliance and certification",
        ],
      },
      {
        id: "deal_volume",
        label: "How many deals do you handle in a year?",
        kind: "single",
        options: ["Under 10", "10 to 24", "25 to 99", "100 to 249", "250 or more"],
      },
      {
        id: "regions",
        label: "Where do you operate?",
        kind: "text",
        placeholder: "For example: the North East, or nationally",
        maxLength: 200,
      },
      {
        id: "frictions",
        label: "What costs you deals?",
        help: "The ones we hear most. Tick every one you have hit.",
        kind: "multi",
        options: [
          "Finding buyers for the stock I have",
          "Finding stock for the buyers I have",
          "Deals that fall through late",
          "Verifying who is genuinely funded",
          "Getting paid on completion",
          "Too many introducers on one deal",
          "No visibility of institutional demand",
        ],
      },
      frictionsDetail("For example: a deal that collapsed, and where it actually broke"),
      orgBudget(
        "If a tool like this saved you real time, what could you justify paying for it each month?",
      ),
    ],
    submitLabel: "Join the waitlist",
    success: {
      heading: "You are on the list",
      body: "What you broker and where you operate are recorded against your email address. Nobody will call you, and there is nothing else you need to do.",
      next: [
        "Your answers go into what we are still deciding to build, not into a pile for launch day",
        "One email when the platform opens, and none between now and then unless you asked for them",
        "Both sides of your deal are matched against your areas from day one",
      ],
    },
    metaDescription:
      "Join the Impact Investment Platform waiting list as a broker. Funded buyers and real stock on one platform.",
  },

  {
    /**
     * ⚠️ THIS PAGE IS HELP, NOT SALES. No price band, no early access, no talk
     * of what we get out of it. It asks what this person needs and where, it
     * does not promise them a home, and it puts the crisis numbers in front of
     * them rather than at the bottom of a page they may never reach.
     */
    id: "resident",
    label: "Resident",
    eyebrow: "Looking for a home",
    h1: "Tell us what you need, and where",
    lede: "The platform is not open yet, so we cannot offer you a home today and we will not pretend otherwise. What we can do is take down what you need now, so that when it opens we are looking for the right thing in the right place.",
    offer: [
      { icon: "Heart", text: "We record what you need in your words, not as a category" },
      { icon: "MapPin", text: "Where you need to be, so a home is not somewhere you cannot live" },
      { icon: "Clock", text: "One message when it opens, and nothing else unless you ask" },
    ],
    askOrganisation: false,
    organisationLabel: "",
    questions: [
      {
        id: "who_for",
        label: "Who is the home for?",
        kind: "single",
        options: [
          "Me",
          "Me and my children",
          "Me and my partner",
          "Me and my family",
          "Someone I care for",
          "A young person I support",
        ],
      },
      {
        id: "home_needs",
        label: "What does the home need to be?",
        help: "Pick as many as matter to you.",
        kind: "multi",
        options: [
          "Ground floor, or step free",
          "Near a school",
          "Near family or people who help me",
          "Somewhere I can keep a pet",
          "Adapted for a disability",
          "Somewhere with support attached",
          "Just somewhere settled and safe",
        ],
      },
      {
        id: "location",
        label: "Where do you need to be?",
        kind: "text",
        placeholder: "A town, a city, or the area you need to stay near",
        maxLength: 200,
      },
      {
        id: "timing",
        label: "When do you need it?",
        kind: "single",
        options: [
          "Right now",
          "Within a month",
          "Within three months",
          "Within six months",
          "I am planning ahead",
        ],
      },
      /*
       * ⚠️ THE OPEN "Anything you want us to know?" BOX IS DELETED, NOT MOVED.
       *
       * On a page a person in housing difficulty lands on, a free-text box is
       * an invitation to write about a diagnosis, a court order, an abusive
       * ex-partner or a child's needs, and this site's privacy notice does not
       * yet say what happens to any of that. The other questions here are
       * closed lists we chose, so we know in advance what we are asking for
       * and can say so; a free-text box is the one field where we cannot.
       *
       * It comes back when the privacy notice covers free text, and not
       * before. Recorded in docs/WAVE295_REPORT.md under "Review fixes".
       */
    ],
    submitLabel: "Add me to the list",
    success: {
      heading: "We have got that",
      body: "What you need and where you need it are recorded against your email address. Nobody will call you unless you asked us to.",
      next: [
        "We look for the right thing in the right place, not whatever is nearest",
        "One message when the platform opens, and nothing else unless you asked for it",
        `If your situation changes, write to ${generalEnquiriesAddress} and we will update it`,
      ],
    },
    metaDescription:
      "Tell the Impact Investment Platform what home you need and where. We record it now so we are looking for the right thing when the platform opens.",
  },
] as const;

/**
 * Shown on /register/resident only, above the questions. The crisis numbers
 * are already in the footer of every page and they are repeated here for the
 * same reason contact.tsx repeats them: a number somebody has to scroll to
 * find is a number they may not find. Rendered from `crisisLines` in
 * content/site.ts rather than retyped, so there is one copy of each number.
 */
export const residentUrgentNote = {
  heading: "If you need help today",
  body: "This is a waiting list and nobody reads it out of hours. If you have nowhere to sleep tonight, or you are in danger, use one of these instead.",
} as const;

/* ─────────────────────────────────────────────────────────────────────────
 * Lookups
 * ───────────────────────────────────────────────────────────────────────── */

export const registerRoleIds: readonly string[] = registerRoleContent.map((role) => role.id);

export function getRegisterRole(id: string): RegisterRoleContent | undefined {
  return registerRoleContent.find((role) => role.id === id);
}

/**
 * The hero and the picker draw the same ten tiles from `registerRoles`, so the
 * two files must not drift. This is the assertion that says so out loud: add a
 * role to content/audiences.ts and forget this file, and the module throws on
 * import rather than shipping a tile that lands on a 404.
 */
const rolesWithoutAPage: string[] = registerRoles
  /* WAVE 838: a tile with an `href` registers on the platform, not here. */
  .filter((role: AudienceRole) => !role.href && !registerRoleIds.includes(role.id))
  .map((role: AudienceRole) => role.id);

if (rolesWithoutAPage.length > 0) {
  throw new Error(
    `content/register.ts has no page for ${rolesWithoutAPage.join(", ")}. Every tile in ` +
      "content/audiences.ts needs an entry here, or its tile lands on a 404.",
  );
}
