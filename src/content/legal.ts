/**
 * THE COMPANY RECORD, AND WHERE THE POLICIES LIVE.
 *
 * ⚠ EVERY VALUE IN `companyRecord` IS COPIED FROM THE COMPANIES HOUSE PUBLIC
 * REGISTER. Nothing here may be typed from memory, inferred from a domain
 * name, or filled with a placeholder. If a field cannot be evidenced it is
 * omitted from the page and raised as an outstanding question in the wave
 * report, because a wrong company number on a legal page is worse than a
 * missing one.
 *
 *   Source:    https://find-and-update.company-information.service.gov.uk/company/16650494
 *              and its filing history, form AD01 filed 29 May 2026
 *   Read on:   9 September 2026 (wave 298)
 *
 * ON THE REGISTERED OFFICE. There are THREE strings in play and it is worth a
 * minute to know which is which.
 *
 * 1. WHAT THE COMPANY ACTUALLY FILED. The AD01 of 29 May 2026 prints the
 *    address as one unbroken line, with no field splitting and no punctuation:
 *
 *      "Renewal Trust Business Centre 3 Hawksworth St Nottingham NG3 2EG"
 *
 *    This is the best evidence there is, and `registeredOfficeAsFiled` holds
 *    it. Note "St", not "Street".
 *
 * 2. WHAT THE COMPANY PROFILE PAGE SHOWS. The same address, reassembled from
 *    separate fields, with Companies House's own comma landing mid-name:
 *
 *      "Renewal Trust Business, Centre 3 Hawksworth St, Nottingham, NG3 2EG"
 *
 *    The premises field is "Renewal Trust Business" and the first address line
 *    is "Centre 3 Hawksworth St". `registeredOfficeAsRegistered` holds it, and
 *    the AD01 is what proves the split is an artefact rather than the name.
 *
 * 3. WHAT THIS SITE PRINTS. `registeredOffice`, accepted by Callum on
 *    9 September 2026 (wave 298, question O-4). Against the FILED form it makes
 *    one substantive change and adds punctuation the filing does not carry:
 *
 *      "St" is expanded to "Street"
 *      commas are inserted after "Centre" and after "Nottingham"
 *
 * ⚠ THAT EXPANSION IS A DECISION, NOT A LICENCE, AND WAVE 297 DOES NOT MAKE
 * IT. The platform prints "3 Hawksworth St", following the AD01 exactly, so
 * the two properties currently disclose the same registered office in two
 * different forms. One of them should move before both land, and it is a
 * one-line edit either way. Callum's call; see the wave 298 report, O-4.
 *
 * An earlier draft of this file made the same edits while describing the
 * change as comma-only, which is how a small improvement quietly becomes an
 * unverified claim. Any further departure needs Callum again. The cleanest fix
 * of all is to correct the premises field at Companies House, after which the
 * profile page, the filing and the site all read the same.
 */

export interface CompanyRecordField {
  /** Shown as the row label. */
  label: string;
  /** The verified value. */
  value: string;
}

export const companyRecord = {
  name: "Impact Investment Group UK Limited",
  number: "16650494",
  registeredOffice: "Renewal Trust Business Centre, 3 Hawksworth Street, Nottingham NG3 2EG",
  /**
   * The company profile page's string, character for character, comma splice
   * and all. NOT rendered. Never edit it to match the tidy: its whole job is
   * to preserve what a reader checking the profile page will actually see.
   */
  registeredOfficeAsRegistered:
    "Renewal Trust Business, Centre 3 Hawksworth St, Nottingham, NG3 2EG",
  /**
   * What the company FILED, from form AD01 of 29 May 2026, unbroken and
   * unpunctuated. NOT rendered. This is the strongest evidence of the address
   * and it is what wave 297 follows on the platform, so it is also the string
   * to reconcile against if the two properties are ever made to agree.
   */
  registeredOfficeAsFiled: "Renewal Trust Business Centre 3 Hawksworth St Nottingham NG3 2EG",
  jurisdiction: "England and Wales",
  companyType: "Private limited company",
  incorporated: "14 August 2025",
  status: "Active",
  registerHref: "https://find-and-update.company-information.service.gov.uk/company/16650494",
  registerLabel: "View the entry on the Companies House register",
  /** When the values above were last read off the register. */
  verifiedOn: "9 September 2026",
} as const;

