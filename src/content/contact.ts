/** Copy and field configuration for /contact. */

import { companyRecord, privacyPolicyHref } from "@/content/legal";

export const enquiryRouteIds = [
  "demo",
  "waitlist",
  "partner",
  "investor",
  "media",
  "support",
] as const;

export type EnquiryRouteId = (typeof enquiryRouteIds)[number];

export interface EnquiryRoute {
  id: EnquiryRouteId;
  label: string;
  subline: string;
  /** Promised reply time, shown once a route is selected. */
  reply: string;
  /** Internal desk the enquiry is routed to. */
  routedTo: string;
}

export const enquiryRoutes: EnquiryRoute[] = [
  {
    id: "demo",
    label: "Talk to the team",
    subline: "See the platform and ask us your questions · 30 min",
    reply: "We reply within one working day",
    routedTo: "Platform team",
  },
  {
    id: "waitlist",
    label: "Register your interest",
    subline: "Join the waitlist for platform access",
    reply: "We reply within one working day",
    routedTo: "Platform team",
  },
  {
    id: "partner",
    label: "Become a partner",
    subline: "Housing associations, care providers, developers and agents",
    reply: "We reply within two working days",
    routedTo: "Partnerships team",
  },
  {
    id: "investor",
    label: "Investor enquiry",
    subline: "Demand-led opportunities · capital at risk",
    reply: "We reply within one working day",
    routedTo: "Investor relations",
  },
  {
    id: "media",
    label: "Media",
    subline: "Press enquiries, interviews and fact-checking",
    reply: "We reply the same working day where a deadline is given",
    routedTo: "Press office",
  },
  {
    id: "support",
    label: "Support",
    subline: "Existing users and partners",
    reply: "We reply within one working day",
    routedTo: "Support desk",
  },
];

export const roleOptions = [
  "Local authority · commissioning",
  "Local authority · housing",
  "NHS · discharge or ICB",
  "Housing association",
  "Care or support provider",
  "Investor",
  "Landlord",
  "Developer",
  "Estate agent",
  "Journalist",
  "Other",
];

export const entityTypeOptions = [
  "Housing association",
  "Care or support provider",
  "Developer",
  "Estate agent",
  "Landlord",
  "Technology or data provider",
  "Other",
];

export const ticketSizeOptions = [
  "Under £250k",
  "£250k – £1m",
  "£1m – £5m",
  "£5m – £25m",
  "Over £25m",
  "Not yet decided",
];

export const previewSlots = [
  "Tuesday · 10:00",
  "Wednesday · 14:30",
  "Friday · 09:30",
];

export const investorAcknowledgement =
  "I understand my capital is at risk and that this is not a Collective Investment Scheme, and that Impact Investment Group is not authorised or regulated by the FCA.";

/**
 * THE NOTICE AT COLLECTION. Rendered beside the submit control, not in the
 * footer, because that is where the ICO's right-to-be-informed guidance puts
 * it: a person has to be told who is taking their details and why AT THE
 * MOMENT they hand them over. Layered information is allowed; making somebody
 * hunt for it is not.
 *
 * It used to read, in full:
 *
 *   "UK GDPR · we use your details only to answer this enquiry · ICO ZB957755"
 *
 * which named no controller, gave no way to reach one, and linked to nothing.
 * The parts below add those three things and change the promise in none of
 * them: the purpose is still the same purpose, word for word.
 *
 * ⚠ THIS FORM SENDS NO MARKETING, SO IT ASKS FOR NO MARKETING CONSENT.
 * Do not add a marketing checkbox here. If marketing is ever switched on, the
 * consent is collected then, unticked, and this notice changes with it. And
 * never pre-tick a box on this form: a pre-ticked box is not a consent under
 * UK GDPR, so it would buy nothing and cost the page its credibility.
 */
export const collectionNotice = {
  /** Named in full. `companyRecord.name` is the Companies House record. */
  controller: companyRecord.name,
  /** Follows the controller name. */
  purpose: "is the data controller for this form. We use your details only to answer this enquiry.",
  /**
   * How to reach the controller ABOUT THE DATA, which is a different question
   * from how to reach the business. The general mailbox handles enquiries; this is the
   * address a person writes to in order to ask what is held about them, or to
   * ask for it to be corrected or deleted. Callum settled it on 9 September
   * 2026 (wave 298, O-1) and `legalMailboxes` in content/legal.ts publishes
   * the same address on /legal. If one moves, move both.
   */
  contactLead: "To ask about the data we hold about you, write to",
  contactAddress: "admin@impactig.co.uk",
  /** The registration the site already published, kept verbatim. */
  registration: "UK GDPR · ICO ZB957755",
  linkLabel: "Read the Privacy Policy",
  /** The company's published Privacy Policy. Single source: content/legal.ts. */
  linkHref: privacyPolicyHref,
} as const;

export const lookingForHome = {
  title: "Looking for a home?",
  body: "This form is for organisations. If you need somewhere to live, or you support someone who does, use this route instead.",
  action: "Find a home",
};

/**
 * ⚠ NOT CURRENTLY RENDERED, and corrected anyway. This block used to carry
 * `entity` alone: a company NAME under a heading that promises a postal
 * ADDRESS. That is the exact defect wave 298 was called in to fix in the
 * footer, and leaving the same shape sitting here unused is how it comes back
 * the day somebody restores the block. If it is ever rendered again, print
 * `address` with it, and take both from content/legal.ts rather than typing
 * them out here.
 */
export const registeredOffice = {
  title: "Registered office",
  entity: companyRecord.name,
  address: companyRecord.registeredOffice,
  number: `Registered in ${companyRecord.jurisdiction}, company number ${companyRecord.number}`,
};


/* ══ THE REASSURANCE RAIL ════════════════════════════════════════════════ */

/**
 * The three things that stop somebody hitting send.
 *
 * This is not decoration and it is not marketing. The reason a form goes
 * unfilled is almost never the layout — it is not knowing where it goes, how
 * long it takes and what happens afterwards. These sit beside the submit
 * button because that is the moment the doubt occurs.
 *
 * ⚠️ EACH LINE IS A PROMISE THE BUSINESS HAS TO KEEP. "A person reads it" and
 * "no automated sequence" are commitments about how enquiries are handled. If
 * an autoresponder or a drip campaign is ever switched on, these come off the
 * page the same day — a broken promise here is worse than no promise.
 *
 * The reply times must match the `reply` values on `enquiryRoutes` above. If
 * one changes, change both.
 */
export const whatHappensNext = [
  {
    title: "A person reads it",
    body: "Your message goes to a member of the team who can help.",
  },
  {
    title: "One working day",
    body: "Two for partnership enquiries. Same day for media on a deadline.",
  },
  {
    title: "Then a real conversation",
    body: "We will speak with you directly, without an automated sales sequence.",
  },
];

export const contactHero = {
  eyebrow: "Talk to us",
  title: "Tell us what you need.",
};
