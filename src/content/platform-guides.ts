/**
 * Source-checked public guides. Platform roles come from the backend Role enum
 * and App.jsx at platformGuideSourceSha. Partner pathways are not login roles.
 * Screenshot metadata identifies the real interface to capture in CI.
 * It deliberately has no image URL until a capture has been reviewed.
 */
export const platformGuideSourceSha = "be6673d2643a2023ceb72ba167ffc2f5ef6490cb";

export interface PlatformGuideStep {
  title: string;
  description: string;
  /** An actual platform route, or an existing website partner route. */
  route?: string;
}

export interface PlatformGuideScreenshot {
  /** Reused for a connected-workspace preview on a partner-only guide. */
  key: string;
  route: string;
  role: string;
  alt: string;
  caption: string;
}

export interface PlatformGuide {
  id: string;
  label: string;
  kind: "platform" | "partner";
  platformRole: string | null;
  summary: string;
  features: string[];
  steps: PlatformGuideStep[];
  entryHref: string;
  partnerHref?: string;
  screenshot: PlatformGuideScreenshot;
  /** Source references are implementation evidence, not public interface copy. */
  sourceRefs: string[];
}

const app = "https://app.impactinvestmentgroup.co.uk";
const demoCaption = "Real platform interface shown with demonstration data.";