/** The rows the Legal page prints, in the order a reader checks them. */
export const companyRecordFields: CompanyRecordField[] = [
  { label: "Registered company name", value: companyRecord.name },
  { label: "Company registration number", value: companyRecord.number },
  { label: "Registered office", value: companyRecord.registeredOffice },
  { label: "Jurisdiction of registration", value: companyRecord.jurisdiction },
  { label: "Company type", value: companyRecord.companyType },
  { label: "Incorporated", value: companyRecord.incorporated },
  { label: "Status on the register", value: companyRecord.status },
];

/**
 * The four footer legal links, in the order they are shown.
 *
 * ⚠ TERMS, PRIVACY AND DISCLAIMER ARE EXTERNAL BY MEASUREMENT, NOT BY CHOICE.
 * This site publishes no Terms, Privacy Policy or Disclaimer of its own (there
 * is no `/terms`, `/privacy` or `/disclaimer` route in `src/routes`), so the
 * documents published on the platform are the canonical ones and the site
 * links straight to them. If this site ever gains its own, point these three
 * at the local routes and drop `external`.
 *
 * `Legal` is internal: the company block below is about this company and is
 * prerendered here so it survives with no network hop and no sign-in.
 */
export interface LegalLink {
  label: string;
  href: string;
  external: boolean;
  /**
   * One line of context, shown on the Legal page's index of documents.
   * OPTIONAL, because that index is built from the EXTERNAL links only: the
   * fourth link is /legal itself, and a card on the Legal page describing the
   * Legal page would be a link to where the reader already is. Give a
   * description to anything that becomes a card; leave it off anything that
   * does not.
   */
  description?: string;
}

const platformDocsBase = "https://app.impactinvestmentgroup.co.uk";

export const legalLinks: LegalLink[] = [
  {
    label: "Terms of Service",
    href: `${platformDocsBase}/terms`,
    external: true,
    description: "The terms on which the services are provided.",
  },
  {
    label: "Privacy Policy",
    href: `${platformDocsBase}/privacy`,
    external: true,
    description: "How personal data is collected, used and stored.",
  },
  {
    label: "Disclaimer",
    href: `${platformDocsBase}/disclaimer`,
    external: true,
    description: "The qualifications that apply to figures, matches and claims.",
  },
  {
    label: "Legal",
    href: "/legal",
    external: false,
    // No description: this entry never becomes a card. See `LegalLink`.
  },
];

/**
 * The Privacy Policy on its own, for the notice at collection on /contact.
 * Derived from `legalLinks` so the two can never point at different documents.
 */
export const privacyPolicyHref = legalLinks.find((l) => l.label === "Privacy Policy")!.href;

/** The three published mailboxes, settled by Callum on 9 September 2026. */
export interface LegalMailbox {
  purpose: string;
  address: string;
}

/**
 * Israel requested `enquiries@impactig.co.uk` on 5 November 2026.
 * This supersedes the earlier September instruction to keep the missing "i".
 * Visible addresses and mailto recipients must both use this one constant.
 *
 * ⚠ AND `hello@impactig.co.uk` IS NOT A REAL MAILBOX. It was printed across
 * this site until 10 September 2026 and never existed. Do not reinstate it,
 * and do not copy it out of an old commit, an old screenshot or the wave 298
 * report's before-and-after tables.
 *
 * ⚠ IT LIVES HERE, NOT IN content/site.ts, AND THE DIRECTION MATTERS.
 * `contactDetails.email` in site.ts imports this constant. The reverse would be
 * a cycle, because site.ts already imports `companyRecord` from this file, and
 * a cycle between two modules of top-level consts resolves to `undefined` at
 * evaluation time rather than failing loudly. The footers, the contact hero,
 * the contact page's meta description and the enquiry form's failure line all
 * end up reading this one string.
 */