export const platformGuides: PlatformGuide[] = [
  {
    id: "investor",
    label: "Investor",
    kind: "platform",
    platformRole: "investor",
    summary:
      "Find properties, examine the evidence and follow your property portfolio in one workspace.",
    features: ["Home Finder", "Demand Map", "Property analysis", "My portfolio"],
    steps: [
      {
        title: "Set your search",
        description: "Choose where to look and refine the Home Finder filters.",
        route: "/investor/search",
      },
      {
        title: "Examine a property",
        description:
          "Open a property to review its information, housing plan and the workings behind its figures.",
        route: "/investor/search",
      },
      {
        title: "Compare your options",
        description:
          "Use Compare and the calculator to examine properties and your own assumptions.",
        route: "/investor/compare",
      },
      {
        title: "Follow your portfolio",
        description:
          "Return to My portfolio to review properties and the next actions in your journey.",
        route: "/investor/portfolio",
      },
    ],
    entryHref: app + "/investor/search",
    partnerHref: "/partner-with-investor",
    screenshot: {
      key: "investor",
      role: "investor",
      route: "/investor/search",
      alt: "The Investor Home Finder with property search controls and demonstration results",
      caption: demoCaption,
    },
    sourceRefs: [
      "src/App.jsx",
      "src/lib/tutorials/investor.js",
      "src/pages/investor/Search.jsx",
      "src/pages/investor/Portfolio.jsx",
    ],
  },
  {
    id: "resident",
    label: "Resident",
    kind: "platform",
    platformRole: "seeker",
    summary:
      "Describe what you need from a home, see homes that may suit and ask to discuss them with your support worker.",
    features: ["Your needs", "Homes that may suit", "Talk to your worker", "Support resources"],
    steps: [
      {
        title: "Describe your needs",
        description:
          "Set your support needs, accessibility requirements, preferred areas and consent to matching.",
        route: "/seeker/profile",
      },
      {
        title: "Explore possible homes",
        description:
          "Review the homes shown and the reasons they may suit your needs. A person confirms every match.",
        route: "/seeker/matches",
      },
      {
        title: "Start a conversation",
        description:
          "Use Talk to my worker on a home to register your interest with the placements team.",
        route: "/seeker/matches",
      },
      {
        title: "Find support",
        description: "Open the support page for help and crisis resources.",
        route: "/seeker/support",
      },
    ],
    entryHref: app + "/seeker",
    partnerHref: "/partner-with-resident",
    screenshot: {
      key: "resident",
      role: "seeker",
      route: "/seeker/matches",
      alt: "The Resident homes view with demonstration property matches",
      caption: demoCaption,
    },
    sourceRefs: [
      "src/pages/seeker/Profile.jsx",
      "src/pages/seeker/Matches.jsx",
      "src/pages/seeker/Support.jsx",
    ],
  },
  {
    id: "care-provider",
    label: "Care Provider",
    kind: "platform",
    platformRole: "care_provider",
    summary:
      "Describe your property requirements and review accommodation that may suit the people you support.",
    features: [
      "Property requirements",
      "Areas and property types",
      "Possible matches",
      "Property interest",
    ],
    steps: [
      {
        title: "Describe the requirement",
        description: "Choose areas, property types, uses, bedroom limits and special requirements.",
        route: "/care_provider/requirements",
      },
      {
        title: "Save and review",
        description:
          "Save the requirement and review Properties that may suit. A person confirms every match.",
        route: "/care_provider/requirements",
      },
      {
        title: "Browse available stock",
        description: "Narrow the stock by region, bedroom count and refurbishment status.",
        route: "/care_provider",
      },
      {
        title: "Express interest",
        description: "Register interest in a property so the team can follow up.",
        route: "/care_provider",
      },
    ],
    entryHref: app + "/care_provider",
    partnerHref: "/partner-with-care-provider",
    screenshot: {
      key: "care-provider",
      role: "care_provider",
      route: "/care_provider/requirements",
      alt: "The Care Provider property requirements form and demonstration matches",
      caption: demoCaption,
    },
    sourceRefs: [
      "src/pages/care_provider/Requirements.jsx",
      "src/pages/care_provider/requirementsCopy.js",
      "src/components/PropertyStockView.jsx",
    ],
  },
  {
    id: "housing-association",
    label: "Housing Association",
    kind: "platform",
    platformRole: "housing_association",
    summary:
      "Review available homes for your scheme and maintain occupancy and rent records for properties you lease.",
    features: ["Scheme stock", "Property interest", "Occupancy", "Rent records"],
    steps: [
      {
        title: "Explore scheme stock",
        description:
          "Filter available properties by region, bedroom count and refurbishment status.",
        route: "/housing_association",
      },
      {
        title: "Register interest",
        description: "Select a property and register scheme interest for the team to review.",
        route: "/housing_association",
      },
      {
        title: "Record occupancy",
        description:
          "Open a leased property in Tenancies & rent to maintain occupancy, capacity and tenancy details.",
        route: "/housing_association/rent",
      },
      {
        title: "Keep the rent record",
        description:
          "Record the period, amount due and amount received in the property's rent ledger.",
        route: "/housing_association/rent",
      },
    ],
    entryHref: app + "/housing_association",
    partnerHref: "/partner-with-housing-association",
    screenshot: {
      key: "housing-association",
      role: "housing_association",
      route: "/housing_association",
      alt: "The Housing Association stock view with demonstration property cards",
      caption: demoCaption,
    },
    sourceRefs: [
      "src/pages/housing_association/Stock.jsx",
      "src/pages/housing_association/Rent.jsx",
      "src/components/PropertyStockView.jsx",
    ],
  },
  {
    id: "local-authority",
    label: "Local Authority",
    kind: "platform",
    platformRole: "local_authority",
    summary:
      "Browse property stock for placement needs and register interest for the team to follow up.",
    features: [
      "Placement stock",
      "Property filters",
      "Property information",
      "Interest registration",
    ],
    steps: [
      {
        title: "Open placement stock",
        description: "Review the properties currently presented in your organisation's stock view.",
        route: "/local_authority",
      },
      {
        title: "Narrow the selection",
        description: "Filter by region, minimum bedrooms and refurbishment status.",
        route: "/local_authority",
      },
      {
        title: "Raise a placement enquiry",
        description:
          "Use the property action to register interest. It starts a follow-up, rather than confirming a placement.",
        route: "/local_authority",
      },
    ],
    entryHref: app + "/local_authority",
    partnerHref: "/partner-with-local-authority",
    screenshot: {
      key: "local-authority",
      role: "local_authority",
      route: "/local_authority",
      alt: "The Local Authority placement stock view with demonstration properties",
      caption: demoCaption,
    },
    sourceRefs: ["src/pages/local_authority/Stock.jsx", "src/components/PropertyStockView.jsx"],
  },
  {
    id: "co-sourcer",
    label: "Co-sourcer",
    kind: "platform",
    platformRole: "deal_sourcer",
    summary:
      "Submit property opportunities, follow their status and keep your profile, agreement and fee information together.",
    features: ["Property submissions", "Bulk upload", "Submission progress", "Fees and profile"],
    steps: [
      {
        title: "Prepare your profile",
        description: "Review the co-sourcing agreement and complete your profile.",
        route: "/sourcer/profile",
      },
      {
        title: "Add a property",
        description:
          "Work through the six saved steps for the property facts, photographs, documents and checks.",
        route: "/sourcer/new",
      },
      {
        title: "Follow the submission",
        description:
          "Return to Your stock to review each property's status and open its detailed record.",
        route: "/sourcer",
      },
      {
        title: "Review your fees",
        description: "Use the Fees page to follow your recorded fee information.",
        route: "/sourcer/fees",
      },
    ],
    entryHref: app + "/sourcer/join",
    screenshot: {
      key: "co-sourcer",
      role: "deal_sourcer",
      route: "/sourcer",
      alt: "The Co-sourcer stock workspace with demonstration property submissions",
      caption: demoCaption,
    },
    sourceRefs: [
      "src/lib/tutorials/deal_sourcer.js",
      "src/pages/sourcer/Stock.jsx",
      "src/pages/sourcer/PropertyForm.jsx",
      "src/pages/sourcer/Fees.jsx",
    ],
  },
  {
    id: "housing-provider",
    label: "Housing Provider",
    kind: "platform",
    platformRole: "housing_provider",
    summary: "Review available property stock in a workspace focused on your housing caseload.",
    features: [
      "Caseload stock",
      "Property filters",
      "Property information",
      "Interest registration",
    ],
    steps: [
      {
        title: "Review available homes",
        description: "Open the stock view and read the property information.",
        route: "/housing_provider",
      },
      {
        title: "Refine the options",
        description: "Narrow the list by region, minimum bedrooms and refurbishment status.",
        route: "/housing_provider",
      },
      {
        title: "Register interest",
        description:
          "Use Match to caseload to register property interest for the team to follow up.",
        route: "/housing_provider",
      },
    ],
    entryHref: app + "/housing_provider",
    screenshot: {
      key: "housing-provider",
      role: "housing_provider",
      route: "/housing_provider",
      alt: "The Housing Provider caseload stock view with demonstration properties",
      caption: demoCaption,
    },
    sourceRefs: ["src/pages/housing_provider/Stock.jsx", "src/components/PropertyStockView.jsx"],
  },
  {
    id: "estate-agent",
    label: "Estate Agent",
    kind: "platform",
    platformRole: "estate_agent",
    summary: "Submit property listings for review and follow their status in My listings.",
    features: ["Listing submissions", "Bulk upload", "Listing photographs", "Review status"],
    steps: [
      {
        title: "Choose a submission method",
        description: "Use the listing form, upload a file or start from pasted text.",
        route: "/agent/submit",
      },
      {
        title: "Check the details",
        description:
          "Review the property facts, photographs and contact details before submitting.",
        route: "/agent/submit",
      },
      {
        title: "Follow the review",
        description:
          "Return to My listings to see submission statuses and any rejection reason provided.",
        route: "/agent",
      },
    ],
    entryHref: app + "/agent",
    screenshot: {
      key: "estate-agent",
      role: "estate_agent",
      route: "/agent",
      alt: "The Estate Agent My listings workspace with demonstration submissions",
      caption: demoCaption,
    },
    sourceRefs: ["src/pages/agent/Submit.jsx", "src/pages/agent/Dashboard.jsx"],
  },
  {
    id: "contractor",
    label: "Contractor",
    kind: "platform",
    platformRole: "contractor",
    summary:
      "Review refurbishment work, submit quotations and keep job progress and supporting media together.",
    features: ["Jobs", "Quotations", "Refurbishment progress", "Progress media"],
    steps: [
      {
        title: "Review the work",
        description: "Open Jobs to see the properties requiring refurbishment work.",
        route: "/contractor",
      },
      {
        title: "Submit a quotation",
        description: "Enter the scope, amount and lead time, then follow the quote's status.",
        route: "/contractor",
      },
      {
        title: "Update a refurbishment",
        description:
          "Open Refurbs to record progress and add supporting photographs or other progress media.",
        route: "/contractor/refurbs",
      },
    ],
    entryHref: app + "/contractor",
    screenshot: {
      key: "contractor",
      role: "contractor",
      route: "/contractor",
      alt: "The Contractor jobs and quotations view with demonstration records",
      caption: demoCaption,
    },
    sourceRefs: ["src/pages/contractor/Jobs.jsx", "src/pages/contractor/Refurbs.jsx"],
  },
  {
    id: "valuer",
    label: "Valuer",
    kind: "platform",
    platformRole: "valuer",
    summary:
      "Review the valuation queue and submit your independent property values with supporting reasoning.",
    features: ["Valuation queue", "Independent figures", "Reasoning", "Submission status"],
    steps: [
      {
        title: "Open the queue",
        description: "Review the properties awaiting valuation and the reference figures shown.",
        route: "/valuer",
      },
      {
        title: "Add your assessment",
        description:
          "Enter the current value, optional post-refurbishment value and your reasoning.",
        route: "/valuer",
      },
      {
        title: "Follow the submission",
        description: "Review your submitted values and their status in My submissions.",
        route: "/valuer",
      },
    ],
    entryHref: app + "/valuer",
    screenshot: {
      key: "valuer",
      role: "valuer",
      route: "/valuer",
      alt: "The Valuer queue and submission table with demonstration records",
      caption: demoCaption,
    },
    sourceRefs: ["src/pages/valuer/Queue.jsx"],
  },
  {
    id: "viewer",
    label: "Viewer",
    kind: "platform",
    platformRole: "viewer",
    summary: "Review your viewing assignments and submit a report link and notes after a visit.",
    features: ["Viewing assignments", "Visit details", "Report links", "Submitted reports"],
    steps: [
      {
        title: "Review an assignment",
        description: "Check the location and details of your assigned viewing.",
        route: "/viewer",
      },
      {
        title: "Complete the report",
        description: "After the visit, open Upload report and enter the report URL and notes.",
        route: "/viewer",
      },
      {
        title: "Review your reports",
        description:
          "Return to the submitted reports list to review the recorded report and status.",
        route: "/viewer",
      },
    ],
    entryHref: app + "/viewer",
    screenshot: {
      key: "viewer",
      role: "viewer",
      route: "/viewer",
      alt: "The Viewer assignments and reports view with demonstration records",
      caption: demoCaption,
    },
    sourceRefs: ["src/pages/viewer/Assignments.jsx"],
  },
  {
    id: "management-agent",
    label: "Housing Management Agent",
    kind: "platform",
    platformRole: "management_agent",
    summary:
      "A housing management CRM that keeps your property records, contacts, maintenance, compliance and scheduled work together.",
    features: [
      "Property records",
      "Contacts and rent records",
      "Maintenance and compliance",
      "Tenants and calendar",
    ],
    steps: [
      {
        title: "Check what needs attention",
        description: "Review dashboard items, upcoming dates and vacancies.",
        route: "/management_agent",
      },
      {
        title: "Open a property",
        description: "Review the home's rooms, leases, documents and recorded rent.",
        route: "/management_agent/properties",
      },
      {
        title: "Find the right contact",
        description: "Open a contact to review linked properties and payment records.",
        route: "/management_agent/properties/contacts",
      },
      {
        title: "Follow the work",
        description: "Use the Maintenance and Compliance views to track jobs and compliance dates.",
        route: "/management_agent/properties/maintenance",
      },
      {
        title: "Plan and report",
        description:
          "Review scheduled work in Calendar or open Reports for a filtered spreadsheet export.",
        route: "/management_agent/calendar",
      },
    ],
    entryHref: app + "/management_agent",
    screenshot: {
      key: "management-agent",
      role: "management_agent",
      route: "/management_agent/properties",
      alt: "The Management Agent properties workspace with demonstration housing records",
      caption: demoCaption,
    },
    sourceRefs: [
      "src/App.jsx",
      "src/lib/specialistNav.js",
      "src/lib/managementAgentViews.js",
      "src/lib/tutorials/management_agent.js",
    ],
  },
  {
    id: "landlord",
    label: "Landlord",
    kind: "partner",
    platformRole: null,
    summary:
      "Bring an existing home into the housing partnership and clarify its property, lease and management requirements with the team.",
    features: [
      "Property information",
      "Housing requirements",
      "Lease responsibilities",
      "Partner coordination",
    ],
    steps: [
      {
        title: "Describe the property",
        description:
          "Share its location, condition, availability and compliance information with the team.",
        route: "/partner-with-landlord",
      },
      {
        title: "Review the requirement",
        description: "Discuss how the property fits the proposed housing need and delivery route.",
        route: "/partner-with-landlord",
      },
      {
        title: "Agree responsibilities",
        description:
          "Work through the due diligence, lease and management responsibilities with the relevant partners.",
        route: "/partner-with-landlord",
      },
    ],
    entryHref: "/partner-with-landlord",
    partnerHref: "/partner-with-landlord",
    screenshot: {
      key: "management-agent",
      role: "management_agent",
      route: "/management_agent/properties",
      alt: "A related Management Agent properties workspace with demonstration housing records",
      caption:
        "Connected workspace preview: Management Agent. This is not a separate Landlord login. Demonstration data.",
    },
    sourceRefs: ["site:src/content/partners.ts#landlord", "src/App.jsx", "app/models.py#Role"],
  },
  {
    id: "developer",
    label: "Developer",
    kind: "partner",
    platformRole: null,
    summary:
      "Discuss sites, conversions and adaptations with the partners who define the housing requirement and delivery route.",
    features: ["Sites and schemes", "Housing requirements", "Specifications", "Delivery partners"],
    steps: [
      {
        title: "Start with the need",
        description: "Explore the location and property specification with the housing partners.",
        route: "/partner-with-developer",
      },
      {
        title: "Share the opportunity",
        description: "Bring the site, scheme or conversion proposal to the team for discussion.",
        route: "/partner-with-developer",
      },
      {
        title: "Plan the delivery",
        description:
          "Clarify planning, specifications, approvals and handover responsibilities with the relevant partners.",
        route: "/partner-with-developer",
      },
    ],
    entryHref: "/partner-with-developer",
    partnerHref: "/partner-with-developer",
    screenshot: {
      key: "investor",
      role: "investor",
      route: "/investor/search",
      alt: "A related Investor Home Finder workspace with demonstration property information",
      caption:
        "Connected workspace preview: Investor Home Finder. This is not a separate Developer login. Demonstration data.",
    },
    sourceRefs: ["site:src/content/partners.ts#developer", "src/App.jsx", "app/models.py#Role"],
  },
  {
    id: "support-provider",
    label: "Support Provider",
    kind: "partner",
    platformRole: null,
    summary:
      "Help shape the practical support around a home and agree responsibilities with housing, care and referral partners.",
    features: ["Support needs", "Housing context", "Partner responsibilities", "Agreed outcomes"],
    steps: [
      {
        title: "Describe the support",
        description:
          "Explain the practical help someone needs to settle into and sustain their home.",
        route: "/partner-with-support-provider",
      },
      {
        title: "Connect the partners",
        description:
          "Clarify the housing, care and support responsibilities around the proposed home.",
        route: "/partner-with-support-provider",
      },
      {
        title: "Agree the next steps",
        description:
          "Discuss the support activity and outcomes with the team and the relevant professionals.",
        route: "/partner-with-support-provider",
      },
    ],
    entryHref: "/partner-with-support-provider",
    partnerHref: "/partner-with-support-provider",
    screenshot: {
      key: "housing-provider",
      role: "housing_provider",
      route: "/housing_provider",
      alt: "A related Housing Provider caseload stock view with demonstration properties",
      caption:
        "Connected workspace preview: Housing Provider. This is not a separate Support Provider login. Demonstration data.",
    },
    sourceRefs: [
      "site:src/content/partners.ts#support-provider",
      "src/App.jsx",
      "app/models.py#Role",
    ],
  },
  {
    id: "social-worker",
    label: "Social Worker",
    kind: "partner",
    platformRole: null,
    summary:
      "Bring the person's assessed needs, preferences and rights into discussions with housing and support partners.",
    features: ["Person's needs", "Referrals", "Partner coordination", "Choice and outcomes"],
    steps: [
      {
        title: "Explain the requirement",
        description: "Bring the agreed referral and practical housing requirements to the team.",
        route: "/partner-with-social-worker",
      },
      {
        title: "Coordinate the response",
        description:
          "Discuss the proposed home and the responsibilities of housing, care and support partners.",
        route: "/partner-with-social-worker",
      },
      {
        title: "Keep the person central",
        description:
          "Keep the person's circumstances, choices and agreed outcomes visible in the discussion.",
        route: "/partner-with-social-worker",
      },
    ],
    entryHref: "/partner-with-social-worker",
    partnerHref: "/partner-with-social-worker",
    screenshot: {
      key: "resident",
      role: "seeker",
      route: "/seeker/matches",
      alt: "A related Resident homes view with demonstration property matches",
      caption:
        "Connected workspace preview: Resident. This is not a separate Social Worker login. Demonstration data.",
    },
    sourceRefs: ["site:src/content/partners.ts#social-worker", "src/App.jsx", "app/models.py#Role"],
  },
  {
    id: "broker",
    label: "Broker",
    kind: "partner",
    platformRole: null,
    summary:
      "Connect credible property opportunities with the owners, capital and housing partners needed to assess them.",
    features: ["Property opportunities", "Housing requirements", "Introductions", "Next steps"],
    steps: [
      {
        title: "Understand the brief",
        description: "Clarify the location, property specification and intended delivery route.",
        route: "/partner-with-broker",
      },
      {
        title: "Present the opportunity",
        description: "Share complete property information with the team for assessment.",
        route: "/partner-with-broker",
      },
      {
        title: "Connect the right people",
        description:
          "Coordinate introductions between the owners, investors and housing partners involved.",
        route: "/partner-with-broker",
      },
    ],
    entryHref: "/partner-with-broker",
    partnerHref: "/partner-with-broker",
    screenshot: {
      key: "co-sourcer",
      role: "deal_sourcer",
      route: "/sourcer",
      alt: "A related Co-sourcer workspace with demonstration property submissions",
      caption:
        "Connected workspace preview: Co-sourcer. This is not a separate Broker login. Demonstration data.",
    },
    sourceRefs: ["site:src/content/partners.ts#broker", "src/App.jsx", "app/models.py#Role"],
  },
];