export const generalEnquiriesAddress = "enquiries@impactig.co.uk";

export const legalMailboxes: LegalMailbox[] = [
  { purpose: "General enquiries", address: generalEnquiriesAddress },
  { purpose: "Support", address: "support@impactig.co.uk" },
  { purpose: "Legal and data protection", address: "admin@impactig.co.uk" },
];

/* Callum settled these on 9 September 2026 (wave 298, O-1): all three are on
   impactig.co.uk and monitored, and the platform's own
   legal@ and privacy@impactinvestmentplatform.com are retired rather than
   republished here. Wave 297 moves the platform's Terms and Privacy Policy to
   the same set; if these ever diverge from those documents, the documents are
   what a reader relies on, so change both together.

   AMENDED 5 November 2026: Israel requested the corrected general address
   published above. Support and legal are unchanged. */
export const mailboxesNote =
  "Legal and data-protection enquiries, including requests about personal data, are read at the address above.";

/*
 * THIS SENTENCE STATES WHERE THE DOCUMENTS ARE AND NOTHING ELSE, AND IT STAYS
 * THAT WAY UNTIL WAVE 297 HAS LANDED.
 *
 * Callum settled the entity on 9 September 2026 (wave 298, O-2): the
 * controller is Impact Investment Group UK Limited, and wave 297 is aligning
 * the platform's Terms and Privacy Policy to that entity and to the mailboxes
 * above. Until those documents actually say it, this site attributing them to
 * the company would be describing a state of affairs a reader clicking through
 * would not find. When 297 lands, this may become:
 *
 *   "The Terms of Service, Privacy Policy and Disclaimer are published by
 *    Impact Investment Group UK Limited on the platform at
 *    app.impactinvestmentgroup.co.uk. This site publishes no separate versions
 *    of them; those documents are the ones that apply."
 */
export const policiesNote =
  "The Terms of Service, Privacy Policy and Disclaimer are published on the platform at app.impactinvestmentgroup.co.uk. This site publishes no separate versions of them.";

export const legalPageEyebrow = "Company information";
export const legalPageTitle = "Legal";
export const legalPageLead =
  "Who this company is, where it is registered, and where to find the documents that govern its services.";

/**
 * ⚠ NEVER PRINT A COVER PERIOD AS CURRENT. The footer used to carry a fixed
 * twelve-month cover period that was still on the live site a month after it
 * had ended, beside a card headed "PI & PL Insured". A visitor reading it had
 * no way to tell whether the policy had been renewed. R298-4 prescribes the
 * sentence below in its place.
 *
 * ⚠ AND IT DOES NOT MAKE THE CARD FULLY HONEST ON ITS OWN. The card still
 * carries "PI & PL Insured" and two specific limits, and those came off the
 * same certificate that expired. Removing the date stops the site presenting
 * an ended period AS CURRENT, which is what the ruling asked for; it does not
 * evidence that cover exists today.
 *
 * ⚠ CALLUM DEFERRED THAT GAP ON 9 SEPTEMBER 2026 (wave 298, O-3). The card
 * ships as it stands. This is a decision on the record, not an open question,
 * and it has ONE review trigger: THE RENEWED CERTIFICATE ARRIVING. On the day
 * it does, add the insurer and the period BESIDE this line, never instead of
 * it, and diary their removal for the day that period ends. Nothing else
 * reopens it, and nobody should quietly soften the card in the meantime: the
 * deferral is Callum's to revisit. Report section 5, O-3, carries the wording
 * for both outcomes.
 */
export const insuranceEvidenceLine = "Current insurance evidence available on request";
